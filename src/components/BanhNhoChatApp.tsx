import React, { useState, useRef, useEffect, useContext } from 'react';
import { ArrowLeft, Settings, Database, List, Instagram, Clock, Key, CreditCard, Info, Image as ImageIcon, Youtube, Users, BookOpen, FileText, Shield, Wallet, Mic, Video, Globe, PlusCircle, PawPrint, LayoutList } from 'lucide-react';
import { loadCards, saveDraft, saveBackground, loadBackgrounds, clearDrafts } from '../utils/db';
import { safeSetItem } from '../utils/storage';
import { compressImage } from '../utils/imageUtils';
import { fetchAvailableModels, ApiProxySettings } from '../utils/apiProxy';
import Tab1CreateBot from './banhnho/Tab1CreateBot';
import BotCardGallery from './banhnho/BotCardGallery';
import { RoleplayChat } from './banhnho/RoleplayChat';
import GroupForum from './banhnho/GroupForum';

const TabContext = React.createContext<{ tabBgs: Record<string, string>, onUploadClick: () => void }>({ tabBgs: {}, onUploadClick: () => {} });

const TabWrapper = ({ children, tabId }: { children: React.ReactNode, tabId: string }) => {
  const { tabBgs, onUploadClick } = useContext(TabContext);
  const bg = tabBgs[tabId];
  return (
    <div className={`h-full relative overflow-hidden ${!bg ? 'bg-heart-pattern' : 'bg-[#FAF9F6]'}`}>
      {/* Background Image without Blur */}
      {bg && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('${bg}')`
          }}
        />
      )}
      
      {/* 2.1 Overlay "milky" */}
      <div className="absolute inset-0 z-0 bg-[rgba(255,255,255,0.2)] pointer-events-none" />

      {/* 2.3 Pink tint */}
      <div className="absolute inset-0 z-0 bg-[#F9C6D4] opacity-10 mix-blend-soft-light pointer-events-none" />

      {/* Upload Button */}
      <div className="absolute bottom-24 right-4 z-20">
        <button 
          onClick={onUploadClick} 
          className="p-3 bg-white/60 backdrop-blur-md rounded-full hover:bg-white/80 shadow-md border border-white/40 transition-all"
          title="Đổi ảnh nền"
        >
          <ImageIcon size={24} className="text-[#F3B4C2]" />
        </button>
      </div>

      {/* Content Area */}
      <div 
        className="relative z-10 h-full overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
};

export default function BanhNhoChatApp({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('banhnho_active_tab') || 'tab1');
  const [subTab, setSubTab] = useState<string | null>(() => localStorage.getItem('banhnho_sub_tab'));
  const [roleplayBot, setRoleplayBot] = useState<any | null>(null);

  useEffect(() => {
    const handleStartRoleplay = (e: any) => {
      setRoleplayBot(e.detail);
    };
    window.addEventListener('start-roleplay', handleStartRoleplay);
    return () => window.removeEventListener('start-roleplay', handleStartRoleplay);
  }, []);

  useEffect(() => {
    localStorage.setItem('banhnho_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (subTab) {
      localStorage.setItem('banhnho_sub_tab', subTab);
    } else {
      localStorage.removeItem('banhnho_sub_tab');
    }
  }, [subTab]);

  // API Proxy Settings
  const [apiSettings, setApiSettings] = useState<ApiProxySettings>(() => {
    const saved = localStorage.getItem('banhnho_api_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    
    return {
      endpoint: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      maxTokens: 30000,
      isUnlimited: false,
      timeoutMinutes: 2,
      apiType: 'auto'
    };
  });

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    try {
      const models = await fetchAvailableModels(apiSettings.endpoint, apiSettings.apiKey);
      if (models.length > 0) {
        setAvailableModels(models);
        if (!models.includes(apiSettings.model)) {
          setApiSettings({ ...apiSettings, model: models[0] });
        }
        showToast(`Đã tải thành công ${models.length} models! Vui lòng chọn model ở bên dưới.`);
      } else {
        showToast("Không tìm thấy model nào từ API này. Bạn có thể nhập tên model thủ công.");
      }
    } catch (error: any) {
      showToast(`Không thể lấy danh sách model tự động: ${error.message}`);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const saveApiSettings = () => {
    safeSetItem('banhnho_api_settings', JSON.stringify(apiSettings));
    setIsSettingsSaved(true);
    showToast('Đã lưu cấu hình API thành công! Hệ thống đã sẵn sàng xử lý dữ liệu lớn.');
    setTimeout(() => setIsSettingsSaved(false), 2000);
  };

  // Saved Profiles
  const [savedProfiles, setSavedProfiles] = useState<ApiProxySettings[]>(() => {
    const saved = localStorage.getItem('banhnho_api_profiles');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [profileName, setProfileName] = useState('');
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) {
      showToast("Vui lòng nhập tên cho cấu hình này (VD: OpenAI, Claude...)");
      return;
    }
    
    const newProfile: ApiProxySettings = {
      ...apiSettings,
      id: Date.now().toString(),
      name: profileName.trim()
    };
    
    const updatedProfiles = [...savedProfiles, newProfile];
    setSavedProfiles(updatedProfiles);
    safeSetItem('banhnho_api_profiles', JSON.stringify(updatedProfiles));
    const savedName = newProfile.name;
    setProfileName('');
    
    setIsProfileSaved(true);
    showToast(`Đã lưu cấu hình "${savedName}" thành công!`);
    setTimeout(() => setIsProfileSaved(false), 2000);
  };

  const handleLoadProfile = (profile: ApiProxySettings) => {
    setApiSettings(profile);
    safeSetItem('banhnho_api_settings', JSON.stringify(profile));
    showToast(`Đã tải cấu hình "${profile.name}".`);
  };

  const handleDeleteProfile = (id: string) => {
    // Custom confirm logic is hard without a modal component, so we just delete directly for now 
    // or we can add a simple state for it. Let's just delete directly and show a toast.
    const updatedProfiles = savedProfiles.filter(p => p.id !== id);
    setSavedProfiles(updatedProfiles);
    safeSetItem('banhnho_api_profiles', JSON.stringify(updatedProfiles));
    showToast("Đã xóa cấu hình.");
  };

  // Backgrounds for all 20 tabs - stored in IndexedDB to avoid quota issues
  const [tabBgs, setTabBgs] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadBgs = async () => {
      try {
        const bgs = await loadBackgrounds();
        let migrated = false;
        // Migrate from localStorage if needed
        for (let i = 1; i <= 20; i++) {
          const key = `banhnho_bg_tab${i}`;
          const saved = localStorage.getItem(key);
          if (saved && !bgs[`tab${i}`]) {
            bgs[`tab${i}`] = saved;
            await saveBackground(`tab${i}`, saved);
            localStorage.removeItem(key);
            migrated = true;
          }
        }
        
        setTabBgs(bgs);
      } catch (e) {
        console.error("Failed to load backgrounds from DB", e);
      }
    };
    loadBgs();
  }, []);

  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64data = await compressImage(file);
        await saveBackground(activeTab, base64data);
        
        const newBgs = { ...tabBgs, [activeTab]: base64data };
        setTabBgs(newBgs);
        showToast("Đã lưu ảnh nền thành công!");
      } catch (error) {
        console.error("Failed to save background:", error);
        showToast("Có lỗi xảy ra khi xử lý ảnh nền.");
      }
      e.target.value = '';
    }
  };

  const [isFullScreen, setIsFullScreen] = useState(false);

  // Load cards for gallery
  const [savedCards, setSavedCards] = useState<any[]>([]);
  useEffect(() => {
    const fetchCards = async () => {
      const cards = await loadCards();
      setSavedCards(cards);
    };
    fetchCards();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tab1':
        return (
          <TabWrapper tabId="tab1">
            <Tab1CreateBot onSaveComplete={async () => {
              const cards = await loadCards();
              setSavedCards(cards);
              setActiveTab('tab4');
            }} />
          </TabWrapper>
        );
      case 'tab2':
        return (
          <TabWrapper tabId="tab2">
            <GroupForum 
              apiSettings={apiSettings} 
              setApiSettings={setApiSettings}
              availableModels={availableModels}
              isFetchingModels={isFetchingModels}
              handleFetchModels={handleFetchModels}
              saveApiSettings={saveApiSettings}
              savedProfiles={savedProfiles}
              setSavedProfiles={setSavedProfiles}
              profileName={profileName}
              setProfileName={setProfileName}
              isProfileSaved={isProfileSaved}
              setIsProfileSaved={setIsProfileSaved}
              isSettingsSaved={isSettingsSaved}
              setIsSettingsSaved={setIsSettingsSaved}
              showToast={showToast}
              onNavigateToTab={setActiveTab} 
            />
          </TabWrapper>
        );
      case 'tab3':
        return (
          <TabWrapper tabId="tab3">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#9E919A] px-10 text-center">
              <div className="text-6xl mb-6">📝</div>
              <h2 className="text-2xl font-bold mb-2">Blog Tin tức</h2>
              <p>Cập nhật những thông tin mới nhất về thế giới Bot Char. Tính năng đang được phát triển...</p>
            </div>
          </TabWrapper>
        );
      case 'tab4':
        return (
          <TabWrapper tabId="tab4">
            <BotCardGallery 
              onEdit={async (card, index) => {
                await Promise.all([
                  saveDraft('card_avatar', card.avatar || ''),
                  saveDraft('card_name', card.name || ''),
                  saveDraft('card_occupation', card.occupation || ''),
                  saveDraft('card_hobbies', card.hobbies || ''),
                  saveDraft('card_appearance', card.appearance || ''),
                  saveDraft('card_about', card.about || ''),
                  saveDraft('card_history', card.history || ''),
                  saveDraft('card_theme', card.theme || 'pink'),
                  saveDraft('card_intro', card.intro || ''),
                  saveDraft('card_short_info', card.shortInfo || ["", "", ""]),
                  saveDraft('card_free_text', card.freeText || ''),
                  saveDraft('card_bullet_points', card.bulletPoints || ["", "", "", ""]),
                  saveDraft('card_media_images', card.mediaImages || ["", "", "", ""]),
                  saveDraft('card_nav_buttons', card.navButtons || ["Home", "Interests", "Art Comms"]),
                  saveDraft('card_links', card.links || ["", "", ""])
                ]);
                
                localStorage.setItem('banhnho_bot_card_selected_index', index.toString());
                setActiveTab('tab1');
              }}
            />
          </TabWrapper>
        );
      case 'tab5':
        return (
          <TabWrapper tabId="tab5">
            {subTab === '5.0' ? (
              <div className="p-4">
                <button onClick={() => setSubTab(null)} className="mb-4 text-[#F3B4C2] font-bold bg-white/50 px-3 py-1 rounded-full">← Quay lại</button>
                <h2 className="text-xl font-bold text-[#8A7D85]">Thiết lập nhân vật chi tiết</h2>
              </div>
            ) : subTab === '5.1' ? (
              <div className="p-4">
                <button onClick={() => setSubTab(null)} className="mb-4 text-[#F3B4C2] font-bold bg-white/50 px-3 py-1 rounded-full">← Quay lại</button>
                <h2 className="text-xl font-bold text-[#8A7D85] mb-4">Gắn Prompt/Preset, SYSTEM</h2>
                
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-[#F9C6D4] shadow-sm">
                  <label className="block text-sm font-bold text-[#8A7D85] mb-2">System Instruction (Chỉ dẫn hệ thống)</label>
                  <textarea 
                    value={apiSettings.systemPrompt || ''}
                    onChange={(e) => setApiSettings({...apiSettings, systemPrompt: e.target.value})}
                    placeholder="VD: Bạn là một trợ lý nhập vai chuyên nghiệp. Hãy trả lời bằng tiếng Việt, sử dụng ngôn ngữ tự nhiên, giàu cảm xúc..."
                    className="w-full h-64 p-4 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50 text-sm resize-none"
                  />
                  <p className="text-xs text-[#9E919A] mt-2 italic">
                    * Chỉ dẫn này sẽ được gửi kèm với mọi tin nhắn để định hình phong cách trả lời của AI.
                  </p>
                  
                  <button 
                    onClick={saveApiSettings}
                    className="w-full mt-4 p-3 bg-[#F3B4C2] text-white rounded-xl font-bold shadow-md hover:bg-[#F9C6D4] transition-all"
                  >
                    Lưu cấu hình System
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <h2 className="text-xl font-bold text-[#8A7D85] mb-4">Danh sách giao diện bot char</h2>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setSubTab('5.0')} className="p-3 bg-[#F9C6D4] text-white rounded-xl font-bold shadow-md">
                    Thiết lập nhân vật chi tiết (Tab 5.0)
                  </button>
                  <button onClick={() => setSubTab('5.1')} className="p-3 bg-[#F9C6D4] text-white rounded-xl font-bold shadow-md">
                    Gắn Prompt/Preset, SYSTEM (Tab 5.1)
                  </button>
                </div>
              </div>
            )}
          </TabWrapper>
        );
      case 'tab6':
        return (
          <TabWrapper tabId="tab6">
            {subTab === '6.1' ? (
              <div className="p-4">
                <button onClick={() => setSubTab(null)} className="mb-4 text-[#F3B4C2] font-bold bg-white/50 px-3 py-1 rounded-full">← Quay lại</button>
                <h2 className="text-xl font-bold text-[#8A7D85]">Chi tiết Instagram</h2>
              </div>
            ) : (
              <div className="p-4">
                <h2 className="text-xl font-bold text-[#8A7D85] mb-4">Instagram của bot Char</h2>
                <button onClick={() => setSubTab('6.1')} className="p-3 bg-[#F9C6D4] text-white rounded-xl font-bold shadow-md">
                  Xem chi tiết (Tab 6.1)
                </button>
              </div>
            )}
          </TabWrapper>
        );
      case 'tab7':
        return (
          <TabWrapper tabId="tab7">
            {subTab === '7.1' ? (
              <div className="p-4">
                <button onClick={() => setSubTab(null)} className="mb-4 text-[#F3B4C2] font-bold bg-white/50 px-3 py-1 rounded-full">← Quay lại</button>
                <h2 className="text-xl font-bold text-[#8A7D85]">Tương lai 10, 20, 30 năm sau</h2>
              </div>
            ) : (
              <div className="p-4">
                <h2 className="text-xl font-bold text-[#8A7D85] mb-4">Tương lai cuộc đời (5 năm sau)</h2>
                <button onClick={() => setSubTab('7.1')} className="p-3 bg-[#F9C6D4] text-white rounded-xl font-bold shadow-md">
                  Xem xa hơn (Tab 7.1)
                </button>
              </div>
            )}
          </TabWrapper>
        );
      case 'tab8':
        return (
          <TabWrapper tabId="tab8">
            <div className="p-4 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-[#8A7D85] mb-6 text-center">API Proxy Key Setup</h2>
              
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#F9C6D4] flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#8A7D85] mb-1">Loại API (API Type)</label>
                  <select 
                    value={apiSettings.apiType || 'auto'}
                    onChange={(e) => setApiSettings({...apiSettings, apiType: e.target.value as any})}
                    className="w-full p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50"
                  >
                    <option value="auto">Tự động phát hiện (Auto Detect)</option>
                    <option value="openai">OpenAI-compatible</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="gemini">Gemini</option>
                    <option value="custom">Custom Endpoint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#8A7D85] mb-1">Endpoint URL (v1)</label>
                  <input 
                    type="text" 
                    value={apiSettings.endpoint || ''}
                    onChange={(e) => setApiSettings({...apiSettings, endpoint: e.target.value})}
                    placeholder="https://api.openai.com/v1"
                    className="w-full p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#8A7D85] mb-1">API Key</label>
                  <input 
                    type="password" 
                    value={apiSettings.apiKey || ''}
                    onChange={(e) => setApiSettings({...apiSettings, apiKey: e.target.value})}
                    placeholder="Nhập API Key..."
                    className="w-full p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#8A7D85] mb-1">Model</label>
                  <div className="flex gap-2 mb-2">
                    <button 
                      onClick={handleFetchModels}
                      disabled={isFetchingModels}
                      className="px-4 py-2 bg-[#F9C6D4] text-white rounded-xl font-bold text-sm hover:bg-[#F3B4C2] transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {isFetchingModels ? 'Đang tải...' : 'Gọi API Lấy Model'}
                    </button>
                  </div>
                  {availableModels.length > 0 ? (
                    <select 
                      value={apiSettings.model}
                      onChange={(e) => setApiSettings({...apiSettings, model: e.target.value})}
                      className="w-full p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50"
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={apiSettings.model || ''}
                      onChange={(e) => setApiSettings({...apiSettings, model: e.target.value})}
                      placeholder="gpt-3.5-turbo, claude-3-opus..."
                      className="w-full p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50"
                    />
                  )}
                </div>

                <div className="pt-4 border-t border-[#F9C6D4]/50">
                  <h3 className="font-bold text-[#8A7D85] mb-3">Cấu hình Token & Xử lý lớn</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[8000, 10000, 12000, 25000, 35000, 45000, 60000, 75000, 100000].map(val => (
                      <button 
                        key={val}
                        onClick={() => setApiSettings({...apiSettings, maxTokens: val, isUnlimited: false})}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${!apiSettings.isUnlimited && apiSettings.maxTokens === val ? 'bg-[#F3B4C2] text-white shadow-md' : 'bg-white/50 text-[#8A7D85] border border-[#F9C6D4]'}`}
                      >
                        {val >= 1000 ? `${val/1000}K` : val}
                      </button>
                    ))}
                    <button 
                      onClick={() => setApiSettings({...apiSettings, maxTokens: 1000000, isUnlimited: false})}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${!apiSettings.isUnlimited && apiSettings.maxTokens === 1000000 ? 'bg-[#F3B4C2] text-white shadow-md' : 'bg-white/50 text-[#8A7D85] border border-[#F9C6D4]'}`}
                    >
                      1M
                    </button>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input 
                      type="checkbox" 
                      checked={apiSettings.isUnlimited}
                      onChange={(e) => setApiSettings({...apiSettings, isUnlimited: e.target.checked})}
                      className="w-5 h-5 rounded border-[#F9C6D4] text-[#F3B4C2] focus:ring-[#F3B4C2]"
                    />
                    <span className="text-sm font-bold text-[#8A7D85]">Không giới hạn (Max Token Vĩnh Viễn)</span>
                  </label>

                  <div>
                    <label className="block text-sm font-bold text-[#8A7D85] mb-1">Thời gian chờ tối đa (Timeout - Phút)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="10"
                      value={apiSettings.timeoutMinutes || 2}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 2;
                        if (val > 10) val = 10; 
                        setApiSettings({...apiSettings, timeoutMinutes: val});
                      }}
                      className="w-full p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50"
                    />
                    <p className="text-xs text-[#9E919A] mt-1">Tối đa 10 phút để đảm bảo AI có đủ thời gian viết chương dài (19K token).</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F9C6D4]/50">
                  <h3 className="font-bold text-[#8A7D85] mb-3">Lưu trữ Cấu hình (Profiles)</h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Tên cấu hình (VD: OpenAI GPT-4...)"
                      className="flex-1 p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50 text-sm"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={isProfileSaved}
                      className={`px-4 py-2 text-white rounded-xl font-bold text-sm transition-colors whitespace-nowrap shadow-sm ${isProfileSaved ? 'bg-[#4CAF50]' : 'bg-[#F3B4C2] hover:bg-[#F9C6D4]'}`}
                    >
                      {isProfileSaved ? '✓ Đã lưu' : 'Lưu mới'}
                    </button>
                  </div>

                  {savedProfiles.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                      {savedProfiles.map(profile => (
                        <div key={profile.id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-[#F9C6D4]/50">
                          <div className="flex flex-col overflow-hidden mr-2">
                            <span className="font-bold text-sm text-[#8A7D85] truncate">{profile.name}</span>
                            <span className="text-xs text-[#9E919A] truncate">{profile.endpoint}</span>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleLoadProfile(profile)} className="p-2 bg-[#E8F5E9] text-[#2E7D32] rounded-lg hover:bg-[#C8E6C9] text-xs font-bold transition-colors">Chọn</button>
                            <button onClick={() => handleDeleteProfile(profile.id!)} className="p-2 bg-[#FFEBEE] text-[#C62828] rounded-lg hover:bg-[#FFCDD2] text-xs font-bold transition-colors">Xóa</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={saveApiSettings}
                  disabled={isSettingsSaved}
                  className={`w-full mt-2 p-4 text-white rounded-xl font-bold shadow-md transition-all ${isSettingsSaved ? 'bg-[#4CAF50]' : 'bg-gradient-to-r from-[#F9C6D4] to-[#F3B4C2] hover:shadow-lg active:scale-95'}`}
                >
                  {isSettingsSaved ? '✓ Đã lưu cấu hình' : 'Lưu Cấu Hình API Hiện Tại'}
                </button>
              </div>
            </div>
          </TabWrapper>
        );
      case 'tab9':
        return (
          <TabWrapper tabId="tab9">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Ngân Hàng của bot char</h2>
            </div>
          </TabWrapper>
        );
      case 'tab10':
        return (
          <TabWrapper tabId="tab10">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">About</h2>
            </div>
          </TabWrapper>
        );
      case 'tab11':
        return (
          <TabWrapper tabId="tab11">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Xem YouTube</h2>
            </div>
          </TabWrapper>
        );
      case 'tab12':
        return (
          <TabWrapper tabId="tab12">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Người nhà + Người thân nhận xét về Bot char</h2>
            </div>
          </TabWrapper>
        );
      case 'tab13':
        return (
          <TabWrapper tabId="tab13">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Viết Tiểu Thuyết Novel</h2>
            </div>
          </TabWrapper>
        );
      case 'tab14':
        return (
          <TabWrapper tabId="tab14">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Bài Đăng + NPC</h2>
            </div>
          </TabWrapper>
        );
      case 'tab15':
        return (
          <TabWrapper tabId="tab15">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Văn Phong + Bắt Buộc Bot char tuân thủ theo các quy định</h2>
            </div>
          </TabWrapper>
        );
      case 'tab16':
        return (
          <TabWrapper tabId="tab16">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Sổ Chi Tiêu</h2>
            </div>
          </TabWrapper>
        );
      case 'tab17':
        return (
          <TabWrapper tabId="tab17">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Phỏng Vấn và bot char trả lời</h2>
            </div>
          </TabWrapper>
        );
      case 'tab18':
        return (
          <TabWrapper tabId="tab18">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Livestream Tiktok</h2>
            </div>
          </TabWrapper>
        );
      case 'tab19':
        return (
          <TabWrapper tabId="tab19">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Weibo</h2>
            </div>
          </TabWrapper>
        );
      case 'tab20':
        return (
          <TabWrapper tabId="tab20">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#8A7D85]">Hội Anti fan và Fan Cuồng</h2>
            </div>
          </TabWrapper>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'tab1', icon: <PlusCircle size={24} />, label: 'Tạo Bot' },
    { id: 'tab8', icon: <Key size={24} />, label: 'API Key' },
    { id: 'tab2', icon: <PawPrint size={24} />, label: 'Diễn đàn' },
    { id: 'tab3', icon: <LayoutList size={24} />, label: 'Blog' },
    { id: 'tab4', icon: <Database size={24} />, label: 'Bộ nhớ' },
    { id: 'tab5', icon: <Settings size={24} />, label: 'Danh sách' },
    { id: 'tab6', icon: <Instagram size={24} />, label: 'Instagram' },
    { id: 'tab7', icon: <Clock size={24} />, label: 'Tương lai' },
    { id: 'tab9', icon: <CreditCard size={24} />, label: 'Ngân hàng' },
    { id: 'tab10', icon: <Info size={24} />, label: 'About' },
    { id: 'tab11', icon: <Youtube size={24} />, label: 'YouTube' },
    { id: 'tab12', icon: <Users size={24} />, label: 'Nhận xét' },
    { id: 'tab13', icon: <BookOpen size={24} />, label: 'Tiểu thuyết' },
    { id: 'tab14', icon: <FileText size={24} />, label: 'Bài đăng NPC' },
    { id: 'tab15', icon: <Shield size={24} />, label: 'Quy định' },
    { id: 'tab16', icon: <Wallet size={24} />, label: 'Sổ chi tiêu' },
    { id: 'tab17', icon: <Mic size={24} />, label: 'Phỏng vấn' },
    { id: 'tab18', icon: <Video size={24} />, label: 'Tiktok Live' },
    { id: 'tab19', icon: <Globe size={24} />, label: 'Weibo' },
    { id: 'tab20', icon: <Users size={24} />, label: 'Fan/Anti' },
  ];

  return (
    <div className="w-full h-screen flex flex-col font-sans overflow-hidden bg-heart-pattern relative">
      {!isFullScreen && (
        <div className="absolute top-4 left-4 z-50">
          <button onClick={onBack} className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-[#F3B4C2] shadow-sm border border-[#F9C6D4]">
            ← Thoát
          </button>
        </div>
      )}

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={bgInputRef} 
        onChange={handleBgUpload} 
      />

      <div className={`flex-1 overflow-hidden transition-all duration-500 ${!isFullScreen ? 'pb-[80px]' : 'pb-0'}`}>
        <TabContext.Provider value={{ tabBgs, onUploadClick: () => bgInputRef.current?.click() }}>
          {renderTabContent()}
        </TabContext.Provider>
      </div>

      {/* Scrollable Bottom Navigation Wrapper */}
      <div 
        className="fixed bottom-0 left-0 w-full z-50 transition-all duration-500 ease-in-out"
        style={{ 
          transform: !isFullScreen ? 'translateY(0)' : 'translateY(100%)',
          pointerEvents: 'none' // Allow clicks to pass through the wrapper itself
        }}
      >
        {/* Toggle Button - Heart Icon */}
        <button 
          onClick={() => setIsFullScreen(prev => !prev)}
          className={`absolute -top-10 right-6 w-7 h-7 bg-[#FDE2E4] rounded-full shadow-md flex items-center justify-center border border-[#9E919A] hover:scale-110 transition-all z-50 cursor-pointer ${isFullScreen ? 'translate-y-6' : ''}`}
          style={{ pointerEvents: 'auto' }}
          title={!isFullScreen ? "Ẩn thanh điều hướng" : "Hiện thanh điều hướng"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#F3B4C2" stroke="#9E919A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>

        <div 
          className="h-[85px] bg-white/95 backdrop-blur-md border-t-2 border-[#F9C6D4] flex items-center overflow-x-auto px-4 gap-6 scrollbar-hide snap-x rounded-t-[35px] shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)]"
          style={{ pointerEvents: 'auto' }}
        >
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSubTab(null); }}
              className={`flex flex-col items-center justify-center min-w-[70px] snap-center transition-all ${activeTab === tab.id ? 'text-[#F3B4C2] scale-110' : 'text-[#9E919A] opacity-70'}`}
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${activeTab === tab.id ? 'bg-[#FDF2F5] shadow-sm border border-[#F9C6D4]' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] font-bold mt-1 whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md border border-[#F9DDE3] text-[#8A7D85] px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 z-[100]">
          <div className="w-2 h-2 rounded-full bg-[#4CAF50]"></div>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Roleplay Chat Overlay */}
      {roleplayBot && (
        <div className="fixed inset-0 z-[100] bg-white">
          <RoleplayChat 
            bot={roleplayBot} 
            apiSettings={apiSettings}
            onBack={() => setRoleplayBot(null)} 
          />
        </div>
      )}
    </div>
  );
}
