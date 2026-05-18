import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  MoreVertical, 
  Phone, 
  Edit2, 
  Trash2, 
  Save,
  User,
  Heart,
  MessageSquare,
  Sparkles,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NPCProfile, NPCConversation, NPCRelationType, NPCMessage } from '../../types';
import { 
  saveNPCProfile, 
  loadNPCProfiles, 
  deleteNPCProfile, 
  saveNPCConversation, 
  loadNPCConversations,
  deleteNPCConversation,
  saveGlobalBackground,
  loadGlobalBackground
} from '../../utils/db';
import { compressImage } from '../../utils/imageUtils';
import { sendMessageStream } from '../../utils/apiProxy';
import { SmartLoadingBar } from './SmartLoadingBar';

interface NPCManagerProps {
  bot: any;
  apiSettings: any;
  onClose: () => void;
  mainStoryContext?: string;
  currentScene?: string;
  currentArc?: string;
  longTermMemory?: string;
  botCharCore?: string;
}

type ViewState = 'list' | 'create' | 'edit' | 'profile' | 'chat';

export const CandyNPCManager: React.FC<NPCManagerProps> = ({ 
  bot, 
  apiSettings, 
  onClose,
  mainStoryContext = "",
  currentScene = "",
  currentArc = "",
  longTermMemory = "",
  botCharCore = ""
}) => {
  const [view, setView] = useState<ViewState>('list');
  const [npcs, setNpcs] = useState<NPCProfile[]>([]);
  const [selectedNpc, setSelectedNpc] = useState<NPCProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'related' | 'unrelated' | 'extra'>('all');
  
  // Create/Edit Form State
  const [npcForm, setNpcForm] = useState<Partial<NPCProfile>>({
    name: '',
    avatarUrl: '',
    relationType: 'friend',
    relationToBotChar: '',
    description: '',
    personalityNotes: '',
    chatBgUrl: '',
    profileBgUrl: '',
    extraInfo: {}
  });

  const [globalListBg, setGlobalListBg] = useState(bot.npcGlobalBackground || '');

  // Chat State
  const [messages, setMessages] = useState<NPCMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [generateStartTime, setGenerateStartTime] = useState(0);
  const [dynamicTarget, setDynamicTarget] = useState(12000);

  useEffect(() => {
    refreshNPCs();
    // Load background
    const loadBg = async () => {
      const botKey = `bot_${bot.id || bot.name}`;
      const savedBg = await loadGlobalBackground(botKey);
      if (savedBg) setGlobalListBg(savedBg);
    };
    loadBg();
  }, [bot.id]);

  const refreshNPCs = async () => {
    const list = await loadNPCProfiles(bot.id || bot.name);
    setNpcs(list);
  };

  const handleSaveNPC = async () => {
    if (!npcForm.name) return;
    
    const newNpc: NPCProfile = {
      id: npcForm.id || Date.now().toString(),
      botId: bot.id || bot.name,
      name: npcForm.name || 'NPC vô danh',
      avatarUrl: npcForm.avatarUrl || 'https://picsum.photos/seed/npc/200',
      relationType: npcForm.relationType as NPCRelationType,
      relationToBotChar: npcForm.relationToBotChar || '',
      description: npcForm.description || '',
      personalityNotes: npcForm.personalityNotes || '',
      chatBgUrl: npcForm.chatBgUrl || '',
      profileBgUrl: npcForm.profileBgUrl || '',
      extraInfo: npcForm.extraInfo || {},
      createdAt: npcForm.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    await saveNPCProfile(newNpc);
    await refreshNPCs();
    setView('list');
  };

  const handleDeleteNPC = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa NPC này?')) {
      await deleteNPCProfile(id);
      await refreshNPCs();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      setNpcForm(prev => ({ ...prev, avatarUrl: base64 }));
    }
  };

  const handleChatBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      setNpcForm(prev => ({ ...prev, chatBgUrl: base64 }));
    }
  };

  const handleProfileBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      setNpcForm(prev => ({ ...prev, profileBgUrl: base64 }));
    }
  };

  const handleGlobalListBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      setGlobalListBg(base64);
      
      // Persist to IndexedDB
      try {
        const botKey = `bot_${bot.id || bot.name}`;
        await saveGlobalBackground(botKey, base64);
        
        // Also try to patch the current bot object if possible
        if (bot) bot.npcGlobalBackground = base64;
      } catch (err) {
        console.error("Error saving global list bg:", err);
      }
    }
  };

  const startChat = async (npc: NPCProfile) => {
    setSelectedNpc(npc);
    const convos = await loadNPCConversations(npc.id);
    if (convos.length > 0) {
      // Find latest conversation or create new
      setMessages(convos[0].messages);
    } else {
      setMessages([]);
    }
    setView('chat');
  };

  const handleCallAPI = async (targetTurns: number = 200) => {
    if (!selectedNpc || isGenerating) return;

    setIsGenerating(true);
    setGenerateStartTime(Date.now());
    setTokenCount(0);
    // Set dynamic target based on request size
    // For 500+ turns, we push for maximum tokens allowed
    const currentTarget = targetTurns >= 1000 ? 25000 : (targetTurns >= 500 ? 19000 : 12000);
    setDynamicTarget(currentTarget);

    const prompt = `
### NPC SIDE CONVERSATION GENERATOR (MASSIVE EXTENDED MODE)

You are generating a massive side conversation (messaging style) between the main Bot Character and the selected NPC.
This is a private chat box in the story universe.

BOT CHARACTER CORE:
${botCharCore}

CURRENT MAIN STORY CONTEXT:
${mainStoryContext}

SELECTED NPC PROFILE:
${JSON.stringify(selectedNpc, null, 2)}

STRICT REQUIREMENTS FOR OUTPUT:
1. QUANTITY: YOU MUST GENERATE EXACTLY ${targetTurns} TURNS OR MORE. 
2. SCALE: This is a long-form interaction. Fill it with personality, banter, drama, or deep conversation.
3. FORMAT: Output ONLY a JSON array of message objects.
4. JSON SCHEMA: [{"sender": "bot_char"|"npc", "text": "...", "emotion": "..."}]

THINKING BUDGET: 0
MAX OUTPUT TOKENS: 64000
SYSTEM NOTE: YOU MUST OUTPUT THE COMPLETED LIST. IF THE LIST IS TOO LONG, STILL TRY TO FINISH IT.
`;

    try {
      const stream = sendMessageStream(apiSettings, [
        { role: 'system', content: prompt }
      ], "");

      let fullText = "";
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
          setTokenCount(Math.ceil(fullText.length / 3.5));
        }
      }

      // Try parsing JSON from the end of it
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
         try {
           const parsed = JSON.parse(jsonMatch[0]);
           const newMessages: NPCMessage[] = parsed.map((m: any, i: number) => ({
             id: `${Date.now()}_${i}`,
             npcId: selectedNpc.id,
             sender: m.sender,
             text: m.text,
             emotion: m.emotion,
             createdAt: Date.now()
           }));
           
           setMessages(prev => [...prev, ...newMessages]);
           
           // Save conversation
           const convo: NPCConversation = {
             id: selectedNpc.id + '_convo',
             npcId: selectedNpc.id,
             botId: bot.id || bot.name,
             title: `Chat with ${selectedNpc.name}`,
             messages: [...messages, ...newMessages],
             createdAt: Date.now(),
             updatedAt: Date.now()
           };
           await saveNPCConversation(convo);

         } catch (e) {
           console.error("JSON parse error:", e);
           alert("Lỗi parse JSON từ API. Vợ thử lại nha!");
         }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredNpcs = npcs.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'related') return matchesSearch && n.relationType === 'related';
    if (activeTab === 'unrelated') return matchesSearch && n.relationType === 'unrelated';
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[600] flex flex-col bg-[#FBF5F7] font-sans">
      <AnimatePresence mode="wait">
        {/* VIEW: LIST */}
        {view === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full relative"
          >
            {/* Background List Image */}
            {globalListBg && (
              <div 
                className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `url(${globalListBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-[#F9C6D4]">
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="p-2 bg-white rounded-2xl shadow-sm text-[#D93F82]">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => document.getElementById('global-list-bg')?.click()}
                  className="p-2 bg-white rounded-2xl shadow-sm text-[#8C748D] hover:text-[#F06AA3] active:scale-95 transition-all"
                  title="Chọn hình nền trưng bày"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input id="global-list-bg" type="file" className="hidden" accept="image/*" onChange={handleGlobalListBgUpload} />
              </div>
              <div className="text-center">
                <h1 className="text-lg font-black text-[#D93F82]">Quản lý NPC</h1>
                <p className="text-[10px] text-[#8C748D] uppercase tracking-wider">Nhân vật phụ & Trò chuyện</p>
              </div>
              <button 
                onClick={() => {
                  setNpcForm({ name: '', avatarUrl: '', relationType: 'friend', chatBgUrl: '', profileBgUrl: '' });
                  setView('create');
                }}
                className="p-2 bg-[#F06AA3] text-white rounded-2xl shadow-lg"
              >
                <Plus className="w-6 h-6" />
              </button>
            </header>

            {/* Search */}
            <div className="relative z-10 p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C748D]" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm NPC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#F4Cddd] rounded-3xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F06AA3]/20 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'related', label: 'Liên quan' },
                { id: 'unrelated', label: 'Không liên quan' },
                { id: 'extra', label: 'Nhân vật phụ' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id ? 'bg-[#F06AA3] text-white shadow-md' : 'bg-white text-[#8C748D] border border-[#F4Cddd]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* NPC List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
              {filteredNpcs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <User className="w-16 h-16 text-[#F06AA3] mb-4" />
                  <p className="text-sm font-bold text-[#8C748D]">Chưa có NPC nào đâu vợ ơi ~</p>
                </div>
              ) : (
                filteredNpcs.map(npc => (
                  <motion.div 
                    layout
                    key={npc.id}
                    className="bg-white/90 border border-[#F4Cddd] p-3 rounded-[28px] shadow-sm flex items-center gap-3 active:scale-95 transition-transform"
                    onClick={() => {
                      setSelectedNpc(npc);
                      setView('profile');
                    }}
                  >
                    <img 
                      src={npc.avatarUrl} 
                      alt={npc.name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#FFE5F0]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold text-[#2B1830]">{npc.name}</h3>
                      <p className="text-[10px] font-black text-[#D93F82] uppercase tracking-tighter">
                        {npc.relationToBotChar || npc.relationType}
                      </p>
                    </div>
                    <button className="p-2 text-[#8C748D] hover:text-[#F06AA3]">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Bottom Nav Simulation */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] bg-white/90 backdrop-blur-xl border border-[#F4Cddd] h-16 rounded-[32px] shadow-xl flex items-center justify-around px-8">
               <button className="text-[#F06AA3]"><Sparkles className="w-6 h-6" /></button>
               <button className="text-[#8C748D]"><Phone className="w-6 h-6 outline-none" /></button>
               <button className="text-[#8C748D]"><Edit2 className="w-6 h-6" /></button>
            </div>
          </motion.div>
        )}

        {/* VIEW: CREATE/EDIT */}
        {(view === 'create' || view === 'edit') && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col h-full bg-[#FFF7FB]"
          >
            <header className="p-4 flex items-center justify-between border-b border-[#F9C6D4] bg-white">
              <button onClick={() => setView('list')} className="p-2 bg-white rounded-2xl shadow-sm text-[#D93F82]">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-black text-[#D93F82]">{view === 'create' ? 'Tạo NPC Mới' : 'Sửa NPC'}</h1>
              <button onClick={handleSaveNPC} className="p-2 bg-[#F06AA3] text-white rounded-full shadow-lg">
                <Save className="w-6 h-6" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Avatar Picker */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <img 
                    src={npcForm.avatarUrl || 'https://picsum.photos/seed/npc/200'} 
                    alt="avatar" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => document.getElementById('npc-avatar')?.click()}
                    className="absolute bottom-1 right-1 p-3 bg-[#F06AA3] text-white rounded-full shadow-lg border-2 border-white"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input id="npc-avatar" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <p className="mt-3 text-[10px] font-black text-[#8C748D] uppercase tracking-widest">Ảnh đại diện công chúa</p>
              </div>

              {/* Background Picker (Chat) */}
              <div className="bg-white border border-[#F4Cddd] rounded-[28px] p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FBF5F7] rounded-xl flex items-center justify-center text-[#D93F82] border-2 border-[#FFE5F0] overflow-hidden">
                    {npcForm.chatBgUrl ? (
                      <img src={npcForm.chatBgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#2B1830] uppercase">Hình nền Chat</h4>
                    <p className="text-[9px] text-[#8C748D]">NPC này thích nhắn tin ở đâu?</p>
                  </div>
                </div>
                <button 
                  onClick={() => document.getElementById('chat-bg-upload')?.click()}
                  className="px-4 py-2 bg-[#F06AA3] text-white text-[10px] font-black rounded-xl shadow-md active:scale-95 transition-all"
                >
                  CHỌN
                </button>
                <input id="chat-bg-upload" type="file" className="hidden" accept="image/*" onChange={handleChatBgUpload} />
              </div>

              {/* Background Picker (Profile) */}
              <div className="bg-white border border-[#F4Cddd] rounded-[28px] p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FBF5F7] rounded-xl flex items-center justify-center text-[#D93F82] border-2 border-[#FFE5F0] overflow-hidden">
                    {npcForm.profileBgUrl ? (
                      <img src={npcForm.profileBgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#2B1830] uppercase">Hình nền Thẻ</h4>
                    <p className="text-[9px] text-[#8C748D]">Nền cho hồ sơ nhân vật</p>
                  </div>
                </div>
                <button 
                  onClick={() => document.getElementById('profile-bg-upload')?.click()}
                  className="px-4 py-2 bg-[#D93F82] text-white text-[10px] font-black rounded-xl shadow-md active:scale-95 transition-all"
                >
                  CHỌN
                </button>
                <input id="profile-bg-upload" type="file" className="hidden" accept="image/*" onChange={handleProfileBgUpload} />
              </div>

              {/* Preset Background Library */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#8C748D] uppercase tracking-widest ml-2">Thư viện hình nền Coquette</h4>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {[
                    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=200',
                    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200',
                    'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=200',
                    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=200',
                    'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200'
                  ].map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setNpcForm(prev => ({ ...prev, chatBgUrl: url }))}
                      className={`flex-shrink-0 w-16 h-16 rounded-2xl border-2 overflow-hidden transition-all ${
                        npcForm.chatBgUrl === url ? 'border-[#F06AA3] scale-105 shadow-md' : 'border-white'
                      }`}
                    >
                      <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                 <div>
                   <label className="text-xs font-black text-[#8C748D] uppercase ml-2 mb-1 block">Tên nhân vật</label>
                   <input 
                     type="text" 
                     value={npcForm.name || ''}
                     onChange={(e) => setNpcForm(prev => ({ ...prev, name: e.target.value }))}
                     placeholder="Nhập tên NPC..."
                     className="w-full bg-white border border-[#F4Cddd] rounded-[22px] p-4 text-sm focus:ring-2 focus:ring-[#F06AA3]/20 outline-none"
                   />
                 </div>

                 <div>
                   <label className="text-xs font-black text-[#8C748D] uppercase ml-2 mb-1 block">Quan hệ với Bot</label>
                   <select 
                     value={npcForm.relationType || 'friend'}
                     onChange={(e) => setNpcForm(prev => ({ ...prev, relationType: e.target.value as any }))}
                     className="w-full bg-white border border-[#F4Cddd] rounded-[22px] p-4 text-sm focus:ring-2 focus:ring-[#F06AA3]/20 outline-none appearance-none"
                   >
                     <option value="friend">Bạn bè</option>
                     <option value="related">Liên quan</option>
                     <option value="unrelated">Không liên quan</option>
                     <option value="rival">Đối thủ</option>
                     <option value="family">Gia đình</option>
                     <option value="classmate">Bạn học</option>
                     <option value="coworker">Đồng nghiệp</option>
                     <option value="neighbor">Hàng xóm</option>
                     <option value="secret_admirer">Người thầm lặng</option>
                     <option value="custom">Tùy chỉnh</option>
                   </select>
                 </div>

                 <div>
                   <label className="text-xs font-black text-[#8C748D] uppercase ml-2 mb-1 block">Mô tả quan hệ cụ thể</label>
                   <input 
                     type="text" 
                     value={npcForm.relationToBotChar || ''}
                     onChange={(e) => setNpcForm(prev => ({ ...prev, relationToBotChar: e.target.value }))}
                     placeholder="Vd: Chị gái cùng cha khác mẹ..."
                     className="w-full bg-white border border-[#F4Cddd] rounded-[22px] p-4 text-sm focus:ring-2 focus:ring-[#F06AA3]/20 outline-none"
                   />
                 </div>

                 <div>
                   <label className="text-xs font-black text-[#8C748D] uppercase ml-2 mb-1 block">Mô tả nhân vật</label>
                   <textarea 
                     value={npcForm.description || ''}
                     onChange={(e) => setNpcForm(prev => ({ ...prev, description: e.target.value }))}
                     placeholder="NPC này là ai? Có đặc điểm gì nổi bật?"
                     className="w-full bg-white border border-[#F4Cddd] rounded-[22px] p-4 text-sm focus:ring-2 focus:ring-[#F06AA3]/20 outline-none h-24 resize-none"
                   />
                 </div>

                 <div>
                   <label className="text-xs font-black text-[#8C748D] uppercase ml-2 mb-1 block">Ghi chú tính cách/Trí nhớ</label>
                   <textarea 
                     value={npcForm.personalityNotes || ''}
                     onChange={(e) => setNpcForm(prev => ({ ...prev, personalityNotes: e.target.value }))}
                     placeholder="Lạnh lùng, hay cười, thích kẹo mút..."
                     className="w-full bg-white border border-[#F4Cddd] rounded-[22px] p-4 text-sm focus:ring-2 focus:ring-[#F06AA3]/20 outline-none h-24 resize-none"
                   />
                 </div>
              </div>

              {view === 'edit' && (
                <button 
                  onClick={() => handleDeleteNPC(npcForm.id!)}
                  className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-[22px] border border-red-100 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" /> XÓA NPC
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW: PROFILE */}
        {view === 'profile' && selectedNpc && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col h-full bg-white relative overflow-hidden"
          >
            {/* Profile Background Image */}
            {selectedNpc.profileBgUrl && (
              <div 
                className="absolute inset-0 z-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `url(${selectedNpc.profileBgUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}

            {/* Minimal Header */}
            <div className="absolute top-4 left-4 right-4 z-50 flex justify-between">
              <div className="flex gap-2">
                <button onClick={() => setView('list')} className="p-2 bg-white/80 backdrop-blur rounded-2xl shadow-lg text-[#D93F82]">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => document.getElementById('quick-profile-bg')?.click()}
                  className="p-2 bg-white/80 backdrop-blur rounded-2xl shadow-lg text-[#8C748D] hover:text-[#F06AA3]"
                  title="Chọn hình nền thẻ"
                >
                  <ImageIcon className="w-6 h-6" />
                </button>
                <input 
                  id="quick-profile-bg" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedNpc) {
                      const base64 = await compressImage(file);
                      const updated = { ...selectedNpc, profileBgUrl: base64 };
                      setSelectedNpc(updated);
                      await saveNPCProfile(updated);
                      await refreshNPCs();
                    }
                  }} 
                />
              </div>
              <button 
                onClick={() => {
                  setNpcForm(selectedNpc);
                  setView('edit');
                }}
                className="p-2 bg-white/80 backdrop-blur rounded-2xl shadow-lg text-[#D93F82]"
              >
                <Edit2 className="w-6 h-6" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto relative z-10">
              <div className="h-[40vh] relative">
                <img 
                  src={selectedNpc.avatarUrl} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              </div>

              <div className="px-6 -mt-12 relative z-10 space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-[#2B1830]">{selectedNpc.name}</h2>
                  <div className="inline-block mt-2 px-4 py-1.5 bg-[#FFE5F0] rounded-full text-[#D93F82] text-xs font-black uppercase tracking-tighter">
                    {selectedNpc.relationToBotChar || selectedNpc.relationType}
                  </div>
                </div>

                <div className="bg-[#FBF5F7] p-5 rounded-[32px] border border-[#F4Cddd] space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-[#8C748D] uppercase tracking-widest mb-1 flex items-center gap-2">
                       <User className="w-3 h-3" /> THÔNG TIN CƠ BẢN
                    </h4>
                    <p className="text-sm text-[#2B1830] leading-relaxed">{selectedNpc.description || 'Chưa có mô tả...'}</p>
                  </div>
                  <div className="w-full h-px bg-[#F4Cddd]/50" />
                  <div>
                    <h4 className="text-[10px] font-black text-[#8C748D] uppercase tracking-widest mb-1 flex items-center gap-2">
                       <Sparkles className="w-3 h-3" /> ĐẶC ĐIỂM TÍNH CÁCH
                    </h4>
                    <p className="text-sm text-[#2B1830] leading-relaxed">{selectedNpc.personalityNotes || 'Chưa có ghi chú...'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 bg-white border-t border-[#F4Cddd]">
               <button 
                onClick={() => startChat(selectedNpc)}
                className="w-full py-4 bg-gradient-to-r from-[#F06AA3] to-[#E4478F] text-white font-black rounded-[28px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                 <MessageSquare className="w-5 h-5" /> BẮT ĐẦU TRÒ CHUYỆN
               </button>
            </div>
          </motion.div>
        )}

        {/* VIEW: CHAT */}
        {view === 'chat' && selectedNpc && (
          <motion.div 
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full bg-[#FFF7FB] relative overflow-hidden"
          >
            {/* Background Image Layer */}
            {selectedNpc.chatBgUrl && (
              <div 
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: `url(${selectedNpc.chatBgUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'saturate(0.5) contrast(0.8)'
                }}
              />
            )}

            {/* Chat Header */}
            <header className="flex items-center gap-3 p-4 bg-white/90 backdrop-blur-md border-b border-[#F4Cddd] sticky top-0 z-50">
               <button onClick={() => setView('profile')} className="p-2 text-[#D93F82]">
                 <ArrowLeft className="w-6 h-6" />
               </button>
               <div className="relative group" onClick={() => document.getElementById('chat-bg-quick')?.click()}>
                 <img 
                  src={selectedNpc.avatarUrl} 
                  alt="npc" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#FFE5F0] cursor-pointer hover:brightness-90 transition-all"
                 />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                    <Camera className="w-4 h-4 text-white drop-shadow-md" />
                 </div>
                 <input 
                  id="chat-bg-quick" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedNpc) {
                      const base64 = await compressImage(file);
                      const updated = { ...selectedNpc, chatBgUrl: base64 };
                      setSelectedNpc(updated);
                      await saveNPCProfile(updated);
                      await refreshNPCs();
                    }
                  }} 
                />
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="text-sm font-bold text-[#2B1830] truncate">{selectedNpc.name}</h3>
                 <p className="text-[9px] text-[#D93F82] font-bold uppercase tracking-tighter truncate">{selectedNpc.relationToBotChar || selectedNpc.relationType}</p>
               </div>
            </header>

            {/* Quick Action Buttons */}
            <div className="relative z-10 flex gap-2 px-4 py-2 bg-white/60 border-b border-[#F4Cddd] overflow-x-auto no-scrollbar backdrop-blur-sm">
               {[500, 1000, 1500].map(cnt => (
                 <button 
                  key={cnt}
                  onClick={() => handleCallAPI(cnt)}
                  disabled={isGenerating}
                  className="px-3 py-2 bg-white border border-[#F9C6D4] text-[#D93F82] text-[10px] font-black rounded-xl shadow-sm whitespace-nowrap active:scale-90 transition-all flex items-center gap-1"
                 >
                   <Phone className="w-3 h-3" /> {cnt} Lượt
                 </button>
               ))}
               <button 
                onClick={() => handleCallAPI(200)}
                disabled={isGenerating}
                className="px-3 py-2 bg-[#F06AA3] text-white text-[10px] font-black rounded-xl shadow-sm whitespace-nowrap active:scale-90 transition-all"
               >
                 Tạo 200 câu
               </button>
            </div>

            {/* Message List */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4">
               {messages.length === 0 && !isGenerating && (
                 <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-10">
                   <Phone className="w-16 h-16 mb-4 text-[#D93F82]" />
                   <p className="text-xs font-bold text-[#8C748D]">Bấm gọi API để tạo cuộc hội thoại bên lề giữa {bot.name} và {selectedNpc.name} nhé!</p>
                 </div>
               )}

               {messages.map((m) => (
                 <div key={m.id} className={`flex flex-col ${m.sender === 'bot_char' ? 'items-end' : 'items-start'}`}>
                   <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm text-sm ${
                     m.sender === 'bot_char' 
                      ? 'bg-gradient-to-br from-[#F06AA3] to-[#E4478F] text-white rounded-br-none' 
                      : 'bg-white border border-[#F4Cddd] text-[#2B1830] rounded-bl-none'
                   }`}>
                     {m.text}
                   </div>
                   <span className="text-[8px] text-[#8C748D] mt-1 px-1">
                     {m.sender === 'bot_char' ? bot.name : selectedNpc.name} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                 </div>
               ))}

               {isGenerating && (
                 <div className="fixed inset-0 z-[700] bg-white/40 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="w-full max-w-sm">
                      <SmartLoadingBar 
                        status={isGenerating ? 'working' : 'done'}
                        tokenCount={tokenCount}
                        targetTokens={dynamicTarget}
                        timeElapsed={Math.floor((Date.now() - generateStartTime) / 1000)}
                        speed={Math.round(tokenCount / (Math.max((Date.now() - generateStartTime) / 1000, 1)))}
                      />
                      <p className="text-center text-[10px] font-black text-[#D93F82] mt-4 uppercase animate-pulse tracking-widest">Đang truyền tải sóng não...</p>
                    </div>
                 </div>
               )}
            </div>

            {/* Mini Input for manual additions if needed */}
            <footer className="relative z-10 p-3 bg-white/90 backdrop-blur-md border-t border-[#F4Cddd]">
               <div className="flex items-center gap-2 bg-[#FFF0F6] p-2 rounded-2xl border border-[#F4Cddd]">
                  <button className="p-2 bg-[#FFE5F0] rounded-full text-[#D93F82]">🍬</button>
                  <input 
                    type="text" 
                    placeholder="Nhập tin nhắn..." 
                    className="flex-1 bg-transparent border-none outline-none text-xs text-[#2B1830]"
                    onFocus={() => alert('Vợ ơi, tính năng NPC Chat này ưu tiên AI tự sinh 200 lượt nha 💕')}
                  />
                  <button className="p-2 bg-[#F06AA3] text-white rounded-full">➤</button>
               </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const targetChatTokens = 12000;
