import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart, Star, Coffee, MessageCircle, User, Settings, Image as ImageIcon, Loader2, Send } from 'lucide-react';
import { generateNPCs, generateLoveQuiz, generateCafeScenarios, generateNPCResponse, NPCProfile, QuizQuestion, CafeScenario, UserProfile } from '../services/geminiService';
import { sendCoreMessage } from '../services/coreAi';
import { saveToDB, getFromDB } from '../utils/indexedDB';
import { getLargeData, setLargeData } from '../utils/storage';
import { compressImage } from '../utils/imageUtils';
import { fetchAvailableModels, ApiProxySettings } from '../utils/apiProxy';

export default function LoveShowScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'apply' | 'show'>('apply');
  const [appBackground, setAppBackground] = useState('');

  useEffect(() => {
    const loadBg = async () => {
      const saved = await getFromDB('backgrounds', 'loveshow_bg');
      if (saved) setAppBackground(saved);
      else {
        const legacy = localStorage.getItem('loveshow_bg');
        if (legacy) {
          setAppBackground(legacy);
          await saveToDB('backgrounds', 'loveshow_bg', legacy);
          localStorage.removeItem('loveshow_bg');
        }
      }
    };
    loadBg();
  }, []);
  
  // Game State
  const [npcs, setNpcs] = useState<NPCProfile[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const savedNpcs = await getLargeData('loveshow_npcs');
      if (savedNpcs) {
        setNpcs(savedNpcs);
      } else {
        try {
          const saved = localStorage.getItem('loveshow_npcs');
          const parsed = saved ? JSON.parse(saved) : [];
          setNpcs(Array.isArray(parsed) ? parsed : []);
          if (saved) localStorage.removeItem('loveshow_npcs');
        } catch (e) {
          setNpcs([]);
        }
      }

      const savedProfile = await getLargeData('loveshow_profile');
      if (savedProfile) {
        setFormData(savedProfile);
      } else {
        const localProfile = localStorage.getItem('loveshow_profile');
        if (localProfile) {
          try {
            setFormData(JSON.parse(localProfile));
            localStorage.removeItem('loveshow_profile');
          } catch (e) {}
        }
      }
      setIsDataLoaded(true);
    };
    loadData();
  }, []);

  const [loadingNpcs, setLoadingNpcs] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [activeMiniGame, setActiveMiniGame] = useState<'none' | 'quiz' | 'cafe'>('none');
  const [selectedNpc, setSelectedNpc] = useState<NPCProfile | null>(null);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'npc', content: string, usage?: any, isStreaming?: boolean}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('loveshow_settings');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed || {
        maxTokens: 30000,
        timeoutMinutes: 5,
        superMode: false,
        isUnlimited: false,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: '',
        model: 'gemini-3-flash-preview'
      };
    } catch (e) {
      return {
        maxTokens: 30000,
        timeoutMinutes: 5,
        superMode: false,
        isUnlimited: false,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: '',
        model: 'gemini-3-flash-preview'
      };
    }
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  const handleFetchModels = async () => {
    if (!settings.apiKey) {
      alert("Vui lòng nhập API Key trước khi kéo Model.");
      return;
    }
    setFetchingModels(true);
    try {
      const models = await fetchAvailableModels(settings.endpoint, settings.apiKey);
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(settings.model)) {
        setSettings(s => ({ ...s, model: models[0] }));
      }
      alert(`Đã kéo thành công ${models.length} model!`);
    } catch (e) {
      alert("Lỗi khi kéo model: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setFetchingModels(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('loveshow_settings', JSON.stringify(settings));
  }, [settings]);
  
  // Application Data
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    intro: '',
    target: '',
    reason: '',
    mc: 'MC Sâu Bọ',
    gender: 'female',
    targetGender: 'male',
    minChars: 2000,
    maxChars: 4000,
    avatarBg: '#FFFFFF',
    quizCount: 10,
    cafeCount: 10,
    npcCount: 40
  });

  useEffect(() => {
    if (isDataLoaded) {
      setLargeData('loveshow_npcs', npcs);
    }
  }, [npcs, isDataLoaded]);

  const handleSaveProfile = () => {
    setLargeData('loveshow_profile', formData);
    alert('Đã lưu hồ sơ thành công! Các NPC đã đọc được hồ sơ của bạn. Hãy chuyển sang Sàn Diễn để bắt đầu.');
  };

  const handleSelectNpc = async (npc: NPCProfile) => {
    setSelectedNpc(npc);
    setChatHistory([{ role: 'npc', content: '', isStreaming: true }]);
    setIsTyping(true);
    
    try {
      // Gọi API ngay lập tức để lấy lời chào dài
      const response = await generateNPCResponse(npc, "Chào bạn! Hãy giới thiệu bản thân một cách chi tiết và ấn tượng nhé.", [], formData, settings, settings.maxTokens, settings.timeoutMinutes, settings.superMode, (text) => {
        setChatHistory([{ role: 'npc', content: text, isStreaming: true }]);
      });
      setChatHistory([{ role: 'npc', content: response.content, usage: response.usage, isStreaming: false }]);
    } catch (e) {
      console.error(e);
      setChatHistory([{ role: 'npc', content: "Xin lỗi, hiện tại tôi đang hơi bối rối một chút...", isStreaming: false }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLoadMoreNpcs = async () => {
    setLoadingNpcs(true);
    setError(null);
    const count = formData.npcCount || 40;
    setProgress({ current: 0, total: count });
    try {
      await generateNPCs(count, formData, settings, (current, total, newItems) => {
        setProgress({ current, total });
        if (newItems) {
          setNpcs(prev => [...prev, ...newItems]);
        }
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Có lỗi xảy ra khi gọi API.");
    } finally {
      setLoadingNpcs(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleStartShow = async () => {
    setActiveTab('show');
    if (npcs.length === 0) {
      await handleLoadMoreNpcs();
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedNpc) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }, { role: 'npc', content: '', isStreaming: true }]);
    setIsTyping(true);
    
    try {
      const history = (chatHistory || []).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      const response = await generateNPCResponse(selectedNpc, userMsg, history, formData, settings, settings.maxTokens, settings.timeoutMinutes, settings.superMode, (text) => {
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          if (lastMsg && lastMsg.role === 'npc' && lastMsg.isStreaming) {
            return [...newHistory.slice(0, -1), { ...lastMsg, content: text }];
          }
          return newHistory;
        });
      });
      setChatHistory(prev => {
        const newHistory = [...prev];
        const lastMsg = newHistory[newHistory.length - 1];
        if (lastMsg && lastMsg.role === 'npc' && lastMsg.isStreaming) {
          return [...newHistory.slice(0, -1), { role: 'npc', content: response.content, usage: response.usage, isStreaming: false }];
        }
        return newHistory;
      });
    } catch (e: any) {
      console.error(e);
      setChatHistory(prev => {
        const newHistory = [...prev];
        const lastMsg = newHistory[newHistory.length - 1];
        if (lastMsg && lastMsg.role === 'npc' && lastMsg.isStreaming) {
          return [...newHistory.slice(0, -1), { role: 'npc', content: "Xin lỗi, hiện tại tôi đang hơi bối rối một chút... " + e.message, isStreaming: false }];
        }
        return [...newHistory, { role: 'npc', content: "Xin lỗi, hiện tại tôi đang hơi bối rối một chút... " + e.message, isStreaming: false }];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleBgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setAppBackground(compressed);
        await saveToDB('backgrounds', 'loveshow_bg', compressed);
      } catch (error) {
        console.error("Failed to upload loveshow background", error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 bg-[#FFF5F7] z-50 flex flex-col"
      style={{
        backgroundImage: appBackground ? `url(${appBackground})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 bg-white/80 backdrop-blur-md border-b border-[#F9C6D4] shrink-0 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 text-[#F3B4C2] hover:bg-[#FFF5F7] rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-[#F3B4C2] font-['Comic_Sans_MS',_cursive]">Show Hẹn Hò</h1>
        <div className="flex gap-2">
          <button onClick={() => { console.log("Settings button clicked"); setShowSettings(true); }} className="p-2 text-[#F3B4C2] hover:bg-[#FFF5F7] rounded-full transition-colors">
            <Settings size={20} />
          </button>
          <label className="p-2 text-[#F3B4C2] hover:bg-[#FFF5F7] rounded-full transition-colors cursor-pointer flex items-center justify-center">
            <ImageIcon size={20} />
            <input type="file" onChange={handleBgChange} accept="image/*" className="hidden" />
          </label>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Cài đặt API Proxy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Loại API</label>
                <select 
                  value={settings.apiType || 'auto'}
                  onChange={e => setSettings(s => ({...s, apiType: e.target.value as any}))}
                  className="w-full p-2 border rounded-lg text-xs"
                >
                  <option value="auto">Tự động phát hiện</option>
                  <option value="openai">OpenAI-compatible</option>
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="gemini">Gemini</option>
                  <option value="custom">Custom Endpoint</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">API Endpoint</label>
                <input 
                  type="text" 
                  value={settings.endpoint} 
                  onChange={e => setSettings(s => ({...s, endpoint: e.target.value}))} 
                  className="w-full p-2 border rounded-lg text-xs"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">API Key</label>
                <input 
                  type="password" 
                  value={settings.apiKey} 
                  onChange={e => setSettings(s => ({...s, apiKey: e.target.value}))} 
                  className="w-full p-2 border rounded-lg text-xs"
                  placeholder="Nhập API Key..."
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold">Model</label>
                  <button 
                    onClick={handleFetchModels}
                    disabled={fetchingModels}
                    className="text-[10px] text-blue-600 font-bold hover:underline disabled:opacity-50"
                  >
                    {fetchingModels ? "Đang kéo..." : "Kéo Model"}
                  </button>
                </div>
                {availableModels.length > 0 ? (
                  <select 
                    value={settings.model} 
                    onChange={e => setSettings(s => ({...s, model: e.target.value}))} 
                    className="w-full p-2 border rounded-lg text-xs"
                  >
                    {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={settings.model} 
                    onChange={e => setSettings(s => ({...s, model: e.target.value}))} 
                    className="w-full p-2 border rounded-lg text-xs"
                    placeholder="gemini-3-flash-preview"
                  />
                )}
              </div>
              <hr className="border-gray-100" />
              <div>
                <label className="block text-sm font-bold mb-1">Max Tokens</label>
                <select value={settings.maxTokens} onChange={e => setSettings(s => ({...s, maxTokens: parseInt(e.target.value)}))} className="w-full p-2 border rounded-lg text-xs">
                  <option value={30000}>30,000</option>
                  <option value={50000}>50,000</option>
                  <option value={100000}>100,000</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Thời gian chờ (Phút)</label>
                <div className="flex gap-2">
                  <input type="number" value={settings.timeoutMinutes} onChange={e => setSettings(s => ({...s, timeoutMinutes: parseInt(e.target.value)}))} className="flex-1 p-2 border rounded-lg text-xs" />
                  <button 
                    onClick={() => {
                      const suggested = Math.max(5, Math.ceil((formData.maxChars || 2000) / 500) + (npcs.length > 0 ? 2 : 0));
                      setSettings(s => ({...s, timeoutMinutes: suggested}));
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold rounded hover:bg-blue-200"
                  >
                    Đề xuất
                  </button>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={settings.superMode} onChange={e => setSettings(s => ({...s, superMode: e.target.checked}))} />
                  <span className="text-sm font-bold">Super Mode (100k Tokens)</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={settings.isUnlimited} onChange={e => setSettings(s => ({...s, isUnlimited: e.target.checked}))} />
                  <span className="text-sm font-bold">Không giới hạn Token (Unlimited)</span>
                </label>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-pink-500 text-white p-2 rounded-lg font-bold">Lưu</button>
              <button onClick={async () => {
                try {
                  await generateNPCResponse(
                    { id: 'test', name: 'Test Bot', age: 20, avatarSeed: 'test', mbti: 'INTJ', intro: 'Test' },
                    "Ping",
                    [],
                    formData,
                    settings
                  );
                  alert('Kết nối thành công! API Key và Proxy URL đang hoạt động tốt.');
                } catch (e: any) {
                  alert('Kết nối thất bại: ' + e.message);
                }
              }} className="w-full bg-gray-200 text-gray-800 p-2 rounded-lg font-bold">Kiểm tra kết nối</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-4 gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('apply')}
          className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === 'apply' ? 'bg-[#F3B4C2] text-white shadow-md' : 'bg-white/60 text-[#F3B4C2] hover:bg-white/80'}`}
        >
          Ứng Tuyển
        </button>
        <button
          onClick={() => setActiveTab('show')}
          className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === 'show' ? 'bg-[#F3B4C2] text-white shadow-md' : 'bg-white/60 text-[#F3B4C2] hover:bg-white/80'}`}
        >
          Sàn Diễn
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {activeMiniGame === 'quiz' ? (
            <LoveQuiz key="quiz" onBack={() => setActiveMiniGame('none')} quizCount={formData.quizCount || 10} settings={settings} />
          ) : activeMiniGame === 'cafe' ? (
            <LoveCafe key="cafe" onBack={() => setActiveMiniGame('none')} cafeCount={formData.cafeCount || 10} settings={settings} />
          ) : selectedNpc ? (
            <ChatView 
              key="chat" 
              npc={selectedNpc} 
              onBack={() => setSelectedNpc(null)} 
              chatHistory={chatHistory}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendMessage={handleSendMessage}
              isTyping={isTyping}
            />
          ) : activeTab === 'apply' ? (
            <ApplyTab 
              key="apply" 
              formData={formData} 
              setFormData={setFormData} 
              onSaveProfile={handleSaveProfile}
              onStartQuiz={() => setActiveMiniGame('quiz')}
              onStartCafe={() => setActiveMiniGame('cafe')}
              loadingNpcs={loadingNpcs}
              progress={progress}
            />
          ) : (
            <MainShowTab 
              key="show" 
              npcs={npcs} 
              loading={loadingNpcs} 
              onSelectNpc={handleSelectNpc}
              onLoadMore={handleLoadMoreNpcs}
              avatarBg={formData.avatarBg}
              error={error}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedNpc && (
          <ChatView 
            key="chat-fullscreen" 
            npc={selectedNpc} 
            onBack={() => setSelectedNpc(null)} 
            chatHistory={chatHistory}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendMessage={handleSendMessage}
            isTyping={isTyping}
            avatarBg={formData.avatarBg}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ApplyTab({ formData, setFormData, onSaveProfile, onStartQuiz, onStartCafe, loadingNpcs, progress }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border-2 border-dashed border-[#F9C6D4]">
        <h2 className="text-2xl font-bold text-[#F3B4C2] mb-4 font-['Comic_Sans_MS',_cursive]">Hồ Sơ Ứng Tuyển</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tên của bạn</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
              placeholder="Nhập tên của bạn..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Giới thiệu bản thân</label>
            <textarea
              value={formData.intro}
              onChange={e => setFormData({...formData, intro: e.target.value})}
              className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700 h-24 resize-none"
              placeholder="Hãy kể một chút về bạn..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Đối tượng muốn tìm hiểu</label>
            <input
              type="text"
              value={formData.target}
              onChange={e => setFormData({...formData, target: e.target.value})}
              className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
              placeholder="Gu của bạn là gì..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Lý do tham gia chương trình</label>
            <textarea
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700 h-24 resize-none"
              placeholder="Tại sao bạn muốn tham gia..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Giới tính của bạn</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Giới tính đối tượng</label>
              <select
                value={formData.targetGender}
                onChange={e => setFormData({...formData, targetGender: e.target.value})}
                className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="any">Bất kỳ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Chọn MC Dẫn Dắt</label>
            <select
              value={formData.mc}
              onChange={e => setFormData({...formData, mc: e.target.value})}
              className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
            >
              <option value="MC Sâu Bọ">MC Sâu Bọ (Vui vẻ, hoạt ngôn)</option>
              <option value="MC Radio">MC Radio (Nói không ngừng nghỉ)</option>
              <option value="MC Robot">MC Robot (Nghiêm túc, logic)</option>
              <option value="MC Bong Bóng">MC Bong Bóng (Nhẹ nhàng, bay bổng)</option>
              <option value="MC Lửa Trại">MC Lửa Trại (Nhiệt huyết, cháy hết mình)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Độ dài tối thiểu (ký tự)</label>
              <input
                type="number"
                value={formData.minChars}
                onChange={e => setFormData({...formData, minChars: parseInt(e.target.value)})}
                className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Độ dài tối đa (ký tự)</label>
              <input
                type="number"
                value={formData.maxChars}
                onChange={e => setFormData({...formData, maxChars: parseInt(e.target.value)})}
                className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Màu nền Avatar NPC (Hex)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.avatarBg}
                onChange={e => setFormData({...formData, avatarBg: e.target.value})}
                className="h-12 w-20 rounded-xl border border-[#F9C6D4] cursor-pointer"
              />
              <input
                type="text"
                value={formData.avatarBg}
                onChange={e => setFormData({...formData, avatarBg: e.target.value})}
                className="flex-1 p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Số NPC</label>
              <input
                type="number"
                value={formData.npcCount || 40}
                onChange={e => setFormData({...formData, npcCount: parseInt(e.target.value)})}
                className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Số câu hỏi Quiz</label>
              <input
                type="number"
                value={formData.quizCount || 10}
                onChange={e => setFormData({...formData, quizCount: parseInt(e.target.value)})}
                className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Số tình huống Cafe</label>
              <input
                type="number"
                value={formData.cafeCount || 10}
                onChange={e => setFormData({...formData, cafeCount: parseInt(e.target.value)})}
                className="w-full p-3 rounded-xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-gray-700"
              />
            </div>
          </div>

          <button onClick={onSaveProfile} className="w-full py-4 bg-[#F3B4C2] text-white rounded-xl font-bold shadow-md hover:bg-[#e8a5b4] transition-colors mt-4">
            Lưu Hồ Sơ
          </button>
        </div>
      </div>

      {loadingNpcs && (
        <div className="mb-4 p-4 bg-white/50 rounded-2xl border border-[#F9C6D4] flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-[#F3B4C2] font-bold text-sm">
            <Loader2 className="animate-spin" size={16} />
            Đang tìm kiếm NPC... ({progress.current}/{progress.total})
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#F3B4C2] h-full transition-all duration-500" 
              style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border-2 border-dashed border-[#F9C6D4] flex flex-col items-center text-center gap-3 cursor-pointer hover:scale-105 transition-transform">
            <div onClick={onStartQuiz} className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-[#FFF5F7] rounded-full flex items-center justify-center text-[#F3B4C2]">
                <Star size={32} />
              </div>
              <h3 className="font-bold text-gray-800">Thử Thách {formData.quizCount || 10} Câu Hỏi</h3>
              <p className="text-xs text-gray-500">Trả lời sai tối đa 1 lần để đi tiếp.</p>
            </div>
            <div className="mt-2 w-full">
              <label className="text-[10px] font-bold text-gray-400">Số lượng câu hỏi</label>
              <input 
                type="number" 
                value={formData.quizCount || 10} 
                onChange={e => setFormData({...formData, quizCount: parseInt(e.target.value)})}
                className="w-full p-1 text-xs border rounded bg-white"
              />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border-2 border-dashed border-[#F9C6D4] flex flex-col items-center text-center gap-3 cursor-pointer hover:scale-105 transition-transform">
            <div onClick={onStartCafe} className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-[#FFF5F7] rounded-full flex items-center justify-center text-[#F3B4C2]">
                <Coffee size={32} />
              </div>
              <h3 className="font-bold text-gray-800">Cafe Tình Yêu {formData.cafeCount || 5} ☕</h3>
              <p className="text-xs text-gray-500">Lắng nghe và giải quyết tâm sự của khách hàng.</p>
            </div>
            <div className="mt-2 w-full">
              <label className="text-[10px] font-bold text-gray-400">Số lượng tình huống</label>
              <input 
                type="number" 
                value={formData.cafeCount || 5} 
                onChange={e => setFormData({...formData, cafeCount: parseInt(e.target.value)})}
                className="w-full p-1 text-xs border rounded bg-white"
              />
            </div>
          </div>
    </motion.div>
  );
}

function MainShowTab({ npcs, loading, onSelectNpc, onLoadMore, avatarBg, error }: { npcs: NPCProfile[], loading: boolean, onSelectNpc: (npc: NPCProfile) => void, onLoadMore: () => void, avatarBg: string, error: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border-2 border-dashed border-[#F9C6D4] text-center">
        <h2 className="text-2xl font-bold text-[#F3B4C2] mb-2 font-['Comic_Sans_MS',_cursive]">Sàn Diễn Tình Yêu</h2>
        <p className="text-gray-600 text-sm mb-6">Bấm dấu + để API gọi thêm 50 NPC phù hợp với gu của bạn!</p>
        
        <button onClick={onLoadMore} disabled={loading} className="px-6 py-3 bg-[#F3B4C2] text-white rounded-full font-bold shadow-md hover:bg-[#e8a5b4] transition-transform hover:scale-105 text-lg disabled:opacity-50 flex items-center justify-center gap-2 mx-auto">
          {loading ? <><Loader2 className="animate-spin" size={24} /> Đang gọi API...</> : '+ Gọi 20 Đối Tượng'}
        </button>

        {error && (
          <p className="text-red-500 font-bold mt-4">{error}</p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4">
            {(npcs || []).map(npc => (
              <div key={npc.id} className="bg-[#FFF5F7] rounded-2xl p-4 border border-[#F9C6D4] flex flex-col items-center gap-2 text-center">
                <div className="w-20 h-20 rounded-full shadow-sm overflow-hidden border-2 border-[#F3B4C2]" style={{ backgroundColor: avatarBg }}>
                  <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${npc.avatarSeed}`} alt={npc.name} className="w-full h-full object-cover" />
                </div>
                <div className="font-bold text-gray-700">{npc.name}, {npc.age}</div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-[#F9C6D4]">{npc.mbti}</div>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">{npc.intro}</p>
                <button onClick={() => onSelectNpc(npc)} className="mt-2 w-full py-2 bg-white text-[#F3B4C2] rounded-xl font-bold border border-[#F3B4C2] hover:bg-[#F3B4C2] hover:text-white transition-colors text-sm flex items-center justify-center gap-1">
                  <MessageCircle size={16} /> Trò chuyện
                </button>
              </div>
            ))}
          </div>
      </div>
    </motion.div>
  );
}

function ChatView({ npc, onBack, chatHistory, chatInput, setChatInput, handleSendMessage, isTyping, avatarBg }: any) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[60] flex flex-col"
    >
      <div className="p-4 border-b border-[#F9C6D4] flex items-center gap-3 bg-[#FFF5F7] shrink-0">
        <button onClick={onBack} className="p-2 text-[#F3B4C2] hover:bg-white rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="w-12 h-12 rounded-full shadow-sm overflow-hidden border border-[#F3B4C2]" style={{ backgroundColor: avatarBg }}>
          <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${npc.avatarSeed}`} alt={npc.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{npc.name}</h3>
          <p className="text-sm text-gray-500">{npc.age} tuổi • {npc.mbti}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#FFF5F7]/30">
        {chatHistory.length === 0 && isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
            <Loader2 className="animate-spin" size={48} />
            <p className="font-bold">Đang soạn lời chào cực dài...</p>
          </div>
        )}
        
        {(chatHistory || []).map((msg: any, i: number) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-[#F3B4C2] text-white rounded-tr-none shadow-md' : 'bg-white text-gray-800 border border-[#F9C6D4] rounded-tl-none shadow-sm'}`}>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.usage && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                  <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Total: {msg.usage.total_tokens}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded-full">Prompt: {msg.usage.prompt_tokens}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-500 rounded-full">Comp: {msg.usage.completion_tokens}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && chatHistory.length > 0 && !chatHistory[chatHistory.length - 1].content && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#F9C6D4] p-4 rounded-3xl rounded-tl-none flex gap-1 shadow-sm">
              <div className="w-2 h-2 bg-[#F3B4C2] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#F3B4C2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-[#F3B4C2] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-[#F9C6D4] flex gap-3 shrink-0">
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Nhập tin nhắn..."
          className="flex-1 p-4 rounded-2xl bg-[#FFF5F7] border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] text-base"
        />
        <button 
          onClick={handleSendMessage}
          disabled={!chatInput.trim() || isTyping}
          className="p-4 bg-[#F3B4C2] text-white rounded-2xl disabled:opacity-50 hover:bg-[#e8a5b4] transition-colors shadow-md"
        >
          <Send size={24} />
        </button>
      </div>
    </motion.div>
  );
}

function LoveQuiz({ onBack, quizCount, settings }: { onBack: () => void, quizCount: number, settings: ApiProxySettings }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: quizCount });
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    generateLoveQuiz(quizCount, settings, (current, total, newItems) => {
      setProgress({ current, total });
      if (newItems) {
        setQuestions(prev => [...prev, ...newItems]);
        setLoading(false); // Start game as soon as first batch is ready
      }
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || !questions[currentQ]) return;
    setSelectedAnswer(index);
    
    const isCorrect = index === questions[currentQ].correctAnswerIndex;
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      setMistakes(m => m + 1);
    }

    setTimeout(() => {
      if (mistakes + (isCorrect ? 0 : 1) >= 2) {
        setGameOver(true);
      } else if (currentQ < questions.length - 1) {
        setCurrentQ(q => q + 1);
        setSelectedAnswer(null);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-sm border-2 border-dashed border-[#F9C6D4] min-h-[400px] flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 text-[#F3B4C2] hover:bg-[#FFF5F7] rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-[#F3B4C2] font-['Comic_Sans_MS',_cursive]">Thử Thách 10 Câu Hỏi</h2>
        <div className="flex gap-1">
          <Heart size={20} className={mistakes < 2 ? 'text-red-500 fill-red-500' : 'text-gray-300'} />
          <Heart size={20} className={mistakes < 1 ? 'text-red-500 fill-red-500' : 'text-gray-300'} />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#F3B4C2]" size={48} />
          <p className="text-[#F3B4C2] font-bold">Đang chuẩn bị câu hỏi... ({progress.current}/{progress.total})</p>
          <div className="w-full max-w-xs bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#F3B4C2] h-full transition-all duration-500" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      ) : gameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <Star size={64} className="text-yellow-400 fill-yellow-400" />
          <h3 className="text-2xl font-bold text-gray-800">Hoàn thành thử thách!</h3>
          <p className="text-lg text-gray-600">Bạn trả lời đúng {score}/{questions.length} câu</p>
          {mistakes >= 2 && <p className="text-red-500 font-bold">Bạn đã sai quá số lần quy định!</p>}
          <button onClick={onBack} className="mt-4 px-8 py-3 bg-[#F3B4C2] text-white rounded-xl font-bold shadow-md hover:bg-[#e8a5b4] transition-colors">
            Quay lại
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="text-sm text-gray-500 font-bold mb-2">Câu hỏi {currentQ + 1}/{questions.length}</div>
          <h3 className="text-lg font-bold text-gray-800 mb-6">{questions[currentQ]?.question || "Đang tải câu hỏi..."}</h3>
          
          <div className="space-y-3 mt-auto">
            {questions[currentQ]?.options?.map((opt, i) => {
              let btnClass = "w-full p-4 rounded-xl border-2 text-left font-medium transition-all ";
              if (selectedAnswer === null) {
                btnClass += "border-[#F9C6D4] bg-[#FFF5F7] text-gray-700 hover:bg-[#F9C6D4] hover:text-white";
              } else if (i === questions[currentQ].correctAnswerIndex) {
                btnClass += "border-green-500 bg-green-50 text-green-700";
              } else if (i === selectedAnswer) {
                btnClass += "border-red-500 bg-red-50 text-red-700";
              } else {
                btnClass += "border-gray-200 bg-gray-50 text-gray-400 opacity-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedAnswer !== null}
                  className={btnClass}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function LoveCafe({ onBack, cafeCount, settings }: { onBack: () => void, cafeCount: number, settings: ApiProxySettings }) {
  const [scenarios, setScenarios] = useState<CafeScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: cafeCount });
  const [loadingMsg, setLoadingMsg] = useState("Đang làm việc chờ chút nhennn~");
  const [error, setError] = useState<string | null>(null);
  const [currentS, setCurrentS] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAdvice, setSelectedAdvice] = useState<number | null>(null);
  const [customAvatars, setCustomAvatars] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsg(prev => prev === "Đang làm việc chờ chút nhennn~" ? "Đang gõ phím nè cậu ơi" : "Đang làm việc chờ chút nhennn~");
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    generateCafeScenarios(cafeCount, settings, (current, total, newItems) => {
      setProgress({ current, total });
      if (newItems) {
        setScenarios(prev => [...prev, ...newItems]);
        setLoading(false); // Start game as soon as first batch is ready
      }
    }).catch(e => {
      console.error(e);
      setError(e.message || "Có lỗi xảy ra khi gọi API.");
      setLoading(false);
    });
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && scenarios[currentS]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatars(prev => ({
          ...prev,
          [scenarios[currentS].npcName]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdvice = (index: number) => {
    if (selectedAdvice !== null || !scenarios[currentS]) return;
    setSelectedAdvice(index);
    
    if (index === scenarios[currentS].bestAdviceIndex) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentS < scenarios.length - 1) {
        setCurrentS(s => s + 1);
        setSelectedAdvice(null);
      } else {
        setGameOver(true);
      }
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-sm border-2 border-dashed border-[#F9C6D4] min-h-[400px] flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 text-[#F3B4C2] hover:bg-[#FFF5F7] rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-[#F3B4C2] font-['Comic_Sans_MS',_cursive]">Cafe Tình Yêu ☕</h2>
        <div className="font-bold text-[#F3B4C2]">Điểm: {score}</div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#F3B4C2]" size={48} />
          <p className="text-[#F3B4C2] font-bold">{loadingMsg} ({progress.current}/{progress.total})</p>
          <div className="w-full max-w-xs bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#F3B4C2] h-full transition-all duration-500" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-6">
          <p className="text-red-500 font-bold">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#F3B4C2] text-white rounded-full font-bold">
            Thử lại
          </button>
        </div>
      ) : gameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <Coffee size={64} className="text-[#F3B4C2]" />
          <h3 className="text-2xl font-bold text-gray-800">Kết thúc ca làm!</h3>
          <p className="text-lg text-gray-600">Bạn đã tư vấn thành công {score}/{scenarios.length} khách hàng.</p>
          <button onClick={onBack} className="mt-4 px-8 py-3 bg-[#F3B4C2] text-white rounded-xl font-bold shadow-md hover:bg-[#e8a5b4] transition-colors">
            Quay lại
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="text-xs text-gray-500 font-bold mb-2">Khách hàng {currentS + 1}/{scenarios.length}</div>
          <div className="bg-[#FFF5F7] p-4 rounded-2xl border border-[#F9C6D4] mb-6">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div 
                onClick={handleAvatarClick}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 border border-[#F3B4C2] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              >
                {customAvatars[scenarios[currentS]?.npcName] ? (
                  <img src={customAvatars[scenarios[currentS]?.npcName]} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{scenarios[currentS]?.npcName}</h4>
                <p className="text-xs text-gray-500 italic">Gọi món: {scenarios[currentS]?.coffeeOrder}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-2">"{scenarios[currentS]?.problem || "Đang tải tình huống..."}"</p>
          </div>
          
          <div className="space-y-3 mt-auto">
            <p className="text-sm font-bold text-gray-500 mb-2">Lời khuyên của bạn:</p>
            {scenarios[currentS]?.options?.map((opt, i) => {
              let btnClass = "w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ";
              if (selectedAdvice === null) {
                btnClass += "border-[#F9C6D4] bg-white text-gray-700 hover:bg-[#FFF5F7]";
              } else if (i === scenarios[currentS].bestAdviceIndex) {
                btnClass += "border-green-500 bg-green-50 text-green-700";
              } else if (i === selectedAdvice) {
                btnClass += "border-red-500 bg-red-50 text-red-700";
              } else {
                btnClass += "border-gray-200 bg-gray-50 text-gray-400 opacity-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAdvice(i)}
                  disabled={selectedAdvice !== null}
                  className={btnClass}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
