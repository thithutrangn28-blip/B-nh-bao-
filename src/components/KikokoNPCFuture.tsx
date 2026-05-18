import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Hourglass, Star, Plus } from 'lucide-react';
import { loadKikokoInstagram } from '../utils/db';
import { sendMessage } from '../utils/apiProxy';

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
  coverImage?: string;
  type: 'char' | 'npc';
}

interface FutureGeneration {
  id: string;
  chapterId: string;
  chapterTitle: string;
  timestamp: number;
  data: any;
}

interface KikokoNPCFutureProps {
  onClose: () => void;
  apiSettings: any;
  secondaryApiSettings: any;
  currentStory: any;
  currentChapter: any;
  getCompletionUrl: (url: string) => string;
  updateStory: (updates: any) => void;
}

export default function KikokoNPCFuture({ onClose, apiSettings, secondaryApiSettings, currentStory, currentChapter, getCompletionUrl, updateStory }: KikokoNPCFutureProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  
  const [history, setHistory] = useState<Record<string, FutureGeneration[]>>({});
  const [selectedGenId, setSelectedGenId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const historyRef = useRef(history);

  const [generatingProfiles, setGeneratingProfiles] = useState<Record<string, boolean>>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});
  const isGenerating = activeProfile ? generatingProfiles[activeProfile.id] : false;

  useEffect(() => { historyRef.current = history; }, [history]);

  useEffect(() => {
    if (activeProfile) {
      const profileHistory = historyRef.current[activeProfile.id] || [];
      if (profileHistory.length > 0) {
        setSelectedGenId(profileHistory[profileHistory.length - 1].id);
      } else {
        setSelectedGenId(null);
      }
    }
  }, [activeProfile]);

  useEffect(() => {
    const loadProfiles = async () => {
      if (currentStory?.id) {
        setIsLoaded(false);
        try {
          // Sync history from story prop
          const initialHistory = currentStory.npcFutures || {};
          setHistory(initialHistory);
          historyRef.current = initialHistory;

          const data = await loadKikokoInstagram(currentStory.id);
          let loadedProfiles: Profile[] = [];
          
          if (data && data.profiles) {
            loadedProfiles = [...data.profiles];
          }

          // Find and remove existing main profiles to re-insert them at the front
          const botIndex = loadedProfiles.findIndex(p => p.id === 'char_bot');
          const botProfile = botIndex !== -1 ? loadedProfiles.splice(botIndex, 1)[0] : null;
          
          const userIndex = loadedProfiles.findIndex(p => p.id === 'char_user');
          const userProfile = userIndex !== -1 ? loadedProfiles.splice(userIndex, 1)[0] : null;

          // Re-insert User profile at the front
          if (userProfile) {
            loadedProfiles.unshift(userProfile);
          } else {
            loadedProfiles.unshift({
              id: 'char_user',
              name: currentStory.userChar || 'User Character',
              avatar: 'https://i.postimg.cc/5ywFrTmH/eb9a4782a68c767ff5a7e46ad2b4b0ff.jpg',
              type: 'char'
            });
          }

          // Re-insert Bot profile at the front
          if (botProfile) {
            loadedProfiles.unshift(botProfile);
          } else {
            loadedProfiles.unshift({
              id: 'char_bot',
              name: currentStory.botChar || 'Bot Character',
              avatar: 'https://i.postimg.cc/5ywFrTmH/eb9a4782a68c767ff5a7e46ad2b4b0ff.jpg',
              type: 'char'
            });
          }

          setProfiles(loadedProfiles);
          if (loadedProfiles.length > 0 && !activeProfile) {
            setActiveProfile(loadedProfiles[0]);
          }
        } catch (e) {
          console.error("Failed to load profiles", e);
        } finally {
          setIsLoaded(true);
        }
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

  const generateFuture = async () => {
    const targetProfile = activeProfile;
    if (!targetProfile || generatingProfiles[targetProfile.id]) return;
    
    setGeneratingProfiles(prev => ({ ...prev, [targetProfile.id]: true }));

    try {
      const controller = new AbortController();
      abortControllersRef.current[targetProfile.id] = controller;

      const newGenId = Math.random().toString(36).substr(2, 9);
      const newGen: FutureGeneration = {
        id: newGenId,
        chapterId: currentChapter?.id || '',
        chapterTitle: currentChapter?.title || 'Không rõ',
        timestamp: Date.now(),
        data: { status: {}, rawText: '' }
      };

      setHistory(prev => ({
        ...prev,
        [targetProfile.id]: [...(prev[targetProfile.id] || []), newGen]
      }));
      
      if (activeProfile?.id === targetProfile.id) {
        setSelectedGenId(newGenId);
      }

      const latestChapter = currentStory.chapters?.[currentStory.chapters.length - 1]?.content || '';
      const previousChapters = currentStory.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || '';

      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là hệ thống giả lập tương lai 20 năm sau cho nhân vật trong tiểu thuyết. Hãy đóng vai ${targetProfile.name} ở thời điểm 20 năm sau nhìn lại quá khứ để trả lời.
      
[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
- Truyện tổng thể: ${currentStory?.plot || 'Không có'}
- Ký ức chung/Memory: ${currentStory?.memory || currentStory?.characterMemory || 'Không có'}
- Đặc điểm Bot (${currentStory?.botChar || 'Bot'}): ${currentStory?.charDescription || 'Không có'}
- Đặc điểm User (${currentStory?.userChar || 'User'}): ${currentStory?.userDescription || 'Không có'}
- Smart Memory (Tóm tắt tiến độ): ${currentStory?.progressSummary || 'Không có'}
- Tình huống hiện tại: ${currentStory?.situationTracking || 'Không có'}
- Thời gian hiện tại: ${currentStory?.currentTime || 'Chưa rõ'}
- Ngày tháng: ${currentStory?.currentDate || 'Chưa rõ'}
- Thời tiết: ${currentStory?.weather || 'Chưa rõ'}
- Nhiệt độ: ${currentStory?.temperature || 'Chưa rõ'}
- Mùa: ${currentStory?.season || 'Chưa rõ'}
- Tính cách/Thiết lập NPC đang xét: ${(targetProfile as any).description || (targetProfile as any).bio || 'Không có'}
- Nhân vật cần tiên đoán tương lai: ${targetProfile.name}

[BỐI CẢNH 3 CHƯƠNG GẦN NHẤT ĐỂ NGHIÊN CỨU]
${previousChapters}

[NHIỆM VỤ DÀNH RIÊNG CHO BẠN]
Hãy đóng vai ${targetProfile.name} ở thời điểm 20 năm sau, nhìn lại sự kiện ở chương hiện tại và cuộc sống hiện tại. Viết theo phong cách dễ thương, dùng emoji. Các phần text dài phải đủ độ dài yêu cầu. ĐÂY LÀ NHIỆM VỤ SINH RA CODE JSON.

ĐỊNH DẠNG TRẢ VỀ BẮT BUỘC LÀ MỘT OBJECT JSON HỢP LỆ (KHÔNG ĐƯỢC CÓ BẤT KỲ VĂN BẢN NÀO NẰM NGOÀI JSON, CHỈ TRẢ VỀ {}):
{
  "memories": "Hồi tưởng lại lúc đó (viết dài khoảng 1000 ký tự, cảm xúc, chi tiết)...",
  "alternativeChoice": "Nếu được lựa chọn cách khác thì bạn sẽ chọn làm thế nào để có một cuộc sống khác đi (Nếu không muốn mà vẫn giữ nguyên thì giữ nguyên) (viết dài khoảng 1000 ký tự)...",
  "regrets": "Điều gì hối tiếc nhất mà chưa làm được (viết dài khoảng 1000 ký tự)...",
  "advice": "Muốn gửi gắm cho chính mình trong quá khứ lời khuyên gì? (viết dài khoảng 1000 ký tự)...",
  "status": {
    "balance": "Số dư tài khoản hiện tại",
    "job": "Công việc / Chức vụ hiện tại",
    "maritalStatus": "Tình trạng hôn nhân",
    "children": "Có con chưa?",
    "oldCrush": "Crush năm xưa giờ ra sao?",
    "currentPartner": "Người bên cạnh lúc này là ai?",
    "futureGoals": "Mục tiêu tương lai",
    "housing": "Nhà đang ở là nhà Thuê hay Mua",
    "hatingSomeone": "Có đang ghét ai đó không? Tại sao lại ghét người đó? (viết dài)",
    "dreamCompletion": "Đã thực hiện được thành công bao nhiêu % ước mơ?",
    "gettingOld": "Có phải bạn sắp già? (nếu phải thì OK, nếu không phải thì cãi lại 1000 ký tự)"
  }
}`;

      let apiToUse = apiSettings;
      if (secondaryApiSettings.enabled && secondaryApiSettings.apiKey && secondaryApiSettings.proxyEndpoint) {
        apiToUse = secondaryApiSettings;
      }

      const response = await sendMessage(apiToUse, [{ role: 'user', content: prompt }]);
      const text = extractTextFromResponse(response);

      if (text) {
        try {
          const { isJson, json } = safeParseJson(text);
          if (isJson && json) {
            const parsed = json;
          
            if (parsed && (Object.keys(parsed).length > 1 || (parsed.status && Object.keys(parsed.status).length > 0))) {
              const updatedHistory = {
                ...historyRef.current,
                [targetProfile.id]: (historyRef.current[targetProfile.id] || []).map(g => 
                  g.id === newGenId ? { ...g, data: parsed } : g
                )
              };
              setHistory(updatedHistory);
              historyRef.current = updatedHistory;
              
              // Save to database after successful generation
              updateStory({ npcFutures: updatedHistory });
            } else {
              throw new Error("Dữ liệu JSON không đầy đủ.");
            }
          } else {
            throw new Error("Dữ liệu không phải là JSON hợp lệ.");
          }
        } catch (err) {
          console.error("Parse JSON failed:", err);
          throw new Error("Không thể đọc dữ liệu từ AI. Vui lòng thử lại.");
        }
      }
      
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Future generation failed", e);
        alert("Lỗi tạo dữ liệu tương lai: " + e.message);
      }
    } finally {
      setGeneratingProfiles(prev => ({ ...prev, [targetProfile.id]: false }));
      if (abortControllersRef.current[targetProfile.id]) {
        delete abortControllersRef.current[targetProfile.id];
      }
    }
  };

  const handleClose = () => {
    Object.values(abortControllersRef.current).forEach(c => c.abort());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[4000] flex flex-col bg-[#FFFDFE]"
      style={{
        backgroundImage: 'radial-gradient(#E5DCDA 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* Header / NPC List */}
      <div className="relative bg-white/60 backdrop-blur-md border-b border-[#F9C6D4]/30 pb-4">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-pink-50 rounded-full text-stone-400 hover:text-[#F9C6D4] transition-colors"
        >
          <X size={28} />
        </button>

        <div className="max-w-4xl mx-auto pt-6 px-4">
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

          {activeProfile && (
            <div className="flex gap-2 overflow-x-auto mt-4 pb-2 custom-scrollbar px-2">
              {(history[activeProfile.id] || []).map((gen, idx) => (
                <button
                  key={gen.id}
                  onClick={() => setSelectedGenId(gen.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedGenId === gen.id ? 'bg-[#F9C6D4] text-white shadow-md' : 'bg-white text-[#F9C6D4] border border-[#F9C6D4]/30 hover:bg-pink-50'}`}
                >
                  Đợt {idx + 1} ({gen.chapterTitle})
                </button>
              ))}
              <button
                onClick={generateFuture}
                disabled={generatingProfiles[activeProfile.id]}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-pink-50 text-[#F9C6D4] border border-pink-200 hover:bg-pink-100 flex items-center gap-1 disabled:opacity-50"
              >
                {generatingProfiles[activeProfile.id] ? <Hourglass size={14} className="animate-spin" /> : <Plus size={14} />} 
                Tạo đợt mới
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          {!activeProfile ? (
            <div className="text-center text-[#5c4a4a] mt-20" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>
              Vui lòng chọn một nhân vật để xem tương lai ✿
            </div>
          ) : !selectedGenId || !(history[activeProfile.id] || []).find(g => g.id === selectedGenId) ? (
            <div className="flex flex-col items-center justify-center mt-20 gap-6">
              <button
                onClick={generateFuture}
                disabled={generatingProfiles[activeProfile.id]}
                className="px-8 py-4 bg-white border-2 border-[#F9C6D4] text-[#5c4a4a] rounded-full font-bold shadow-[3px_3px_0px_#F9C6D4] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#F9C6D4] transition-all flex items-center gap-2"
                style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive", fontSize: '1.1rem' }}
              >
                {generatingProfiles[activeProfile.id] ? (
                  <>
                    <Hourglass className="animate-spin text-[#F9C6D4]" /> Đang du hành thời gian...
                  </>
                ) : (
                  <>
                    <Hourglass className="text-[#F9C6D4]" /> Xem 20 Năm Sau Của {activeProfile.name}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-8 pb-20">
              {/* Intro Template */}
              <div className="text-center text-[#5c4a4a] whitespace-pre font-light text-sm md:text-base">
{`      /)    /)
    (｡•ㅅ•｡)〝₎₎ Intro template! ✦₊ ˊ˗ 
. .╭∪─∪────────── ✦ ⁺.
. .┊ ✧ ${activeProfile.name} (20 Năm Sau) ✧`}
              </div>

              {/* Card 1: Thoughts & Memories */}
              <div className="bg-[#FFF7F8] rounded-[20px] p-6 border border-dashed border-[#D6C4C4] shadow-sm">
                <h3 className="text-[#5c4a4a] font-bold mb-4" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>
                  ◝⧣₊˚﹒✦₊ Hồi ức năm ấy 𓂃★
                </h3>
                <div className="text-[#5c4a4a] text-[13px] md:text-[14px] whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar pr-2" style={{ lineHeight: 1.8 }}>
                  {(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.memories}
                  {'\n\n'}
                  {(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.alternativeChoice}
                </div>
              </div>

              <div className="text-center text-[#D6C4C4] text-xs tracking-widest">
                . . . . . ╰──╮ ✦ ╭──╯ . . . . .
              </div>

              {/* Card 2: Current Status */}
              <div className="bg-white rounded-[20px] p-6 border border-dashed border-[#D6C4C4] shadow-sm">
                <h3 className="text-[#5c4a4a] font-bold mb-4" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>
                  ⸝⸝ ⧣₊˚﹒✦₊ Báo Cáo Hiện Tại ⧣₊˚
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] md:text-[14px] text-[#5c4a4a]">
                  <div className="bg-pink-50/50 p-3 rounded-xl">
                    <span className="font-bold">⸝⸝ Số dư tài khoản:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.balance}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl">
                    <span className="font-bold">⸝⸝ Nghề nghiệp:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.job}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl">
                    <span className="font-bold">⸝⸝ Tình trạng hôn nhân:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.maritalStatus}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl">
                    <span className="font-bold">⸝⸝ Có con chưa?:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.children}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl">
                    <span className="font-bold">⸝⸝ Crush năm xưa:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.oldCrush}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl">
                    <span className="font-bold">⸝⸝ Người bên cạnh:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.currentPartner}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl">
                    <span className="font-bold">⸝⸝ Mục tiêu tương lai:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.futureGoals}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl">
                    <span className="font-bold">⸝⸝ Nhà ở:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.housing}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl col-span-1 md:col-span-2">
                    <span className="font-bold">⸝⸝ Có đang ghét ai đó không?:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.hatingSomeone}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl col-span-1 md:col-span-2">
                    <span className="font-bold">⸝⸝ Hoàn thành ước mơ:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.dreamCompletion}
                  </div>
                  <div className="bg-pink-50/50 p-3 rounded-xl col-span-1 md:col-span-2">
                    <span className="font-bold">⸝⸝ Có phải bạn sắp già?:</span> <br/>{(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.status?.gettingOld}
                  </div>
                </div>
              </div>

              <div className="text-center text-[#D6C4C4] text-xs tracking-widest">
                . . . . . ╰──╮ ✦ ╭──╯ . . . . .
              </div>

              {/* Card 3: Advice & Regrets */}
              <div className="bg-[#F3F0F5] rounded-[20px] p-6 shadow-sm">
                <h3 className="text-[#5c4a4a] font-bold mb-4" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>
                  ⸝⸝ ⧣₊˚﹒✦ Lời thì thầm gửi quá khứ ⧣₊˚
                </h3>
                <div className="text-[#5c4a4a] text-[13px] md:text-[14px] italic whitespace-pre-wrap" style={{ lineHeight: 1.8 }}>
                  <span className="font-bold not-italic">Điều hối tiếc nhất:</span>
                  <br/>
                  {(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.regrets}
                  <br/><br/>
                  <span className="font-bold not-italic">Lời khuyên cho bản thân:</span>
                  <br/>
                  {(history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.advice}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
