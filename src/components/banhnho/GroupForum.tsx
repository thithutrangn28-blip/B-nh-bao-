import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Heart, MessageCircle, Share2, ArrowLeft, Image as ImageIcon, Send, User, Check, Settings, Grid, Bookmark, MoreHorizontal, MoreVertical, Edit2, Trash2, Megaphone } from 'lucide-react';
import { sendMessageStream, ApiProxySettings } from '../../utils/apiProxy';
import { saveForumData, loadForumData } from '../../utils/db';

interface GroupForumProps {
  apiSettings: ApiProxySettings;
  setApiSettings: (settings: ApiProxySettings) => void;
  availableModels: string[];
  isFetchingModels: boolean;
  handleFetchModels: () => Promise<void>;
  saveApiSettings: () => void;
  savedProfiles: ApiProxySettings[];
  setSavedProfiles: (profiles: ApiProxySettings[]) => void;
  profileName: string;
  setProfileName: (name: string) => void;
  isProfileSaved: boolean;
  setIsProfileSaved: (saved: boolean) => void;
  isSettingsSaved: boolean;
  setIsSettingsSaved: (saved: boolean) => void;
  showToast: (msg: string) => void;
  onNavigateToTab?: (tabId: string) => void;
}

interface PostBatch {
  id: string;
  name: string; // e.g., "Đợt 1"
  timestamp: string;
  posts: any[];
  background?: string;
}

interface GroupData {
  id: string;
  name: string;
  coverImage: string;
  avatar: string;
  themeColor: string;
  topic: string;
  description: string;
  rules: string;
  npcRules: string;
  ownerInfo: any;
  introStyle?: 'style1' | 'style2';
  introContent?: string;
  bannerImage?: string;
  illustrationImage?: string;
  secondaryImage?: string;
  batches?: PostBatch[];
}

const npcAvatars = [
  'https://i.postimg.cc/K8YsjygV/8bf48946a8a6c1c7808055ae66638ecf.jpg',
  'https://i.postimg.cc/3NBnrLrY/7ceb610e6bcaa5ab56455bebd21c2ab2.jpg',
  'https://i.postimg.cc/85gHR8jG/31852e119a56c6c911b88e16288aa325.jpg',
  'https://i.postimg.cc/sgB9bfW7/987727d1717650d6e85c26a4842b8cd7.jpg',
  'https://i.postimg.cc/FzK3Ff5x/8ba1f29b574ce1427d5bea5da098b759.jpg',
  'https://i.postimg.cc/pdf8tmLd/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg',
  'https://i.postimg.cc/vTNxv932/dbbbd8f7f0ac3352569ea193d49b992f.jpg',
  'https://i.postimg.cc/j5qW0v1N/8e0f80bf499843f17a6d72cb04d43463.jpg',
  'https://picsum.photos/seed/avatar1/200',
  'https://picsum.photos/seed/avatar2/200',
  'https://picsum.photos/seed/avatar3/200',
  'https://picsum.photos/seed/avatar4/200',
  'https://picsum.photos/seed/avatar5/200',
  'https://picsum.photos/seed/avatar6/200',
  'https://picsum.photos/seed/avatar7/200',
  'https://picsum.photos/seed/avatar8/200',
  'https://picsum.photos/seed/avatar9/200',
  'https://picsum.photos/seed/avatar10/200',
  'https://picsum.photos/seed/avatar11/200',
  'https://picsum.photos/seed/avatar12/200',
  'https://picsum.photos/seed/avatar13/200',
  'https://picsum.photos/seed/avatar14/200',
  'https://picsum.photos/seed/avatar15/200',
  'https://picsum.photos/seed/avatar16/200',
  'https://picsum.photos/seed/avatar17/200',
  'https://picsum.photos/seed/avatar18/200',
  'https://picsum.photos/seed/avatar19/200',
  'https://picsum.photos/seed/avatar20/200',
];

function cleanRaw(text: string) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/^data:\s*/gm, "")
    .replace(/```json|```/g, "")
    .trim();
}

function extractByRegex(text: string) {
  const regex = /{\s*"author"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([\s\S]*?)"\s*}/g;
  const results: any[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    results.push({
      author: match[1],
      content: match[2]
    });
  }

  return results;
}

function safeParse(text: string) {
  const cleaned = cleanRaw(text);
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return extractByRegex(cleaned);
  }
}

const validatePosts = (parsed: any[]) => {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(p =>
    p && p.author && p.content && p.content.length > 50
  );
};

const robustParseJSON = (text: string) => {
  return safeParse(text);
};

const postImages = [
  'https://i.postimg.cc/K8YsjygV/8bf48946a8a6c1c7808055ae66638ecf.jpg',
  'https://i.postimg.cc/3NBnrLrY/7ceb610e6bcaa5ab56455bebd21c2ab2.jpg',
  'https://i.postimg.cc/85gHR8jG/31852e119a56c6c911b88e16288aa325.jpg',
  'https://i.postimg.cc/sgB9bfW7/987727d1717650d6e85c26a4842b8cd7.jpg',
  'https://i.postimg.cc/FzK3Ff5x/8ba1f29b574ce1427d5bea5da098b759.jpg',
  'https://i.postimg.cc/pdf8tmLd/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg',
  'https://i.postimg.cc/vTNxv932/dbbbd8f7f0ac3352569ea193d49b992f.jpg',
  'https://i.postimg.cc/j5qW0v1N/8e0f80bf499843f17a6d72cb04d43463.jpg'
];

const ImageWithFilter = ({ src, className, alt = "" }: { src: string, className?: string, alt?: string }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <img src={src} alt={alt} className="w-full h-full object-cover" style={{ filter: 'contrast(85%) saturate(70%)' }} referrerPolicy="no-referrer" />
    <div className="absolute inset-0 bg-pink-100/10 pointer-events-none mix-blend-overlay"></div>
  </div>
);

