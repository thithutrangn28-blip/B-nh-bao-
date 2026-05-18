import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hourglass, Plus, Save, Trash2, RefreshCw, Book, Sparkles, Image as ImageIcon, Heart, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { loadKikokoInstagram } from '../utils/db';

interface Profile {
  id: string;
  name: string;
  avatar: string;
  type: 'char' | 'npc';
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  direction?: string;
  timestamp: number;
}

interface NPCNovelData {
  chapters: Chapter[];
  currentChapterIndex: number;
  backgroundImage?: string;
}

interface KikokoNPCNovelWritingProps {
  onClose: () => void;
  apiSettings: any;
  secondaryApiSettings: any;
  currentStory: any;
  getCompletionUrl: (url: string) => string;
  updateStory: (updates: any) => void;
}

export default React.memo(function KikokoNPCNovelWriting({ 
  onClose, 
  apiSettings, 
  secondaryApiSettings, 
  currentStory, 
  getCompletionUrl, 
  updateStory 
}: KikokoNPCNovelWritingProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  
  // State for novels per NPC
  const [npcNovels, setNpcNovels] = useState<Record<string, NPCNovelData>>(currentStory.npcNovels || {});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [tokenGoal, setTokenGoal] = useState(12000);
  const [generationTime, setGenerationTime] = useState(3); // minutes
  const [streamingContent, setStreamingContent] = useState('');
  const [userDirection, setUserDirection] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load profiles
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const data = await loadKikokoInstagram(currentStory.id);
        let loadedProfiles: Profile[] = [];
        if (data && data.profiles) {
          loadedProfiles = [...data.profiles];
        }

        // Add main bot and user if not present
        if (!loadedProfiles.find(p => p.id === 'char_bot')) {
          loadedProfiles.unshift({ id: 'char_bot', name: currentStory.botChar || 'Bot', avatar: '', type: 'char' });
        }
        if (!loadedProfiles.find(p => p.id === 'char_user')) {
          loadedProfiles.unshift({ id: 'char_user', name: currentStory.userChar || 'User', avatar: '', type: 'char' });
        }

        setProfiles(loadedProfiles);
        if (loadedProfiles.length > 0) setActiveProfile(loadedProfiles[0]);
      } catch (e) {
        console.error("Failed to load profiles", e);
      }
    };
    loadProfiles();
  }, [currentStory.id]);



  const currentNPCNovel = React.useMemo(() => {
    return activeProfile ? npcNovels[activeProfile.id] || { chapters: [{ id: 'ch1', title: 'Chương 1', content: '', timestamp: Date.now() }], currentChapterIndex: 0 } : null;
  }, [activeProfile, npcNovels]);
  const currentChapter = currentNPCNovel?.chapters[currentNPCNovel.currentChapterIndex];

  const robustParseJSON = (content: string) => {
    if (!content || typeof content !== 'string') return { content: '' };
    try {
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        // Fallback for cut-off content property
        const contentMatch = content.match(/"content"\s*:\s*"([\s\S]*?)$/);
        if (contentMatch) return { content: contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') };
        return { content: content };
      }

      let jsonStr = content.substring(firstBrace, lastBrace + 1);
      
      // Basic Cleanup
      jsonStr = jsonStr.replace(/```json\s?|```/g, '');
      
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        // Fix common AI JSON errors
        let fixedStr = jsonStr
          .replace(/[\u0000-\u001F]+/g, (match) => {
            return match === '\n' ? '\\n' : match === '\r' ? '\\r' : match === '\t' ? '\\t' : '';
          })
          .replace(/\\(?!"|\\|\/|b|f|n|r|t|u)/g, '\\\\')
          .replace(/,\s*([\}\]])/g, '$1');

        try {
          return JSON.parse(fixedStr);
        } catch (e2) {
          // Manual extraction for heavily malformed JSON
          const titleMatch = fixedStr.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const contentMatch = fixedStr.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          
          if (contentMatch) {
            return {
              title: (titleMatch && titleMatch[1]) ? titleMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '',
              content: (contentMatch && contentMatch[1]) ? contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : (content || '')
            };
          }
          throw e2;
        }
      }
    } catch (e) {
      console.warn("Robust parse failed, using raw content:", e);
      return { content: content };
    }
  };

  const generateChapter = async (isRecreate: boolean = false) => {
    if (!activeProfile || isGenerating) return;

    const commitContent = (text: string) => {
      const parsed = robustParseJSON(text);
      const contentToSave = parsed.content || '';
      const titleToSave = parsed.title || '';
      if (!contentToSave && !text) return;

      setNpcNovels(prevNovels => {
        if (!activeProfile) return prevNovels;
        const updatedNovels = { ...prevNovels };
        if (!updatedNovels[activeProfile.id]) {
          updatedNovels[activeProfile.id] = { chapters: [], currentChapterIndex: 0 };
        }
        const novel = updatedNovels[activeProfile.id];
        const chapter = novel.chapters[novel.currentChapterIndex];
        
        if (chapter) {
          if (contentToSave) chapter.content = contentToSave;
          if (titleToSave) chapter.title = titleToSave;
          
          // Persist the updated state
          updateStory({ npcNovels: updatedNovels });
        }
        return updatedNovels;
      });
    };
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setStreamingContent('');
    abortControllerRef.current = new AbortController();

    try {
      const apiToUse = secondaryApiSettings.enabled && secondaryApiSettings.apiKey ? secondaryApiSettings : apiSettings;
      const completionUrl = getCompletionUrl(apiToUse.proxyEndpoint);

      const systemMessage = {
        role: 'system',
        content: `Bạn là một đại tiểu thuyết gia chuyên viết truyện về cuộc đời của các nhân vật. 
        Nhiệm vụ của bạn là viết một chương tiểu thuyết CỰC KỲ DÀI, chi tiết và giàu cảm xúc cho nhân vật: ${activeProfile.name}.
        
        NGỮ CẢNH HỆ THỐNG (70.000 TOKEN):
        - Bạn được cung cấp tóm tắt cốt truyện chính, các thiết lập cài đặt, và ghi nhớ nội dung từ API phụ.
        - Bạn được cung cấp các chương truyện gần nhất của chính nhân vật ${activeProfile.name} trong bộ truyện riêng của họ.
        - Bạn cũng được cung cấp một phần nhỏ thông tin từ các chương gần nhất của câu chuyện chính để đảm bảo tính nhất quán, nhưng trọng tâm tuyệt đối là câu chuyện riêng của ${activeProfile.name}.
        
        MỤC TIÊU ĐỘ DÀI: Tối thiểu 12.000 token. Bạn PHẢI viết liên tục, không được dừng lại cho đến khi đạt đủ độ dài.
        PHONG CÁCH: Văn phong tiểu thuyết chuyên nghiệp, miêu tả nội tâm sâu sắc, bối cảnh sống động.
        ĐỊNH DẠNG: Sử dụng HTML (h3 cho tiêu đề nhỏ, p cho đoạn văn, b cho nhấn mạnh, i cho suy nghĩ, hr cho chuyển cảnh).
        
        QUY TẮC VIẾT TRUYỆN (BẮT BUỘC):
        1. KIỂM SOÁT NHỊP ĐỘ: Cấm tuyệt đối việc tự ý giải quyết mâu thuẫn (Conflict Resolution) trong cùng một chương trừ khi có lệnh từ người dùng. Chỉ được phép triển khai 'Rising Action' (hành động tiến triển) hoặc 'Climax' (cao trào).
        2. TIẾN TRÌNH DẦN DẦN: Mỗi phản hồi chỉ được phép xử lý tối đa 10-15% tiến trình của một Plot Point. Tập trung vào nội tâm, ánh mắt, cử chỉ thay vì nhảy vọt tới kết quả.
        3. DUY TRÌ TRẠNG THÁI: Trạng thái tâm lý (ví dụ: Giận dữ, Nghi ngờ) phải được bảo toàn qua nhiều chương cho đến khi có biến cố lớn hoặc lệnh thay đổi từ người dùng.
        4. ĐOẠN KẾT: Kết thúc chương bằng một câu trọn vẹn, có nghĩa, kết thúc bằng dấu chấm (.), không được lấp lửng, nhưng phải mở ra hướng cho chương tiếp theo một cách liền mạch.
        5. CẤM SỬ DỤNG KÝ TỰ ĐẶC BIỆT CHO THUẬT NGỮ: Tuyệt đối KHÔNG được để các thuật ngữ, tên riêng, hoặc từ ngữ nhấn mạnh trong dấu ngoặc đơn () hoặc dấu sao *. Hãy viết chúng như những từ ngữ bình thường trong văn bản tiểu thuyết. Ví dụ: viết "shoji" thay vì "*shoji*" hay "(shoji)".

        CẤU TRÚC TRẢ VỀ: Trả về một đối tượng JSON duy nhất có dạng:
        {
          "title": "Tiêu đề chương",
          "content": "Nội dung chương truyện (Sử dụng HTML, cực kỳ dài, ít nhất 12.000 token)"
        }
        
        LƯU Ý: Tuyệt đối không tóm tắt. Hãy viết chi tiết từng hơi thở, từng ánh mắt, từng biến chuyển nhỏ nhất trong tâm hồn nhân vật.`
      };

      // Prepare NPC-specific memory: previous chapters of this NPC's novel
      const npcNovel = npcNovels[activeProfile.id];
      const previousNPCChapters = npcNovel?.chapters
        ? npcNovel.chapters
            .slice(0, npcNovel.currentChapterIndex || 0)
            .slice(-3) // Last 3 NPC chapters for continuity
            .map((ch, i) => `[CHƯƠNG NPC ${i+1}: ${ch.title}]\n${ch.content.substring(0, 2000)}...`)
            .join('\n\n')
        : '';

      // Prepare Main Story context (limited as requested)
      const mainStoryChapters = currentStory.chapters
        .slice(-2) // Only last 2 main chapters for minimal context
        .map((ch, i) => `[BỐI CẢNH CHÍNH - CHƯƠNG ${i+1}]: ${ch.content.substring(0, 1000)}...`)
        .join('\n\n');

      const systemPromptText = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là một đại tiểu thuyết gia chuyên viết truyện về cuộc đời của các nhân vật.

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
Tên truyện gốc: ${currentStory.title}
Cốt truyện chính: ${currentStory.plot}
Thiết lập & Ghi nhớ nhân vật: ${currentStory.characterMemory || 'Không có'}
Ghi nhớ nội dung tổng quan: ${currentStory.memory || 'Không có'}

[THÔNG TIN THẾ GIỚI HIỆN TẠI]
- Thời gian: ${currentStory.worldState?.time || 'Không rõ'}
- Ngày tháng: ${currentStory.worldState?.date || 'Không rõ'}
- Thời tiết: ${currentStory.worldState?.weather || 'Không rõ'}
- Nhiệt độ: ${currentStory.worldState?.temperature || 'Không rõ'}
- Mùa: ${currentStory.worldState?.season || 'Không rõ'}

[BỘ NHỚ NGỮ CẢNH DÀI HẠN VÀ NGẮN HẠN CỦA NHÂN VẬT: ${activeProfile.name}]
${previousNPCChapters || 'Đây là chương đầu tiên trong tiểu thuyết của NPC này.'}

[BỐI CẢNH 3 CHƯƠNG GẦN NHẤT ĐỂ NGHIÊN CỨU TỪ CÂU CHUYỆN CHÍNH]
${mainStoryChapters || 'Không có dữ liệu chương chính.'}`;

      const userPromptText = `[NHIỆM VỤ DÀNH RIÊNG CHO BẠN]
Nhiệm vụ của bạn là viết một chương tiểu thuyết CỰC KỲ DÀI, chi tiết và giàu cảm xúc, tập trung tuyệt đối vào câu chuyện riêng của nhân vật: ${activeProfile.name}.
Định hướng từ người dùng: ${userDirection || 'Tiếp tục phát triển câu chuyện của nhân vật này một cách tự nhiên và sâu sắc.'}
${isRecreate ? 'YÊU CẦU ĐẶC BIỆT: Viết lại chương này với nội dung hoàn toàn mới, kịch tính và dài hơn nữa.' : ''}

MỤC TIÊU ĐỘ DÀI: Tối thiểu 12.000 token. Bạn PHẢI viết liên tục, không được dừng lại cho đến khi đạt đủ độ dài.
PHONG CÁCH: Văn phong tiểu thuyết chuyên nghiệp, miêu tả nội tâm sâu sắc, bối cảnh sống động. Đừng tóm tắt.
ĐỊNH DẠNG: Sử dụng HTML (h3 cho tiêu đề nhỏ, p cho đoạn văn, b cho nhấn mạnh, i cho suy nghĩ, hr cho chuyển cảnh).

QUY TẮC VIẾT TRUYỆN (BẮT BUỘC):
1. KIỂM SOÁT NHỊP ĐỘ: Cấm tuyệt đối việc tự ý giải quyết mâu thuẫn (Conflict Resolution) trong cùng một chương trừ khi định hướng yêu cầu. Hãy triển khai 'Rising Action' (hành động tiến triển) hoặc 'Climax' (cao trào).
2. TIẾN TRÌNH DẦN DẦN: Tập trung vào nội tâm, ánh mắt, cử chỉ thay vì nhảy vọt tới kết quả.
3. DUY TRÌ TRẠNG THÁI: Trạng thái tâm lý phải được bảo toàn qua nhiều chương.
4. ĐOẠN KẾT: Kết thúc chương bằng một câu trọn vẹn, có nghĩa, dấu chấm (.), không lấp lửng.
5. CẤM SỬ DỤNG KÝ TỰ ĐẶC BIỆT CHO THUẬT NGỮ: Tuyệt đối KHÔNG được để các thuật ngữ, tên riêng trong ngoặc đơn () hoặc dấu sao *.

ĐÂY LÀ NHIỆM VỤ SINH RA JSON JSON. TRẢ VỀ ĐÚNG 1 OBJECT JSON DUY NHẤT (VÀ KHÔNG CÓ BẤT KỲ VĂN BẢN NGOÀI LỀ NÀO):
{
  "title": "Tiêu đề chương",
  "content": "Nội dung chương truyện (Sử dụng HTML, cực kỳ dài, ít nhất 12.000 token)"
}`;

      const response = await fetch(completionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiToUse.apiKey}` },
        body: JSON.stringify({
          model: apiToUse.model,
          messages: [
            { role: 'system', content: systemPromptText },
            { role: 'user', content: userPromptText }
          ],
          max_tokens: 16384,
          temperature: 0.8,
          stream: true
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let lastProgressUpdate = Date.now();
      let lastTokenCount = 0;
      let lastCommitTokenCount = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') break;
              try {
                const data = JSON.parse(dataStr);
                const content = data.choices?.[0]?.delta?.content || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                fullText += content;
                
                let displayContent = fullText;
                // Try to extract content from JSON stream
                const contentMatch = fullText.match(/"content"\s*:\s*"([\s\S]*?)$/);
                if (contentMatch && contentMatch[1]) {
                  displayContent = contentMatch[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\t/g, '\t');
                } else if (fullText.includes('"content"')) {
                   // If we have "content" but regex failed, it might be just starting
                   displayContent = "...";
                }
                
                setStreamingContent(displayContent);
                
                const textToEstimate = contentMatch ? contentMatch[1] : fullText;
                const currentTokenCount = Math.floor(textToEstimate.length / 3.0);
                
                if (currentTokenCount > lastTokenCount) {
                  setGenerationProgress(currentTokenCount);
                  lastTokenCount = currentTokenCount;
                  lastProgressUpdate = Date.now();

                  // Incremental commit every 300 tokens
                  if (currentTokenCount - lastCommitTokenCount > 300) {
                    commitContent(fullText);
                    lastCommitTokenCount = currentTokenCount;
                  }
                }
                
                // Stalled detection: if no new tokens for 20 seconds while streaming
                if (Date.now() - lastProgressUpdate > 20000 && currentTokenCount > 0) {
                  throw new Error("Tiến trình bị đứng. Đang lưu lại phần đã viết...");
                }

              } catch (e: any) {
                if (e.message.includes("Tiến trình bị đứng")) throw e;
              }
            }
          }
        }
      }

      if (fullText) {
        commitContent(fullText);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        alert("Lỗi tạo chương: " + e.message);
        // Final attempt to save whatever we have
        if (streamingContent) {
          setNpcNovels(prevNovels => {
            if (!activeProfile) return prevNovels;
            const updatedNovels = { ...prevNovels };
            const novel = updatedNovels[activeProfile.id];
            if (!novel) return prevNovels;
            
            const chapter = novel.chapters[novel.currentChapterIndex];
            if (chapter) {
              chapter.content = streamingContent;
              updateStory({ npcNovels: updatedNovels });
            }
            return updatedNovels;
          });
        }
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      // Removed setStreamingContent('') to prevent content loss
    }
  };

  const addChapter = () => {
    if (!activeProfile) return;
    const updatedNovels = { ...npcNovels };
    if (!updatedNovels[activeProfile.id]) {
      updatedNovels[activeProfile.id] = { chapters: [], currentChapterIndex: 0 };
    }
    const novel = updatedNovels[activeProfile.id];
    const newChapter: Chapter = {
      id: `ch${novel.chapters.length + 1}`,
      title: `Chương ${novel.chapters.length + 1}`,
      content: '',
      timestamp: Date.now()
    };
    novel.chapters.push(newChapter);
    novel.currentChapterIndex = novel.chapters.length - 1;
    setNpcNovels(updatedNovels);
    updateStory({ npcNovels: updatedNovels });
  };

  const deleteChapter = () => {
    if (!activeProfile || !currentNPCNovel) return;
    if (currentNPCNovel.chapters.length <= 1) {
      alert("Không thể xóa chương duy nhất!");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa chương này?")) return;

    const updatedNovels = { ...npcNovels };
    if (!updatedNovels[activeProfile.id]) {
      updatedNovels[activeProfile.id] = { ...currentNPCNovel };
    }
    const novel = updatedNovels[activeProfile.id];
    novel.chapters.splice(novel.currentChapterIndex, 1);
    novel.currentChapterIndex = Math.max(0, novel.currentChapterIndex - 1);
    setNpcNovels(updatedNovels);
    updateStory({ npcNovels: updatedNovels });
  };

  const saveNovel = () => {
    updateStory({ npcNovels });
    alert("Đã lưu tiểu thuyết thành công! Nội dung của bạn đã được bảo vệ.");
  };

  const goToChapter = (index: number) => {
    if (!activeProfile || !currentNPCNovel) return;
    if (index < 0 || index >= currentNPCNovel.chapters.length) return;
    
    const updated = { ...npcNovels };
    if (!updated[activeProfile.id]) {
      updated[activeProfile.id] = { ...currentNPCNovel };
    }
    updated[activeProfile.id].currentChapterIndex = index;
    setNpcNovels(updated);
    updateStory({ npcNovels: updated });
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProfile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updatedNovels = { ...npcNovels };
      if (!updatedNovels[activeProfile.id]) {
        updatedNovels[activeProfile.id] = { chapters: [], currentChapterIndex: 0 };
      }
      updatedNovels[activeProfile.id].backgroundImage = base64;
      setNpcNovels(updatedNovels);
      updateStory({ npcNovels: updatedNovels });
    };
    reader.readAsDataURL(file);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[6000] flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'rgba(255, 240, 245, 0.85)',
        backgroundImage: currentNPCNovel?.backgroundImage ? `url(${currentNPCNovel.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Top Navigation - NPC Selection & Icons */}
      <div className="w-full bg-white/40 backdrop-blur-sm border-b border-[#FFE4E8] p-4 shrink-0 flex items-center">
        <button 
          onClick={() => setShowDrawer(true)}
          className="p-2 text-[#D18E9B] hover:scale-110 transition-all mr-2"
          title="Ngăn kéo chương"
        >
          <Menu size={20} />
        </button>
        
        <div className="flex-1 flex gap-6 overflow-x-auto py-2 no-scrollbar">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => setActiveProfile(profile)}
                className="flex flex-col items-center gap-1 shrink-0 group relative"
              >
                <div className={`w-[45px] h-[45px] rounded-full border-2 p-[2px] transition-all ${activeProfile?.id === profile.id ? 'border-[#F9C6D4] scale-110' : 'border-[#FFE4E8] opacity-70 group-hover:opacity-100'}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-pink-50">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D18E9B] bg-pink-100">
                        <Book size={18} />
                      </div>
                    )}
                  </div>
                </div>
                <span className={`text-[9px] font-medium transition-colors ${activeProfile?.id === profile.id ? 'text-[#D18E9B]' : 'text-stone-400'}`}>
                  {profile.name.toLowerCase()}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => bgInputRef.current?.click()}
              className="p-2 text-[#D18E9B] hover:scale-110 transition-all"
              title="Chọn hình nền"
            >
              <ImageIcon size={18} />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-[#D18E9B] hover:scale-110 transition-all"
              title="Định hướng"
            >
              <Heart size={18} fill={showSettings ? "#D18E9B" : "none"} />
            </button>
            <button onClick={onClose} className="p-2 text-[#D18E9B] hover:scale-110 transition-all">
              <X size={20} />
            </button>
          </div>
          <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
      </div>

      {/* Chapter Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-[7000]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="absolute top-0 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-md shadow-2xl border-r border-pink-100 flex flex-col z-[7001]"
            >
              <div className="p-6 border-b border-pink-50 flex items-center justify-between">
                <h3 className="font-bold text-[#D18E9B] flex items-center gap-2">
                  <Book size={18} /> Danh sách chương
                </h3>
                <button onClick={() => setShowDrawer(false)} className="text-stone-400 hover:text-stone-600">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {currentNPCNovel?.chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      goToChapter(idx);
                      setShowDrawer(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${currentNPCNovel.currentChapterIndex === idx ? 'bg-pink-50 text-[#C2185B] shadow-sm' : 'hover:bg-pink-50/50 text-stone-600'}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold opacity-60">Chương {idx + 1}</span>
                      <span className="text-sm font-medium truncate max-w-[180px]">{ch.title}</span>
                    </div>
                    <ChevronRight size={14} className={`transition-transform ${currentNPCNovel.currentChapterIndex === idx ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-pink-50">
                <button 
                  onClick={() => {
                    addChapter();
                    setShowDrawer(false);
                  }}
                  className="w-full py-3 bg-pink-50 text-[#D18E9B] rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-pink-100 transition-all"
                >
                  <Plus size={14} /> Thêm chương mới
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Orientation Card (Heart Settings) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute top-20 right-4 z-[6500] w-[calc(100%-32px)] sm:w-80 max-h-[70vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-pink-100 p-6 custom-scrollbar"
          >
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <div className="text-sm font-bold text-[#D18E9B] flex items-center gap-2">
                  <Sparkles size={16} /> Định hướng sáng tác
                </div>
                <button onClick={() => setShowSettings(false)} className="sm:hidden text-stone-400">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Mồi câu định hướng</label>
                <textarea
                  value={userDirection}
                  onChange={(e) => setUserDirection(e.target.value)}
                  placeholder="Ép API viết theo ý mình..."
                  className="w-full bg-pink-50/50 rounded-xl p-3 text-sm text-[#4A4A4A] outline-none border border-transparent focus:border-pink-200 resize-none h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Số Token</label>
                  <input 
                    type="number"
                    value={tokenGoal}
                    onChange={(e) => setTokenGoal(Number(e.target.value))}
                    className="w-full bg-pink-50/50 rounded-xl p-2 text-sm text-[#4A4A4A] outline-none border border-transparent focus:border-pink-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Thời gian (phút)</label>
                  <input 
                    type="number"
                    value={generationTime}
                    onChange={(e) => setGenerationTime(Number(e.target.value))}
                    className="w-full bg-pink-50/50 rounded-xl p-2 text-sm text-[#4A4A4A] outline-none border border-transparent focus:border-pink-200"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSettings(false);
                  generateChapter(false);
                }}
                disabled={isGenerating}
                className="w-full py-3 bg-[#D18E9B] text-white rounded-full font-bold text-sm shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                ⸝⸝ Bắt đầu dệt mộng ✦₊
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API HUD */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 right-6 z-[6100] bg-white/80 backdrop-blur-md border border-pink-100 rounded-2xl p-4 shadow-xl min-w-[200px]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#C2185B]">
                <span className="flex items-center gap-1"><Sparkles size={14} /> Token</span>
                <span>{(generationProgress ?? 0).toLocaleString()} / {(tokenGoal ?? 0).toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-pink-50 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#FFB6C1]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (generationProgress / tokenGoal) * 100)}%` }}
                />
              </div>
              
              <div className="text-[10px] text-[#D18E9B] font-medium animate-pulse text-center flex items-center justify-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#D18E9B] rounded-full animate-bounce" />
                {streamingContent.slice(-30)}...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto px-5 py-8 custom-scrollbar relative">
        {/* Navigation Buttons */}
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[5500] flex flex-col gap-4">
          <button
            onClick={() => goToChapter(currentNPCNovel!.currentChapterIndex - 1)}
            disabled={!currentNPCNovel || currentNPCNovel.currentChapterIndex === 0}
            className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-pink-100 flex items-center justify-center text-[#D18E9B] shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100"
            title="Chương trước"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[5500] flex flex-col gap-4">
          <button
            onClick={() => goToChapter(currentNPCNovel!.currentChapterIndex + 1)}
            disabled={!currentNPCNovel || currentNPCNovel.currentChapterIndex === currentNPCNovel.chapters.length - 1}
            className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-pink-100 flex items-center justify-center text-[#D18E9B] shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100"
            title="Chương sau"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="w-full">
          <motion.div 
            layout
            className="bg-transparent rounded-[20px] p-0 min-h-[80vh] relative"
          >
            {/* Content */}
            <div className="max-w-none">
              <h2 className="text-2xl font-bold text-[#3E2723] mb-12 text-center opacity-80">
                {currentChapter?.title}
              </h2>
              
              <div 
                className="text-[#3E2723] font-medium leading-[1.8] text-justify space-y-8 novel-content"
                dangerouslySetInnerHTML={{ __html: isGenerating ? streamingContent : (currentChapter?.content || '<p className="text-stone-400 italic text-center py-20">Chưa có nội dung cho chương này...</p>') }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full p-4 shrink-0 bg-white/10 backdrop-blur-[2px]">
        <div className="max-w-md mx-auto flex items-center justify-center gap-6">
          <button 
            onClick={deleteChapter}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#BCAAA4] hover:text-[#FFAB91] transition-colors"
          >
            <Trash2 size={14} strokeWidth={1.5} /> Xóa
          </button>
          <button 
            onClick={() => generateChapter(true)}
            disabled={isGenerating}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#D18E9B] hover:opacity-70 transition-colors disabled:opacity-30"
          >
            <RefreshCw size={14} strokeWidth={1.5} className={isGenerating ? 'animate-spin' : ''} /> Tạo lại
          </button>
          <button 
            onClick={saveNovel}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#D18E9B] hover:opacity-70 transition-colors"
          >
            <Save size={14} strokeWidth={1.5} /> Lưu
          </button>
          
          <button 
            onClick={addChapter}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#D18E9B] hover:opacity-70 transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} /> Chương mới
          </button>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .novel-content h3 {
          font-size: 1.25rem;
          font-weight: bold;
          color: #D18E9B;
          margin-top: 2rem;
          margin-bottom: 1rem;
          text-align: center;
        }
        .novel-content p {
          margin-bottom: 2rem;
          text-indent: 2.5rem;
          word-spacing: 0.15em;
          line-height: 2;
          color: #3E2723;
          font-weight: 500;
        }
        .novel-content {
          width: 100%;
          margin: 0 auto;
          text-align: justify;
          font-family: 'Times New Roman', serif;
          font-size: 1.15rem;
        }
        .novel-content b {
          color: #C2185B;
        }
        .novel-content i {
          color: #777;
        }
        .novel-content hr {
          border: none;
          border-top: 1px dashed #FFE4E8;
          margin: 3rem 0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FFE4E8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F9C6D4;
        }
      `}</style>
    </motion.div>
  );
});
