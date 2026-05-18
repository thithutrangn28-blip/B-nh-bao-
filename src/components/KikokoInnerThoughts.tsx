import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hourglass, Plus, Heart, Activity, Sparkles, Image as ImageIcon } from 'lucide-react';
import { loadKikokoInstagram } from '../utils/db';
import { sendMessage, sendMessageStream } from '../utils/apiProxy';

const safeParseJson = (text: string) => {
  if (!text || typeof text !== 'string') return { isJson: false, json: null };
  try {
    let jsonStr = text.replace(/```json\s*|\s*```/g, '').trim();
    const firstCurly = jsonStr.indexOf('{');
    const firstBracket = jsonStr.indexOf('[');
    let startIndex = -1;
    let isObject = false;

    if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
      startIndex = firstCurly;
      isObject = true;
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
      isObject = false;
    }
    
    if (startIndex !== -1) {
      const lastIndex = isObject ? jsonStr.lastIndexOf('}') : jsonStr.lastIndexOf(']');
      if (lastIndex !== -1 && lastIndex >= startIndex) {
        jsonStr = jsonStr.substring(startIndex, lastIndex + 1);
      }
    }
    
    try {
      return { isJson: true, json: JSON.parse(jsonStr) };
    } catch {
      const fixedStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
      return { isJson: true, json: JSON.parse(fixedStr) };
    }
  } catch (e) {
    return { isJson: false, json: null };
  }
};

const extractTextFromResponse = (response: any) => {
  if (typeof response === 'string') return response;
  if (!response) return '';
  return (
    response?.choices?.[0]?.message?.content ||
    response?.content?.[0]?.text ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.text ||
    response?.content ||
    response?.message ||
    ''
  );
};


interface Profile {
  id: string;
  name: string;
  avatar: string;
  type: 'char' | 'npc';
}

interface InnerThoughtsData {
  physiological: {
    innerThoughts: string;
    mood: string;
    bodyAndHeart: string;
    heartRate: string;
  };
  emotions: Record<string, number>;
  priorities: string[];
  diaries: {
    devil: string;
    angel: string;
    gossip: string;
    confession: string;
    happiest: string;
    sadness: string;
  };
}

interface ExceptionMessage {
  role: 'user' | 'char';
  content: string;
}

interface ExceptionData {
  content: string;
  customCover?: string;
  customAvatar?: string;
  conversation?: ExceptionMessage[];
}

interface ThoughtGeneration {
  id: string;
  timestamp: number;
  data: InnerThoughtsData;
}

interface ExceptionGeneration {
  id: string;
  timestamp: number;
  data: ExceptionData;
}

interface KikokoInnerThoughtsProps {
  onClose: () => void;
  apiSettings: any;
  secondaryApiSettings: any;
  currentStory: any;
  currentChapter: any;
  getCompletionUrl: (url: string) => string;
  updateStory: (updates: any) => void;
}

const EMOTION_KEYS = [
  "Cảm Xúc dành cho User", "Thiện Cảm dành cho nhân vật của User", "Buồn", "Không Vui", "Khoẻ", "Năng Lượng", 
  "Ghen Tuông", "Trạng Thái", "Tự Tin", "Cục Cằn", "Khó Chịu", "Ấm áp", "Dễ chịu", "Hài Lòng", 
  "Hạnh Phúc (Happy Happy)", "Mệt nhưng cực hạnh phúc", "Cam Chịu", "Phẫn Nộ", "Chiếm hữu", 
  "Muốn nổi điên", "Cay Cú", "Sốc Nặng", "Ấm Ức", "Tủi Thân", "Muốn Cắn người", 
  "Tức lắm mà không làm gì được!!", "Hổ Thẹn", "Xí Hổ", "Ngại ngùng", "Đỏ Mặt cấp độ Max pro", 
  "Bùng Nổ trái tim", "Lý Trí về 0", "Gào Thét vì hạnh phúc", "Tụt Mood", "Âm Độ Hạnh Phúc", 
  "Không Thích", "Tẻ Nhạt", "Cảm thấy người kia phiền phức", "Lo âu", "Căm Ghét", "Ngứa mắt", 
  "Khó chịu ra mặt", "Nóng Máu", "Tâm trạng cực kỳ tồi tệ", "Rung động", "Chỉ số hạnh phúc tăng vọt"
];

const migrateThoughts = (oldData: any) => {
  if (!oldData) return {};
  const newData: Record<string, Record<string, ThoughtGeneration[]>> = {};
  for (const profileId in oldData) {
    newData[profileId] = {};
    for (const chapterId in oldData[profileId]) {
      const item = oldData[profileId][chapterId];
      if (Array.isArray(item)) {
        newData[profileId][chapterId] = item;
      } else if (item) {
        newData[profileId][chapterId] = [{ id: 'legacy', timestamp: Date.now(), data: item }];
      }
    }
  }
  return newData;
};

const migrateExceptions = (oldData: any) => {
  if (!oldData) return {};
  const newData: Record<string, Record<string, ExceptionGeneration[]>> = {};
  for (const profileId in oldData) {
    newData[profileId] = {};
    for (const chapterId in oldData[profileId]) {
      const item = oldData[profileId][chapterId];
      if (Array.isArray(item)) {
        newData[profileId][chapterId] = item;
      } else if (item) {
        newData[profileId][chapterId] = [{ id: 'legacy', timestamp: Date.now(), data: item }];
      }
    }
  }
  return newData;
};

