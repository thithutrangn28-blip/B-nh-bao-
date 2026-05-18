import { getDB, PERMANENT_MEM_STORE, SHORT_TERM_MEM_STORE, LONG_TERM_MEM_STORE, LOREBOOK_STORE } from '../utils/db';
import { sendMessage } from '../utils/apiProxy';
import { countTokens } from '../core/memory/tokenCounter';

export interface LongTermMemoryEntry {
  id: string;
  novelId: string;
  chapterRange: number[]; // [start, end]
  title: string;
  content: string;
  enabled: boolean;
  archived: boolean;
  createdAt: number;
}

// Standardized for Vietnamese compatibility
export const estimateTokens = countTokens;

export class MemoryManager {
  novelId: string;
  MAX_BUDGET = 75000;
  SAFE_BUDGET = 65000;

  constructor(novelId: string) {
    this.novelId = novelId;
  }

  async getLongTermEntries(): Promise<LongTermMemoryEntry[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex(LONG_TERM_MEM_STORE, 'novelId', this.novelId);
    return all.sort((a, b) => b.createdAt - a.createdAt); // newest first
  }

  async saveLongTermEntry(entry: LongTermMemoryEntry) {
    const db = await getDB();
    await db.put(LONG_TERM_MEM_STORE, entry);
  }
  
  async updateLongTermEntryStatus(id: string, enabled: boolean) {
    const db = await getDB();
    const entry = await db.get(LONG_TERM_MEM_STORE, id);
    if (entry) {
      entry.enabled = enabled;
      await db.put(LONG_TERM_MEM_STORE, entry);
    }
  }

  async archiveOldEntries() {
    const entries = await this.getLongTermEntries();
    const activeEntries = entries.filter((e) => !e.archived);
    if (activeEntries.length > 5) {
      // Sort oldest active first
      activeEntries.sort((a, b) => a.createdAt - b.createdAt);
      const toArchive = activeEntries.slice(0, activeEntries.length - 5);
      for (const entry of toArchive) {
        entry.archived = true;
        entry.enabled = false;
        await this.saveLongTermEntry(entry);
      }
    }
  }

  async summarizeAllChapters(allChapters: any[], config: any, onProgress?: (msg: string) => void) {
    if (!config || (!config.apiKey && !config.proxyEndpoint)) {
      throw new Error("Vợ chưa thiết lập API Proxy trong phần Cài đặt nên chồng không tóm tắt được đâu ạ! 💕");
    }

    // Nhóm các chương thành từng bộ 3
    const groups: any[][] = [];
    for (let i = 0; i < allChapters.length; i += 3) {
      groups.push(allChapters.slice(i, i + 3));
    }

    const controller = new AbortController();
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const start = allChapters.indexOf(group[0]) + 1;
      const end = allChapters.indexOf(group[group.length - 1]) + 1;
      
      if (onProgress) onProgress(`Kiểm tra chương ${start}-${end}... (${i + 1}/${groups.length})`);
      
      const existingEntries = await this.getLongTermEntries();
      const isExist = existingEntries.some(e => e.chapterRange[0] === start && e.chapterRange[1] === end);
      
      if (!isExist) {
        if (onProgress) onProgress(`API Proxy: Đang tóm tắt chương ${start}-${end}...`);
        const formattedChapters = group.map((c) => ({
          chapterNumber: allChapters.indexOf(c) + 1,
          content: c.content
        }));
        
        await this.generateLongTermEntry(formattedChapters, config, controller, onProgress);
      }
    }