export default function GroupForum({ 
  apiSettings, 
  setApiSettings, 
  availableModels, 
  isFetchingModels, 
  handleFetchModels, 
  saveApiSettings,
  savedProfiles,
  setSavedProfiles,
  profileName,
  setProfileName,
  isProfileSaved,
  setIsProfileSaved,
  isSettingsSaved,
  setIsSettingsSaved,
  showToast,
  onNavigateToTab 
}: GroupForumProps) {
  const [view, setView] = useState<'intro' | 'create' | 'list' | 'group_intro' | 'group_detail' | 'npc_profile' | 'promote' | 'api_settings' | 'flower_creation'>(() => {
    return localStorage.getItem('banhnho_has_seen_intro') === 'true' ? 'list' : 'intro';
  });
  const [streamingText, setStreamingText] = useState('');
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [currentGroup, setCurrentGroup] = useState<GroupData | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<{name: string, avatar: string} | null>(null);
  const [npcProfilePosts, setNpcProfilePosts] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [promoteContent, setPromoteContent] = useState('');
  const [groupBatches, setGroupBatches] = useState<PostBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [creationBackground, setCreationBackground] = useState<string>('https://i.postimg.cc/K8YsjygV/8bf48946a8a6c1c7808055ae66638ecf.jpg');
  const [promoteHistory, setPromoteHistory] = useState<any[]>([]);
  
  // Create Form State
  const [openAccordion, setOpenAccordion] = useState<number | null>(1);
  const [formData, setFormData] = useState<Partial<GroupData>>({
    themeColor: '#FFC8D2'
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedGroups = await loadForumData('banhnho_groups');
        if (savedGroups) setGroups(savedGroups);
        else {
          const localGroups = localStorage.getItem('banhnho_groups');
          if (localGroups) {
            setGroups(JSON.parse(localGroups));
            localStorage.removeItem('banhnho_groups');
          }
        }

        const savedFormData = await loadForumData('banhnho_form_data');
        if (savedFormData) setFormData(savedFormData);
        else {
          const localFormData = localStorage.getItem('banhnho_form_data');
          if (localFormData) {
            setFormData(JSON.parse(localFormData));
            localStorage.removeItem('banhnho_form_data');
          }
        }

        const savedNewPost = await loadForumData('banhnho_new_post_content');
        if (savedNewPost) setNewPostContent(savedNewPost);
        else {
          const localNewPost = localStorage.getItem('banhnho_new_post_content');
          if (localNewPost) {
            setNewPostContent(localNewPost);
            localStorage.removeItem('banhnho_new_post_content');
          }
        }

        const savedPromoteContent = await loadForumData('banhnho_promote_content');
        if (savedPromoteContent) setPromoteContent(savedPromoteContent);
        else {
          const localPromoteContent = localStorage.getItem('banhnho_promote_content');
          if (localPromoteContent) {
            setPromoteContent(localPromoteContent);
            localStorage.removeItem('banhnho_promote_content');
          }
        }

        setIsDataLoaded(true);
      } catch (e) {
        console.error("Failed to load forum data", e);
        setIsDataLoaded(true);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    saveForumData('banhnho_groups', groups);
  }, [groups, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    saveForumData('banhnho_new_post_content', newPostContent);
  }, [newPostContent, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    saveForumData('banhnho_promote_content', promoteContent);
  }, [promoteContent, isDataLoaded]);

  // Load NPC profile posts when selectedNPC changes
  useEffect(() => {
    if (selectedNPC?.name) {
      const loadNpcPosts = async () => {
        try {
          const savedPosts = await loadForumData(`banhnho_npc_posts_${selectedNPC.name}`);
          if (savedPosts) {
            setNpcProfilePosts(savedPosts);
          } else {
            const localPosts = localStorage.getItem(`banhnho_npc_posts_${selectedNPC.name}`);
            if (localPosts) {
              setNpcProfilePosts(JSON.parse(localPosts));
              localStorage.removeItem(`banhnho_npc_posts_${selectedNPC.name}`);
            } else {
              setNpcProfilePosts([]);
            }
          }
        } catch (e) {
          setNpcProfilePosts([]);
        }
      };
      loadNpcPosts();
    } else {
      setNpcProfilePosts([]);
    }
  }, [selectedNPC?.name]);

  // Save NPC profile posts when they change
  useEffect(() => {
    if (selectedNPC?.name && npcProfilePosts.length > 0 && isDataLoaded) {
      try {
        saveForumData(`banhnho_npc_posts_${selectedNPC.name}`, npcProfilePosts);
      } catch (e) {
        console.warn("Failed to save NPC posts to IndexedDB", e);
      }
    }
  }, [npcProfilePosts, selectedNPC?.name, isDataLoaded]);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteImage, setPromoteImage] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // New states for Promote and Approve
  const [promoteTab, setPromoteTab] = useState<'promote' | 'approve'>('promote');
  const [promotePost, setPromotePost] = useState<any>(null);
  const [approvedMembers, setApprovedMembers] = useState<any[]>([]);
  const [isCreatingPromote, setIsCreatingPromote] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!isDataLoaded) return;
    saveForumData('banhnho_form_data', formData);
  }, [formData, isDataLoaded]);

  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [timer, setTimer] = useState(0);

  const loadingMessages = [
    'Đang nấu cơm cho cậu đây ,nhăm nhăm 🍚',
    'Uống trà hoặc ăn kẹo đi ,tớ đang làm cho cậu này 🍵🍬',
    'Úm ba la xì bùa ~ đợi xíu đang chuẩn bị ✨',
    'Em yêu ~ đợi anh nhé 💖',
    'Cậu rót cho tớ cốc nước tớ khát quá làm việc thật vất vả nhưng tớ thích nhìn cậu vui ^^ 💧'
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsg(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        setTimer(prev => prev + 1);
      }, 3000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleImageUpload = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderIntro = () => (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div className="bg-[#FFC8D2] p-8 rounded-3xl shadow-[0_0_20px_rgba(255,200,210,0.6)] max-w-md w-full text-center relative overflow-hidden border-2 border-white/50">
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 pointer-events-none"></div>
        <div className="text-white font-mono whitespace-pre text-sm mb-4">
{`⧣₊˚﹒✦₊  ⧣₊˚  𓂃★    ⸝⸝ ⧣₊˚﹒✦₊  ⧣₊˚
      /)    /)
    (｡•ㅅ•｡)〝₎₎ Intro template! ✦₊ ˊ˗ 
. .╭∪─∪────────── ✦ ⁺.`}
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-[#8A7D85] text-left shadow-inner">
          <p className="mb-4">
            <span className="font-bold text-[#F3B4C2]">┊ ◟Xin chào cậu nhen</span> chào mừng đến với Hội nhóm nơi đây cậu sẽ thoả thích được vào với nhóm mà cậu yêu thích chủ đề mà cậu thích để bàn luận với mọi người.
          </p>
          <p className="font-bold mb-2">1/ Cho phép cậu tạo nhóm không giới hạn</p>
          <p className="mb-6">Trước tiên để tớ gợi ý cho cậu trước nhé.</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                localStorage.setItem('banhnho_has_seen_intro', 'true');
                setFormData({ themeColor: '#FFC8D2' });
                setView('create');
              }}
              className="w-full py-3 bg-[#F3B4C2] text-white rounded-xl font-bold shadow-md hover:bg-[#F9C6D4] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Bắt đầu tạo nhóm
            </button>
            <button 
              onClick={() => {
                localStorage.setItem('banhnho_has_seen_intro', 'true');
                setView('list');
              }}
              className="w-full py-3 bg-white text-[#F3B4C2] rounded-xl font-bold shadow-sm border border-[#F9C6D4] hover:bg-[#FFF0F5] transition-all"
            >
              Bỏ qua (Đã biết)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreateForm = () => {
    return (
      <div className="max-w-3xl mx-auto p-4 h-full flex flex-col overflow-y-auto scrollbar-hide pb-24 relative z-10">
        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 rounded-b-2xl px-2">
          <button onClick={() => setView('list')} className="p-2 bg-white rounded-full shadow-sm text-[#F3B4C2] hover:bg-[#FFF0F5] transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-[#8A7D85]">{formData.id ? "Chỉnh sửa Hội Nhóm" : "Tạo Hội Nhóm Mới"}</h2>
        </div>

        {/* ASCII Art Header */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 mb-8 text-center border border-[#FFD1DC] shadow-sm">
          <pre className="font-mono text-[#F3B4C2] text-sm whitespace-pre-wrap leading-relaxed font-bold">
{`⧣₊˚﹒✦₊  ⧣₊˚  𓂃★    ⸝⸝ ⧣₊˚﹒✦₊  ⧣₊˚
      /)    /)
    (｡•ㅅ•｡)〝₎₎ Intro template! ✦₊ ˊ˗ 
. .╭∪─∪────────── ✦ ⁺.
. .┊ ◟ Chào mừng cậu đến với không gian sáng tạo
. .┊﹒𐐪 Hãy điền các thông tin bên dưới
. .┊ꜝꜝ﹒ Để xây dựng một hội nhóm thật tuyệt vời nhé!
. .┊ ⨳゛ Cùng nhau tạo ra những kỷ niệm đẹp
. .┊ ◟ヾ Thỏa sức đam mê và chia sẻ
. .┊﹒𐐪 Tớ luôn ở đây hỗ trợ cậu
. .┊ ◟﹫ Bắt đầu thôi nào!
   ╰─────────────  ✦ ⁺.
⧣₊˚﹒✦₊  ⧣₊˚  𓂃★    ⸝⸝ ⧣₊˚﹒✦₊  ⧣₊˚`}
          </pre>
        </div>

        <div className="space-y-6">
          {/* Section 1: Group Info */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-[#FFD1DC]">
            <h3 className="text-lg font-bold text-[#8A7D85] mb-4 flex items-center gap-2">
              <span className="text-[#F3B4C2]">✿</span> Thông tin Hội Nhóm
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#8A7D85] mb-2">Tên hội nhóm</label>
                <input type="text" value={formData.name || ''} placeholder="Nhập tên hội nhóm thật kêu nhé..." className="w-full p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm" onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-[#8A7D85] mb-2">Ảnh Bìa</label>
                  <div className="relative w-full h-32 bg-white rounded-2xl border-2 border-dashed border-[#FFD1DC] flex items-center justify-center overflow-hidden hover:bg-[#FFF5F7] transition-colors cursor-pointer" onClick={() => document.getElementById('cover-upload')?.click()}>
                    {formData.coverImage ? (
                      <img src={formData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                      <div className="text-center text-[#F3B4C2]"><ImageIcon className="mx-auto mb-1" size={24} /><span className="text-xs font-bold">Tải ảnh lên</span></div>
                    )}
                    <input id="cover-upload" type="file" accept="image/*" onChange={handleImageUpload('coverImage')} className="hidden" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-[#8A7D85] mb-2">Avatar Nhóm</label>
                  <div className="relative w-full h-32 bg-white rounded-2xl border-2 border-dashed border-[#FFD1DC] flex items-center justify-center overflow-hidden hover:bg-[#FFF5F7] transition-colors cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                    {formData.avatar ? (
                      <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <div className="text-center text-[#F3B4C2]"><ImageIcon className="mx-auto mb-1" size={24} /><span className="text-xs font-bold">Tải ảnh lên</span></div>
                    )}
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageUpload('avatar')} className="hidden" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Topic & Rules */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-[#FFD1DC]">
            <h3 className="text-lg font-bold text-[#8A7D85] mb-4 flex items-center gap-2">
              <span className="text-[#F3B4C2]">✿</span> Chủ đề & Hoạt động
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#8A7D85] mb-2">Chủ đề bàn luận</label>
                <textarea value={formData.topic || ''} placeholder="Nhóm hoạt động chủ yếu những nội dung gì?..." className="w-full h-24 p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm resize-none" onChange={e => setFormData({...formData, topic: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#8A7D85] mb-2">Cách thức hoạt động & Giới thiệu</label>
                <textarea value={formData.description || ''} placeholder="Ví dụ: Đây là nhóm giúp bạn yêu thương bản thân..." className="w-full h-32 p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm resize-none" onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#8A7D85] mb-2">Nội quy nhóm</label>
                <textarea value={formData.rules || ''} placeholder="Viết nội quy của bạn vào nhé..." className="w-full h-24 p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm resize-none" onChange={e => setFormData({...formData, rules: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#8A7D85] mb-2">Quy tắc đăng bài cho NPC</label>
                <textarea value={formData.npcRules || ''} placeholder="- Mỗi bài đăng ít nhất bao nhiêu ký tự...&#10;- Gắn hashtag gì...&#10;- Chủ đề bắt buộc..." className="w-full h-24 p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm resize-none" onChange={e => setFormData({...formData, npcRules: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Section 3: Owner Info */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-[#FFD1DC]">
            <h3 className="text-lg font-bold text-[#8A7D85] mb-4 flex items-center gap-2">
              <span className="text-[#F3B4C2]">✿</span> Giới thiệu Chủ Nhóm
            </h3>
            <div className="space-y-4">
              <input type="text" value={formData.ownerInfo?.name || ''} onChange={e => setFormData({...formData, ownerInfo: {...(formData.ownerInfo || {}), name: e.target.value}})} placeholder="Tên của bạn" className="w-full p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm" />
              <div className="flex gap-4">
                <input type="text" value={formData.ownerInfo?.age || ''} onChange={e => setFormData({...formData, ownerInfo: {...(formData.ownerInfo || {}), age: e.target.value}})} placeholder="Tuổi" className="w-1/2 p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm" />
                <input type="text" value={formData.ownerInfo?.zodiac || ''} onChange={e => setFormData({...formData, ownerInfo: {...(formData.ownerInfo || {}), zodiac: e.target.value}})} placeholder="MBTI / Cung Hoàng Đạo" className="w-1/2 p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm" />
              </div>
              <input type="text" value={formData.ownerInfo?.job || ''} onChange={e => setFormData({...formData, ownerInfo: {...(formData.ownerInfo || {}), job: e.target.value}})} placeholder="Ngành nghề" className="w-full p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm" />
              <input type="text" value={formData.ownerInfo?.hobbies || ''} onChange={e => setFormData({...formData, ownerInfo: {...(formData.ownerInfo || {}), hobbies: e.target.value}})} placeholder="Sở thích" className="w-full p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm" />
              <textarea value={formData.ownerInfo?.about || ''} onChange={e => setFormData({...formData, ownerInfo: {...(formData.ownerInfo || {}), about: e.target.value}})} placeholder="About me..." className="w-full h-24 p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm resize-none" />
              <input type="text" value={formData.ownerInfo?.socials || ''} onChange={e => setFormData({...formData, ownerInfo: {...(formData.ownerInfo || {}), socials: e.target.value}})} placeholder="Tài khoản mạng xã hội" className="w-full p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm" />
              
              <div className="pt-4">
                <label className="block text-sm font-bold text-[#8A7D85] mb-2">Bài đăng ra mắt</label>
                <textarea value={formData.ownerInfo?.firstPost || ''} onChange={e => setFormData({...formData, ownerInfo: {...(formData.ownerInfo || {}), firstPost: e.target.value}})} placeholder="Viết bài đăng đầu tiên để NPC đọc và biết đến chủ nhóm..." className="w-full h-32 p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm resize-none" />
              </div>
            </div>
          </div>

          {/* Section 4: Intro Card Design */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-[#FFD1DC]">
            <h3 className="text-lg font-bold text-[#8A7D85] mb-4 flex items-center gap-2">
              <span className="text-[#F3B4C2]">✿</span> Thiết kế Thẻ Giới Thiệu
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#8A7D85] mb-2">Phong cách thẻ</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="introStyle" value="style1" checked={formData.introStyle !== 'style2'} onChange={() => setFormData({...formData, introStyle: 'style1'})} className="hidden" />
                    <div className={`p-3 rounded-2xl text-center border-2 transition-colors ${formData.introStyle !== 'style2' ? 'border-[#F3B4C2] bg-white text-[#F3B4C2] font-bold' : 'border-transparent bg-white/50 text-[#8A7D85]'}`}>
                      Style 1: Kẹo Ngọt
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="introStyle" value="style2" checked={formData.introStyle === 'style2'} onChange={() => setFormData({...formData, introStyle: 'style2'})} className="hidden" />
                    <div className={`p-3 rounded-2xl text-center border-2 transition-colors ${formData.introStyle === 'style2' ? 'border-[#8A7D85] bg-white text-[#8A7D85] font-bold' : 'border-transparent bg-white/50 text-[#8A7D85]'}`}>
                      Style 2: Ballet Dream
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#8A7D85] mb-2">Nội dung thẻ giới thiệu</label>
                <textarea 
                  value={formData.introContent || defaultIntroContent} 
                  onChange={e => setFormData({...formData, introContent: e.target.value})} 
                  placeholder="Viết lời chào mừng..." 
                  className="w-full h-48 p-4 rounded-2xl border-none bg-white focus:ring-2 focus:ring-[#F3B4C2] text-[#8A7D85] shadow-sm resize-none font-mono text-xs" 
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-[#8A7D85] mb-2">Ảnh Banner</label>
                  <div className="relative w-full h-24 bg-white rounded-2xl border-2 border-dashed border-[#FFD1DC] flex items-center justify-center overflow-hidden hover:bg-[#FFF5F7] cursor-pointer" onClick={() => document.getElementById('banner-upload')?.click()}>
                    {formData.bannerImage ? <img src={formData.bannerImage} className="w-full h-full object-cover" /> : <span className="text-xs text-[#F3B4C2]">Tải ảnh</span>}
                    <input id="banner-upload" type="file" accept="image/*" onChange={handleImageUpload('bannerImage')} className="hidden" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-[#8A7D85] mb-2">Ảnh Minh Họa</label>
                  <div className="relative w-full h-24 bg-white rounded-2xl border-2 border-dashed border-[#FFD1DC] flex items-center justify-center overflow-hidden hover:bg-[#FFF5F7] cursor-pointer" onClick={() => document.getElementById('ill-upload')?.click()}>
                    {formData.illustrationImage ? <img src={formData.illustrationImage} className="w-full h-full object-cover" /> : <span className="text-xs text-[#F3B4C2]">Tải ảnh</span>}
                    <input id="ill-upload" type="file" accept="image/*" onChange={handleImageUpload('illustrationImage')} className="hidden" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-[#8A7D85] mb-2">Ảnh Phụ</label>
                  <div className="relative w-full h-24 bg-white rounded-2xl border-2 border-dashed border-[#FFD1DC] flex items-center justify-center overflow-hidden hover:bg-[#FFF5F7] cursor-pointer" onClick={() => document.getElementById('sec-upload')?.click()}>
                    {formData.secondaryImage ? <img src={formData.secondaryImage} className="w-full h-full object-cover" /> : <span className="text-xs text-[#F3B4C2]">Tải ảnh</span>}
                    <input id="sec-upload" type="file" accept="image/*" onChange={handleImageUpload('secondaryImage')} className="hidden" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => {
                if (formData.id) {
                  // Edit existing group
                  const updatedGroups = groups.map(g => g.id === formData.id ? formData as GroupData : g);
                  setGroups(updatedGroups);
                  setCurrentGroup(formData as GroupData);
                  setView('group_detail');
                } else {
                  // Create new group
                  const newGroup = { ...formData, id: Date.now().toString(), posts: [] } as GroupData;
                  setGroups([...groups, newGroup]);
                  setCurrentGroup(newGroup);
                  setView('group_detail');
                }
              }}
              className="flex-1 py-4 bg-[#F3B4C2] text-white rounded-2xl font-bold shadow-lg hover:bg-[#F9C6D4] transition-all text-lg flex items-center justify-center gap-2"
            >
              <Check size={24} /> {formData.id ? "Cập nhật Nhóm" : "Hoàn tất & Lưu Nhóm"}
            </button>
            <button 
              onClick={() => setShowPromoteModal(true)}
              className="px-6 py-4 bg-white text-[#F3B4C2] rounded-2xl font-bold border-2 border-[#F3B4C2] hover:bg-[#FFF0F5] transition-colors shadow-sm flex items-center gap-2"
            >
              <Megaphone size={20} /> Quảng bá
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Load persistent data for current group
  useEffect(() => {
    if (currentGroup?.id) {
      const loadGroupData = async () => {
        try {
          const savedBatches = await loadForumData(`banhnho_batches_${currentGroup.id}`);
          if (savedBatches) {
            setGroupBatches(savedBatches);
            if (savedBatches.length > 0) {
              setSelectedBatchId(savedBatches[0].id);
            } else {
              setSelectedBatchId(null);
            }
          } else {
            setGroupBatches([]);
            setSelectedBatchId(null);
          }
          
          const savedPromote = await loadForumData(`banhnho_promote_${currentGroup.id}`);
          if (savedPromote) setPromotePost(savedPromote);
          else {
            const localPromote = localStorage.getItem(`banhnho_promote_${currentGroup.id}`);
            if (localPromote) {
              setPromotePost(JSON.parse(localPromote));
              localStorage.removeItem(`banhnho_promote_${currentGroup.id}`);
            } else {
              setPromotePost(null);
            }
          }
          
          const savedApproved = await loadForumData(`banhnho_approved_${currentGroup.id}`);
          if (savedApproved) setApprovedMembers(savedApproved);
          else {
            const localApproved = localStorage.getItem(`banhnho_approved_${currentGroup.id}`);
            if (localApproved) {
              setApprovedMembers(JSON.parse(localApproved));
              localStorage.removeItem(`banhnho_approved_${currentGroup.id}`);
            } else {
              setApprovedMembers([]);
            }
          }

          const savedHistory = await loadForumData(`banhnho_promote_history_${currentGroup.id}`);
          if (savedHistory) setPromoteHistory(savedHistory);
          else {
            const localHistory = localStorage.getItem(`banhnho_promote_history_${currentGroup.id}`);
            if (localHistory) {
              setPromoteHistory(JSON.parse(localHistory));
              localStorage.removeItem(`banhnho_promote_history_${currentGroup.id}`);
            } else {
              setPromoteHistory([]);
            }
          }
        } catch (e) {
          setGroupBatches([]);
          setPromotePost(null);
          setApprovedMembers([]);
          setPromoteHistory([]);
        }
      };
      loadGroupData();
    } else {
      setGroupBatches([]);
      setPromotePost(null);
      setApprovedMembers([]);
      setPromoteHistory([]);
    }
    setPromoteTab('promote');
    setIsCreatingPromote(false);
    setSelectedHistoryId(null);
  }, [currentGroup?.id]);

  // Save persistent data when it changes
  useEffect(() => {
    if (currentGroup?.id && isDataLoaded) {
      try {
        saveForumData(`banhnho_batches_${currentGroup.id}`, groupBatches);
        saveForumData(`banhnho_promote_${currentGroup.id}`, promotePost);
        saveForumData(`banhnho_approved_${currentGroup.id}`, approvedMembers);
        saveForumData(`banhnho_promote_history_${currentGroup.id}`, promoteHistory);
      } catch (e) {
        console.warn("Failed to save data to IndexedDB", e);
      }
    }
  }, [groupBatches, promotePost, approvedMembers, promoteHistory, currentGroup?.id, isDataLoaded]);

  const [groupPosts, setGroupPosts] = useState<any[]>([]);
  
  // Update groupPosts based on selected batch
  useEffect(() => {
    if (selectedBatchId) {
      const batch = groupBatches.find(b => b.id === selectedBatchId);
      if (batch) {
        setGroupPosts(batch.posts);
      } else {
        setGroupPosts([]);
      }
    } else {
      // If no batch selected, show all posts from all batches
      const allPosts = groupBatches.flatMap(b => b.posts);
      setGroupPosts(allPosts);
    }
  }, [selectedBatchId, groupBatches]);

  const generateGroupPosts = async () => {
    if (!currentGroup) return;
    setIsLoading(true);
    setLoadingMsg('Đang tạo 20 bài đăng diễn đàn...');
    
    try {
      const prompt = `Trả về CHÍNH XÁC 20 bài viết dưới dạng JSON array cho nhóm "${currentGroup.name}".
      Chủ đề: ${currentGroup.topic}. 
      Quy tắc nhóm: ${currentGroup.rules}.
      Quy tắc NPC: ${currentGroup.npcRules}.

      Mỗi phần tử:
      {
        "author": "...",
        "content": "..."
      }

      Yêu cầu:
      - Nội dung mỗi bài tối thiểu 1200 ký tự
      - Không markdown
      - Không giải thích
      - Không text ngoài JSON

      Chỉ trả về JSON duy nhất:

      [
        {...},
        {...}
      ]

      Nếu không đủ 20 bài → vẫn phải tạo đủ.

      KHÔNG được:
      - trả về code
      - trả về text ngoài JSON
      - trả về markdown`;

      const stream = sendMessageStream(apiSettings, [{ role: 'user', content: prompt }], "Bạn là hệ thống tạo nội dung diễn đàn chuyên nghiệp. CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ.");
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
      }

      const parsed = safeParse(fullText);
      const validPosts = validatePosts(parsed);

      if (validPosts.length > 0) {
        const newPosts = validPosts.map((p: any, i: number) => {
          return {
            id: Date.now().toString() + '_' + i + '_' + Math.random().toString(36).substr(2, 9),
            author: p.author || `Thành viên_${i}`,
            avatar: npcAvatars[i % npcAvatars.length],
            content: p.content,
            image: Math.random() > 0.6 ? postImages[Math.floor(Math.random() * postImages.length)] : null,
            likes: Math.floor(Math.random() * 200) + 50,
            comments: []
          };
        });

        const newBatch: PostBatch = {
          id: Date.now().toString(),
          name: `Đợt ${groupBatches.length + 1}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          posts: newPosts,
          background: creationBackground
        };

        setGroupBatches(prev => [newBatch, ...prev]);
        setSelectedBatchId(newBatch.id);
        showToast(`Đã tạo thành công đợt bài đăng mới với ${newPosts.length} bài!`);
      } else {
        showToast("Không thể tạo bài đăng. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      showToast("Lỗi khi kết nối API. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateNPCPrompt = async () => {
    setIsLoading(true);
    setLoadingMsg('Đang tạo bài đăng NPC...');
    
    try {
      const prompt = `Hãy tạo 10 bài đăng cho nhóm "${currentGroup?.name}". 
      Chủ đề: ${currentGroup?.topic}. 
      Quy tắc NPC: ${currentGroup?.npcRules}.
      Yêu cầu: Mỗi bài viết phải dài khoảng 1000 ký tự, thể hiện rõ tính cách của NPC như một bài chia sẻ tâm huyết.
      Trả về định dạng JSON array: [{"author": "Tên", "content": "Nội dung bài viết"}].
      KHÔNG GIẢI THÍCH, CHỈ TRẢ VỀ JSON.`;

      const stream = sendMessageStream(apiSettings, [{ role: 'user', content: prompt }], "Bạn là hệ thống tạo nội dung NPC cho hội nhóm. CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ.");
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
      }

      const parsed = safeParse(fullText);
      const validPosts = validatePosts(parsed);

      if (validPosts.length > 0) {
        const newPosts = validPosts.map((p: any, i: number) => ({
          id: (Date.now() + i).toString() + '_npc_' + Math.random().toString(36).substr(2, 5),
          author: p.author || `NPC_${i}`,
          avatar: npcAvatars[i % npcAvatars.length],
          content: p.content,
          image: Math.random() > 0.6 ? postImages[Math.floor(Math.random() * postImages.length)] : null,
          likes: Math.floor(Math.random() * 150) + 20,
          comments: []
        }));
        setGroupPosts(prev => [...newPosts, ...prev]);
        showToast(`Đã tạo thêm ${newPosts.length} bài đăng NPC!`);
      } else {
        showToast("Không thể tạo bài đăng NPC. Vui lòng thử lại.");
      }

    } catch (error) {
      console.error(error);
      showToast("Lỗi khi tạo bài đăng NPC.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateComments = async (postId: string) => {
    setIsLoading(true);
    setLoadingMsg('Đang tạo bình luận tương tác...');
    
    try {
      const prompt = `Hãy tạo 20 bình luận tương tác cho bài viết trong nhóm "${currentGroup?.name}".
      Các NPC phải tương tác qua lại, đúng chủ đề, không trùng lặp, thể hiện rõ tính cách.
      Trả về JSON array: [{"author": "Tên", "content": "Nội dung"}]. CHỈ JSON.`;

      const stream = sendMessageStream(apiSettings, [{ role: 'user', content: prompt }], "Bạn là hệ thống tạo bình luận NPC chuyên nghiệp. CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ.");
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
      }

      const parsed = safeParse(fullText);
      const validComments = validatePosts(parsed);

      if (validComments.length > 0) {
        const newComments = validComments.map((c: any, i: number) => ({
          id: (Date.now() + i).toString() + '_comment_' + Math.random().toString(36).substr(2, 5),
          author: c.author || `NPC_${i}`,
          avatar: npcAvatars[i % npcAvatars.length],
          content: c.content
        }));
        
        setGroupPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...newComments, ...p.comments] } : p));
        showToast(`Đã tạo ${newComments.length} bình luận mới!`);
      } else {
        showToast("Không thể tạo bình luận. Vui lòng thử lại.");
      }

    } catch (error) {
      console.error(error);
      showToast("Lỗi khi tạo bình luận.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeComment = async (postId: string, comment: any) => {
    if (likedComments.has(comment.id)) return;
    
    // Optimistically mark as liked
    setLikedComments(prev => new Set(prev).add(comment.id));
    setIsLoading(true);
    setLoadingMsg('Đang tạo phản hồi từ NPC...');
    
    try {
      const prompt = `Người dùng vừa thả tim bài đăng của "${comment.author}". 
      Hãy tạo ra 15 bình luận từ các NPC khác nhau tương tác với bài đăng này.
      Bài đăng: "${comment.content}"
      Chủ đề nhóm: ${currentGroup?.topic}.
      Yêu cầu:
      - Các NPC phải trả lời liên quan, tương tác với nhau, hợp chủ đề và đúng với nội dung bài đăng.
      - Không trả lời trùng lặp, không thiếu NPC, không lặp lại câu trả lời.
      - Trả về định dạng JSON array: [{"author": "Tên NPC", "content": "Nội dung bình luận"}].
      KHÔNG GIẢI THÍCH, CHỈ TRẢ VỀ JSON.`;

      const stream = sendMessageStream(apiSettings, [{ role: 'user', content: prompt }], "Bạn là hệ thống tạo bình luận NPC chuyên nghiệp. CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ.");
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
      }

      const parsed = safeParse(fullText);
      const validComments = validatePosts(parsed);

      if (validComments.length > 0) {
        const massiveComments = [];
        for (let i = 0; i < 30; i++) {
          const baseComment = validComments[i % validComments.length];
          massiveComments.push({
            id: Date.now().toString() + '_like_' + i + '_' + Math.random().toString(36).substr(2, 5),
            author: baseComment.author || `NPC_${Math.floor(Math.random() * 10000)}`,
            avatar: npcAvatars[i % npcAvatars.length],
            content: baseComment.content
          });
        }
        
        setGroupPosts(prev => prev.map(p => p.id === postId ? { 
          ...p, 
          likes: p.likes + 1,
          comments: [...(p.comments || []), ...massiveComments]
        } : p));
        showToast(`Đã tạo ${massiveComments.length} bình luận tương tác!`);
      } else {
        showToast("Không thể tạo bình luận tương tác. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBunnyComment = async (postId: string, post: any) => {
    setIsLoading(true);
    setLoadingMsg('Đang gọi 500 NPC vào bình luận...');
    setStreamingText('');
    
    try {
      const prompt = `Hãy tạo ra 50 bình luận từ các NPC khác nhau tương tác với bài đăng này.
      Bài đăng: "${post.content}"
      Chủ đề nhóm: ${currentGroup?.topic}.
      Yêu cầu ĐẶC BIỆT về tính cách NPC:
      - Mỗi NPC phải có một cá tính riêng biệt: vui vẻ, nhí nhảnh, nghiêm túc, hời hợt, sâu sắc, hoặc tò mò.
      - Thay vì chỉ nói "tớ xin vào nhóm", họ phải giải thích lý do thực sự muốn tham gia (ví dụ: vì đam mê chủ đề này, vì thấy nhóm dễ thương, vì muốn tìm bạn đồng hành, v.v.).
      - Độ dài bình luận phải đa dạng: có người viết rất dài và tâm huyết, có người chỉ viết vài chữ ngắn gọn.
      - Các NPC phải tương tác qua lại với nhau (reply bình luận của nhau).
      - Trả về định dạng JSON array: [{"author": "Tên NPC", "content": "Nội dung bình luận"}].
      KHÔNG GIẢI THÍCH, CHỈ TRẢ VỀ JSON.`;

      const stream = sendMessageStream(apiSettings, [{ role: 'user', content: prompt }], "Bạn là hệ thống tạo bình luận NPC đa dạng tính cách.");
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
      }

      const parsed = safeParse(fullText);
      const validComments = validatePosts(parsed);
      
      if (validComments.length > 0) {
        const massiveComments = [];
        // Duplicate to 500 comments as requested
        for (let i = 0; i < 500; i++) {
          const baseComment = validComments[i % validComments.length];
          massiveComments.push({
            id: Date.now().toString() + '_bunny_' + i,
            author: baseComment.author || `NPC_${Math.floor(Math.random() * 10000)}`,
            avatar: npcAvatars[i % npcAvatars.length],
            content: baseComment.content
          });
        }
        
        const newRound = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString(),
          count: massiveComments.length,
          comments: massiveComments
        };

        setGroupPosts(prev => prev.map(p => p.id === postId ? { 
          ...p, 
          comments: [...(p.comments || []), ...massiveComments],
          bunnyRounds: [...(p.bunnyRounds || []), newRound]
        } : p));
        
        showToast(`Đã gọi thành công ${massiveComments.length} NPC vào bình luận!`);
      } else {
        throw new Error("No valid comments found");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultIntroContent = `⧣₊˚﹒✦₊  ⧣₊˚  𓂃★    ⸝⸝ ⧣₊˚﹒✦₊  ⧣₊˚
      /)    /)
    (｡•ㅅ•｡)〝₎₎ Intro template! ✦₊ ˊ˗ 
. .╭∪─∪────────── ✦ ⁺.
. .┊ ◟Xin chào cậu nhen chào mừng đến với 
. .┊ {name}
. .┊ Nơi đây cậu sẽ thoả thích được vào với nhóm mà cậu yêu thích chủ đề {topic}
. .┊ 
. .┊ Quy tắc nhóm:
. .┊ 1. Tôn trọng mọi người
. .┊ 2. Không spam
. .┊ 3. Vui vẻ là chính!
. .╰───────────── ✦ ⁺.`;

  const renderGroupIntro = () => {
    if (!currentGroup) return null;
    const style = currentGroup.introStyle || 'style1';

    let displayContent = currentGroup.introContent || defaultIntroContent;
    displayContent = displayContent.replace('{name}', currentGroup.name || 'Hội nhóm').replace('{topic}', currentGroup.topic || 'này');

    if (style === 'style1') {
      return (
        <div className="min-h-full bg-white/40 backdrop-blur-sm p-4 relative overflow-y-auto pb-24 flex items-center justify-center">
          <div className="w-full max-w-md bg-[#FFC8D2] rounded-[30px] p-6 shadow-[0_0_20px_rgba(255,200,210,0.8)] relative z-10 border-2 border-white/50 text-white animate-in zoom-in-95 duration-500 max-h-[80vh] flex flex-col">
            <div className="text-center whitespace-pre-wrap font-mono text-sm leading-relaxed overflow-y-auto scrollbar-hide flex-1">
              {displayContent}
            </div>
            
            <div className="mt-8 flex justify-center shrink-0">
              <button 
                onClick={() => setView('group_detail')}
                className="px-8 py-3 bg-white text-[#FFC8D2] rounded-full font-bold shadow-md hover:bg-gray-50 transition-transform hover:scale-105 active:scale-95"
              >
                Vào nhóm ngay!
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      // Style 2: Ballet Dream
      return (
        <div className="min-h-full bg-white/40 backdrop-blur-sm p-4 relative overflow-y-auto pb-24 font-serif">
          <h1 className="font-[cursive] text-5xl text-center text-[#8A7D85] mb-8 mt-4">Ballet Dream</h1>
          
          <div className="flex overflow-x-auto gap-4 pb-8 scrollbar-hide snap-x">
            {/* Card 1 */}
            <div className="min-w-[220px] snap-center bg-[repeating-linear-gradient(90deg,transparent,transparent_10px,#FFF5F7_10px,#FFF5F7_20px)] p-4 border border-[#EAE4E4] rounded-sm flex flex-col">
              <div className="border border-[#8A7D85] rounded-t-full px-4 py-1 text-center mb-4 mx-auto">
                <span className="text-[10px] uppercase tracking-widest text-[#8A7D85]">Chapter I</span>
              </div>
              <div className="w-full aspect-square bg-white border border-[#EAE4E4] p-2 mb-4">
                <img src={currentGroup.bannerImage || currentGroup.coverImage || 'https://picsum.photos/seed/banner2/400/400'} className="w-full h-full object-cover grayscale opacity-80" />
              </div>
              <div className="mt-auto text-center">
                <h3 className="font-[cursive] text-2xl text-[#8A7D85]">Quiet Moments</h3>
                <p className="text-[9px] text-[#9E919A] mt-2 uppercase tracking-widest leading-relaxed">
                  Embracing the silence<br/>within the soul
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="min-w-[260px] snap-center bg-[#F5F5F5] p-4 border border-[#EAE4E4] rounded-sm flex flex-col relative h-[450px]">
              <div className="text-center mb-4 relative shrink-0">
                <span className="font-[cursive] text-4xl text-[#D3C4C9] absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-0">Elegance</span>
                <span className="relative z-10 text-sm uppercase tracking-widest text-[#8A7D85] bg-[#F5F5F5] px-2 truncate block max-w-[200px] mx-auto">{currentGroup.name}</span>
              </div>
              <div className="w-full h-64 bg-white border border-[#EAE4E4] p-2 mb-4 shrink-0">
                <img src={currentGroup.illustrationImage || currentGroup.avatar || 'https://picsum.photos/seed/ill2/400/600'} className="w-full h-full object-cover opacity-90" />
              </div>
              <div className="mt-auto border-y border-[#EAE4E4] py-3 text-center overflow-y-auto scrollbar-hide max-h-[120px]">
                <p className="text-[10px] text-[#8A7D85] leading-relaxed">
                  {currentGroup.description || "A place for gentle souls to gather and share their deepest thoughts in tranquility."}
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="min-w-[220px] snap-center bg-white p-4 border border-[#EAE4E4] rounded-sm flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#8A7D85 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              
              <div className="relative z-10 flex flex-col items-center h-full">
                <div className="w-8 h-8 mb-2 opacity-50 text-2xl">🎀</div>
                <div className="w-32 h-40 rounded-[50%] border border-[#8A7D85] p-1 mb-4">
                  <img src={currentGroup.secondaryImage || currentGroup.avatar || 'https://picsum.photos/seed/sec2/300/400'} className="w-full h-full rounded-[50%] object-cover sepia-[0.2]" />
                </div>
                <div className="w-12 h-16 border-x border-[#EAE4E4] relative mb-4">
                  <div className="absolute top-2 left-0 w-full border-b border-[#EAE4E4] rotate-45"></div>
                  <div className="absolute top-2 left-0 w-full border-b border-[#EAE4E4] -rotate-45"></div>
                  <div className="absolute top-8 left-0 w-full border-b border-[#EAE4E4] rotate-45"></div>
                  <div className="absolute top-8 left-0 w-full border-b border-[#EAE4E4] -rotate-45"></div>
                </div>
                <div className="mt-auto text-center">
                  <h3 className="font-serif text-lg text-[#8A7D85] uppercase tracking-widest">Dream Ballet</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-center">
            <div className="w-48 h-8 border border-[#EAE4E4] flex items-center justify-center relative bg-white">
              <div className="absolute -top-4 text-2xl opacity-70">🎀</div>
              <span className="text-[8px] uppercase tracking-widest text-[#9E919A]">End of Chapter</span>
            </div>
          </div>

          <div className="fixed bottom-6 left-0 w-full px-6 z-20">
            <button 
              onClick={() => setView('group_detail')}
              className="w-full py-4 bg-white/80 backdrop-blur-md text-[#8A7D85] border border-[#EAE4E4] rounded-sm font-serif uppercase tracking-widest shadow-sm hover:bg-white transition-all text-sm"
            >
              Tham gia trò chuyện
            </button>
          </div>
        </div>
      );
    }
  };

  const renderList = () => (
    <div className="min-h-full pb-24 relative font-serif">
      <div className="p-6 pb-2 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-[#8A7D85] mb-2">Danh sách Hội Nhóm</h2>
          <p className="text-sm text-[#9E919A] italic">Nơi những giấc mơ bắt đầu...</p>
        </div>
      </div>

      <div className="flex flex-col">
        {groups.length === 0 ? (
          <div className="p-6 text-center text-[#9E919A] bg-white/40 backdrop-blur-sm mx-4 rounded-2xl">Chưa có nhóm nào. Hãy tạo nhóm đầu tiên nhé!</div>
        ) : (
          groups.map(g => (
            <div 
              key={g.id} 
              onClick={() => { setCurrentGroup(g); setView('group_intro'); }} 
              className="flex items-center p-4 border-b border-[#FFD1DC]/50 hover:bg-white/40 transition-colors cursor-pointer bg-white/20 backdrop-blur-[2px]"
            >
              {/* Avatar in white circle */}
              <div className="w-14 h-14 rounded-full bg-white p-1 shadow-sm shrink-0 mr-4">
                <img src={g.avatar || 'https://picsum.photos/seed/avatar/100'} className="w-full h-full rounded-full object-cover" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#8A7D85] text-lg truncate">{g.name}</h3>
                <p className="text-sm text-[#9E919A] line-clamp-1">{g.topic}</p>
              </div>

              {/* Options */}
              <div className="relative ml-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === g.id ? null : g.id);
                  }}
                  className="p-2 text-[#9E919A] hover:bg-[#FFF0F5] rounded-full transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                
                {activeDropdown === g.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#FFD1DC] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(g);
                        setView('create');
                        setActiveDropdown(null);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#FFF0F5] text-[#8A7D85] transition-colors"
                    >
                      <Edit2 size={16} /> Chỉnh sửa
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupToDelete(g.id);
                        setActiveDropdown(null);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#FFF0F5] text-red-500 transition-colors border-t border-[#FFD1DC]/50"
                    >
                      <Trash2 size={16} /> Xóa nhóm
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right Nav Bar */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 bg-white/40 backdrop-blur-sm rounded-full p-2 flex flex-col gap-4 shadow-sm border border-white/50">
        <div className="w-2 h-2 rounded-full bg-[#F3B4C2]/50 mx-auto"></div>
        <div className="w-2 h-2 rounded-full bg-[#F3B4C2]/50 mx-auto"></div>
        <div className="w-2 h-2 rounded-full bg-[#F3B4C2]/50 mx-auto"></div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2">
        <button className="px-8 py-2 bg-white/40 backdrop-blur-sm border border-[#FFD1DC] rounded-full text-[#8A7D85] text-sm shadow-sm">
          Mở rộng
        </button>
      </div>

      {/* FAB */}
      <button 
        onClick={() => {
          setFormData({ themeColor: '#FFC8D2' });
          setView('create');
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#F3B4C2] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#F9C6D4] transition-transform hover:scale-105 z-50"
      >
        <Plus size={28} />
      </button>
    </div>
  );

  const renderGroupDetail = () => {
    if (!currentGroup) return null;

    return (
      <div className="h-full flex flex-col relative z-10">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md border-b border-[#FFD1DC] sticky top-0 z-20 shadow-sm shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setView('group_intro')} className="p-2 bg-white/50 rounded-full text-[#F3B4C2] hover:bg-white transition-colors shrink-0">
              <ArrowLeft size={20} />
            </button>
            <button onClick={() => setView('api_settings')} className="p-2 bg-white/50 rounded-full text-[#F3B4C2] hover:bg-white transition-colors shrink-0" title="Cấu hình API">
              <Settings size={20} />
            </button>
            <div className="relative shrink-0">
              <img src={currentGroup.avatar || 'https://picsum.photos/seed/avatar/100'} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-[#8A7D85] text-lg leading-tight truncate">{currentGroup.name}</h2>
              <p className="text-[11px] text-[#9E919A]">{groupPosts.length} bài đăng</p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative shrink-0 ml-2">
            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'group_detail' ? null : 'group_detail')}
              className="p-2 text-[#F3B4C2] hover:bg-white/50 rounded-full transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            {activeDropdown === 'group_detail' && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-[#FFD1DC] py-2 z-50">
                <button 
                  onClick={() => {
                    setFormData(currentGroup);
                    setView('create');
                    setActiveDropdown(null);
                  }}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#FFF0F5] text-[#8A7D85] transition-colors"
                >
                  <Edit2 size={16} /> Chỉnh sửa nhóm
                </button>
                <button 
                  onClick={() => {
                    setShowPromoteModal(true);
                    setActiveDropdown(null);
                  }}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#FFF0F5] text-[#8A7D85] transition-colors"
                >
                  <Megaphone size={16} /> Quảng bá nhóm
                </button>
                <button 
                  onClick={() => {
                    setView('promote');
                    setActiveDropdown(null);
                  }}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#FFF0F5] text-[#8A7D85] transition-colors border-t border-[#FFD1DC]/30"
                >
                  <Bookmark size={16} /> Xem lại Quảng Bá
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feed Area */}
        <div className="flex-1 overflow-y-auto p-4 pb-32 scrollbar-hide">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
              <button 
                onClick={() => setSelectedBatchId(null)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${!selectedBatchId ? 'bg-[#F3B4C2] text-white' : 'bg-white text-[#8A7D85] border border-[#FFD1DC]'}`}
              >
                Tất cả
              </button>
              {groupBatches.map(batch => (
                <button 
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedBatchId === batch.id ? 'bg-[#F3B4C2] text-white' : 'bg-white text-[#8A7D85] border border-[#FFD1DC]'}`}
                >
                  {batch.name}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setView('flower_creation')} 
              className="w-10 h-10 bg-white rounded-full shadow-sm text-xl flex items-center justify-center hover:bg-[#FFF0F5] transition-colors border border-[#FFD1DC] shrink-0"
              title="Trang chính thức tạo bài đăng"
            >
              🌸
            </button>
          </div>
          {groupPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-80 mt-10">
              <div className="w-24 h-24 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-sm border border-[#FFD1DC]">
                <MessageCircle size={40} className="text-[#F3B4C2]" />
              </div>
              <p className="text-[#8A7D85] font-medium mb-2">Chưa có bài đăng nào</p>
              <p className="text-[#9E919A] text-sm mb-6 max-w-[250px]">Hãy bấm vào bông hoa 🌸 để bắt đầu tạo các đợt bài đăng nhé!</p>
              <button 
                onClick={() => setView('flower_creation')} 
                className="px-6 py-3 bg-[#F3B4C2] text-white rounded-full font-bold shadow-md hover:bg-[#F9C6D4] transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                🌸 Tạo bài đăng mới
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center my-4">
                <span className="text-[10px] bg-white/50 text-[#9E919A] px-3 py-1 rounded-full uppercase tracking-widest font-bold">Hôm nay</span>
              </div>
              {groupPosts.map(post => {
                const isUser = post.author === "Chủ nhóm" || post.author === "System";
                return (
                  <div key={post.id} className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-[#FFD1DC] animate-in slide-in-from-bottom-4">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <div className="flex items-center gap-3 shrink-0">
                        <img 
                          src={post.avatar || 'https://picsum.photos/seed/avatar/100'} 
                          className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white cursor-pointer hover:scale-105 transition-transform shrink-0" 
                          onClick={() => {
                            if (!isUser) {
                              openNPCProfile(post.author, post.avatar || 'https://picsum.photos/seed/avatar/100');
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 
                            className={`font-bold ${isUser ? 'text-[#F3B4C2]' : 'text-[#8A7D85]'} cursor-pointer hover:underline truncate max-w-[150px]`}
                            onClick={() => {
                              if (!isUser) {
                                openNPCProfile(post.author, post.avatar || 'https://picsum.photos/seed/avatar/100');
                              }
                            }}
                          >
                            {post.author}
                          </h4>
                          <span className="text-xs text-[#9E919A]">Vừa xong</span>
                        </div>
                      </div>
                      <button className="text-[#9E919A] hover:text-[#F3B4C2] transition-colors shrink-0">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                    
                    {/* Post Content */}
                    <div className="text-[#8A7D85] text-sm leading-relaxed mb-4 whitespace-pre-wrap max-h-[400px] overflow-y-auto scrollbar-hide">
                      {post.content}
                    </div>
                    
                    {/* Post Image */}
                    {post.image && !post.image.includes('undefined') && (
                      <div className="mb-4 rounded-2xl overflow-hidden border border-[#FFD1DC]/50">
                        <img src={post.image} className="w-full h-auto object-cover max-h-[400px]" />
                      </div>
                    )}
                    
                    {/* Post Actions */}
                    <div className="flex items-center gap-6 pt-3 border-t border-[#FFD1DC]/50">
                      <button 
                        onClick={() => handleLikeComment(post.id, post)} 
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${likedComments.has(post.id) ? 'text-red-400' : 'text-[#9E919A] hover:text-[#F3B4C2]'}`}
                        title="Thả tim để NPC xin vào nhóm"
                      >
                        <Heart size={18} fill={likedComments.has(post.id) ? "currentColor" : "none"} className={likedComments.has(post.id) ? "animate-bounce" : ""} />
                        <span>{likedComments.has(post.id) ? post.likes + 1 : post.likes || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm font-medium text-[#9E919A] hover:text-[#F3B4C2] transition-colors">
                        <MessageCircle size={18} />
                        <span>{post.comments?.length || 0} Bình luận</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleBunnyComment(post.id, post)}
                          className="flex items-center justify-center w-8 h-8 bg-[#FFF0F5] rounded-full hover:bg-[#FDE2E4] transition-colors shadow-sm border border-[#FFD1DC]"
                          title="Gọi 500 NPC vào bình luận"
                        >
                          <span className="text-lg">🐰</span>
                        </button>
                        {post.bunnyRounds && post.bunnyRounds.length > 0 && (
                          <div className="flex -space-x-2">
                            {post.bunnyRounds.slice(-3).map((round: any, idx: number) => (
                              <div key={round.id} className="w-5 h-5 bg-pink-200 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-pink-600 shadow-sm" title={`Đợt ${post.bunnyRounds.length - 2 + idx}: ${round.timestamp}`}>
                                {post.bunnyRounds.length - 2 + idx}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button className="flex items-center gap-2 text-sm font-medium text-[#9E919A] hover:text-[#F3B4C2] transition-colors ml-auto">
                        <Share2 size={18} />
                      </button>
                    </div>

                    {/* Comments Section */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#FFD1DC]/30 space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                        {post.comments.map((comment: any, idx: number) => (
                          <div key={idx} className="flex gap-3">
                            <img 
                              src={comment.avatar || 'https://picsum.photos/seed/avatar/100'} 
                              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:scale-105 transition-transform shrink-0"
                              onClick={() => openNPCProfile(comment.author, comment.avatar || 'https://picsum.photos/seed/avatar/100')}
                            />
                            <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                              <h5 
                                className="font-bold text-xs text-[#8A7D85] cursor-pointer hover:underline mb-1"
                                onClick={() => openNPCProfile(comment.author, comment.avatar || 'https://picsum.photos/seed/avatar/100')}
                              >
                                {comment.author}
                              </h5>
                              <p className="text-sm text-[#8A7D85] whitespace-pre-wrap max-h-[200px] overflow-y-auto scrollbar-hide">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Post Area */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-white/60 backdrop-blur-md border-t border-[#FFD1DC] z-20">
          <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl border border-[#FFD1DC] p-3 shadow-sm">
            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'post_drawer' ? null : 'post_drawer')}
              className="w-full flex items-center justify-between text-[#8A7D85] font-bold text-sm px-2 pb-2"
            >
              <span>{activeDropdown === 'post_drawer' ? 'Thu gọn' : 'Đăng bài mới'}</span>
              {activeDropdown === 'post_drawer' ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            
            {activeDropdown === 'post_drawer' && (
              <div className="flex items-end gap-3 pt-2 border-t border-[#FFD1DC]/50 animate-in slide-in-from-bottom-2">
                <img src={currentGroup.avatar || 'https://picsum.photos/seed/avatar/100'} className="w-10 h-10 rounded-full object-cover shadow-sm border border-white shrink-0" />
                <div className="flex-1 bg-white rounded-2xl border border-[#FFD1DC]/50 px-4 py-3 shadow-inner">
                  <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Bạn đang nghĩ gì? Đăng bài vào nhóm nhé..." 
                    className="w-full bg-transparent border-none focus:outline-none text-[#8A7D85] text-sm resize-none max-h-32"
                    rows={2}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                    }}
                  />
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-[#F3B4C2] hover:bg-[#FFF0F5] rounded-full transition-colors">
                        <ImageIcon size={18} />
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        if (!newPostContent.trim()) return;
                        const newPost = {
                          id: Date.now().toString(),
                          author: "Chủ nhóm",
                          avatar: formData.ownerInfo?.avatar || 'https://picsum.photos/seed/avatar/100',
                          content: newPostContent,
                          likes: 0,
                          comments: []
                        };
                        setGroupPosts([newPost, ...groupPosts]);
                        setNewPostContent('');
                        setActiveDropdown(null);
                      }}
                      className="px-4 py-1.5 bg-[#F3B4C2] text-white rounded-full font-bold text-sm shadow-sm hover:bg-[#F9C6D4] transition-transform hover:scale-105"
                    >
                      Đăng bài
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const generateNPCProfilePosts = async (npcName: string, npcAvatar: string, isLoadMore = false) => {
    setIsLoading(true);
    setLoadingMsg(`Đang tạo bài đăng cho ${npcName}...`);
    
    try {
      const prompt = `Hãy đóng vai NPC "${npcName}" đang hoạt động trong nhóm "${currentGroup?.name}" (chủ đề: ${currentGroup?.topic}).
      Hãy tạo ra 15 bài đăng trên trang cá nhân Instagram của bạn.
      Các bài đăng phải thể hiện rõ tính cách, sở thích cá nhân của bạn, và có liên quan mật thiết đến việc bạn là thành viên của nhóm này.
      Trả về định dạng JSON array: [{"content": "Nội dung bài đăng (caption)"}].
      KHÔNG GIẢI THÍCH, CHỈ TRẢ VỀ JSON.`;

      const stream = sendMessageStream(apiSettings, [{ role: 'user', content: prompt }], "Bạn là hệ thống tạo bài đăng cá nhân cho NPC chuyên nghiệp. CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ.");
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
      }

      const parsed = safeParse(fullText);
      const validPosts = validatePosts(parsed);

      if (validPosts.length > 0) {
        const newPosts = validPosts.map((p: any, i: number) => ({
          id: (Date.now() + i).toString() + '_profile_' + Math.random().toString(36).substr(2, 5),
          content: p.content,
          image: postImages[(i + Math.floor(Math.random() * 10)) % postImages.length],
        }));
        
        if (isLoadMore) {
          setNpcProfilePosts(prev => [...prev, ...newPosts]);
        } else {
          setNpcProfilePosts(newPosts);
        }
        showToast(`Đã tạo ${newPosts.length} bài đăng cá nhân!`);
      } else {
        showToast("Không thể tạo bài đăng cá nhân. Vui lòng thử lại.");
      }

    } catch (error) {
      console.error(error);
      showToast("Lỗi khi tạo bài đăng cá nhân.");
    } finally {
      setIsLoading(false);
    }
  };

  const openNPCProfile = async (npcName: string, npcAvatar: string) => {
    setSelectedNPC({ name: npcName, avatar: npcAvatar });
    setView('npc_profile');
    
    try {
      const savedPosts = await loadForumData(`banhnho_npc_posts_${npcName}`);
      if (savedPosts && savedPosts.length > 0) {
        setNpcProfilePosts(savedPosts);
        return; // Already have posts, don't generate
      } else {
        const localPosts = localStorage.getItem(`banhnho_npc_posts_${npcName}`);
        if (localPosts) {
          const parsed = JSON.parse(localPosts);
          if (parsed && parsed.length > 0) {
            setNpcProfilePosts(parsed);
            localStorage.removeItem(`banhnho_npc_posts_${npcName}`);
            return;
          }
        }
      }
    } catch (e) {}
    
    generateNPCProfilePosts(npcName, npcAvatar);
  };

  const renderNPCProfile = () => {
    if (!selectedNPC) return null;
    return (
      <div className="h-full bg-[#FDFBFB] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={() => setView('group_detail')} className="p-2"><ArrowLeft size={24} className="text-[#333333]" /></button>
          <span className="font-bold text-[#333333]">{selectedNPC.name}</span>
          <button onClick={() => generateNPCProfilePosts(selectedNPC.name, selectedNPC.avatar, true)} className="p-2 text-[#F3B4C2] hover:scale-110 transition-transform" title="Tạo thêm 20 bài đăng">
            <Heart size={24} fill="currentColor" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="w-[86px] h-[86px] rounded-full border border-gray-200 p-[3px]">
              <ImageWithFilter src={selectedNPC.avatar} className="w-full h-full rounded-full" />
            </div>
            <div className="flex-1 flex justify-around text-center ml-4 text-[#333333]">
              <div><div className="font-bold text-lg">{npcProfilePosts.length}</div><div className="text-xs">Posts</div></div>
              <div><div className="font-bold text-lg">1.2K</div><div className="text-xs">Followers</div></div>
              <div><div className="font-bold text-lg">345</div><div className="text-xs">Following</div></div>
            </div>
          </div>

          <div className="mb-4 text-[#333333]">
            <h2 className="font-bold">{selectedNPC.name}</h2>
            <p className="text-sm leading-relaxed mt-1">
              Thành viên của {currentGroup?.name || 'Hội nhóm'}<br/>
              "Sống chậm lại, yêu thương nhiều hơn" ✨
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button className="flex-1 h-[36px] bg-[#EAE4E4] text-[#333333] font-bold rounded-[8px] text-sm">Following</button>
            <button className="flex-1 h-[36px] bg-[#EAE4E4] text-[#333333] font-bold rounded-[8px] text-sm">Message</button>
          </div>

          {/* Highlights */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide mb-6 pb-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-[60px] h-[60px] rounded-full border border-gray-200 p-[2px]">
                  <ImageWithFilter src={`https://picsum.photos/seed/${selectedNPC.name}_h${i}/200`} className="w-full h-full rounded-full" />
                </div>
                <span className="text-[10px] text-[#333333]">Story {i}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Tabs */}
        <div className="flex border-t border-gray-100">
          <button className="flex-1 py-3 flex justify-center border-b-2 border-[#333333]"><Grid size={20} className="text-[#333333]" /></button>
          <button className="flex-1 py-3 flex justify-center text-gray-400"><Bookmark size={20} /></button>
          <button className="flex-1 py-3 flex justify-center text-gray-400"><User size={20} /></button>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-0.5">
          {npcProfilePosts.map((post, i) => (
            <div key={post.id} className="aspect-square bg-gray-100 relative group cursor-pointer">
              <ImageWithFilter src={post.image} className="w-full h-full" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                <p className="text-white text-[10px] line-clamp-4 text-center">{post.content}</p>
              </div>
            </div>
          ))}
        </div>
        
        {npcProfilePosts.length === 0 && !isLoading && (
          <div className="p-8 text-center text-gray-400 text-sm">
            Chưa có bài đăng nào
          </div>
        )}
      </div>
    );
  };

  const renderApiSettings = () => (
    <div className="h-full overflow-y-auto p-4 max-w-md mx-auto">
      <button onClick={() => setView('list')} className="mb-4 text-[#F3B4C2] font-bold bg-white/50 px-3 py-1 rounded-full">← Quay lại</button>
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
            value={apiSettings.endpoint}
            onChange={(e) => setApiSettings({...apiSettings, endpoint: e.target.value})}
            placeholder="https://api.openai.com/v1"
            className="w-full p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#8A7D85] mb-1">API Key</label>
          <input 
            type="password" 
            value={apiSettings.apiKey}
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
              value={apiSettings.model}
              onChange={(e) => setApiSettings({...apiSettings, model: e.target.value})}
              placeholder="gpt-3.5-turbo, claude-3-opus..."
              className="w-full p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50"
            />
          )}
        </div>

        <div className="pt-4 border-t border-[#F9C6D4]/50">
          <h3 className="font-bold text-[#8A7D85] mb-3">Cấu hình Token & Xử lý lớn</h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <button 
              onClick={() => setApiSettings({...apiSettings, maxTokens: 30000, isUnlimited: false})}
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${!apiSettings.isUnlimited && apiSettings.maxTokens === 30000 ? 'bg-[#F3B4C2] text-white shadow-md' : 'bg-white/50 text-[#8A7D85] border border-[#F9C6D4]'}`}
            >
              30.000 Token
            </button>
            <button 
              onClick={() => setApiSettings({...apiSettings, maxTokens: 50000, isUnlimited: false})}
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${!apiSettings.isUnlimited && apiSettings.maxTokens === 50000 ? 'bg-[#F3B4C2] text-white shadow-md' : 'bg-white/50 text-[#8A7D85] border border-[#F9C6D4]'}`}
            >
              50.000 Token
            </button>
            <button 
              onClick={() => setApiSettings({...apiSettings, maxTokens: 100000, isUnlimited: false})}
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${!apiSettings.isUnlimited && apiSettings.maxTokens === 100000 ? 'bg-[#F3B4C2] text-white shadow-md' : 'bg-white/50 text-[#8A7D85] border border-[#F9C6D4]'}`}
            >
              100.000 Token
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
              max="2"
              value={apiSettings.timeoutMinutes}
              onChange={(e) => {
                let val = parseInt(e.target.value) || 2;
                if (val > 2) val = 2; // Strict max 2 minutes
                setApiSettings({...apiSettings, timeoutMinutes: val});
              }}
              className="w-full p-3 rounded-xl border border-[#F9C6D4] focus:outline-none focus:ring-2 focus:ring-[#F3B4C2] bg-white/50"
            />
            <p className="text-xs text-[#9E919A] mt-1">Tối đa 2 phút để đảm bảo không lỗi frontend và không ngắt quãng.</p>
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
              onClick={() => {
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
                showToast(`Đã lưu cấu hình "${newProfile.name}" thành công!`);
                setIsProfileSaved(true);
                setTimeout(() => setIsProfileSaved(false), 2000);
              }}
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
                    <button onClick={() => {
                      setApiSettings(profile);
                      showToast(`Đã tải cấu hình "${profile.name}".`);
                    }} className="p-2 bg-[#E8F5E9] text-[#2E7D32] rounded-lg hover:bg-[#C8E6C9] text-xs font-bold transition-colors">Chọn</button>
                    <button onClick={() => setSavedProfiles(savedProfiles.filter(p => p.id !== profile.id))} className="p-2 bg-[#FFEBEE] text-[#C62828] rounded-lg hover:bg-[#FFCDD2] text-xs font-bold transition-colors">Xóa</button>
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
  );

  const generatePromoteComments = async () => {
    setIsLoading(true);
    setLoadingMsg('Đang gọi NPC xin vào nhóm...');
    
    try {
      const prompt = `Hãy đóng vai 20 người dùng khác nhau đang xem bài quảng bá nhóm "${currentGroup?.name}".
      Chủ đề nhóm: ${currentGroup?.topic}.
      Nội dung quảng bá: "${promotePost?.content}".
      Yêu cầu:
      - Tạo ra danh sách bình luận xin vào nhóm.
      - Mỗi bình luận phải thể hiện sở thích, mong muốn khi vào nhóm, phù hợp với chủ đề.
      - Trả về ĐÚNG định dạng JSON array: [{"author": "Tên người", "content": "Nội dung bình luận"}].
      - KHÔNG bọc trong markdown, KHÔNG thêm text giải thích, CHỈ trả về JSON hợp lệ.`;

      const stream = sendMessageStream(apiSettings, [{ role: 'user', content: prompt }], "Bạn là hệ thống tạo bình luận NPC chuyên nghiệp. CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ.");
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
      }

      const parsed = safeParse(fullText);
      const validComments = validatePosts(parsed);

      if (validComments.length > 0) {
        const massiveComments: any[] = [];
        // Atomic generation of 500 comments
        for (let i = 0; i < 500; i++) {
          const baseComment = validComments[i % validComments.length];
          massiveComments.push({
            id: Date.now().toString() + '_promote_' + i,
            author: baseComment.author || `User_${i}`,
            avatar: npcAvatars[i % npcAvatars.length],
            content: baseComment.content,
            isLiked: false
          });
        }
        
        setPromotePost((prev: any) => {
          if (!prev) return prev;
          const updated = { ...prev, comments: massiveComments };
          setPromoteHistory(h => {
            const filtered = h.filter(item => item.id !== updated.id);
            return [updated, ...filtered];
          });
          return updated;
        });
        showToast(`Đã gọi thành công ${massiveComments.length} NPC!`);
      } else {
        showToast("Không thể tạo bình luận quảng bá. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      showToast("Lỗi khi tạo bình luận quảng bá.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikePromoteComment = (comment: any) => {
    setPromotePost((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: prev.comments.map((c: any) => 
          c.id === comment.id ? { ...c, isLiked: !c.isLiked } : c
        )
      };
    });

    if (!comment.isLiked) {
      setApprovedMembers(prev => [...prev, {
        id: comment.id,
        name: comment.author,
        avatar: comment.avatar,
        bio: comment.content
      }]);
    } else {
      setApprovedMembers(prev => prev.filter(m => m.id !== comment.id));
    }
  };

  const renderPromoteTab = () => {
    // 1. If viewing a specific history item
    if (selectedHistoryId) {
      const historyPost = promoteHistory.find(h => h.id === selectedHistoryId);
      if (!historyPost) {
        setSelectedHistoryId(null);
        return null;
      }
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <button 
            onClick={() => setSelectedHistoryId(null)}
            className="flex items-center gap-2 text-[#F3B4C2] font-bold text-sm hover:underline mb-2"
          >
            <ArrowLeft size={16} /> Quay lại danh sách đợt quảng bá
          </button>
          
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-[#FFD1DC]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={currentGroup?.avatar || 'https://picsum.photos/seed/avatar/100'} className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white" />
                <div>
                  <h4 className="font-bold text-[#F3B4C2]">Đợt Quảng Bá</h4>
                  <span className="text-xs text-[#9E919A]">{historyPost.timestamp}</span>
                </div>
              </div>
              <div className="px-3 py-1 bg-[#FFF0F5] rounded-full text-[10px] font-bold text-[#F3B4C2] border border-[#FFD1DC]">
                ĐÃ LƯU
              </div>
            </div>
            <div className="text-[#8A7D85] text-sm leading-relaxed mb-4 whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-hide">
              {historyPost.content}
            </div>
            {historyPost.image && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-[#FFD1DC]/50">
                <img src={historyPost.image} className="w-full h-auto object-cover max-h-[400px]" />
              </div>
            )}
            
            {/* Comments */}
            {historyPost.comments && historyPost.comments.length > 0 && (
              <div className="mt-6 space-y-4">
                <h5 className="font-bold text-[#8A7D85] text-sm">Bình luận từ NPC ({historyPost.comments.length})</h5>
                <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-hide space-y-4">
                  {historyPost.comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <img src={comment.avatar} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="bg-[#FFF0F5] rounded-2xl p-3">
                          <h6 className="font-bold text-sm text-[#8A7D85]">{comment.author}</h6>
                          <p className="text-sm text-[#8A7D85] mt-1">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1 ml-2">
                          <button 
                            onClick={() => handleLikePromoteComment(comment)}
                            className={`text-xs font-bold transition-colors flex items-center gap-1 ${comment.isLiked ? 'text-red-400' : 'text-[#9E919A] hover:text-[#F3B4C2]'}`}
                          >
                            <Heart size={14} fill={comment.isLiked ? "currentColor" : "none"} />
                            {comment.isLiked ? 'Đã duyệt' : 'Duyệt vào nhóm'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 2. If creating a new promotion
    if (isCreatingPromote || (!promotePost && promoteHistory.length === 0)) {
      return (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-[#F9C6D4] max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#8A7D85]">Tạo bài viết quảng bá mới</h3>
            {promoteHistory.length > 0 && (
              <button 
                onClick={() => setIsCreatingPromote(false)}
                className="text-xs font-bold text-[#9E919A] hover:text-[#F3B4C2]"
              >
                Hủy bỏ
              </button>
            )}
          </div>
          <textarea 
            value={promoteContent}
            onChange={(e) => setPromoteContent(e.target.value)}
            placeholder="Viết lời giới thiệu thật hấp dẫn để mời mọi người vào nhóm nhé..." 
            className="w-full h-32 p-4 rounded-2xl bg-[#FFF0F5] border-none focus:ring-2 focus:ring-[#F3B4C2] text-sm resize-none mb-4"
          />
          <div 
            className="w-full h-48 bg-[#FFF0F5] rounded-2xl border-2 border-dashed border-[#F9C6D4] flex items-center justify-center text-[#F3B4C2] mb-6 cursor-pointer hover:bg-[#FDE2E4] transition-colors overflow-hidden"
            onClick={() => document.getElementById('promote-upload')?.click()}
          >
            {promoteImage ? (
              <img src={promoteImage} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <ImageIcon size={32} className="mx-auto mb-2" />
                <span className="font-bold text-sm">Tải ảnh quảng bá lên</span>
              </div>
            )}
            <input 
              id="promote-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setPromoteImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>

          <button 
            onClick={() => {
              const newPost = {
                id: Date.now().toString(),
                content: promoteContent,
                image: promoteImage,
                comments: [],
                timestamp: new Date().toLocaleString()
              };
              setPromotePost(newPost);
              setIsCreatingPromote(false);
            }}
            className="w-full py-4 bg-[#F3B4C2] text-white rounded-2xl font-bold shadow-lg hover:bg-[#F9C6D4] transition-all text-lg flex items-center justify-center gap-2"
          >
            <Send size={20} /> Đăng bài Quảng Bá
          </button>
        </div>
      );
    }

    // 3. Main History View
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Active Promotion (if any) */}
        {promotePost && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-[#FFD1DC] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#F3B4C2] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">ĐANG HOẠT ĐỘNG</div>
            <div className="flex items-center gap-3 mb-4">
              <img src={currentGroup?.avatar || 'https://picsum.photos/seed/avatar/100'} className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white" />
              <div>
                <h4 className="font-bold text-[#F3B4C2]">Chủ nhóm</h4>
                <span className="text-xs text-[#9E919A]">{promotePost.timestamp || 'Vừa xong'}</span>
              </div>
            </div>
            <div className="text-[#8A7D85] text-sm leading-relaxed mb-4 whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-hide">
              {promotePost.content}
            </div>
            {promotePost.image && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-[#FFD1DC]/50">
                <img src={promotePost.image} className="w-full h-auto object-cover max-h-[400px]" />
              </div>
            )}
            
            <div className="flex items-center gap-6 pt-3 border-t border-[#FFD1DC]/50">
              <button 
                onClick={generatePromoteComments}
                className="w-full py-3 bg-[#F3B4C2] text-white rounded-xl font-bold shadow-md hover:bg-[#F9C6D4] transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> Gọi 500 NPC xin vào nhóm
              </button>
            </div>

            {/* Comments */}
            {promotePost.comments.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-[#8A7D85] text-sm">Bình luận ({promotePost.comments.length})</h5>
                  <span className="text-[10px] text-[#9E919A]">Lưu tự động vào lịch sử</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-hide space-y-4">
                  {promotePost.comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <img src={comment.avatar} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="bg-[#FFF0F5] rounded-2xl p-3">
                          <h6 className="font-bold text-sm text-[#8A7D85]">{comment.author}</h6>
                          <p className="text-sm text-[#8A7D85] mt-1">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1 ml-2">
                          <button 
                            onClick={() => handleLikePromoteComment(comment)}
                            className={`text-xs font-bold transition-colors flex items-center gap-1 ${comment.isLiked ? 'text-red-400' : 'text-[#9E919A] hover:text-[#F3B4C2]'}`}
                          >
                            <Heart size={14} fill={comment.isLiked ? "currentColor" : "none"} />
                            {comment.isLiked ? 'Đã duyệt' : 'Duyệt vào nhóm'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#8A7D85] flex items-center gap-2">
              <Bookmark size={20} className="text-[#F3B4C2]" /> Lịch sử Lưu Quảng Bá
            </h3>
            <button 
              onClick={() => {
                setIsCreatingPromote(true);
                setPromoteContent('');
                setPromoteImage(null);
              }}
              className="px-4 py-2 bg-[#FFF0F5] text-[#F3B4C2] rounded-xl font-bold text-xs border border-[#FFD1DC] hover:bg-[#FDE2E4] transition-colors"
            >
              + Tạo đợt mới
            </button>
          </div>

          {promoteHistory.length === 0 ? (
            <div className="text-center py-12 bg-white/40 rounded-[40px] border-2 border-dashed border-[#FFD1DC]">
              <div className="text-4xl mb-3 opacity-50">📋</div>
              <p className="text-[#9E919A] font-medium">Chưa có đợt quảng bá nào được lưu.</p>
              <p className="text-xs text-[#9E919A] mt-1">Hãy tạo bài quảng bá để bắt đầu thu hút NPC!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {promoteHistory.map((historyPost) => (
                <div 
                  key={historyPost.id} 
                  onClick={() => setSelectedHistoryId(historyPost.id)}
                  className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-[#FFD1DC] hover:border-[#F3B4C2] transition-all cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F5] flex items-center justify-center text-[#F3B4C2]">
                        <Megaphone size={16} />
                      </div>
                      <span className="text-xs font-bold text-[#8A7D85]">{historyPost.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#F3B4C2] opacity-0 group-hover:opacity-100 transition-opacity">
                      Xem chi tiết <ArrowLeft size={10} className="rotate-180" />
                    </div>
                  </div>
                  <p className="text-sm text-[#8A7D85] line-clamp-2 mb-3 font-medium">{historyPost.content}</p>
                  <div className="flex items-center gap-4 text-[10px] text-[#9E919A] font-bold">
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <MessageCircle size={12} className="text-[#F3B4C2]" /> {historyPost.comments?.length || 0} NPC xin vào
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Heart size={12} className="text-red-400" /> {historyPost.comments?.filter((c: any) => c.isLiked).length || 0} Đã duyệt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderApproveTab = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-[#8A7D85] mb-4">Thành viên đã duyệt ({approvedMembers.length})</h3>
        {approvedMembers.length === 0 ? (
          <div className="text-center py-10 bg-white/50 rounded-3xl border border-[#FFD1DC] border-dashed">
            <p className="text-[#9E919A]">Chưa có thành viên nào được duyệt.</p>
            <p className="text-sm text-[#9E919A] mt-2">Hãy sang tab Quảng Bá và thả tim bình luận để duyệt nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {approvedMembers.map(member => (
              <div key={member.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-[#FFD1DC] flex items-center gap-4">
                <img src={member.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#8A7D85] truncate">{member.name}</h4>
                  <p className="text-xs text-[#9E919A] line-clamp-2 mt-1">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFlowerCreation = () => {
    if (!currentGroup) return null;

    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <img src={creationBackground} className="w-full h-full object-cover opacity-30 blur-sm" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white/80"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 bg-white/60 backdrop-blur-md border-b border-[#FFD1DC]">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('group_detail')} className="p-2 bg-white/50 rounded-full text-[#F3B4C2] hover:bg-white transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="font-bold text-[#8A7D85] text-xl">Trang chính thức tạo bài đăng 🌸</h2>
              <p className="text-xs text-[#9E919A]">Nhóm: {currentGroup.name}</p>
            </div>
          </div>
          <button 
            onClick={generateGroupPosts}
            disabled={isLoading}
            className={`px-6 py-3 bg-[#F3B4C2] text-white rounded-full font-bold shadow-lg transition-all flex items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#F9C6D4] hover:scale-105 active:scale-95'}`}
          >
            {isLoading ? 'Đang tạo...' : 'Gọi 20 bài đăng ✨'}
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Background Selection */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-[#FFD1DC]">
              <h3 className="text-lg font-bold text-[#8A7D85] mb-4 flex items-center gap-2">
                <span className="text-[#F3B4C2]">🎨</span> Chọn nền cho đợt này
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {postImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCreationBackground(img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${creationBackground === img ? 'border-[#F3B4C2] scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Batches History */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#8A7D85] flex items-center gap-2">
                <span className="text-[#F3B4C2]">📚</span> Các đợt bài đăng đã tạo
              </h3>
              
              {groupBatches.length === 0 ? (
                <div className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-[#FFD1DC] text-[#9E919A]">
                  Chưa có đợt bài đăng nào. Hãy bấm nút phía trên để tạo đợt đầu tiên!
                </div>
              ) : (
                <div className="space-y-8">
                  {groupBatches.map((batch, bIdx) => (
                    <div key={batch.id} className="bg-white/60 backdrop-blur-md rounded-3xl overflow-hidden border border-[#FFD1DC] shadow-sm">
                      <div className="p-4 bg-[#FFF0F5] border-b border-[#FFD1DC] flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-[#F3B4C2] text-lg">{batch.name}</h4>
                          <p className="text-[10px] text-[#9E919A] uppercase tracking-widest">{batch.timestamp}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#8A7D85] bg-white px-3 py-1 rounded-full border border-[#FFD1DC]">
                            {batch.posts.length} bài
                          </span>
                          <button 
                            onClick={() => {
                              if (confirm('Bạn có chắc muốn xóa đợt này?')) {
                                setGroupBatches(prev => prev.filter(b => b.id !== batch.id));
                                if (selectedBatchId === batch.id) setSelectedBatchId(null);
                              }
                            }}
                            className="p-2 text-red-400 hover:bg-white rounded-full transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-4">
                          {batch.posts.map((post, pIdx) => (
                            <div key={post.id} className="min-w-[280px] max-w-[280px] bg-white rounded-2xl p-4 shadow-sm border border-[#FFD1DC]/50 flex flex-col h-[350px]">
                              <div className="flex items-center gap-2 mb-3">
                                <img src={post.avatar} className="w-8 h-8 rounded-full object-cover border border-[#FFD1DC]" />
                                <span className="font-bold text-[#8A7D85] text-xs truncate">{post.author}</span>
                              </div>
                              <div className="flex-1 text-[11px] text-[#8A7D85] leading-relaxed overflow-y-auto scrollbar-hide mb-3 italic">
                                "{post.content.substring(0, 300)}..."
                              </div>
                              {post.image && (
                                <div className="h-24 rounded-xl overflow-hidden mb-2">
                                  <img src={post.image} className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPromote = () => {
    return (
      <div className="h-full flex flex-col bg-[#FDFBFB] relative z-10">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-[#FFD1DC] sticky top-0 z-20">
          <button onClick={() => setView('group_detail')} className="p-2 bg-white/50 rounded-full text-[#F3B4C2] hover:bg-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex bg-[#FFF0F5] rounded-full p-1">
            <button 
              onClick={() => setPromoteTab('promote')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${promoteTab === 'promote' ? 'bg-white text-[#F3B4C2] shadow-sm' : 'text-[#8A7D85]'}`}
            >
              Quảng Bá
            </button>
            <button 
              onClick={() => setPromoteTab('approve')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${promoteTab === 'approve' ? 'bg-white text-[#F3B4C2] shadow-sm' : 'text-[#8A7D85]'}`}
            >
              Duyệt Người ({approvedMembers.length})
            </button>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {promoteTab === 'promote' ? renderPromoteTab() : renderApproveTab()}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full relative overflow-x-hidden">
      {view === 'intro' && renderIntro()}
      {view === 'create' && renderCreateForm()}
      {view === 'group_intro' && renderGroupIntro()}
      {view === 'group_detail' && renderGroupDetail()}
      {view === 'npc_profile' && renderNPCProfile()}
      {view === 'flower_creation' && renderFlowerCreation()}
      {view === 'promote' && renderPromote()}
      {view === 'api_settings' && renderApiSettings()}
      {view === 'list' && renderList()}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="relative z-10 flex flex-col items-center bg-white p-8 rounded-3xl shadow-2xl border border-[#F9C6D4] w-[90%] max-w-sm">
            <div className="w-12 h-12 border-4 border-[#FFC8D2] border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-[#8A7D85] font-bold text-center mb-2">
              {loadingMsg}
            </p>
            <p className="text-xs text-[#9E919A] font-mono">
              Thời gian xử lý: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>
      )}

      {/* Promote Prompt Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-[#8A7D85]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] p-8 max-w-sm w-full text-center shadow-2xl border-2 border-[#FFD1DC] animate-in zoom-in-95 duration-200">
            <div className="text-6xl mb-4 animate-bounce">✨</div>
            <h3 className="text-2xl font-bold text-[#8A7D85] mb-2 font-serif">Tạo nhóm thành công!</h3>
            <p className="text-[#9E919A] text-sm mb-8 leading-relaxed">
              Nhóm của cậu đã được lưu vào danh sách trưng bày. Cậu có muốn viết một bài quảng bá để mời các NPC tham gia nhóm ngay bây giờ không?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setShowPromoteModal(false); setView('promote'); }} 
                className="w-full py-4 bg-[#F3B4C2] text-white rounded-2xl font-bold shadow-md hover:bg-[#F9C6D4] transition-colors"
              >
                Có, quảng bá ngay
              </button>
              <button 
                onClick={() => { setShowPromoteModal(false); setView('group_intro'); }} 
                className="w-full py-4 bg-[#FFF0F5] text-[#8A7D85] rounded-2xl font-bold hover:bg-[#FFE4EC] transition-colors"
              >
                Không, xem thẻ giới thiệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 bg-[#8A7D85]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] p-8 max-w-sm w-full text-center shadow-2xl border-2 border-[#FFD1DC] animate-in zoom-in-95 duration-200">
            <div className="text-6xl mb-4 animate-bounce">😿</div>
            <h3 className="text-2xl font-bold text-[#8A7D85] mb-2 font-serif">Xóa nhóm này?</h3>
            <p className="text-[#9E919A] text-sm mb-8 leading-relaxed">
              Cậu có chắc chắn muốn xóa nhóm này không? Mọi dữ liệu của nhóm sẽ bị mất vĩnh viễn đó nha.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { 
                  setGroups(groups.filter(g => g.id !== groupToDelete));
                  setGroupToDelete(null);
                }} 
                className="w-full py-4 bg-red-400 text-white rounded-2xl font-bold shadow-md hover:bg-red-500 transition-colors"
              >
                Chắc chắn xóa
              </button>
              <button 
                onClick={() => setGroupToDelete(null)} 
                className="w-full py-4 bg-[#FFF0F5] text-[#8A7D85] rounded-2xl font-bold hover:bg-[#FFE4EC] transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