export default function KikokoInnerThoughts({ onClose, apiSettings, secondaryApiSettings, currentStory, currentChapter, getCompletionUrl, updateStory }: KikokoInnerThoughtsProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<'thoughts' | 'exception'>('thoughts');
  
  // State for generated data
  const [thoughtsHistory, setThoughtsHistory] = useState<Record<string, Record<string, ThoughtGeneration[]>>>(migrateThoughts(currentStory.innerThoughts));
  const [exceptionHistory, setExceptionHistory] = useState<Record<string, Record<string, ExceptionGeneration[]>>>(migrateExceptions(currentStory.exceptionCorner));
  
  const [selectedThoughtIndex, setSelectedThoughtIndex] = useState(0);
  const [selectedExceptionIndex, setSelectedExceptionIndex] = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [customBg, setCustomBg] = useState<string | null>(currentStory.innerThoughtsBg || null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedThoughtIndex(0);
    setSelectedExceptionIndex(0);
  }, [activeProfile?.id, currentChapter?.id, activeTab]);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const data = await loadKikokoInstagram(currentStory.id);
        let loadedProfiles: Profile[] = [];
        if (data && data.profiles) {
          loadedProfiles = [...data.profiles];
        }

        const botIndex = loadedProfiles.findIndex(p => p.id === 'char_bot');
        const botProfile = botIndex !== -1 ? loadedProfiles.splice(botIndex, 1)[0] : null;
        const userIndex = loadedProfiles.findIndex(p => p.id === 'char_user');
        const userProfile = userIndex !== -1 ? loadedProfiles.splice(userIndex, 1)[0] : null;

        if (userProfile) loadedProfiles.unshift(userProfile);
        else loadedProfiles.unshift({ id: 'char_user', name: currentStory.userChar || 'User', avatar: 'https://i.postimg.cc/5ywFrTmH/eb9a4782a68c767ff5a7e46ad2b4b0ff.jpg', type: 'char' });
        
        if (botProfile) loadedProfiles.unshift(botProfile);
        else loadedProfiles.unshift({ id: 'char_bot', name: currentStory.botChar || 'Bot', avatar: 'https://i.postimg.cc/5ywFrTmH/eb9a4782a68c767ff5a7e46ad2b4b0ff.jpg', type: 'char' });

        setProfiles(loadedProfiles);
        if (loadedProfiles.length > 0) setActiveProfile(loadedProfiles[0]);
      } catch (e) {
        console.error("Failed to load profiles", e);
      }
    };
    loadProfiles();
  }, [currentStory.id, currentStory.botChar, currentStory.userChar]);

  const robustParseJSON = (content: string) => {
    if (!content || typeof content !== 'string') return { content: '' };
    const { isJson, json } = safeParseJson(content);
    if (isJson) return json;
    console.warn("Robust parse failed, using raw content");
    return { content: content };
  };

  const buildContext = (isException: boolean = false) => {
    let apiToUse = secondaryApiSettings.enabled && secondaryApiSettings.apiKey ? secondaryApiSettings : apiSettings;
    
    // Find current chapter index
    const targetChapterIndex = currentStory.chapters.findIndex((ch: any) => ch.id === currentChapter.id);
    const previousChapters = targetChapterIndex !== -1 ? currentStory.chapters.slice(0, targetChapterIndex) : [];
    
    let previousContext = '';
    if (previousChapters.length > 0) {
      // Lấy tối đa 3 chương gần nhất để tránh gửi quá tải hệ thống, nhưng vẫn đủ ngữ cảnh thực tế (vượt qua giới hạn 300 từ cũ)
      const recentChaptersToInclude = previousChapters.slice(-3);
      const chaptersContext = recentChaptersToInclude.map((ch: any) => `--- ${ch.title} ---\n${ch.content}`).join('\n\n');
      
      previousContext = `\n\n[TÓM TẮT DIỄN BIẾN TRƯỚC ĐÓ (Bộ Nhớ Ngữ Cảnh)]\n${currentStory.memory || 'Chưa có tóm tắt.'}\n\n[NỘI DUNG CHI TIẾT 3 CHƯƠNG TRƯỚC]\n${chaptersContext}`;
    }

    let exceptionHistoryContext = '';
    if (isException && activeProfile) {
      const profileExceptions = exceptionHistory[activeProfile.id]?.[currentChapter.id] || [];
      if (profileExceptions.length > 0) {
        exceptionHistoryContext = `\n\n[LỊCH SỬ THỦ THỈ RIÊNG BIỆT CỦA BẠN (${activeProfile.name}) VỚI TÁC GIẢ TRONG CHƯƠNG NÀY]\n(Lưu ý: Bạn chỉ biết những gì bạn đã nói, tuyệt đối không biết nội dung thủ thỉ của các nhân vật khác)\n`;
        // Only include a few recent ones to save tokens
        const recentExceptions = profileExceptions.slice(0, 3);
        recentExceptions.forEach((ex, idx) => {
          exceptionHistoryContext += `--- Lần thủ thỉ ${recentExceptions.length - idx} ---\n${ex.data.content}\n`;
          if (ex.data.conversation) {
            ex.data.conversation.forEach(msg => {
              exceptionHistoryContext += `${msg.role === 'user' ? 'Tác giả' : activeProfile.name}: ${msg.content}\n`;
            });
          }
        });
      }
    }

    // Explicitly identify the active profile's settings
    let activeProfileSetup = 'Không có thông tin chi tiết.';
    if (activeProfile?.id === 'char_user') activeProfileSetup = currentStory.userCharSetup || '';
    else if (activeProfile?.id === 'char_bot') activeProfileSetup = currentStory.botCharSetup || '';
    else {
      // Try to find in NPC profiles if they exist
      const npc = currentStory.npcProfiles?.find((n: any) => n.id === activeProfile?.id);
      if (npc) activeProfileSetup = npc.setup || '';
    }

    return `
      [BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
      - Tên truyện: ${currentStory.title || 'Chưa có tên'}
      - Cốt truyện chính: ${currentStory.plot}
      - Ký ức chung/Memory: ${currentStory.memory || currentStory.characterMemory || 'Không có'}
      - Thiết lập nhân vật User (${currentStory.userChar || 'User'}): ${currentStory.userDescription || currentStory.userCharSetup || 'Không có'}
      - Thiết lập nhân vật Bot (${currentStory.botChar || 'Bot'}): ${currentStory.charDescription || currentStory.botCharSetup || 'Không có'}
      - Smart Memory (Tóm tắt tiến độ): ${currentStory.progressSummary || 'Không có'}
      - Tình huống hiện tại: ${currentStory.situationTracking || 'Không có'}
      - Thiết lập thế giới: ${currentStory.worldSetup || 'Không có'}
      - Các thiết lập khác: ${currentStory.otherSetup || 'Không có'}
      - Thời gian hiện tại: ${currentStory.currentTime || 'Chưa rõ'}
      - Ngày tháng: ${currentStory.currentDate || 'Chưa rõ'}
      - Thời tiết: ${currentStory.weather || 'Chưa rõ'}
      - Nhiệt độ: ${currentStory.temperature || 'Chưa rõ'}
      - Mùa: ${currentStory.season || 'Chưa rõ'}
      - Tính cách/Thiết lập NPC đang xét: ${activeProfileSetup}
      ${previousContext}
      ${exceptionHistoryContext}
      
      - Chương hiện tại: ${currentChapter.title}
      - Nội dung chương hiện tại: ${currentChapter.content}

      QUAN TRỌNG: BẠN ĐANG ĐÓNG VAI NHÂN VẬT: ${activeProfile?.name || 'Unknown'}.
      HÃY ĐỌC KỸ THIẾT LẬP CỦA BẠN ĐỂ TRẢ LỜI ĐÚNG TÍNH CÁCH VÀ VAI TRÒ!
    `;
  };

  const generateThoughts = async () => {
    if (!activeProfile || !currentChapter?.id) return;
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const context = buildContext();
      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là hệ thống phân tích tâm lý nhân vật chuyên nghiệp.

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN VÀ BỐI CẢNH]
${context}

