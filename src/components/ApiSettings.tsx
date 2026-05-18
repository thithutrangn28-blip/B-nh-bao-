import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2, User, Settings as SettingsIcon, Camera, Plus, MessageSquare, Twitter, Instagram } from 'lucide-react';

export interface ApiSettingsData {
  endpoint: string;
  apiKey: string;
  model: string;
  apiType?: 'openai' | 'claude' | 'gemini' | 'custom' | 'auto';
}

import { getLargeData, setLargeData } from '../utils/storage';

export interface CharProfile {
  id: string;
  name: string;
  occupation: string;
  hobbies: string;
  appearance: string;
  socials: {
    discord: string;
    x: string;
    instagram: string;
  };
  about: string;
  history: string;
  avatar: string;
}

const SpiderIcon = ({ size = 20, color = "#000", className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill={color} />
    <path d="M12 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill={color} />
    <path d="M8 8c-2 0-4-1-5-3M16 8c2 0 4 1 5 3M7 11c-2-2-3-4-3-6M17 11c2-2 3-4 3-6M7 15H3M17 15h4" />
  </svg>
);

const BowIcon = ({ size = 16, color = "#000", className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" className={className}>
    <path d="M12 12L4 6v12l8-6z" />
    <path d="M12 12l8-6v12l-8-6z" />
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);

const CrossIcon = ({ size = 16, color = "#000", className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" className={className}>
    <path d="M12 4v16M6 12h12" />
  </svg>
);

const HeartBullet = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#F9C6D4" className="mt-1.5 shrink-0">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const HandDrawnBow = ({ className = "" }: { className?: string }) => (
  <div className={`absolute pointer-events-none select-none ${className}`} style={{ width: '45px', height: 'auto' }}>
    <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-sm opacity-90">
      {/* Hand-drawn style bow with slight asymmetry and watercolor feel */}
      <path 
        d="M50 30 C 45 10, 10 5, 5 30 C 5 50, 40 55, 50 35" 
        stroke="#F9C6D4" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="#F9C6D4" 
        fillOpacity="0.2"
      />
      <path 
        d="M50 30 C 55 10, 90 5, 95 30 C 95 50, 60 55, 50 35" 
        stroke="#F9C6D4" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="#F9C6D4" 
        fillOpacity="0.2"
      />
      {/* Ribbons */}
      <path 
        d="M48 35 C 40 45, 35 55, 38 58" 
        stroke="#F9C6D4" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none"
      />
      <path 
        d="M52 35 C 60 45, 65 55, 62 58" 
        stroke="#F9C6D4" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none"
      />
      {/* Center knot */}
      <path 
        d="M45 28 Q 50 22, 55 28 Q 58 32, 50 38 Q 42 32, 45 28" 
        fill="#F9C6D4" 
        stroke="#F9C6D4" 
        strokeWidth="1"
      />
      {/* Pencil sketch lines for texture */}
      <path d="M15 25 Q 25 15, 40 25" stroke="#F472B6" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
      <path d="M85 25 Q 75 15, 60 25" stroke="#F472B6" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
    </svg>
  </div>
);

const BugIcon = ({ size = 24, color = "#F9C6D4", className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 2l1.5 2M16 2l-1.5 2M12 4v16M8 10h8M7 14h10M8 18h8M12 4a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V8a4 4 0 0 0-4-4z" fill={color} fillOpacity="0.5" />
  </svg>
);

export default function ApiSettings({ 
  onClose, 
  settings, 
  setSettings 
}: { 
  onClose: () => void, 
  settings: ApiSettingsData, 
  setSettings: (s: ApiSettingsData) => void 
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'api'>('profile');
  
  // API State
  const [endpoint, setEndpoint] = useState(settings.endpoint || 'https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [model, setModel] = useState(settings.model || '');
  const [apiType, setApiType] = useState(settings.apiType || 'auto');
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile State
  const [profiles, setProfiles] = useState<CharProfile[]>([{
    id: '1', name: 'Untitled', occupation: '', hobbies: '', appearance: '',
    socials: { discord: '', x: '', instagram: '' }, about: '', history: '', avatar: ''
  }]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('1');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const loadProfiles = async () => {
      const savedProfiles = await getLargeData('char_profiles_data_v2');
      if (savedProfiles && savedProfiles.length > 0) {
        setProfiles(savedProfiles);
        setSelectedProfileId(savedProfiles[0].id);
      } else {
        const localProfiles = localStorage.getItem('char_profiles_data_v2');
        if (localProfiles) {
          try {
            const parsed = JSON.parse(localProfiles);
            if (parsed && parsed.length > 0) {
              setProfiles(parsed);
              setSelectedProfileId(parsed[0].id);
              localStorage.removeItem('char_profiles_data_v2');
            }
          } catch (e) {}
        }
      }
      setIsDataLoaded(true);
    };
    loadProfiles();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      setLargeData('char_profiles_data_v2', profiles);
    }
  }, [profiles, isDataLoaded]);

  const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  const updateProfile = (updates: Partial<CharProfile>) => {
    setProfiles(profiles.map(p => p.id === selectedProfileId ? { ...p, ...updates } : p));
  };

  const updateSocials = (updates: Partial<CharProfile['socials']>) => {
    setProfiles(profiles.map(p => p.id === selectedProfileId ? { ...p, socials: { ...p.socials, ...updates } } : p));
  };

  const addProfile = () => {
    const newProfile: CharProfile = {
      id: Date.now().toString(),
      name: 'New Char',
      occupation: '', hobbies: '', appearance: '',
      socials: { discord: '', x: '', instagram: '' }, about: '', history: '', avatar: ''
    };
    setProfiles([...profiles, newProfile]);
    setSelectedProfileId(newProfile.id);
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchModels = async () => {
    setLoading(true);
    setError('');
    try {
      // Clean endpoint
      const baseUrl = (endpoint || '').replace(/\/$/, '');
      const url = `${baseUrl}/models`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        let errText = '';
        try { errText = await res.text(); } catch (e) {}
        throw new Error(`Lỗi ${res.status}: ${errText ? errText.slice(0, 100) : 'Không thể kết nối'}`);
      }
      
      const data = await res.json();
      let modelsList: any[] = [];
      
      if (Array.isArray(data)) {
        modelsList = data;
      } else if (data && Array.isArray(data.data)) {
        modelsList = data.data;
      } else if (data && Array.isArray(data.models)) {
        modelsList = data.models;
      } else {
        throw new Error('Định dạng phản hồi không hợp lệ từ Proxy');
      }

      setModels(modelsList);
      if (modelsList.length > 0 && !model) {
        setModel(modelsList[0].id || modelsList[0].name || '');
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || 'Lỗi khi lấy danh sách model. Bạn có thể nhập tay tên model.';
      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'Không thể kết nối với Proxy Endpoint. Vui lòng kiểm tra lại URL Proxy, kết nối mạng hoặc CORS settings.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSettings({ endpoint, apiKey, model, apiType });
    onClose();
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 w-full h-full bg-white z-50 flex flex-col md:max-w-4xl md:mx-auto md:h-[90vh] md:top-[5vh] md:rounded-3xl md:shadow-2xl md:overflow-hidden"
    >
      <div className="flex flex-col border-b border-gray-100 bg-[#FAF9F6] pt-safe">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="text-xl font-semibold text-gray-800">Thiết lập</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex px-4 gap-4">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-[#F3B4C2] text-[#F3B4C2]' : 'border-transparent text-gray-500'}`}
          >
            <User size={16} />
            Hồ sơ (Tab 1)
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'api' ? 'border-[#F3B4C2] text-[#F3B4C2]' : 'border-transparent text-gray-500'}`}
          >
            <SettingsIcon size={16} />
            Cài đặt API
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        {activeTab === 'profile' ? (
          <div className="min-h-full bg-[#FFE6EE] relative p-4 md:p-8" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='black' fill-opacity='0.15'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E\")", backgroundSize: '40px 40px' }}>
            
            {/* Profile Selector */}
            <div className="flex flex-wrap gap-2 items-center mb-8 max-w-[600px] mx-auto">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`px-4 py-2 rounded-full font-bold text-sm shadow-sm border-2 transition-colors ${selectedProfileId === p.id ? 'bg-[#F9C6D4] border-white text-black' : 'bg-[#FFF9C4] border-transparent text-gray-700 hover:bg-[#fff59d]'}`}
                >
                  {p.name || 'Untitled'}
                </button>
              ))}
              <button onClick={addProfile} className="w-9 h-9 rounded-full bg-white border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                <Plus size={20} />
              </button>
            </div>

            {/* Main Card Wrapper */}
            <div className="w-full max-w-[600px] mx-auto bg-white shadow-xl relative rounded-b-xl mb-6">
              {/* Header */}
              <div className="relative bg-[#2a2a2a] h-28 flex justify-between items-center px-4 md:px-8 z-10"
                   style={{ backgroundImage: 'radial-gradient(#444 3px, transparent 3px)', backgroundSize: '12px 12px' }}>
                
                {/* Scallop bottom black */}
                <div className="absolute -bottom-3 left-0 right-0 h-3 z-20"
                     style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 12'%3E%3Ccircle cx='12' cy='0' r='12' fill='%232a2a2a'/%3E%3C/svg%3E\")", backgroundSize: '24px 12px', backgroundRepeat: 'repeat-x' }} />
                {/* Scallop bottom pink */}
                <div className="absolute -bottom-4 left-0 right-0 h-4 z-10"
                     style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 12'%3E%3Ccircle cx='12' cy='0' r='12' fill='%23F9C6D4'/%3E%3C/svg%3E\")", backgroundSize: '24px 12px', backgroundRepeat: 'repeat-x' }} />
                
                {/* Left Circle */}
                <div className="w-12 h-12 rounded-full border-[3px] border-dotted border-[#F9C6D4] flex items-center justify-center bg-white shadow-inner shrink-0">
                  <SpiderIcon size={24} color="#000" />
                </div>
                
                {/* Center Title */}
                <div className="px-6 py-2 bg-[#F9C6D4] rounded-2xl border-2 border-dashed border-white shadow-md relative min-w-[120px] max-w-[200px] text-center mx-2">
                  <input 
                    type="text" 
                    value={activeProfile.name}
                    onChange={e => updateProfile({ name: e.target.value })}
                    placeholder="Tên nhân vật"
                    className="font-['Caveat',cursive] text-3xl text-black bg-transparent outline-none text-center w-full placeholder-black/40"
                  />
                </div>

                {/* Right Circle */}
                <div className="w-12 h-12 rounded-full border-[3px] border-dotted border-[#F9C6D4] flex items-center justify-center bg-white shadow-inner shrink-0">
                  <SpiderIcon size={24} color="#000" />
                </div>

                {/* Insect Decoration */}
                <div className="absolute -bottom-8 left-6 z-30 opacity-90 pointer-events-none">
                  <BugIcon size={32} color="#F9C6D4" className="drop-shadow-md transform -rotate-12" />
                </div>
              </div>

              {/* Body */}
              <div className="p-6 pt-12 pb-8 grid grid-cols-1 md:grid-cols-[4fr_6fr] gap-8">
                {/* Left Column */}
                <div className="flex flex-col gap-6">
                  {/* Avatar */}
                  <div className="w-full aspect-square rounded-[2rem] border-[4px] border-dotted border-[#E0B0C0] p-1.5 relative group">
                    <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gray-100 relative">
                      {activeProfile.avatar ? (
                        <img src={activeProfile.avatar} className="w-full h-full object-cover" alt="Avatar" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-['Caveat',cursive] text-xl">Tải ảnh lên</div>
                      )}
                      <div 
                        className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Camera className="text-white" size={28} />
                      </div>
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarUpload} />
                  
                  {/* Divider */}
                  <div className="flex justify-center items-center gap-3 text-black opacity-70 py-1">
                    <BowIcon size={18} /> <CrossIcon size={16} /> <BowIcon size={18} /> <CrossIcon size={16} />
                  </div>

                  {/* Contact */}
                  <div>
                    <h3 className="font-['Caveat',cursive] text-2xl text-black mb-4">find me...</h3>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <MessageSquare size={18} className="text-black shrink-0" /> 
                        <input type="text" value={activeProfile.socials.discord} onChange={e => updateSocials({ discord: e.target.value })} placeholder="Discord" className="text-gray-500 text-sm bg-transparent outline-none w-full border-b border-dashed border-gray-300 focus:border-gray-500 pb-1" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Twitter size={18} className="text-black shrink-0" /> 
                        <input type="text" value={activeProfile.socials.x} onChange={e => updateSocials({ x: e.target.value })} placeholder="X (Twitter)" className="text-gray-500 text-sm bg-transparent outline-none w-full border-b border-dashed border-gray-300 focus:border-gray-500 pb-1" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Instagram size={18} className="text-black shrink-0" /> 
                        <input type="text" value={activeProfile.socials.instagram} onChange={e => updateSocials({ instagram: e.target.value })} placeholder="Instagram" className="text-gray-500 text-sm bg-transparent outline-none w-full border-b border-dashed border-gray-300 focus:border-gray-500 pb-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6">
                  <h3 className="font-['Caveat',cursive] text-[32px] text-black leading-none">about me &lt;3</h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <HeartBullet />
                      <div className="flex-1 flex flex-wrap items-baseline gap-1 border-b border-dashed border-gray-200 pb-1">
                        <span className="text-[15px] text-gray-800 font-['Playfair_Display',serif] font-bold whitespace-nowrap">Nghề nghiệp:</span>
                        <input type="text" value={activeProfile.occupation} onChange={e => updateProfile({ occupation: e.target.value })} placeholder="..." className="text-[15px] text-gray-600 font-['Playfair_Display',serif] bg-transparent outline-none flex-1 min-w-[100px]" />
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <HeartBullet />
                      <div className="flex-1 flex flex-wrap items-baseline gap-1 border-b border-dashed border-gray-200 pb-1">
                        <span className="text-[15px] text-gray-800 font-['Playfair_Display',serif] font-bold whitespace-nowrap">Sở thích:</span>
                        <input type="text" value={activeProfile.hobbies} onChange={e => updateProfile({ hobbies: e.target.value })} placeholder="..." className="text-[15px] text-gray-600 font-['Playfair_Display',serif] bg-transparent outline-none flex-1 min-w-[100px]" />
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <HeartBullet />
                      <div className="flex-1 flex flex-wrap items-baseline gap-1 border-b border-dashed border-gray-200 pb-1">
                        <span className="text-[15px] text-gray-800 font-['Playfair_Display',serif] font-bold whitespace-nowrap">Ngoại hình:</span>
                        <input type="text" value={activeProfile.appearance} onChange={e => updateProfile({ appearance: e.target.value })} placeholder="..." className="text-[15px] text-gray-600 font-['Playfair_Display',serif] bg-transparent outline-none flex-1 min-w-[100px]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5 mt-2">
                    <div>
                      <span className="text-[15px] text-gray-800 font-['Playfair_Display',serif] font-bold block mb-2">About:</span>
                      <textarea 
                        value={activeProfile.about} 
                        onChange={e => updateProfile({ about: e.target.value })} 
                        placeholder="Giới thiệu về nhân vật..." 
                        className="w-full text-[14px] text-gray-600 font-['Playfair_Display',serif] leading-[1.6] bg-gray-50/50 rounded-lg p-3 outline-none border border-gray-100 resize-none min-h-[120px] text-justify custom-scrollbar"
                      />
                    </div>
                    <div>
                      <span className="text-[15px] text-gray-800 font-['Playfair_Display',serif] font-bold block mb-2">Lịch sử quá khứ:</span>
                      <textarea 
                        value={activeProfile.history} 
                        onChange={e => updateProfile({ history: e.target.value })} 
                        placeholder="Quá khứ của nhân vật..." 
                        className="w-full text-[14px] text-gray-600 font-['Playfair_Display',serif] leading-[1.6] bg-gray-50/50 rounded-lg p-3 outline-none border border-gray-100 resize-none min-h-[120px] text-justify custom-scrollbar"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="relative bg-[#2a2a2a] h-14 flex justify-center items-center rounded-b-xl"
                   style={{ backgroundImage: 'radial-gradient(#444 3px, transparent 3px)', backgroundSize: '12px 12px' }}>
                {/* Scallop top black */}
                <div className="absolute -top-3 left-0 right-0 h-3"
                     style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 12'%3E%3Ccircle cx='12' cy='12' r='12' fill='%232a2a2a'/%3E%3C/svg%3E\")", backgroundSize: '24px 12px', backgroundRepeat: 'repeat-x' }} />
                <span className="text-gray-400 text-sm font-['Caveat',cursive] tracking-wider relative z-10">by xiu.carrd.co</span>
              </div>
            </div>

            {/* Navigation Menu (Part D) */}
            <div className="flex flex-wrap justify-center gap-4 mt-8 pb-12 max-w-[600px] mx-auto">
              {['home', 'terms', 'prices', 'gallery'].map((item, idx) => (
                <div key={item} className="relative group cursor-pointer">
                  <div className="px-5 py-1.5 bg-white border-2 border-dashed border-black rounded-lg shadow-sm group-hover:bg-[#F9C6D4] transition-colors">
                    <span className="font-['Caveat',cursive] text-xl text-black">{item}</span>
                  </div>
                  {idx === 0 && <BugIcon size={16} color="#000" className="absolute -top-2 -left-2 transform -rotate-45 pointer-events-none" />}
                  {idx === 3 && <SpiderIcon size={16} color="#000" className="absolute -bottom-2 -right-2 transform rotate-45 pointer-events-none" />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 animate-in fade-in max-w-2xl mx-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Loại API (API Type)</label>
              <select 
                value={apiType}
                onChange={e => setApiType(e.target.value as any)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F9C6D4] transition-all"
              >
                <option value="auto">Tự động phát hiện (Auto Detect)</option>
                <option value="openai">OpenAI-compatible</option>
                <option value="claude">Claude (Anthropic)</option>
                <option value="gemini">Gemini</option>
                <option value="custom">Custom Endpoint</option>
              </select>
            </div>

            <div className="space-y-2 relative">
              <HandDrawnBow className="-top-4 -right-2 rotate-12" />
              <label className="text-sm font-medium text-gray-700">API Endpoint (Proxy / Official)</label>
              <input 
                type="text" 
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F9C6D4] transition-all"
              />
              <p className="text-xs text-gray-500">Ví dụ: https://api.openai.com/v1 hoặc địa chỉ proxy ngược</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Nhập API Key (sk-..., yL9Fw..., v.v.)"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F9C6D4] transition-all"
              />
            </div>

            <div className="space-y-2 relative">
              <HandDrawnBow className="-top-5 -right-3 -rotate-6" />
              <label className="text-sm font-medium text-gray-700">Tên Model</label>
              <input 
                type="text" 
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="gpt-3.5-turbo, claude-3-haiku, ..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F9C6D4] transition-all"
              />
              <p className="text-xs text-gray-500">Nhập tên model hoặc bấm nút dưới để lấy danh sách từ API</p>
              
              {models.length > 0 && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Hoặc chọn từ danh sách:</label>
                  <select 
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F9C6D4] transition-all"
                  >
                    <option value="">-- Chọn model --</option>
                    {models.map((m, i) => {
                      const modelValue = m.id || m.name;
                      return <option key={i} value={modelValue}>{modelValue}</option>;
                    })}
                  </select>
                </div>
              )}
            </div>

            <button 
              onClick={fetchModels}
              disabled={loading || !endpoint || !apiKey}
              className="w-full py-3 bg-[#F3B4C2] text-white rounded-xl font-medium shadow-sm hover:bg-[#f19eb0] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Kéo danh sách Model'}
            </button>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 break-words">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-100 bg-[#FAF9F6]">
        <button 
          onClick={handleSave}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-medium shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 max-w-md mx-auto"
        >
          <Check size={20} />
          Lưu cài đặt
        </button>
      </div>
    </motion.div>
  );
}