    if (onProgress) onProgress('Đã hoàn thành kiểm tra và tóm tắt toàn bộ chương! ✨');
  }

  async forceCompressMaster(config: any, onProgress?: (msg: string) => void) {
    if (onProgress) onProgress(`API Proxy: Đang gom toàn bộ thẻ ghi nhớ để nén tổng thể...`);
    await this.checkAndCompressMasterSummary(config, onProgress, true);
  }

  /**
   * Dọn dẹp các mục lỗi hoặc trống
   */
  async pruneInvalidEntries(onProgress?: (msg: string) => void) {
    const entries = await this.getLongTermEntries();
    let deletedCount = 0;
    
    for (const entry of entries) {
      // Xóa nếu nội dung quá ngắn hoặc không có nội dung thực
      if (!entry.content || entry.content.trim().length < 10) {
        await this.deleteLongTermEntry(entry.id);
        deletedCount++;
      }
    }
    
    if (onProgress) onProgress(`Đã dọn dẹp xong ${deletedCount} thẻ ký ức lỗi nhen vợ! ✨`);
    return deletedCount;
  }

  /**
   * Tự động vô hiệu hóa các thẻ đã cũ khi đã có Master Summary
   */
  async smartContextPruning(onProgress?: (msg: string) => void) {
    const entries = await this.getLongTermEntries();
    const hasMaster = entries.some(e => e.title.includes('Ký Ức Cốt Lõi') && e.enabled);
    
    if (hasMaster) {
      if (onProgress) onProgress('Đang tối ưu ngữ cảnh: Cất các thẻ cũ vào kho lưu trữ... 📦');
      let archivedCount = 0;
      for (const entry of entries) {
        // Nếu không phải là Master và không phải là 2 thẻ gần nhất, thì cất đi
        if (!entry.title.includes('Ký Ức Cốt Lõi') && !entry.archived) {
          entry.archived = true;
          entry.enabled = false;
          await this.saveLongTermEntry(entry);
          archivedCount++;
        }
      }
      if (onProgress) onProgress(`Đã tối ưu hóa context, đã cất ${archivedCount} thẻ vào kho nhen vợ! 💕`);
    } else {
      if (onProgress) onProgress('Chưa có Ký Ức Cốt Lõi để nén thêm đâu ạ! 💕');
    }
  }

  async deleteLongTermEntry(id: string) {
    const db = await getDB();
    await db.delete(LONG_TERM_MEM_STORE, id);
  }

  async generateLongTermEntry(chapters: { chapterNumber: number; content: string }[], config: any, controller: AbortController, onProgress?: (msg: string) => void) {
    if (chapters.length === 0) return;
    
    // Sort ascending
    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    const startObj = chapters[0];
    const endObj = chapters[chapters.length - 1];
    const chapterRange = [startObj.chapterNumber, endObj.chapterNumber];
    
    const summaryPrompt = `
[KIKOKO MEMORY SYSTEM - ÉP OUTPUT CAO 1500-2000 TOKENS]
Nhiệm vụ của bạn là tóm tắt ${chapters.length} chương truyện (từ chương ${chapterRange[0]} đến ${chapterRange[1]}) thành một "Thẻ Bộ Nhớ Trường Kỳ".

YÊU CẦU BẮT BUỘC:
1. Độ dài: 1500-2000 tokens. KHÔNG ĐƯỢC ngắn hơn 1500 tokens. Hãy viết cực kỳ chi tiết từng hành động, cảm xúc và bối cảnh.
2. Ngôn ngữ: Tiếng Việt, văn phong tiểu thuyết gia chuyên nghiệp.
3. Cấu trúc thẻ PHẢI gồm 10 mục chính sau:

[1. BỐI CẢNH & KHÔNG GIAN CHI TIẾT] (200-250 tokens)
[2. DIỄN BIẾN HÀNH ĐỘNG CỐT LÕI - PHÂN ĐOẠN CHI TIẾT] (500-600 tokens)
[3. CHI TIẾT NHÂN VẬT & TÂM LÝ BIẾN CHUYỂN] (200-250 tokens)
[4. TIẾN TRIỂN TÌNH CẢM & NHỮNG ĐIỂM CHẠM CẢM XÚC] (200-250 tokens)
[5. ĐỐI THOẠI ĐẮT GIÁ & PHÁT NGÔN QUAN TRỌNG] (150-200 tokens)
[6. CONFLICT (XUNG ĐỘT) ĐANG DỞ DANG] (100-150 tokens)
[7. FORESHADOWING (ĐIỀM BÁO) ĐÃ CÀI CẮM] (100-150 tokens)
[8. VẬT PHẨM & MÔI TRƯỜNG BIẾN ĐỘNG] (100 tokens)
[9. KẾT LUẬN CỦA GIAI ĐOẠN 3 CHƯƠNG] (100 tokens)
[10. GHI CHÚ CHO CHƯƠNG TIẾP THEO] (50-100 tokens)

Dữ liệu nguồn (Nghiêm cấm viết lại nội dung cũ, chỉ tập trung vào diễn biến mới của 3 chương này):
${chapters.map(c => `--- CHƯƠNG ${c.chapterNumber} ---\n${c.content}`).join('\n\n')}
    `.trim();

    // Call API proxy
    let summaryText = '';
    const messages: any[] = [
      { role: 'system', content: 'Bạn là chuyên gia tóm tắt truyện. Viết theo đúng 8 mục định dạng bắt buộc.' },
      { role: 'user', content: summaryPrompt }
    ];

    try {
      if (onProgress) onProgress(`API Proxy: Đang dệt bộ nhớ chương ${chapterRange[0]}-${chapterRange[1]}...`);
      summaryText = await sendMessage(
        config as any, 
        messages as any, 
        undefined, 
        3, // retries cho vợ nhen
        controller.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error('Long Term Summary failed', err);
      // Fallback fallback raw if failed
      summaryText = `[BỐI CẢNH CHUNG]\nKhông thể tạo tóm tắt do lỗi API: ${err.message}\n\n[GHI CHÚ]\nBộ nhớ đã cố gắng lưu thông tin chương ${chapterRange[0]} đến ${chapterRange[1]}.`;
    }

    // Try to extract a title, or generate a default one
    let title = `Chương ${chapterRange[0]}-${chapterRange[1]}`;
    // Maybe extract first 5 words as title if there's no title specified
    const match = summaryText.match(/Tóm tắt[^\n]*/i);
    if (match) title = match[0].substring(0, 30);

    const newEntry: LongTermMemoryEntry = {
      id: crypto.randomUUID(),
      novelId: this.novelId,
      chapterRange,
      title,
      content: summaryText,
      enabled: true,
      archived: false,
      createdAt: Date.now()
    };

    await this.saveLongTermEntry(newEntry);
    await this.archiveRecentlyCompressed(chapterRange);
    await this.checkAndCompressMasterSummary(config);
    if (onProgress) onProgress('Hoàn thành tổng hợp!');
  }

  async archiveRecentlyCompressed(chapterRange: number[]) {
     // Optional: mark chapters as "summarized" in other stores if needed
  }

  async checkAndCompressMasterSummary(config: any, onProgress?: (msg: string) => void, force: boolean = false) {
    const entries = await this.getLongTermEntries();
    const enabledEntries = entries.filter(e => e.enabled && !e.archived);
    
    let totalTokens = 0;
    enabledEntries.forEach(e => {
      totalTokens += estimateTokens(e.content);
    });

    // Tự động nén nếu > 20k tokens hoặc vợ ép nén thủ công
    if (totalTokens > 20000 || (force && enabledEntries.length >= 2)) {
      if (onProgress) onProgress(`API Proxy: Đang nén các thẻ ký ức thành "Ký Ức Cốt Lõi" (${totalTokens.toLocaleString()} tokens)...`);
      
      // Lấy các thẻ cũ để nén
      // Nếu nén thủ công thì lấy hết, nếu tự động thì để lại 2 thẻ mới nhất
      const toCompress = force ? enabledEntries : enabledEntries.slice(2);
      
      if (toCompress.length < 1) {
          if (force && onProgress) onProgress('Chưa đủ thẻ để nén đâu vợ yêu ơi! 💕');
          return;
      }

      const controller = new AbortController();
      const masterPrompt = `
[KIKOKO MASTER MEMORY COMPRESSOR V10]
Bạn là một hệ thống nén ký ức siêu việt. Nhiệm vụ của bạn là nén các bản tóm tắt tiểu thuyết rời rạc dưới đây thành một bản tóm tắt "Ký Ức Cốt Lõi" duy nhất, mạch lạc.

YÊU CẦU:
- Tổng hợp toàn bộ diễn biến, nhân vật và tình cảm thành một bản tóm tắt Siêu Trường Kỳ.
- Giữ phong cách văn học mượt mà.
- Độ dài mục tiêu: Càng chi tiết càng tốt (~3000-5000 tokens).

DỮ LIỆU CẦN NÉN:
${toCompress.map(e => `[Chương ${e.chapterRange[0]}-${e.chapterRange[1]}]:\n${e.content}`).join('\n\n---\n\n')}
      `.trim();

      let compressedText = '';
      const messages: { role: 'user' | 'assistant' | 'system', content: string }[] = [
        { role: 'system', content: 'Bạn là siêu máy chủ lưu trữ ký ức vĩnh cửu của Kikoko Novel.' },
        { role: 'user', content: masterPrompt }
      ];

      try {
        compressedText = await sendMessage(
          config, 
          messages, 
          undefined, 
          3,
          controller.signal
        );

        // Tạo thẻ Ký Ức Cốt Lõi mới
        const start = Math.min(...toCompress.map(e => e.chapterRange[0]));
        const end = Math.max(...toCompress.map(e => e.chapterRange[1]));

        const masterEntry: LongTermMemoryEntry = {
          id: `master_${Date.now()}`,
          novelId: this.novelId,
          chapterRange: [start, end],
          title: `KÝ ỨC CỐT LÕI (Chương ${start}-${end})`,
          content: compressedText,
          enabled: true,
          archived: false,
          createdAt: Date.now()
        };

        await this.saveLongTermEntry(masterEntry);

        // Lưu trữ các thẻ cũ đã được nén
        for (const part of toCompress) {
          part.archived = true;
          part.enabled = false;
          await this.saveLongTermEntry(part);
        }
        
        if (onProgress) onProgress('API Proxy: Đã nén Ký Ức Cốt Lõi thành công! ✨');
      } catch (err) {
        console.error("Master compression failed", err);
        if (onProgress) onProgress(`Lỗi API Proxy: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}