[NHIỆM VỤ DÀNH RIÊNG CHO BẠN]
Phân tích sâu sắc nội tâm của nhân vật: ${activeProfile.name}
(Lưu ý: Chỉ tập trung vào ${activeProfile.name}, không nhầm lẫn với các nhân vật khác. Bạn tuyệt đối không biết về những lời thủ thỉ riêng tư của các nhân vật khác với tác giả).

YÊU CẦU:
Đọc kỹ thiết lập riêng của ${activeProfile.name}, bối cảnh và nội dung chương hiện tại.
Phân tích những gì ${activeProfile.name} đang thực sự nghĩ và cảm nhận (không phải những gì họ thể hiện ra ngoài).
ĐÂY LÀ NHIỆM VỤ SINH RA JSON. KHÔNG ĐƯỢC CÓ BẤT KỲ VĂN BẢN NÀO BÊN NGOÀI JSON.

TRẢ VỀ ĐÚNG 1 OBJECT JSON HỢP LỆ THEO CẤU TRÚC SAU:
{
  "physiological": {
    "innerThoughts": "Suy nghĩ thầm kín của ${activeProfile.name} (viết dài khoảng 1000 ký tự)...",
    "mood": "Tâm trạng thực sự của ${activeProfile.name} (viết dài khoảng 1000 ký tự)...",
    "bodyAndHeart": "Cảm giác cơ thể và nhịp đập trái tim của ${activeProfile.name} (viết dài khoảng 1000 ký tự)...",
    "heartRate": "Nhịp tim (VD: Ổn Định, 120bpm, Đập loạn nhịp...)"
  },
  "emotions": {
    // Trả về số từ 0 đến 100 cho CÁC CẢM XÚC SAU (phải có đủ):
    "Cảm Xúc dành cho User": 80,
    "Thiện Cảm dành cho nhân vật của User": 90,
    "Buồn": 0, "Không Vui": 0, "Khoẻ": 100, "Năng Lượng": 100, "Ghen Tuông": 0,
    "Trạng Thái": 80, "Tự Tin": 90, "Cục Cằn": 0, "Khó Chịu": 0, "Ấm áp": 100,
    "Dễ chịu": 100, "Hài Lòng": 100, "Hạnh Phúc (Happy Happy)": 100,
    "Mệt nhưng cực hạnh phúc": 0, "Cam Chịu": 0, "Phẫn Nộ": 0, "Chiếm hữu": 0,
    "Muốn nổi điên": 0, "Cay Cú": 0, "Sốc Nặng": 0, "Ấm Ức": 0, "Tủi Thân": 0,
    "Muốn Cắn người": 0, "Tức lắm mà không làm gì được!!": 0, "Hổ Thẹn": 0,
    "Xí Hổ": 0, "Ngại ngùng": 0, "Đỏ Mặt cấp độ Max pro": 0, "Bùng Nổ trái tim": 0,
    "Lý Trí về 0": 0, "Gào Thét vì hạnh phúc": 0, "Tụt Mood": 0, "Âm Độ Hạnh Phúc": 0,
    "Không Thích": 0, "Tẻ Nhạt": 0, "Cảm thấy người kia phiền phức": 0, "Lo âu": 0,
    "Căm Ghét": 0, "Ngứa mắt": 0, "Khó chịu ra mặt": 0, "Nóng Máu": 0,
    "Tâm trạng cực kỳ tồi tệ": 0, "Rung động": 0, "Chỉ số hạnh phúc tăng vọt": 0
  },
  "priorities": [
    "1. Việc ưu tiên 1 của ${activeProfile.name}...",
    "2. Việc ưu tiên 2 của ${activeProfile.name}...",
    // Liệt kê đủ các việc ưu tiên nhất
  ],
  "diaries": {
    "devil": "Phần ác trong tâm trí ${activeProfile.name} đang gào thét gì (viết dài khoảng 1500 ký tự)...",
    "angel": "Phần thiện trong tâm trí ${activeProfile.name} đang khuyên nhủ gì (viết dài khoảng 1500 ký tự)...",
    "gossip": "Những lời bàn tán, đánh giá thầm kín của ${activeProfile.name} về người khác (viết dài khoảng 1500 ký tự)...",
    "confession": "Lời thú nhận mà ${activeProfile.name} không bao giờ dám nói ra (viết dài khoảng 1000 ký tự)...",
    "happiest": "Điều gì đang làm ${activeProfile.name} cảm thấy hạnh phúc nhất lúc này (viết dài khoảng 1000 ký tự)...",
    "sadness": "Nỗi buồn thầm kín mà ${activeProfile.name} đang che giấu (viết dài khoảng 1000 ký tự)..."
  }
}`;

      let apiToUse = secondaryApiSettings.enabled && secondaryApiSettings.apiKey ? secondaryApiSettings : apiSettings;
      const response = await sendMessage(apiToUse, [{ role: 'user', content: prompt }]);
      const text = extractTextFromResponse(response);
      if (!text) throw new Error("API không trả về nội dung.");
      
      if (text) {
        const parsed = robustParseJSON(text);
        const newGen: ThoughtGeneration = { id: Date.now().toString(), timestamp: Date.now(), data: parsed };
        const newHistory = { ...thoughtsHistory };
        if (!newHistory[activeProfile.id]) newHistory[activeProfile.id] = {};
        if (!newHistory[activeProfile.id][currentChapter.id]) newHistory[activeProfile.id][currentChapter.id] = [];
        
        newHistory[activeProfile.id][currentChapter.id] = [newGen, ...newHistory[activeProfile.id][currentChapter.id]];
        
        setThoughtsHistory(newHistory);
        setSelectedThoughtIndex(0);
        updateStory({ innerThoughts: newHistory });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') alert("Lỗi tạo suy nghĩ: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateException = async (isReply: boolean = false, userReplyText: string = '') => {
    if (!activeProfile || !currentChapter?.id) return;
    setIsGenerating(true);
    setGenerationProgress(0);
    setStreamingContent('');
    setGenerationStatus('⸝ Nhận tín hiệu từ máy chủ... (Đang chờ API phản hồi)');
    abortControllerRef.current = new AbortController();

    try {
      const context = buildContext(true); // Pass true to include exception history
      
      const systemMessage = {
        role: 'system' as const,
        content: `Bạn là một đại tiểu thuyết gia chuyên viết những bức thư tâm tình CỰC KỲ DÀI, LAN MAN và CHI TIẾT. 
        Nhiệm vụ tối thượng của bạn là viết một bức thư đạt độ dài tối thiểu 10.000 token (khoảng 30.000 - 40.000 ký tự). 
        Bạn PHẢI mô tả từng cảm xúc nhỏ nhất, kể lại từng kỷ niệm vụn vặt nhất, và phân tích tâm lý nhân vật một cách cực kỳ tỉ mỉ. 
        Tuyệt đối KHÔNG được tóm tắt. Hãy viết như thể đây là tác phẩm để đời của bạn.
        Sử dụng định dạng HTML mạnh (h3, p, b, i, ul, li, hr) để trình bày bức thư một cách sang trọng.`
      };

      let initialPrompt = '';
      const megaLengthInstructions = `
      YÊU CẦU BẮT BUỘC VỀ ĐỘ DÀI (MỤC TIÊU 10.000 TOKEN):
      - Bức thư của bạn PHẢI đạt độ dài kỷ lục. Hãy viết liên tục, không ngừng nghỉ.
      - Cấu trúc bức thư PHẢI bao gồm ít nhất 10 chương nhỏ, mỗi chương mô tả một khía cạnh khác nhau của sự đút lót và tâm tình.
      - Mỗi đoạn văn phải dài và chứa đựng nhiều tính từ, trạng từ mô tả cảm xúc.
      - Sử dụng HTML MẠNH:
        - <h3> cho tiêu đề mỗi chương tâm tình.
        - <p> cho các đoạn văn kể lể.
        - <b> cho những lời khẩn cầu quan trọng.
        - <i> cho những suy nghĩ nội tâm thầm kín.
        - <ul> và <li> cho danh sách những điều bạn hứa hẹn hoặc xin xỏ.
        - <hr /> để tạo khoảng lặng giữa các phần cảm xúc.
      - NỘI DUNG CHI TIẾT:
        1. [Chương 1: Khởi đầu nịnh nọt] - Tôn vinh vẻ đẹp và quyền năng của Tác Giả (viết thật dài).
        2. [Chương 2: Ký ức xa xăm] - Kể lại một sự kiện nhỏ trong truyện nhưng dưới góc nhìn cực kỳ chi tiết của bạn.
        3. [Chương 3: Nỗi lòng tê tái] - Phân tích những nỗi khổ mà bạn đang gánh chịu.
        4. [Chương 4: Sự đút lót ngọt ngào] - Những lời hứa sẽ làm hài lòng tác giả.
        5. [Chương 5: Danh sách 20 điều ước] - Liệt kê và giải thích chi tiết từng điều.
        6. [Chương 6: Góc nhìn về kẻ khác] - Nhận xét về các nhân vật khác một cách xéo xắt hoặc nũng nịu.
        7. [Chương 7: Tương lai rạng ngời] - Vẽ ra viễn cảnh nếu bạn được làm vai chính.
        8. [Chương 8: Lời thề trung thành] - Cam kết sẽ không bao giờ phản bội tác giả.
        9. [Chương 9: Những bí mật chưa kể] - Tiết lộ những suy nghĩ mà bạn chưa từng nói với ai.
        10. [Chương 10: Lời kết thiết tha] - Một cái kết dài và đầy cảm xúc.
      - TRẢ VỀ DUY NHẤT 1 OBJECT JSON:
      {
        "content": "Nội dung bức thư HTML siêu dài (BẮT BUỘC TRÊN 10.000 TOKEN)..."
      }
      `;

      if (!isReply) {
        initialPrompt = `Bạn là nhân vật ${activeProfile.name} trong truyện.
      ${context}

      Hãy viết một bức thư gửi cho "Tác Giả Quyền Năng" (người dùng).
      
      ${megaLengthInstructions}
      - Bạn tuyệt đối không biết về những lời thủ thỉ của các nhân vật khác.
      - Giọng điệu: ${activeProfile.name} (giữ đúng tính cách thiết lập).`;
      } else {
        // Build conversation history for the prompt
        const currentList = exceptionHistory[activeProfile.id]?.[currentChapter.id];
        const currentItem = currentList?.[selectedExceptionIndex];
        let conversationContext = '';
        if (currentItem) {
          conversationContext += `--- Bức thư ban đầu của bạn (${activeProfile.name}) ---\n${currentItem.data.content}\n\n`;
          if (currentItem.data.conversation) {
            currentItem.data.conversation.forEach(msg => {
              if (msg.role === 'user') {
                conversationContext += `--- Tác giả hồi âm ---\n${msg.content}\n\n`;
              } else {
                conversationContext += `--- Bạn (${activeProfile.name}) trả lời ---\n${msg.content}\n\n`;
              }
            });
          }
        }

        initialPrompt = `Bạn là nhân vật ${activeProfile.name} trong truyện.
      ${context}

      Cuộc trò chuyện bí mật:
      ${conversationContext}
      --- Tác giả vừa hồi âm thêm ---\n${userReplyText}

      YÊU CẦU:
      - Hãy viết lời đáp trả lại Tác Giả.
      - Giữ đúng vai diễn ${activeProfile.name}.
      ${megaLengthInstructions}`;
      }

      let apiToUse = secondaryApiSettings.enabled && secondaryApiSettings.apiKey ? secondaryApiSettings : apiSettings;
      
      let fullText = '';
      const messages = [systemMessage, { role: 'user' as const, content: initialPrompt }];
      for await (const chunk of sendMessageStream(apiToUse, messages, undefined, abortControllerRef.current.signal)) {
        if (chunk) {
          fullText += chunk;
          
          let displayContent = fullText;
          const contentMatch = fullText.match(/"content"\s*:\s*"([\s\S]*?)$/);
          if (contentMatch && contentMatch[1]) {
            displayContent = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          }
          setStreamingContent(displayContent);
          
          const textToEstimate = contentMatch ? contentMatch[1] : fullText;
          const currentTokenCount = Math.floor(textToEstimate.length / 3.0);
          setGenerationProgress(currentTokenCount > 10000 ? 10000 : currentTokenCount);
        }
      }


      if (fullText) {
        const parsed = robustParseJSON(fullText);
        const newHistory = { ...exceptionHistory };
        
        if (!isReply) {
          const newGen: ExceptionGeneration = { id: Date.now().toString(), timestamp: Date.now(), data: parsed };
          if (!newHistory[activeProfile.id]) newHistory[activeProfile.id] = {};
          if (!newHistory[activeProfile.id][currentChapter.id]) newHistory[activeProfile.id][currentChapter.id] = [];
          
          newHistory[activeProfile.id][currentChapter.id] = [newGen, ...newHistory[activeProfile.id][currentChapter.id]];
          setExceptionHistory(newHistory);
          setSelectedExceptionIndex(0);
        } else {
          // Append to conversation
          const currentList = newHistory[activeProfile.id]?.[currentChapter.id];
          if (currentList && currentList[selectedExceptionIndex]) {
            const currentItem = currentList[selectedExceptionIndex];
            if (!currentItem.data.conversation) currentItem.data.conversation = [];
            
            // Add user's reply first
            currentItem.data.conversation.push({ role: 'user', content: userReplyText });
            // Add bot's response
            currentItem.data.conversation.push({ role: 'char', content: parsed.content });
            
            setExceptionHistory(newHistory);
          }
        }
        
        updateStory({ exceptionCorner: newHistory });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') alert("Lỗi tạo góc ngoại lệ: " + e.message);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const [userReplyText, setUserReplyText] = useState('');

  const handleClose = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    onClose();
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCustomBg(base64);
      updateStory({ innerThoughtsBg: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file || !activeProfile || !currentChapter) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newHistory = { ...exceptionHistory };
      const currentList = newHistory[activeProfile.id]?.[currentChapter.id];
      
      if (currentList && currentList[selectedExceptionIndex]) {
        const currentItem = currentList[selectedExceptionIndex];
        if (type === 'cover') {
          currentItem.data.customCover = base64;
        } else {
          currentItem.data.customAvatar = base64;
        }
        setExceptionHistory(newHistory);
        updateStory({ exceptionCorner: newHistory });
      }
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth()+1}`;
  };

  const profileThoughts = activeProfile && currentChapter ? thoughtsHistory[activeProfile.id]?.[currentChapter.id] || [] : [];
  const currentThoughts = profileThoughts[selectedThoughtIndex]?.data;

  const profileExceptions = activeProfile && currentChapter ? exceptionHistory[activeProfile.id]?.[currentChapter.id] || [] : [];
  const currentException = profileExceptions[selectedExceptionIndex]?.data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[5000] flex flex-col bg-cover bg-center bg-no-repeat"
      style={{
        backgroundColor: 'rgba(255, 240, 245, 0.85)',
        backgroundImage: customBg ? `url(${customBg})` : 'none',
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className="relative bg-white/40 backdrop-blur-md border-b border-[#F9C6D4]/30 pb-4 shrink-0">
        <div className="absolute top-4 right-16 z-10">
          <button onClick={() => bgInputRef.current?.click()} className="p-2 bg-white/50 hover:bg-pink-50 rounded-full text-stone-400 hover:text-[#F9C6D4] transition-colors" title="Đổi hình nền">
            <ImageIcon size={24} />
          </button>
          <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
        </div>
        <button onClick={handleClose} className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-pink-50 rounded-full text-stone-400 hover:text-[#F9C6D4] transition-colors">
          <X size={28} />
        </button>

        <div className="max-w-5xl mx-auto pt-6 px-4">
          <div className="flex gap-[15px] overflow-x-auto pb-2 custom-scrollbar">
            {profiles.map(profile => (
              <div key={profile.id} className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={() => setActiveProfile(profile)}
                  className={`w-[60px] h-[60px] rounded-full border-2 p-[2px] transition-all ${activeProfile?.id === profile.id ? 'border-[#F9C6D4] scale-110 shadow-md' : 'border-pink-100/50 opacity-70 hover:opacity-100'}`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-pink-50">
                    {profile.avatar && <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />}
                  </div>
                </button>
                <span className={`text-[10px] font-medium max-w-[60px] truncate text-center ${activeProfile?.id === profile.id ? 'text-[#D18E9B]' : 'text-stone-400'}`}>
                  {profile.name}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setActiveTab('thoughts')}
              className={`px-6 py-2 rounded-t-xl rounded-b-sm border-2 border-b-0 transition-all font-bold text-sm flex items-center gap-2 ${activeTab === 'thoughts' ? 'bg-[#FEFBFB] border-[#F9C6D4] text-[#D18E9B] shadow-[0_-2px_10px_rgba(249,198,212,0.2)]' : 'bg-white/50 border-transparent text-stone-400 hover:bg-white'}`}
              style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' }}
            >
              ──★ ˙🍓 ̟ Khám Phá Nội Tâm
            </button>
            <button
              onClick={() => setActiveTab('exception')}
              className={`px-6 py-2 rounded-t-xl rounded-b-sm border-2 border-b-0 transition-all font-bold text-sm flex items-center gap-2 ${activeTab === 'exception' ? 'bg-[#FEFBFB] border-[#F9C6D4] text-[#D18E9B] shadow-[0_-2px_10px_rgba(249,198,212,0.2)]' : 'bg-white/50 border-transparent text-stone-400 hover:bg-white'}`}
              style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' }}
            >
              ✦₊ Góc Ngoại Lệ 𓂃★
            </button>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${activeTab === 'exception' ? 'p-2 md:p-4' : 'p-4 md:p-8'} custom-scrollbar flex flex-col`}>
        <div className={activeTab === 'exception' ? "w-full h-full mx-auto flex-1 flex flex-col" : "max-w-5xl mx-auto"}>
          {activeTab === 'thoughts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 flex-1">
                  {profileThoughts.map((gen, idx) => (
                    <button
                      key={gen.id}
                      onClick={() => setSelectedThoughtIndex(idx)}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${selectedThoughtIndex === idx ? 'bg-[#F9C6D4] text-white shadow-md' : 'bg-white border border-pink-100 text-[#D18E9B] hover:bg-pink-50'}`}
                    >
                      Đợt {profileThoughts.length - idx} ({formatTime(gen.timestamp)})
                    </button>
                  ))}
                </div>
                <button
                  onClick={generateThoughts}
                  disabled={isGenerating}
                  className="ml-4 shrink-0 px-4 py-2 bg-white border-2 border-[#F9C6D4] text-[#5c4a4a] rounded-full font-bold shadow-[2px_2px_0px_#F9C6D4] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#F9C6D4] transition-all flex items-center gap-2 text-sm"
                >
                  {isGenerating ? <Hourglass size={16} className="animate-spin text-[#F9C6D4]" /> : <Plus size={16} className="text-[#F9C6D4]" />}
                  Tạo Mới
                </button>
              </div>

              {!currentThoughts ? (
                <div className="flex justify-center mt-20">
                  <button
                    onClick={generateThoughts}
                    disabled={isGenerating}
                    className="px-8 py-4 bg-white border-2 border-[#F9C6D4] text-[#5c4a4a] rounded-full font-bold shadow-[3px_3px_0px_#F9C6D4] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#F9C6D4] transition-all flex items-center gap-2"
                  >
                    {isGenerating ? <><Hourglass className="animate-spin text-[#F9C6D4]" /> Đang đọc trộm suy nghĩ...</> : <><Heart className="text-[#F9C6D4]" /> Đọc Suy Nghĩ Chương Này</>}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 pb-20">
                  {/* Khối 1: Trạng Thái Tâm Sinh Lý */}
                  <div className="bg-[#FEFBFB] rounded-[20px] p-6 shadow-[0_4px_15px_rgba(209,142,155,0.1)] border border-pink-50">
                    <h3 className="text-[#D18E9B] font-bold mb-4 text-lg flex items-center gap-2">
                      <Activity size={20} /> Trạng Thái Tâm Sinh Lý
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-pink-50">
                        <span className="font-bold text-[#5c4a4a] block mb-2">Suy nghĩ bên trong:</span>
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar text-[#777777] text-sm leading-[1.7] whitespace-pre-wrap pr-2">
                          {currentThoughts.physiological?.innerThoughts}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-pink-50">
                        <span className="font-bold text-[#5c4a4a] block mb-2">Tâm trạng & Cảm giác:</span>
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar text-[#777777] text-sm leading-[1.7] whitespace-pre-wrap pr-2">
                          {currentThoughts.physiological?.mood}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-pink-50">
                        <span className="font-bold text-[#5c4a4a] block mb-2">Nội tâm & Cơ thể:</span>
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar text-[#777777] text-sm leading-[1.7] whitespace-pre-wrap pr-2">
                          {currentThoughts.physiological?.bodyAndHeart}
                        </div>
                      </div>
                      <div className="bg-pink-50/50 p-4 rounded-xl flex items-center gap-3">
                        <span className="font-bold text-[#5c4a4a]">Nhịp tim:</span>
                        <span className={`font-bold ${currentThoughts.physiological?.heartRate?.toLowerCase().includes('ổn định') ? 'text-[#D18E9B] animate-pulse' : 'text-red-500'}`}>
                          {currentThoughts.physiological?.heartRate}
                        </span>
                        <svg className="w-16 h-6 text-[#D18E9B] opacity-50" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M0 15 L20 15 L30 5 L40 25 L50 15 L100 15" className={currentThoughts.physiological?.heartRate?.toLowerCase().includes('ổn định') ? '' : 'animate-pulse'} />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Khối 2: Bảng Chỉ Số Cảm Xúc */}
                  <div className="bg-[#FEFBFB] rounded-[20px] p-6 shadow-[0_4px_15px_rgba(209,142,155,0.1)] border border-pink-50">
                    <h3 className="text-[#D18E9B] font-bold mb-4 text-lg">Bảng Chỉ Số Cảm Xúc</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {EMOTION_KEYS.map(key => {
                        const val = currentThoughts.emotions?.[key] || 0;
                        const isJealous = key === 'Ghen Tuông' && val > 80;
                        return (
                          <div key={key} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-pink-50">
                            <span className="text-xs font-medium text-[#5c4a4a] w-1/2 truncate" title={key}>{key}</span>
                            <div className="flex-1 h-[6px] bg-[#FFE4E8] rounded-full overflow-hidden relative">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                className={`h-full rounded-full ${isJealous ? 'bg-[#FF4D4D]' : 'bg-[#D18E9B]'}`}
                                style={isJealous ? { animation: 'shake 0.5s infinite' } : {}}
                              />
                            </div>
                            <span className={`text-xs font-bold w-8 text-right ${isJealous ? 'text-[#FF4D4D]' : 'text-[#D18E9B]'}`}>{val}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Khối 3: Bảng Xếp Hạng 50 Việc Ưu Tiên */}
                  <div className="bg-[#FEFBFB] rounded-[20px] p-6 shadow-[0_4px_15px_rgba(209,142,155,0.1)] border border-pink-50">
                    <h3 className="text-[#D18E9B] font-bold mb-4 text-lg">Bảng Xếp Hạng 50 Việc Ưu Tiên</h3>
                    <div className="bg-[#FFFDF9] p-6 rounded-xl border border-[#E5C3C6] h-[250px] overflow-y-auto custom-scrollbar" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                      <div className="text-center font-bold text-[#5c4a4a] mb-4 border-b-2 border-dashed border-[#E5C3C6] pb-2">RECEIPT OF PRIORITIES</div>
                      {currentThoughts.priorities?.map((item, idx) => (
                        <div key={idx} className="py-2 border-b border-dotted border-[#E5C3C6] text-sm text-[#777777]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Khối 4: Các Cuốn Sổ Tự Sự */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#F5F5F5] rounded-[20px] p-6 border border-dashed border-[#999999] shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#333333] opacity-5 rounded-bl-full" />
                      <h3 className="text-[#333333] font-bold mb-3" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>Sổ Ác Quỷ 😈</h3>
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar text-[#5C4A4A] text-sm leading-[1.8] lowercase whitespace-pre-wrap pr-2">
                        {currentThoughts.diaries?.devil}
                      </div>
                    </div>

                    <div className="bg-white rounded-[20px] p-6 border border-dashed border-[#F9C6D4] shadow-[0_0_15px_rgba(249,198,212,0.3)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#F9C6D4] opacity-10 rounded-bl-full" />
                      <h3 className="text-[#D18E9B] font-bold mb-3" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>Sổ Thiên Thần 👼</h3>
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar text-[#5C4A4A] text-sm leading-[1.8] lowercase whitespace-pre-wrap pr-2">
                        {currentThoughts.diaries?.angel}
                      </div>
                    </div>

                    <div className="bg-[#FFF9E6] rounded-[20px] p-6 border border-dashed border-[#F4D03F] shadow-sm">
                      <h3 className="text-[#D4AC0D] font-bold mb-3" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>Hóng Hớt / Chuyện Vui 🍿</h3>
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar text-[#5C4A4A] text-sm leading-[1.8] lowercase whitespace-pre-wrap pr-2">
                        {currentThoughts.diaries?.gossip}
                      </div>
                    </div>

                    <div className="bg-[#E8F8F5] rounded-[20px] p-6 border border-dashed border-[#48C9B0] shadow-sm">
                      <h3 className="text-[#17A589] font-bold mb-3" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>Thú Thật 🤫</h3>
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar text-[#5C4A4A] text-sm leading-[1.8] lowercase whitespace-pre-wrap pr-2">
                        {currentThoughts.diaries?.confession}
                      </div>
                    </div>

                    <div className="bg-[#FEF5E7] rounded-[20px] p-6 border border-dashed border-[#F39C12] shadow-sm">
                      <h3 className="text-[#D68910] font-bold mb-3" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>Hạnh Phúc Nhất Thế Gian ✨</h3>
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar text-[#5C4A4A] text-sm leading-[1.8] lowercase whitespace-pre-wrap pr-2">
                        {currentThoughts.diaries?.happiest}
                      </div>
                    </div>

                    <div className="bg-[#EBF5FB] rounded-[20px] p-6 border border-dashed border-[#5DADE2] shadow-sm">
                      <h3 className="text-[#2874A6] font-bold mb-3" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>Nỗi Buồn Cần An Ủi 🌧️</h3>
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar text-[#5C4A4A] text-sm leading-[1.8] lowercase whitespace-pre-wrap pr-2">
                        {currentThoughts.diaries?.sadness}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={generateThoughts}
                      disabled={isGenerating}
                      className="px-6 py-2 bg-white border border-pink-200 text-pink-400 rounded-full text-xs font-bold hover:bg-pink-50 transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? 'Đang tạo lại...' : 'Tạo lại suy nghĩ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'exception' && (
            <div className="space-y-6 flex-1 flex flex-col relative">
              {isGenerating && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-[30px]">
                  <div className="text-center p-8 max-w-md w-full">
                    <div className="mb-6 relative">
                      <div className="w-24 h-24 border-4 border-pink-100 border-t-pink-400 rounded-full animate-spin mx-auto"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="text-pink-400 animate-pulse" size={32} />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-[#D18E9B] font-bold text-lg animate-bounce">
                        {generationStatus || '⸝ Đang kết nối với máy chủ...'}
                      </p>
                      
                      <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
                        <div className="flex justify-between text-xs font-bold text-pink-400 mb-2">
                          <span>Tiến độ: {generationProgress} / 10.000 token</span>
                          <span>Còn lại: {Math.max(0, 10000 - generationProgress)}</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-pink-100">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-pink-300 to-pink-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (generationProgress / 10000) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[10px] text-pink-300 italic">
                          ⸝ API PROXY LÀM VIỆC TỐT - Đang đếm ngược mục tiêu...
                        </p>
                      </div>
                      
                      <div className="text-[11px] text-[#5c4a4a] opacity-60 italic">
                        ⸝ Thời gian tạo nội dung có thể mất 1-2 phút để đảm bảo chất lượng 10.000 token
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 flex-1">
                  {profileExceptions.map((gen, idx) => (
                    <button
                      key={gen.id}
                      onClick={() => setSelectedExceptionIndex(idx)}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${selectedExceptionIndex === idx ? 'bg-[#F9C6D4] text-white shadow-md' : 'bg-white border border-pink-100 text-[#D18E9B] hover:bg-pink-50'}`}
                    >
                      Đợt {profileExceptions.length - idx} ({formatTime(gen.timestamp)})
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => generateException()}
                  disabled={isGenerating}
                  className="ml-4 shrink-0 px-4 py-2 bg-white border-2 border-[#F9C6D4] text-[#5c4a4a] rounded-full font-bold shadow-[2px_2px_0px_#F9C6D4] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#F9C6D4] transition-all flex items-center gap-2 text-sm"
                >
                  {isGenerating ? <Hourglass size={16} className="animate-spin text-[#F9C6D4]" /> : <Plus size={16} className="text-[#F9C6D4]" />}
                  Tạo Mới
                </button>
              </div>

              {!currentException ? (
                <div className="flex justify-center mt-20">
                  <button
                    onClick={() => generateException()}
                    disabled={isGenerating}
                    className="px-8 py-4 bg-white border-2 border-[#F9C6D4] text-[#5c4a4a] rounded-full font-bold shadow-[3px_3px_0px_#F9C6D4] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#F9C6D4] transition-all flex items-center gap-2"
                  >
                    {isGenerating ? <><Hourglass className="animate-spin text-[#F9C6D4]" /> Đang viết thư...</> : <><Sparkles className="text-[#F9C6D4]" /> Viết Thư Gửi Tác Giả</>}
                  </button>
                </div>
              ) : (
                <div className="flex justify-center pb-8 flex-1 min-h-0">
                  <div className="w-full h-full rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col" style={{ backgroundColor: 'rgba(255, 240, 245, 0.85)' }}>
                    {/* Cover Image & Avatar */}
                    <div className="relative h-40 md:h-56 shrink-0 group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-pink-100">
                        {(currentException.customCover || currentStory?.coverImage) && <img src={currentException.customCover || currentStory.coverImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" alt="Cover" />}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                        <span className="bg-white/80 text-pink-500 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Đổi ảnh bìa</span>
                      </div>
                      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
                      
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 group/avatar cursor-pointer" onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }}>
                        <div className="w-24 h-24 rounded-full border-4 border-[#FEFBFB] overflow-hidden bg-white shadow-sm relative">
                          {(currentException.customAvatar || activeProfile?.avatar) && <img src={currentException.customAvatar || activeProfile.avatar} alt={activeProfile?.name} className="w-full h-full object-cover group-hover/avatar:opacity-70 transition-opacity" />}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                            <span className="text-white text-[10px] font-bold drop-shadow-md">Đổi</span>
                          </div>
                        </div>
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                      </div>
                    </div>
                    
                    <div className="pt-16 pb-6 px-6 md:px-12 flex-1 flex flex-col min-h-0">
                      <h2 className="text-xl md:text-2xl text-center text-[#D18E9B] mb-6 font-bold font-sans">
                        ✦₊ Thủ thỉ cùng tác giả 𓂃★
                      </h2>
                      
                        <div className="flex-1 overflow-y-auto custom-scrollbar-thin pr-4 text-[#4A4A4A] text-base md:text-lg whitespace-pre-wrap text-left flex flex-col gap-6" style={{ lineHeight: '1.7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          <div className="p-4 rounded-2xl rounded-tl-none border border-pink-100 shadow-sm self-start max-w-[90%] prose prose-pink" style={{ backgroundColor: 'rgba(255, 240, 245, 0.85)' }}>
                            <div dangerouslySetInnerHTML={{ __html: currentException.content }} />
                          </div>
                          
                          {currentException.conversation?.map((msg, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl border shadow-sm max-w-[90%] prose prose-pink ${msg.role === 'user' ? 'border-pink-200 rounded-tr-none self-end text-[#5c4a4a]' : 'border-pink-100 rounded-tl-none self-start'}`} style={{ backgroundColor: 'rgba(255, 240, 245, 0.85)' }}>
                              <div className="text-xs font-bold mb-1 opacity-50">{msg.role === 'user' ? 'Tác giả' : activeProfile?.name}</div>
                              <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                            </div>
                          ))}
                        </div>
                      
                      <div className="mt-6 shrink-0 flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={userReplyText}
                            onChange={(e) => setUserReplyText(e.target.value)}
                            placeholder="Hồi âm của tác giả..."
                            className="flex-1 px-4 py-2 rounded-full border border-pink-200 focus:outline-none focus:border-pink-400 bg-white text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && userReplyText.trim() && !isGenerating) {
                                generateException(true, userReplyText);
                                setUserReplyText('');
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (userReplyText.trim()) {
                                generateException(true, userReplyText);
                                setUserReplyText('');
                              }
                            }}
                            disabled={isGenerating || !userReplyText.trim()}
                            className="px-6 py-2 bg-[#F9C6D4] text-white rounded-full text-sm font-bold hover:bg-[#f7b5c6] transition-colors disabled:opacity-50 shrink-0"
                          >
                            {isGenerating ? 'Đang gửi...' : 'Gửi hồi âm'}
                          </button>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => generateException(false)}
                            disabled={isGenerating}
                            className="px-4 py-1.5 bg-white border border-pink-200 text-pink-400 rounded-full text-xs font-bold hover:bg-pink-50 transition-colors disabled:opacity-50"
                          >
                            {isGenerating ? 'Đang viết lại...' : 'Viết lại thư mới'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }
        .custom-scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(249, 198, 212, 0.5);
          border-radius: 10px;
        }
        /* Custom styles for HTML content in letters */
        .prose-pink h3 {
          color: #D18E9B;
          font-weight: bold;
          font-size: 1.25rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          border-left: 4px solid #F9C6D4;
          padding-left: 0.75rem;
        }
        .prose-pink p {
          margin-bottom: 1rem;
          text-indent: 1.5rem;
        }
        .prose-pink ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .prose-pink li {
          margin-bottom: 0.5rem;
        }
        .prose-pink b {
          color: #D18E9B;
        }
        .prose-pink hr {
          border: 0;
          border-top: 1px dashed #F9C6D4;
          margin: 2rem 0;
        }
      `}} />
    </motion.div>
  );
}
