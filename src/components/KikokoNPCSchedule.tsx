import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Heart, Star, Plus } from 'lucide-react';
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

interface ScheduleGeneration {
  id: string;
  chapterId: string;
  chapterTitle: string;
  timestamp: number;
  data: any[];
}

interface KikokoNPCScheduleProps {
  onClose: () => void;
  apiSettings: any;
  secondaryApiSettings: any;
  currentStory: any;
  currentChapter: any;
  getCompletionUrl: (url: string) => string;
  updateStory: (updates: any) => void;
}

export default function KikokoNPCSchedule({ onClose, apiSettings, secondaryApiSettings, currentStory, currentChapter, getCompletionUrl, updateStory }: KikokoNPCScheduleProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  
  const [history, setHistory] = useState<Record<string, ScheduleGeneration[]>>({});
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
          const initialHistory = currentStory.npcSchedules || {};
          setHistory(initialHistory);
          historyRef.current = initialHistory;

          const data = await loadKikokoInstagram(currentStory.id);
          if (data && data.profiles) {
            setProfiles(data.profiles);
            if (data.profiles.length > 0) {
              setActiveProfile(data.profiles[0]);
            }
          }
        } catch (e) {
          console.error("Failed to load profiles", e);
        } finally {
          setIsLoaded(true);
        }
      }
    };
    loadProfiles();
  }, [currentStory.id]);

  const robustParseJSON = (content: string) => {
    if (!content || typeof content !== 'string') return [];
    const { isJson, json } = safeParseJson(content);
    if (isJson && Array.isArray(json)) return json;
    if (isJson && !Array.isArray(json)) {
      if (json.data && Array.isArray(json.data)) return json.data;
      if (json.schedule && Array.isArray(json.schedule)) return json.schedule;
    }
    console.warn("Robust parse failed, falling back to regex");
    try {
      const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch(e) {}
    return [{ time: 'RAW', content: content }];
  };

  const generateSchedule = async () => {
    const targetProfile = activeProfile;
    if (!targetProfile || generatingProfiles[targetProfile.id]) return;
    
    setGeneratingProfiles(prev => ({ ...prev, [targetProfile.id]: true }));

    try {
      const controller = new AbortController();
      abortControllersRef.current[targetProfile.id] = controller;

      const newGenId = Math.random().toString(36).substr(2, 9);
      const newGen: ScheduleGeneration = {
        id: newGenId,
        chapterId: currentChapter?.id || '',
        chapterTitle: currentChapter?.title || 'Không rõ',
        timestamp: Date.now(),
        data: []
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
Bạn là hệ thống tạo thời khoá biểu cho nhân vật trong tiểu thuyết. Hãy đọc kỹ bối cảnh để tạo lịch trình logic nhất.
      
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
- Nhân vật cần tạo thời khoá biểu: ${targetProfile.name}

[BỐI CẢNH 3 CHƯƠNG GẦN NHẤT ĐỂ NGHIÊN CỨU]
${previousChapters}

[NHIỆM VỤ DÀNH RIÊNG CHO BẠN]
Tạo lịch trình 1 ngày chi tiết cho nhân vật ${targetProfile.name} dựa trên bối cảnh truyện hiện tại.
Mỗi mốc thời gian phải viết cực kỳ dài, chi tiết, miêu tả hành động, suy nghĩ, cảm xúc (khoảng 1000 ký tự mỗi mốc). ĐÂY LÀ NHIỆM VỤ SINH RA JSON.
      
CÁC MỐC THỜI GIAN BẮT BUỘC:
- Từ 6:00 đến 7:00 sáng
- Từ 7:00 đến 9:00
- Từ 10:00 đến 11:00
- Từ 11:00 đến 12:00
- Từ 12:00 đến 13:00
- Từ 13:00 đến 14:00
- Từ 14:00 đến 15:00
- Từ 15:00 đến 17:00
- Từ 17:00 đến 20:00
- Từ 20:00 đến 24:00

ĐỊNH DẠNG TRẢ VỀ BẮT BUỘC LÀ MỘT MẢNG JSON HỢP LỆ (KHÔNG ĐƯỢC CÓ BẤT KỲ VĂN BẢN NÀO NẰM NGOÀI JSON, CHỈ TRẢ VỀ []):
[
  {
    "time": "Từ 6:00 đến 7:00 sáng",
    "content": "Nội dung chi tiết..."
  },
  {
    "time": "Từ 7:00 đến 9:00",
    "content": "Nội dung chi tiết..."
  }
]

CHÚ Ý:
- Viết theo phong cách dễ thương, dùng emoji.
- ĐẢM BẢO VIẾT ĐẦY ĐỦ THÔNG TIN CHO TỪNG MỐC THỜI GIAN, KHÔNG ĐƯỢC GỘP CHUNG.
- CHỈ TRẢ VỀ ĐÚNG 1 MẢNG JSON, KHÔNG GIẢI THÍCH GÌ THÊM.`;

      let apiToUse = apiSettings;
      if (secondaryApiSettings?.enabled && secondaryApiSettings?.apiKey && secondaryApiSettings?.proxyEndpoint) {
        apiToUse = secondaryApiSettings;
      }

      console.log('[KikokoNPCSchedule] Fetching Schedule...');
      const response = await sendMessage(
        apiToUse,
        [{ role: 'user', content: prompt }]
      );
      
      const text = extractTextFromResponse(response);
      console.log('[KikokoNPCSchedule] Raw response:', text);

      if (text) {
        const schedule = robustParseJSON(text) || [];
          
        if (Array.isArray(schedule) && schedule.length > 0) {
            const updatedHistory = {
              ...historyRef.current,
              [targetProfile.id]: (historyRef.current[targetProfile.id] || []).map(g => 
                g.id === newGenId ? { ...g, data: schedule } : g
              )
            };
            setHistory(updatedHistory);
            historyRef.current = updatedHistory;
            
            // Save to database after successful generation
            updateStory({ npcSchedules: updatedHistory });
          } else {
            throw new Error("Không tìm thấy dữ liệu hợp lệ trong câu trả lời.");
          }
      }
      
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Schedule generation failed", e);
        alert("Lỗi tạo thời khoá biểu: " + e.message);
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[4000] flex flex-col"
      style={{
        backgroundColor: '#FFF5F7',
        backgroundImage: 'linear-gradient(#FFE4E8 1px, transparent 1px), linear-gradient(90deg, #FFE4E8 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* Header / NPC List */}
      <div className="relative bg-white/80 backdrop-blur-md border-b border-[#F9C6D4] rounded-b-3xl shadow-sm pb-4">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-pink-50 rounded-full text-stone-400 hover:text-[#F9C6D4] transition-colors"
        >
          <X size={28} />
        </button>

        <div className="max-w-4xl mx-auto pt-6 px-4">
          <div className="relative w-full h-[120px] rounded-t-[20px] bg-pink-100 overflow-hidden shadow-sm">
            {activeProfile?.coverImage ? (
              <img src={activeProfile.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-pink-200 to-pink-100" />
            )}
            
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white shadow-md">
                {activeProfile?.avatar ? (
                  <img src={activeProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-pink-200" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-xl font-bold text-[#795548]" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>
              {activeProfile?.name || 'Chọn nhân vật'}
            </h2>
          </div>

          <div className="flex gap-[15px] overflow-x-auto mt-6 pb-2 custom-scrollbar justify-center">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => setActiveProfile(profile)}
                className={`shrink-0 w-[65px] h-[65px] rounded-full border-2 p-[2px] transition-all ${activeProfile?.id === profile.id ? 'border-[#F9C6D4] scale-110 shadow-md' : 'border-pink-100/50 opacity-70 hover:opacity-100'}`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-pink-50">
                  {profile.avatar && <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />}
                </div>
              </button>
            ))}
          </div>

          {activeProfile && (
            <div className="flex gap-2 overflow-x-auto mt-4 pb-2 custom-scrollbar justify-center px-4">
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
                onClick={generateSchedule}
                disabled={generatingProfiles[activeProfile.id]}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-pink-50 text-[#F9C6D4] border border-pink-200 hover:bg-pink-100 flex items-center gap-1 disabled:opacity-50"
              >
                {generatingProfiles[activeProfile.id] ? <Sparkles size={14} className="animate-spin" /> : <Plus size={14} />} 
                Tạo đợt mới
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-2xl mx-auto flex flex-col gap-[20px]">
          {!activeProfile ? (
            <div className="text-center text-[#795548] mt-20" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>
              Vui lòng chọn một nhân vật để xem thời khoá biểu ✿
            </div>
          ) : !selectedGenId || !(history[activeProfile.id] || []).find(g => g.id === selectedGenId) ? (
            <div className="flex flex-col items-center justify-center mt-20 gap-6">
              <button
                onClick={generateSchedule}
                disabled={generatingProfiles[activeProfile.id]}
                className="px-8 py-4 bg-white border-2 border-[#F9C6D4] text-[#795548] rounded-full font-bold shadow-[3px_3px_0px_#F9C6D4] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#F9C6D4] transition-all flex items-center gap-2"
                style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive", fontSize: '1.1rem' }}
              >
                {generatingProfiles[activeProfile.id] ? (
                  <>
                    <Sparkles className="animate-spin text-[#F9C6D4]" /> Đang lên lịch trình...
                  </>
                ) : (
                  <>
                    <Star className="text-[#F9C6D4]" /> Tạo Thời Khoá Biểu Cho {activeProfile.name}
                  </>
                )}
              </button>
            </div>
          ) : (
            (history[activeProfile.id] || []).find(g => g.id === selectedGenId)?.data.map((slot: any, idx: number) => (
              slot.time === 'RAW' ? (
                <div key={idx} className="relative bg-white rounded-[16px] p-6 border-2 border-dashed border-[#FFB6C1] shadow-[3px_3px_0px_#FFB6C1]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-[#F9C6D4] animate-spin" size={20} />
                    <span className="font-bold text-[#F9C6D4] text-lg" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>
                      Đang lên lịch trình...
                    </span>
                  </div>
                  <div className="text-[#795548] text-[14px] leading-relaxed whitespace-pre-wrap">
                    {slot.content}
                  </div>
                </div>
              ) : (
                <div 
                  key={idx}
                  className="relative bg-white rounded-[16px] p-6 border-2 border-dashed border-[#FFB6C1] shadow-[3px_3px_0px_#FFB6C1]"
                >
                  <div className="absolute -top-3 -left-2 bg-[#F9C6D4] text-white px-4 py-1 rounded-md text-sm font-bold shadow-sm transform -rotate-2" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}>
                    {slot.time}
                  </div>
                  
                  <div className="mt-4 text-[#795548] text-[14px] whitespace-pre-wrap" style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive", lineHeight: 1.8 }}>
                    {slot.content}
                  </div>

                  <Heart className="absolute bottom-2 right-2 text-pink-100 opacity-50" size={20} />
                  <Sparkles className="absolute top-2 right-2 text-pink-100 opacity-50" size={16} />
                </div>
              )
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
