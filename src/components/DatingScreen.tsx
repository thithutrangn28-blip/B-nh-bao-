import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, User, Dices, Sparkles, ChevronLeft, ChevronRight, Briefcase, Upload, Image as ImageIcon, Send, Settings, RefreshCw, Trash2, Plus, Users, Loader2, Download, Check, Save } from 'lucide-react';
import { sendCoreMessage, sendCoreMessageStream, KokoPrompt, ChatMessage } from '../services/coreAi';
import { generateNPCs, generateNPCResponse, extractJSON, NPCProfile, UserProfile } from '../services/geminiService';
import { saveToDB, getFromDB } from '../utils/indexedDB';
import { compressImage } from '../utils/imageUtils';
import { fetchAvailableModels } from '../utils/apiProxy';

const personalities = [
  { group: "Tư Duy & Phân Tích", items: ["Tư duy logic", "Phân tích sâu", "Lý trí", "Chiến lược", "Sáng tạo", "Độc đáo", "Trực giác", "Tò mò", "Nghiên cứu", "Khoa học", "Tư duy phản biện", "Tập trung cao", "Khách quan", "Tổng quan", "Chi tiết", "Thực tế", "Thực dụng", "Hiện đại", "Đổi mới", "Trải nghiệm"] },
  { group: "Lãnh Đạo & Quyết Đoán", items: ["Quyết đoán", "Tự tin", "Quyền lực", "Tham vọng", "Quyết liệt", "Thuyết phục", "Mạnh mẽ", "Tầm nhìn", "Lôi cuốn", "Tổ chức", "Quản lý", "Trách nhiệm", "Cạnh tranh", "Chủ động", "Quyết tâm", "Cứng rắn", "Dũng cảm", "Bứt phá", "Hướng ngoại", "Thẳng thắn"] },
  { group: "Nhân Hậu & Kết Nối", items: ["Nhân hậu", "Đồng cảm", "Thấu hiểu", "Lắng nghe", "Tận tâm", "Nhẹ nhàng", "Vị tha", "Kiên nhẫn", "Kết nối", "Cộng đồng", "Chân thành", "Ấm áp", "Dịu dàng", "Chu đáo", "Hòa đồng", "Hướng nội", "Hỗ trợ", "Bao dung", "Tin cậy", "Thiện nguyện"] },
  { group: "Sáng Tạo & Nghệ Thuật", items: ["Nghệ sĩ", "Bay bổng", "Nhạy cảm", "Tưởng tượng", "Độc đáo", "Phong cách", "Tinh tế", "Lãng mạn", "Phóng khoáng", "Đam mê", "Nổi loạn", "Truyền cảm hứng", "Cảm xúc", "Sâu sắc", "Phiêu lưu", "Nghệ thuật", "Sáng tạo", "Linh hoạt", "Thẩm mỹ", "Tự do"] },
  { group: "Chi Tiết & Kỷ Luật", items: ["Kỷ luật", "Tỉ mỉ", "Cẩn thận", "Chính xác", "Quy trình", "Trật tự", "An toàn", "Đáng tin", "Trách nhiệm", "Kiên định", "Thận trọng", "Chuẩn mực", "Hệ thống", "Thực tế", "Cam kết", "Nghiêm túc", "Tận tụy", "Chăm chỉ", "Hiệu quả"] }
];

const hobbies = [
  "Chơi game MOBA", "Game bắn súng", "Game nông trại", "Xây dựng thành phố", "Game giải đố", "Xem TikTok", "Lướt Facebook/Reels", "Xem Youtube Shorts", "Nghe Podcast", "Đọc truyện tranh online", "Đọc tiểu thuyết", "Chơi cờ online", "Hát Karaoke online", "Livestream trò chuyện", "Xem Twitch", "Chơi game VR", "Ứng dụng hẹn hò", "Chỉnh sửa ảnh", "Quay và dựng video", "Chơi game giả lập", "Nuôi thú ảo", "Học ngoại ngữ", "Giải đố Sudoku", "Chơi bài online", "Xem phim Netflix", "Nghe nhạc Spotify", "Tìm kiếm cảm hứng trên Pinterest", "Tham gia diễn đàn", "Chơi game kinh dị", "Game nhập vai", "Game chiến thuật", "Game thể thao", "Săn sale", "Xem review phim", "Nghe truyện ma", "Chơi đố vui", "Theo dõi showbiz", "Xem livestream bán hàng", "Tạo meme", "Chơi nhạc cụ ảo", "Xem bói/Tarot", "Chơi game mô tả cuộc đời", "Quản lý bóng đá", "Game sinh tồn", "Game âm nhạc", "Xem mukbang", "Đi dạo công viên", "Chạy bộ buổi sáng", "Đạp xe địa hình", "Đá bóng", "Đánh cầu lông", "Chơi Tennis", "Bơi lội", "Leo núi", "Cắm trại", "Tiệc nướng ngoài trời", "Đi biển", "Lặn ngắm san hô", "Chèo thuyền Kayak", "Lướt ván", "Câu cá", "Thả diều", "Trượt patin", "Trượt ván", "Nhảy dây", "Tập Yoga ngoài trời", "Thái cực quyền", "Chụp ảnh phong cảnh", "Đi phượt bằng xe máy", "Du lịch bụi", "Ngắm bình minh", "Ngắm hoàng hôn", "Đi sở thú", "Tham quan vườn bách thảo", "Picnic trên bãi cỏ", "Đi hội chợ", "Đi công viên nước", "Chơi tàu lượn siêu tốc", "Làm vườn", "Chăm sóc cây cảnh", "Đi chợ hoa", "Trượt cỏ", "Đi cáp treo ngắm cảnh", "Tham gia lễ hội âm nhạc", "Marathon", "Chèo SUP", "Yoga bay", "Khiêu vũ ngoài trời", "Tập dưỡng sinh", "Chơi ném đĩa", "Đi xem đua xe", "Khám phá rừng nguyên sinh", "Đi săn ảnh đường phố", "Tham gia tour đêm di tích", "Ngồi cafe vỉa hè", "Ngủ nướng cuối tuần", "Tắm bồn với tinh dầu", "Ngắm mưa bên cửa sổ", "Ăn món mình thích", "Đi chợ sáng sớm", "Tự cạo râu/chăm sóc da mặt", "Ngắm nhìn đường phố từ ban công", "Nghe tiếng sóng biển", "Đốt nến thơm đêm khuya", "Đọc lại những dòng tin nhắn cũ", "Xem lại album ảnh gia đình", "Đi dạo siêu thị không mua gì", "Thử trang điểm theo phong cách mới", "Ngồi một mình ngẫm nghĩ", "Viết danh sách việc cần làm", "Tự thưởng một món quà nhỏ", "Nghe nhạc không lời", "Đi bộ dưới mưa nhẹ", "Ngửi mùi sách mới", "Thưởng thức cà phê ngon", "Nhìn dòng người qua lại", "Chơi với trẻ con", "Giúp đỡ một người lạ", "Làm đẹp cho thú cưng", "Học cách thắt cà vạt mới", "Thử các kiểu tóc khác nhau", "Ngắm những tòa nhà cao tầng", "Đi xe bus vòng quanh thành phố", "Khám phá một con hẻm mới"
];

const careers = ["Bác sĩ", "Kỹ sư", "Giáo viên", "Lập trình viên", "Thiết kế đồ họa", "Marketing", "Kinh doanh", "Kế toán", "Luật sư", "Nghệ sĩ", "Ca sĩ", "Diễn viên", "Nhà văn", "Nhà báo", "Đầu bếp", "Thợ mộc", "Thợ điện", "Thợ may", "Sinh viên", "Khởi nghiệp", "Freelancer"];

const npcImageLinks = [
  'https://i.postimg.cc/G3NS3ZVY/a922b88856b69ca027ced4e29a399b92.jpg',
  'https://i.postimg.cc/8C1ZnDJb/9ba3bbbb1217a1ca33a4348dfc42f92e.jpg',
  'https://i.postimg.cc/9FnXQNpn/e1d0cd594c41440c5e1dadc28f25c69a.jpg'
];

const randomNames = ["Yuri_Neko", "Usagi_Hime", "Sakura_Chan", "Pastel_Queen", "Momo_Bear"];

interface UserPost {
  id: string;
  content: string;
  image?: string;
  createdAt: string;
  comments: {
    id: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    createdAt: string;
  }[];
}

interface Profile {
  id: string;
  name: string;
  avatar: string;
  preferences: Record<string, string[]>;
  npcPreferences: Record<string, string[]>;
  followedNpcs: string[];
  chatMessages: Record<string, ChatMessage[]>;
  contacts: any[];
  userPosts: UserPost[];
  appBackground: string;
  profileBackground: string;
  chatBackground: string;
  avatarBg: string;
  npcCustomAvatars: Record<string, string>;
  npcCustomBgs: Record<string, string>;
  chatMode: 'online' | 'novel';
  novelMinChars: number;
  novelMaxChars: number;
}

export default function DatingScreen({ onBack }: { onBack: () => void }) {
  const [showSplash, setShowSplash] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string>('default');
  const [userApiKey, setUserApiKey] = useState('');
  const [userApiUrl, setUserApiUrl] = useState('');
  const [userModelName, setUserModelName] = useState('');
  const [userApiType, setUserApiType] = useState<'auto' | 'openai' | 'claude' | 'gemini' | 'custom'>('auto');
  const [userIsUnlimited, setUserIsUnlimited] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  const handleFetchModels = async () => {
    if (!userApiKey) {
      showToast("Vui lòng nhập API Key trước khi kéo Model.");
      return;
    }
    setFetchingModels(true);
    try {
      const models = await fetchAvailableModels(userApiUrl, userApiKey);
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(userModelName)) {
        setUserModelName(models[0]);
      }
      showToast(`Đã kéo thành công ${models.length} model!`);
    } catch (e) {
      showToast("Lỗi khi kéo model: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setFetchingModels(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      let loadedProfiles: Profile[] = [];
      const savedProfiles = await getFromDB('profiles', 'dating_profiles');
      const savedNpcImages = await getFromDB('settings', 'dating_npc_images');
      
      if (savedNpcImages) setNpcUploadedImages(savedNpcImages);
      else {
        const localNpcImages = localStorage.getItem('dating_npc_images');
        if (localNpcImages) {
          try {
            const parsed = JSON.parse(localNpcImages);
            setNpcUploadedImages(parsed);
          } catch (e) {
            console.error('Failed to parse dating_npc_images from localStorage', e);
          }
        }
      }

      if (savedProfiles) {
        loadedProfiles = savedProfiles;
        setProfiles(savedProfiles);
      } else {
        const localProfilesStr = localStorage.getItem('dating_profiles');
        if (localProfilesStr) {
          try {
            loadedProfiles = JSON.parse(localProfilesStr);
            setProfiles(loadedProfiles);
          } catch (e) {
            console.error('Failed to parse dating_profiles from localStorage', e);
          }
        }
        
        if (loadedProfiles.length === 0) {
          // Migration logic
          const oldPrefs = JSON.parse(localStorage.getItem('dating_user_prefs') || '{"age":[],"personality":[],"gender":[],"hobbies":[],"career":[]}');
          const oldFollowed = JSON.parse(localStorage.getItem('dating_followed_npcs') || '[]');
          const oldAvatar = localStorage.getItem('dating_avatar') || npcImageLinks[0];
          const oldBg = localStorage.getItem('dating_bg') || '';
          const oldProfileBg = localStorage.getItem('dating_profile_bg') || '';
          const oldChatBg = localStorage.getItem('dating_chat_bg') || '';
          
          const initialProfile: Profile = {
            id: 'default',
            name: 'Người dùng mới',
            avatar: oldAvatar,
            preferences: oldPrefs,
            npcPreferences: { age: [], personality: [], gender: [], hobbies: [], career: [] },
            followedNpcs: oldFollowed,
            chatMessages: {},
            contacts: [],
            userPosts: [],
            appBackground: oldBg,
            profileBackground: oldProfileBg,
            chatBackground: oldChatBg,
            avatarBg: '#F3B4C2',
            npcCustomAvatars: {},
            npcCustomBgs: {},
            chatMode: 'online',
            novelMinChars: 500,
            novelMaxChars: 2000
          };
          loadedProfiles = [initialProfile];
          setProfiles([initialProfile]);
        }
      }

      const savedCurrentProfileId = await getFromDB('settings', 'dating_current_profile_id');
      let activeProfileId = 'default';
      if (savedCurrentProfileId) {
        setCurrentProfileId(savedCurrentProfileId);
        activeProfileId = savedCurrentProfileId;
      }

      const activeProfile = loadedProfiles.find(p => p.id === activeProfileId) || loadedProfiles[0];
      if (activeProfile) {
        isSwitching.current = true;
        setUserAvatar(activeProfile.avatar);
        setUserPreferences(activeProfile.preferences);
        setNpcPreferences(activeProfile.npcPreferences);
        setFollowedNpcs(activeProfile.followedNpcs);
        setChatMessages(activeProfile.chatMessages);
        setContacts(activeProfile.contacts);
        setAppBackground(activeProfile.appBackground);
        setProfileBackground(activeProfile.profileBackground);
        setChatBackground(activeProfile.chatBackground);
        setAvatarBg(activeProfile.avatarBg || '#F3B4C2');
        setNpcCustomAvatars(activeProfile.npcCustomAvatars || {});
        setNpcCustomBgs(activeProfile.npcCustomBgs || {});
        setChatMode(activeProfile.chatMode);
        setNovelMinChars(activeProfile.novelMinChars);
        setNovelMaxChars(activeProfile.novelMaxChars);
        setUserPosts(activeProfile.userPosts || []);
        
        setTimeout(() => {
          isSwitching.current = false;
        }, 100);
      }

      const savedSettings = await getFromDB('settings', 'kotokoo_settings');
      if (savedSettings) {
        setUserApiKey(savedSettings.apiKey || '');
        setUserApiUrl(savedSettings.endpoint || '');
        setUserModelName(savedSettings.model || '');
        setUserApiType(savedSettings.apiType || 'auto');
        setUserIsUnlimited(savedSettings.isUnlimited || false);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [npcUploadedImages, setNpcUploadedImages] = useState<string[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveToDB('profiles', 'dating_profiles', profiles);
        await saveToDB('settings', 'dating_current_profile_id', currentProfileId);
        await saveToDB('settings', 'dating_npc_images', npcUploadedImages);
        await saveToDB('settings', 'kotokoo_settings', { 
          apiKey: userApiKey, 
          endpoint: userApiUrl, 
          model: userModelName,
          apiType: userApiType,
          isUnlimited: userIsUnlimited
        });
        console.log('DatingScreen: Data saved to IndexedDB');
      } catch (error) {
        console.error('DatingScreen: Failed to save to IndexedDB', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [profiles, currentProfileId, userApiKey, userApiUrl, userModelName, userApiType, userIsUnlimited, npcUploadedImages, isLoaded]);

  const currentProfile = profiles.find(p => p.id === currentProfileId) || profiles[0] || {
    id: 'default',
    name: 'Người dùng mới',
    avatar: npcImageLinks[0],
    preferences: { age: [], personality: [], gender: [], hobbies: [], career: [] },
    npcPreferences: { age: [], personality: [], gender: [], hobbies: [], career: [] },
    followedNpcs: [],
    chatMessages: {},
    contacts: [],
    userPosts: [],
    appBackground: '',
    profileBackground: '',
    chatBackground: '',
    avatarBg: '#F3B4C2',
    npcCustomAvatars: {},
    npcCustomBgs: {},
    chatMode: 'online',
    novelMinChars: 500,
    novelMaxChars: 2000
  };

  const [activeTab, setActiveTab] = useState<'onboarding' | 'npc_settings' | 'feed' | 'random' | 'inbox' | 'profile'>('onboarding');
  const [appBackground, setAppBackground] = useState(currentProfile.appBackground);
  const [profileBackground, setProfileBackground] = useState(currentProfile.profileBackground);
  const [userAvatar, setUserAvatar] = useState(currentProfile.avatar);
  
  // Load backgrounds from IndexedDB for current profile
  useEffect(() => {
    const loadBgs = async () => {
      const bg = await getFromDB('backgrounds', `dating_bg_${currentProfileId}`);
      if (bg) setAppBackground(bg);
      
      const pbg = await getFromDB('backgrounds', `dating_profile_bg_${currentProfileId}`);
      if (pbg) setProfileBackground(pbg);
      
      const cbg = await getFromDB('backgrounds', `dating_chat_bg_${currentProfileId}`);
      if (cbg) setChatBackground(cbg);
    };
    loadBgs();
  }, [currentProfileId]);
  const [npcPosts, setNpcPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(1100);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [randomMatchState, setRandomMatchState] = useState<'idle' | 'rolling' | 'matched'>('idle');
  const [matchedIndex, setMatchedIndex] = useState(-1);
  const onboardingScrollRef = useRef<HTMLDivElement>(null);
  const npcSettingsScrollRef = useRef<HTMLDivElement>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [npcSettingsStep, setNpcSettingsStep] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, onConfirm: () => void } | null>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [trialTimer, setTrialTimer] = useState<number | null>(null);
  const [showTrialEndModal, setShowTrialEndModal] = useState(false);
  const [activeNpcProfile, setActiveNpcProfile] = useState<any>(null);
  const [chatBackground, setChatBackground] = useState(currentProfile.chatBackground);
  const [avatarBg, setAvatarBg] = useState(currentProfile.avatarBg || '#F3B4C2');
  const [npcCustomAvatars, setNpcCustomAvatars] = useState<Record<string, string>>(currentProfile.npcCustomAvatars || {});
  const [npcCustomBgs, setNpcCustomBgs] = useState<Record<string, string>>(currentProfile.npcCustomBgs || {});
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(currentProfile.chatMessages);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatLoadingMsg, setChatLoadingMsg] = useState('Chờ chút nhaa ~ iu ♡');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const [userPreferences, setUserPreferences] = useState<Record<string, string[]>>(currentProfile.preferences);
  const [npcPreferences, setNpcPreferences] = useState<Record<string, string[]>>(currentProfile.npcPreferences);
  const [followedNpcs, setFollowedNpcs] = useState<string[]>(currentProfile.followedNpcs);
  const [contacts, setContacts] = useState<any[]>(currentProfile.contacts);
  const [chatMode, setChatMode] = useState<'online' | 'novel'>(currentProfile.chatMode);
  const [novelMinChars, setNovelMinChars] = useState(currentProfile.novelMinChars);
  const [novelMaxChars, setNovelMaxChars] = useState(currentProfile.novelMaxChars);
  const [userPosts, setUserPosts] = useState<UserPost[]>(currentProfile.userPosts);
  const [npcExtraPosts, setNpcExtraPosts] = useState<Record<string, any[]>>({});
  const [trialLikes, setTrialLikes] = useState<Record<string, { user: boolean; npc: boolean }>>({});
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [customizingNpc, setCustomizingNpc] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const isSwitching = useRef(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const profileBgInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const npcImageInputRef = useRef<HTMLInputElement>(null);
  const chatBgInputRef = useRef<HTMLInputElement>(null);
  const userPostImageInputRef = useRef<HTMLInputElement>(null);
  const npcCustomAvatarInputRef = useRef<HTMLInputElement>(null);
  const npcCustomBgInputRef = useRef<HTMLInputElement>(null);

  const allNpcImages = [...npcImageLinks, ...npcUploadedImages];

  useEffect(() => {
    setShowSplash(false);
  }, []);

  // Sync current profile changes back to profiles array
  useEffect(() => {
    if (isSwitching.current) return;
    setProfiles(prev => prev.map(p => p.id === currentProfileId ? {
      ...p,
      avatar: userAvatar,
      preferences: userPreferences,
      npcPreferences: npcPreferences,
      followedNpcs: followedNpcs,
      chatMessages: chatMessages,
      contacts: contacts,
      appBackground: appBackground,
      profileBackground: profileBackground,
      chatBackground: chatBackground,
      avatarBg: avatarBg,
      npcCustomAvatars: npcCustomAvatars,
      npcCustomBgs: npcCustomBgs,
      chatMode: chatMode,
      novelMinChars: novelMinChars,
      novelMaxChars: novelMaxChars,
      userPosts: userPosts
    } : p));
  }, [userAvatar, userPreferences, npcPreferences, followedNpcs, chatMessages, contacts, appBackground, profileBackground, chatBackground, avatarBg, npcCustomAvatars, npcCustomBgs, chatMode, novelMinChars, novelMaxChars, userPosts, currentProfileId]);

  const createNewProfile = () => {
    const name = prompt('Nhập tên cho tài khoản mới:', `Người dùng ${profiles.length + 1}`);
    if (!name) return;

    const newProfile: Profile = {
      id: Date.now().toString(),
      name: name,
      avatar: npcImageLinks[0],
      preferences: { age: [], personality: [], gender: [], hobbies: [], career: [] },
      npcPreferences: { age: [], personality: [], gender: [], hobbies: [], career: [] },
      followedNpcs: [],
      chatMessages: {},
      contacts: [],
      userPosts: [],
      appBackground: '',
      profileBackground: '',
      chatBackground: '',
      avatarBg: '#F3B4C2',
      npcCustomAvatars: {},
      npcCustomBgs: {},
      chatMode: 'online',
      novelMinChars: 500,
      novelMaxChars: 2000
    };

    setProfiles(prev => [...prev, newProfile]);
    switchProfile(newProfile.id);
    showToast('Đã tạo tài khoản mới ♡');
  };

  const switchProfile = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;

    isSwitching.current = true;
    setCurrentProfileId(id);
    setUserAvatar(profile.avatar);
    setUserPreferences(profile.preferences);
    setNpcPreferences(profile.npcPreferences);
    setFollowedNpcs(profile.followedNpcs);
    setChatMessages(profile.chatMessages);
    setContacts(profile.contacts);
    setAppBackground(profile.appBackground);
    setProfileBackground(profile.profileBackground);
    setChatBackground(profile.chatBackground);
    setAvatarBg(profile.avatarBg || '#F3B4C2');
    setNpcCustomAvatars(profile.npcCustomAvatars || {});
    setNpcCustomBgs(profile.npcCustomBgs || {});
    setChatMode(profile.chatMode);
    setNovelMinChars(profile.novelMinChars);
    setNovelMaxChars(profile.novelMaxChars);
    setUserPosts(profile.userPosts || []);
    
    // Use a small timeout to ensure states are updated before re-enabling sync
    setTimeout(() => {
      isSwitching.current = false;
    }, 100);

    setShowProfileSwitcher(false);
    showToast(`Đã chuyển sang ${profile.name} ♡`);
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      showToast('Bạn không thể xóa tài khoản cuối cùng!');
      return;
    }
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (currentProfileId === id) {
      switchProfile(profiles.find(p => p.id !== id)!.id);
    }
    showToast('Đã xóa tài khoản');
  };

  const renameProfile = (id: string, newName: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    showToast('Đã đổi tên tài khoản');
  };

  // Removed automatic loading on mount
  // useEffect(() => {
  //   loadMoreNpcPosts(10);
  // }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showToast = (msg: string) => {
    setLoadingMsg(msg);
    setTimeout(() => setLoadingMsg(''), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, dbKey?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setter(compressed);
        if (dbKey) {
          await saveToDB('backgrounds', dbKey, compressed);
        }
      } catch (error) {
        console.error("Failed to upload image", error);
      }
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeChat]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isChatLoading) {
      const msgs = [
        "Chờ chút nhaa ~ iu ♡",
        "Đang nấu nè nhaaa ~ ✨",
        "Đang gõ phím lạch cạch... ⌨️",
        "Đợi xíu xiu nha... 🌸",
        "Đang suy nghĩ câu trả lời hay nhất... 💭"
      ];
      interval = setInterval(() => {
        setChatLoadingMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isChatLoading]);

  const handleSendMessage = async (customInput?: string, isContinue = false) => {
    const input = customInput !== undefined ? customInput : chatInput;
    if (!input.trim() && !isContinue || !activeChat || isChatLoading) return;

    const chatId = activeChat.id || activeChat.name;
    const currentHistory = chatMessages[chatId] || [];
    
    if (!isContinue) {
      const newUserMsg: ChatMessage = { role: 'user', content: input };
      setChatMessages(prev => ({
        ...prev,
        [chatId]: [...currentHistory, newUserMsg]
      }));
      setChatInput('');
    }
    
    const msgs = [
      "Chờ chút nhaa ~ iu ♡",
      "Đang nấu nè nhaaa ~ ✨",
      "Đang gõ phím lạch cạch... ⌨️",
      "Đợi xíu xiu nha... 🌸"
    ];
    setChatLoadingMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    setIsChatLoading(true);

    try {
      const historyToPass = isContinue ? currentHistory : [...currentHistory, { role: 'user', content: input } as ChatMessage];
      const promptToPass = isContinue ? "Hãy viết tiếp câu chuyện/đoạn chat trên." : input;

      const response = await generateNPCResponse(
        activeChat,
        promptToPass,
        historyToPass,
        {
          name: currentProfile.name,
          intro: "Người dùng đang tìm kiếm duyên phận",
          target: userPreferences.career?.join(', ') || '',
          reason: "Tìm kiếm tình yêu",
          mc: "Koko",
          gender: "female",
          targetGender: "male",
          minChars: novelMinChars,
          maxChars: novelMaxChars,
          avatarBg: avatarBg,
          chatMode: chatMode
        },
        { apiKey: userApiKey, endpoint: userApiUrl, model: userModelName, apiType: userApiType, isUnlimited: userIsUnlimited }
      );
      
      const responseContent = response.content;
      
      if (chatMode === 'online') {
        const bubbles = response.content.split(/\n+/).filter(b => b.trim().length > 0);
        let finalBubbles = bubbles;
        if (bubbles.length === 1 && bubbles[0].length > 100) {
          finalBubbles = bubbles[0].split(/(?<=[.!?])\s+/).filter(b => b.trim().length > 0);
        }
        const limitedBubbles = finalBubbles.slice(0, 20);
        const finalContent = response.content;

        setChatMessages(prev => {
          const newHistory = [...(prev[chatId] || [])];
          limitedBubbles.forEach(content => {
            newHistory.push({ role: 'assistant', content });
          });
          return { ...prev, [chatId]: newHistory };
        });
      } else {
        setChatMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), { role: 'assistant', content: response }]
        }));
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi kết nối AI');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDeleteMessage = (index: number) => {
    if (!activeChat) return;
    const chatId = activeChat.id || activeChat.name;
    setChatMessages(prev => {
      const newMsgs = [...(prev[chatId] || [])];
      newMsgs.splice(index, 1);
      return { ...prev, [chatId]: newMsgs };
    });
  };

  const handleRegenerateMessage = async (index: number) => {
    if (!activeChat || isChatLoading) return;
    const chatId = activeChat.id || activeChat.name;
    const currentMsgs = chatMessages[chatId] || [];
    
    // Find the last user message before this index
    let lastUserMsgIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (currentMsgs[i].role === 'user') {
        lastUserMsgIndex = i;
        break;
      }
    }

    if (lastUserMsgIndex === -1) return; // No user message to regenerate from

    const historyToPass = currentMsgs.slice(0, lastUserMsgIndex);
    const userPrompt = currentMsgs[lastUserMsgIndex].content;

    setChatMessages(prev => ({
      ...prev,
      [chatId]: currentMsgs.slice(0, index)
    }));

    const msgs = [
      "Chờ chút nhaa ~ iu ♡",
      "Đang nấu nè nhaaa ~ ✨",
      "Đang gõ phím lạch cạch... ⌨️",
      "Đợi xíu xiu nha... 🌸"
    ];
    setChatLoadingMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    setIsChatLoading(true);
    try {
      const response = await generateNPCResponse(
        activeChat,
        userPrompt,
        historyToPass,
        {
          name: currentProfile.name,
          intro: "Người dùng đang tìm kiếm duyên phận",
          target: userPreferences.career?.join(', ') || '',
          reason: "Tìm kiếm tình yêu",
          mc: "Koko",
          gender: "female",
          targetGender: "male",
          minChars: novelMinChars,
          maxChars: novelMaxChars,
          avatarBg: avatarBg,
          chatMode: chatMode
        },
        { apiKey: userApiKey, endpoint: userApiUrl, model: userModelName, apiType: userApiType }
      );
      
      const responseContent = response.content;
      
      if (chatMode === 'online') {
        const bubbles = response.content.split('\n').filter(b => b.trim().length > 0).slice(0, 20);
        setChatMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), ...bubbles.map(b => ({ role: 'assistant' as const, content: b }))]
        }));
      } else {
        setChatMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), { role: 'assistant', content: response }]
        }));
      }
    } catch (error: any) {
      showToast(error.message || 'Lỗi kết nối AI');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleNpcImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const newImages = [...npcUploadedImages, result];
        setNpcUploadedImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadMoreNpcPosts = async (count: number) => {
    setIsChatLoading(true);
    setChatLoadingMsg(`Sách Thế Giới đang kết nối với ${count} NPC mới... ♡`);
    
    try {
      // Batching for large counts to ensure quality and avoid token limits
      const batchSize = 5;
      const totalBatches = Math.ceil(count / batchSize);
      
      for (let b = 0; b < totalBatches; b++) {
        const currentBatchCount = Math.min(batchSize, count - b * batchSize);
        const selectedNames = Array.from({ length: currentBatchCount }).map(() => randomNames[Math.floor(Math.random() * randomNames.length)]);
        
        setChatLoadingMsg(`Đang tải đợt ${b + 1}/${totalBatches} (${currentBatchCount} NPC)... ♡`);

        const prompt = `Hãy tạo ${currentBatchCount} bài đăng tâm trạng hoặc chia sẻ cuộc sống cho một ứng dụng hẹn hò. 
        Các nhân vật có tên là: ${selectedNames.join(', ')}. 
        YÊU CẦU CỰC KỲ QUAN TRỌNG: 
        1. Mỗi nội dung bài viết PHẢI DÀI TRÊN 500 KÝ TỰ. 
        2. Nội dung phải sâu sắc, thu hút, tự nhiên và mang đậm cá tính riêng.
        3. TRẢ VỀ DANH SÁCH CÁC OBJECT JSON, MỖI OBJECT TRÊN MỘT DÒNG, ĐƯỢC PHÂN CÁCH BỞI DẤU XUỐNG DÒNG. VÍ DỤ: 
        {"name": "Tên NPC", "content": "Nội dung bài viết"}
        {"name": "Tên NPC", "content": "Nội dung bài viết"}
        4. BẮT BUỘC: Đảm bảo JSON hợp lệ, không bị cắt cụt.
        5. KHÔNG GIẢI THÍCH, KHÔNG SUY NGHĨ (THINKING), KHÔNG MARKDOWN, KHÔNG CÓ BẤT KỲ CHỮ NÀO KHÁC NGOÀI JSON.`;

        const koko: KokoPrompt = {
          title: "Người dùng Sách Thế Giới",
          context: `Bạn đang tạo ${currentBatchCount} bài đăng chất lượng cao cho các NPC trên ứng dụng hẹn hò Sách Thế Giới.`,
          rules: "BẮT BUỘC viết bài đăng dài trên 500 ký tự cho mỗi NPC. Trả về JSON trên từng dòng.",
          length: `Mỗi bài đăng tối thiểu 500 ký tự.`,
          ooc: "Không OOC."
        };

        const chatSettings: any = {
          mode: 'novel',
          minChars: 500,
          maxChars: 5000,
          maxTokens: 100000 // Maximize tokens to avoid limits
        };

        try {
          const apiSettings = {
            endpoint: userApiUrl,
            apiKey: userApiKey,
            model: userModelName,
            apiType: userApiType,
            systemPrompt: "Bạn là một chuyên gia tạo bài đăng cho ứng dụng hẹn hò.",
            maxTokens: 100000,
            isUnlimited: userIsUnlimited
          };
          const stream = await sendCoreMessageStream(prompt, [], koko, chatSettings, apiSettings);
          
          if (!stream.body) {
            throw new Error("Phản hồi từ API không có nội dung (stream body is null).");
          }

          const reader = stream.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            accumulatedContent += decoder.decode(value, { stream: true });
            
            const lines = accumulatedContent.split('\n');
            accumulatedContent = lines.pop() || "";
            
            for (const line of lines) {
              if (line.trim().length === 0) continue;
              try {
                const item = JSON.parse(line.trim());
                const name = item.name || selectedNames[Math.floor(Math.random() * selectedNames.length)];
                const content = item.content || 'Đang lướt app Sách Thế Giới tìm bạn... ♡';
                
                const avatar = allNpcImages[Math.floor(Math.random() * allNpcImages.length)];
                const image = allNpcImages[Math.floor(Math.random() * allNpcImages.length)];
                
                const newPost = {
                  id: Date.now() + Math.random(),
                  name,
                  avatar,
                  image,
                  content: content,
                  comments: 0,
                  commentsList: []
                };
                setNpcPosts(prev => [...prev, newPost]);
              } catch (e) {
                console.error("Lỗi parse JSON dòng:", line, e);
              }
            }
          }
          
          // Add a small delay between batches to avoid rate limits
          if (b < totalBatches - 1) {
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (err: any) {
          console.error(`Error in batch ${b + 1}:`, err);
          let errorMessage = err.message;
          if (err.message === 'Failed to fetch') {
            errorMessage = "Không thể kết nối tới API Proxy. Hãy kiểm tra lại Proxy URL trong Cài đặt và đảm bảo bạn có kết nối Internet.";
          }
          
          setChatLoadingMsg(`Lỗi ở đợt ${b + 1}: ${errorMessage}. Đang thử lại sau 3 giây...`);
          await new Promise(r => setTimeout(r, 3000));
          // Retry once
          b--; 
        }
      }
    } catch (error) {
      console.error('Error loading NPC posts:', error);
      showToast('Không thể kết nối với NPC lúc này.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleOnboardingScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    setOnboardingStep(Math.round(scrollLeft / width));
  };

  const handleNpcSettingsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    setNpcSettingsStep(Math.round(scrollLeft / width));
  };

  const scrollToNextOnboarding = () => {
    if (onboardingScrollRef.current) {
      const nextStep = onboardingStep + 1;
      if (nextStep < 5) {
        onboardingScrollRef.current.scrollTo({
          left: nextStep * onboardingScrollRef.current.offsetWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  const scrollToNextNpcSettings = () => {
    if (npcSettingsScrollRef.current) {
      const nextStep = npcSettingsStep + 1;
      if (nextStep < 5) {
        npcSettingsScrollRef.current.scrollTo({
          left: nextStep * npcSettingsScrollRef.current.offsetWidth,
          behavior: 'smooth'
        });
      }
    }
  };
  const handleNpcPostHeart = async (postId: number, npcName: string) => {
    const post = npcPosts.find(p => p.id === postId);
    if (!post) return;

    setIsChatLoading(true);
    setChatLoadingMsg('Hệ thống đang gọi 200 NPC vào bình luận... ♡');
    
    try {
      // Add to contacts if not exists
      if (!contacts.find(c => c.name === post.name)) {
        setContacts(prev => [...prev, { id: post.id, name: post.name, avatar: post.avatar, lastMessage: 'Vừa thả tim bài đăng của họ' }]);
      }

      const totalComments = 200;

      const prompt = `Dựa trên bài đăng của ${npcName} với nội dung: "${post.content || 'Đang lướt app Sách Thế Giới tìm bạn... ♡'}", 
      hãy tạo ra ${totalComments} bình luận ngắn (dưới 15 từ), tự nhiên, đa dạng từ các NPC khác nhau. 
      Các bình luận phải thể hiện sự quan tâm, đồng cảm, khen ngợi hoặc đặt câu hỏi liên quan đến nội dung bài viết.
      Phong cách: trẻ trung, dễ thương, thả thính, khen ngợi, hoặc hỏi thăm. 
      Yêu cầu: Trả về danh sách ${totalComments} bình luận, mỗi bình luận trên một dòng, KHÔNG đánh số, KHÔNG có ký tự đặc biệt ở đầu dòng. KHÔNG GIẢI THÍCH.`;

      const koko: KokoPrompt = {
        title: 'Dating App NPC Comments Generator',
        context: `Bạn là một hệ thống tạo bình luận tự động cho mạng xã hội hẹn hò. Bạn đang tạo bình luận cho bài đăng của ${npcName}.`,
        rules: `Tạo ${totalComments} bình luận ngắn, mỗi bình luận một dòng. Không đánh số. Không có ký tự đặc biệt ở đầu.`,
        length: `${totalComments} dòng`,
        ooc: 'Không OOC'
      };

      const stream = await sendCoreMessageStream(prompt, [], koko, {
        mode: 'online',
        minChars: 10,
        maxChars: 100,
        maxTokens: 50000,
        timeoutMinutes: 5
      }, {
        endpoint: userApiUrl,
        apiKey: userApiKey,
        model: userModelName,
        apiType: userApiType,
        systemPrompt: "Bạn là một hệ thống tạo bình luận tự động cho mạng xã hội hẹn hò.",
        maxTokens: 50000,
        isUnlimited: userIsUnlimited
      });

      if (!stream.body) {
        throw new Error("Phản hồi từ API không có nội dung.");
      }

      const reader = stream.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let lastUpdateCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        accumulatedContent += decoder.decode(value, { stream: true });
        
        const lines = accumulatedContent.split('\n');
        accumulatedContent = lines.pop() || "";
        
        const newComments = lines.filter(line => line.trim().length > 0);
        
        for (const line of newComments) {
          let jsonStr = line.trim();
          if (jsonStr.length === 0) continue;
          
          const item = extractJSON(jsonStr);
          if (!item) continue;

          try {
            let content = "";
            if (item.choices && item.choices[0] && item.choices[0].delta && item.choices[0].delta.content) {
              content = item.choices[0].delta.content;
            } else if (item.content) {
              content = item.content;
            } else {
              continue;
            }
            
            const commentLines = content.split('\n').filter(l => l.trim().length > 0);
            
            for (const commentContent of commentLines) {
              const newComment = {
                id: Math.random().toString(),
                authorName: randomNames[Math.floor(Math.random() * randomNames.length)],
                authorAvatar: npcImageLinks[Math.floor(Math.random() * npcImageLinks.length)],
                content: commentContent.trim(),
                createdAt: new Date().toISOString()
              };

              setNpcPosts(prev => prev.map(p => p.id === postId ? { 
                ...p, 
                comments: p.comments + 1,
                commentsList: [...(p.commentsList || []), newComment]
              } : p));
            }
            
            setChatLoadingMsg(`Đang gọi NPC... Đã cập nhật bình luận... ♡`);
          } catch (e) {
            console.error("Lỗi parse JSON dòng:", jsonStr, e);
          }
        }
      }

      setFollowedNpcs(prev => {
        if (!prev.includes(npcName)) {
          return [...prev, npcName];
        }
        return prev;
      });
    } catch (error) {
      console.error('Error generating comments:', error);
      // Fallback if API fails
      setNpcPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 50 } : p));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCreateUserPost = () => {
    if (!newPostContent.trim()) {
      showToast('Vui lòng nhập nội dung bài viết ♡');
      return;
    }

    const newPost: UserPost = {
      id: Date.now().toString(),
      content: newPostContent,
      image: newPostImage || undefined,
      createdAt: new Date().toISOString(),
      comments: []
    };

    setUserPosts(prev => [newPost, ...prev]);
    setNewPostContent('');
    setNewPostImage(null);
    setShowCreatePostModal(false);
    showToast('Đã đăng bài thành công ♡');
  };

  const handleHeartUserPost = async (postId: string) => {
    const post = userPosts.find(p => p.id === postId);
    if (!post) return;

    setIsChatLoading(true);
    setChatLoadingMsg('Hệ thống đang gọi 300 NPC vào bình luận... ♡');

    try {
      const totalComments = 300;

      const prompt = `Người dùng vừa đăng một bài viết với nội dung: "${post.content}". 
      Hãy tạo ra ${totalComments} bình luận từ các NPC khác nhau. 
      Mỗi NPC nên có một bình luận riêng biệt, tự nhiên, thể hiện tính cách của họ.
      Yêu cầu: Trả về danh sách ${totalComments} bình luận theo định dạng: Tên NPC | Nội dung bình luận. 
      Mỗi bình luận trên một dòng. Không đánh số.`;

      const koko: KokoPrompt = {
        title: 'User Post NPC Comments Generator',
        context: `Bạn là một hệ thống tạo bình luận từ NPC cho bài đăng của người dùng.`,
        rules: `Tạo ${totalComments} bình luận từ danh sách NPC. Định dạng: Tên NPC | Nội dung. Mỗi dòng một bình luận.`,
        length: `${totalComments} dòng`,
        ooc: 'Không OOC'
      };

      const response = await sendCoreMessage(prompt, [], koko, {
        mode: 'online',
        minChars: 10,
        maxChars: 100,
        maxTokens: 50000,
        timeoutMinutes: 5
      }, {
        endpoint: userApiUrl,
        apiKey: userApiKey,
        model: userModelName,
        apiType: userApiType,
        systemPrompt: "Bạn là một hệ thống tạo bình luận từ NPC cho bài đăng của người dùng.",
        maxTokens: 50000,
        isUnlimited: userIsUnlimited
      });

      const lines = response.content.split('\n').filter(line => line.includes('|')).slice(0, totalComments);
      const batchComments = lines.map((line, i) => {
        const [name, content] = line.split('|').map(s => s.trim());
        return {
          id: Math.random().toString(),
          authorName: name || randomNames[Math.floor(Math.random() * randomNames.length)],
          authorAvatar: npcImageLinks[Math.floor(Math.random() * npcImageLinks.length)],
          content: content || 'Bài viết hay quá! ♡',
          createdAt: new Date().toISOString()
        };
      });

      setUserPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: [...p.comments, ...batchComments]
      } : p));

      showToast(`Đã có thêm NPC bình luận bài của bạn ♡`);
    } catch (error) {
      console.error('Error generating user post comments:', error);
      showToast('Không thể gọi NPC lúc này, thử lại sau nhé ♡');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleUserPostImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadMoreNpcProfilePosts = async (npcName: string) => {
    setIsChatLoading(true);
    setChatLoadingMsg(`Đang tạo 10 bài đăng cho ${npcName}... ♡`);
    
    try {
      const prompt = `Hãy viết 10 bài đăng tâm trạng hoặc chia sẻ cuộc sống cho một ứng dụng hẹn hò. 
      Nhân vật tên là ${npcName}. 
      Yêu cầu: Mỗi nội dung phải trên 1000 ký tự. 
      Trả về DANH SÁCH CÁC OBJECT JSON, MỖI OBJECT TRÊN MỘT DÒNG: {"content": "Nội dung bài viết"}. 
      KHÔNG GIẢI THÍCH, KHÔNG MARKDOWN, KHÔNG CÓ BẤT KỲ CHỮ NÀO KHÁC NGOÀI JSON.`;

      const koko: KokoPrompt = {
        title: "Người dùng Sách Thế Giới",
        context: `Bạn là ${npcName}, đang đăng 10 bài trên ứng dụng hẹn hò Sách Thế Giới.`,
        rules: "Viết 10 bài đăng dài trên 1000 ký tự. Trả về JSON trên từng dòng.",
        length: "10 bài đăng, mỗi bài 1000 ký tự.",
        ooc: "Không OOC."
      };

      const stream = await sendCoreMessageStream(prompt, [], koko, {
        mode: 'novel',
        minChars: 1000,
        maxChars: 5000,
        maxTokens: 20000
      }, {
        endpoint: userApiUrl,
        apiKey: userApiKey,
        model: userModelName,
        apiType: userApiType,
        systemPrompt: `Bạn là ${npcName}, đang đăng 10 bài trên ứng dụng hẹn hò Sách Thế Giới.`,
        maxTokens: 20000,
        isUnlimited: userIsUnlimited
      });

      if (!stream.body) throw new Error("Phản hồi từ API không có nội dung.");

      const reader = stream.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      const newPosts: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        accumulatedContent += decoder.decode(value, { stream: true });
        const lines = accumulatedContent.split('\n');
        accumulatedContent = lines.pop() || "";
        
        for (const line of lines) {
          let jsonStr = line.trim();
          if (jsonStr.length === 0) continue;
          
          const item = extractJSON(jsonStr);
          if (!item) continue;

          try {
            // Extract content from OpenAI-like streaming format
            let content = "";
            if (item.choices && item.choices[0] && item.choices[0].delta && item.choices[0].delta.content) {
              content = item.choices[0].delta.content;
            } else if (item.content) {
              content = item.content;
            } else {
              continue; // Skip if no content
            }
            
            // If content is a full JSON string (as requested in prompt), parse it
            try {
              const parsedContent = JSON.parse(content);
              if (parsedContent.content) {
                const image = allNpcImages[Math.floor(Math.random() * allNpcImages.length)];
                newPosts.push({
                  id: Date.now() + Math.random(),
                  image,
                  content: parsedContent.content.trim(),
                  date: new Date().toLocaleDateString('vi-VN')
                });
              }
            } catch (e) {
              // Not a full JSON object, maybe just partial content
              console.debug("Partial content received, accumulating...");
            }
          } catch (e) {
            console.error("Lỗi parse JSON dòng:", jsonStr, e);
          }
        }
      }

      setNpcExtraPosts(prev => ({
        ...prev,
        [npcName]: [...(prev[npcName] || []), ...newPosts]
      }));
      
      showToast(`Đã tạo xong 10 bài đăng cho ${npcName} ♡`);
    } catch (error: any) {
      console.error('Error generating profile posts:', error);
      showToast('Không thể tạo bài đăng lúc này, thử lại sau nhé ♡');
    } finally {
      setIsChatLoading(false);
    }
  };

  const toggleTrialLike = (chatId: string) => {
    setTrialLikes(prev => {
      const current = prev[chatId] || { user: false, npc: false };
      const newUserLike = !current.user;
      
      // Simulate NPC liking back with 80% probability if user likes
      const newNpcLike = newUserLike ? (Math.random() < 0.8) : current.npc;
      
      const updated = { user: newUserLike, npc: newNpcLike };
      
      if (updated.user && updated.npc) {
        showToast("Cả hai đều đã thích nhau! Cuộc trò chuyện sẽ được lưu lại vĩnh viễn ♡");
        // Update contact to be permanent
        setContacts(c => c.map(contact => contact.id === chatId ? { ...contact, isTrial: false } : contact));
        setActiveChat(prevChat => prevChat ? { ...prevChat, isTrial: false } : null);
      }
      
      return { ...prev, [chatId]: updated };
    });
  };

  const togglePreference = (category: string, item: string) => {
    setUserPreferences(prev => {
      const current = prev[category] || [];
      const updated = current.includes(item) 
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [category]: updated };
    });
  };

  const toggleNpcPreference = (category: string, item: string) => {
    setNpcPreferences(prev => {
      const current = prev[category] || [];
      const updated = current.includes(item) 
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [category]: updated };
    });
  };

  const handleUserPostHeart = () => {
    setIsChatLoading(true);
    setChatLoadingMsg('Hệ thống đang làm việc bạn vui lòng chờ một chút...');
    setTimeout(() => {
      setFollowerCount(prev => prev + 100);
      setIsChatLoading(false);
      showToast("Đã +100 người ngẫu nhiên kết nối với bạn ♡");
    }, 800);
  };

  const startRandomMatch = () => {
    setRandomMatchState('rolling');
    showToast('Sách Thế Giới đang xoay chuyển...');
    
    let rolls = 0;
    const interval = setInterval(() => {
      setMatchedIndex(rolls % 20);
      rolls++;
      if (rolls > 30) {
        clearInterval(interval);
        setRandomMatchState('matched');
        const matchIdx = Math.floor(Math.random() * 20);
        setMatchedIndex(matchIdx);
        
        setTimeout(() => {
          const isRejected = Math.random() < (2 / 15);
          if (isRejected) {
            showToast("Người này có vẻ đang bận và đã từ chối kết nối. Hãy thử tìm người khác nhé! 💔");
            setRandomMatchState('idle');
          } else {
            const newChat = {
              id: `random_${Date.now()}`,
              name: randomNames[Math.floor(Math.random() * randomNames.length)],
              avatar: npcImageLinks[matchIdx % npcImageLinks.length],
              isTrial: true
            };
            
            // Add to contacts if not already there
            setContacts(prev => {
              if (!prev.find(c => c.id === newChat.id)) {
                return [...prev, {
                  id: newChat.id,
                  name: newChat.name,
                  avatar: newChat.avatar,
                  lastMessage: 'Vừa kết nối ngẫu nhiên'
                }];
              }
              return prev;
            });

            setActiveChat(newChat);
            setTrialTimer(300); // 5 minutes
            setRandomMatchState('idle');
          }
        }, 1500);
      }
    }, 100);
  };

  const renderOnboarding = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 text-center text-[#5a5255] bg-white/30 backdrop-blur-md font-medium shrink-0 relative">
        Thiết lập bản thân ♡
        <div className="absolute bottom-0 left-0 h-1 bg-[#F3B4C2] transition-all duration-300" style={{ width: `${((onboardingStep + 1) / 5) * 100}%` }} />
      </div>
      <div 
        ref={onboardingScrollRef}
        onScroll={handleOnboardingScroll}
        className="flex-1 overflow-x-auto flex snap-x snap-mandatory hide-scrollbar"
      >
        {/* Age */}
        <div className="min-w-full h-full p-4 overflow-y-auto snap-start shrink-0">
          <div className="text-center font-semibold text-[#5a5255] mb-4">Bạn muốn tìm người ở độ tuổi nào?</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {Array.from({ length: 80 - 18 + 1 }).map((_, i) => {
              const age = `${i + 18} tuổi`;
              return (
                <Pill 
                  key={i} 
                  label={age} 
                  selected={userPreferences.age?.includes(age)}
                  onClick={() => togglePreference('age', age)}
                />
              );
            })}
          </div>
        </div>
        
        {/* Personality */}
        <div className="min-w-full h-full p-4 overflow-y-auto snap-start shrink-0">
          <div className="text-center font-semibold text-[#5a5255] mb-4">Bạn thích người như thế nào? (Tính cách)</div>
          {personalities.map((group, idx) => (
            <div key={idx} className="mb-6">
              <div className="text-sm font-medium text-[#8c8286] mb-2 text-center">{group.group}</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {group.items.map((item, i) => (
                  <Pill 
                    key={i} 
                    label={item} 
                    selected={userPreferences.personality?.includes(item)}
                    onClick={() => togglePreference('personality', item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Gender */}
        <div className="min-w-full h-full p-4 overflow-y-auto snap-start shrink-0">
          <div className="text-center font-semibold text-[#5a5255] mb-4">Bạn muốn chọn giới tính nào?</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Nam", "Nữ", "Giới tính thứ 3", "LGBT"].map((item, i) => (
              <Pill 
                key={i} 
                label={item} 
                selected={userPreferences.gender?.includes(item)}
                onClick={() => togglePreference('gender', item)}
              />
            ))}
          </div>
        </div>

        {/* Hobbies */}
        <div className="min-w-full h-full p-4 overflow-y-auto snap-start shrink-0">
          <div className="text-center font-semibold text-[#5a5255] mb-4">Sở thích của họ?</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {hobbies.map((item, i) => (
              <Pill 
                key={i} 
                label={item} 
                selected={userPreferences.hobbies?.includes(item)}
                onClick={() => togglePreference('hobbies', item)}
              />
            ))}
          </div>
        </div>

        {/* Career */}
        <div className="min-w-full h-full p-4 overflow-y-auto snap-start shrink-0">
          <div className="text-center font-semibold text-[#5a5255] mb-4">Nghề nghiệp?</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {careers.map((item, i) => (
              <Pill 
                key={i} 
                label={item} 
                selected={userPreferences.career?.includes(item)}
                onClick={() => togglePreference('career', item)}
              />
            ))}
          </div>
        </div>
      </div>
      {onboardingStep < 4 && (
        <div className="p-4 bg-white/30 backdrop-blur-md flex justify-center shrink-0">
          <button 
            onClick={scrollToNextOnboarding}
            className="px-8 py-3 rounded-full bg-[#F3B4C2] text-white font-bold shadow-md active:scale-95 transition-transform flex items-center gap-2"
          >
            Tiếp theo <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );

  const handleSaveProfile = () => {
    setIsSaved(true);
    const updatedProfiles = profiles.map(p => p.id === currentProfileId ? {
      ...p,
      avatar: userAvatar,
      preferences: userPreferences,
      npcPreferences: npcPreferences,
      followedNpcs: followedNpcs,
      chatMessages: chatMessages,
      contacts: contacts,
      appBackground: appBackground,
      profileBackground: profileBackground,
      chatBackground: chatBackground,
      avatarBg: avatarBg,
      npcCustomAvatars: npcCustomAvatars,
      npcCustomBgs: npcCustomBgs,
      chatMode: chatMode,
      novelMinChars: novelMinChars,
      novelMaxChars: novelMaxChars,
      userPosts: userPosts
    } : p);
    setProfiles(updatedProfiles);
    showToast('Đã lưu hồ sơ và toàn bộ dữ liệu thành công ♡');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleNpcCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && customizingNpc) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNpcCustomAvatars(prev => ({
          ...prev,
          [customizingNpc.id || customizingNpc.name]: result
        }));
        showToast(`Đã cập nhật avatar cho ${customizingNpc.name} ♡`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNpcCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && customizingNpc) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNpcCustomBgs(prev => ({
          ...prev,
          [customizingNpc.id || customizingNpc.name]: result
        }));
        showToast(`Đã cập nhật nền cho ${customizingNpc.name} ♡`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartChat = async (npc: any) => {
    setActiveChat(npc);
    if (!contacts.find(c => c.id === (npc.id || npc.name))) {
      setContacts(prev => [...prev, npc]);
    }
    
    // Auto-greeting if new chat
    const npcId = npc.id || npc.name;
    const existingMsgs = chatMessages[npcId] || [];
    if (existingMsgs.length === 0) {
      setIsChatLoading(true);
      setChatLoadingMsg('Đang kết nối với duyên phận... ♡');
      try {
        const greeting = await generateNPCResponse(
          npc, 
          `Hãy gửi lời chào đầu tiên thật ấn tượng, ngọt ngào và ${chatMode === 'novel' ? `rất dài (khoảng ${novelMinChars}-${novelMaxChars} ký tự)` : 'ngắn gọn'}.`, 
          [], 
          {
            name: currentProfile.name,
            intro: (userPreferences.intro && userPreferences.intro[0]) || "Người dùng đang tìm kiếm duyên phận",
            target: userPreferences.career?.join(', ') || '',
            reason: "Tìm kiếm tình yêu",
            mc: "Koko",
            gender: "female",
            targetGender: "male",
            minChars: chatMode === 'novel' ? novelMinChars : 50,
            maxChars: chatMode === 'novel' ? novelMaxChars : 300,
            avatarBg: avatarBg,
            chatMode: chatMode
          },
          { apiKey: userApiKey, endpoint: userApiUrl, model: userModelName, apiType: userApiType }
        );
        
        const greetingContent = greeting.content;
        const newMsg: ChatMessage = { role: 'assistant', content: greetingContent };
        setChatMessages(prev => ({
          ...prev,
          [npcId]: [newMsg]
        }));
      } catch (err) {
        console.error("Lỗi khi gọi API chào mừng:", err);
      } finally {
        setIsChatLoading(false);
      }
    }
  };

  const renderFeed = () => (
    <div className="p-4 pb-24">
      {isSaving && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-pink-50 text-pink-700 rounded-full w-fit animate-pulse border border-pink-100 mx-auto">
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
          <span className="text-[10px] font-bold uppercase tracking-widest italic">Đang lưu dữ liệu... ♡</span>
        </div>
      )}
      {userPosts.map(post => (
        <div key={post.id} className="bg-white/60 backdrop-blur-md mb-4 rounded-[15px] overflow-hidden shadow-sm border border-pink-100/50">
          <div className="flex items-center p-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-pink-100">
                <img src={userAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="User" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">{currentProfile.name}</h4>
                <p className="text-[10px] text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>
          {post.image && (
            <div className="px-4 pb-4">
              <img src={post.image} className="w-full rounded-xl shadow-sm" referrerPolicy="no-referrer" alt="Post" />
            </div>
          )}
          <div className="px-4 py-3 border-t border-pink-50 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 hover:text-pink-500 transition-colors" onClick={() => handleHeartUserPost(post.id)}>
                <Heart size={16} className="text-pink-400" /> {post.comments.length > 0 ? post.comments.length : 'Thả tim'}
              </button>
              <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
                <MessageCircle size={16} /> {post.comments.length}
              </button>
            </div>
          </div>
          {post.comments.length > 0 && (
            <div className="px-4 pb-4 space-y-2">
              {post.comments.slice(0, 3).map((comment, idx) => (
                <div key={idx} className="text-[11px] bg-pink-50/50 p-2 rounded-lg">
                  <span className="font-bold text-pink-600">{comment.authorName}:</span> {comment.content}
                </div>
              ))}
              {post.comments.length > 3 && (
                <p className="text-[10px] text-pink-400 italic text-center">Xem thêm {post.comments.length - 3} bình luận khác...</p>
              )}
            </div>
          )}
        </div>
      ))}
      {npcPosts.map(post => {
        const customAvatar = npcCustomAvatars[post.id || post.name];
        const customBg = npcCustomBgs[post.id || post.name];
        
        return (
          <div key={post.id} className="bg-white/60 backdrop-blur-md mb-4 rounded-[15px] overflow-hidden shadow-sm">
            <div className="flex items-center p-3 justify-between">
              <div className="flex items-center cursor-pointer flex-1" onClick={() => setActiveNpcProfile(post)}>
                <div 
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-cover bg-center overflow-hidden"
                  style={{ 
                    backgroundImage: `url('${customAvatar || post.avatar}')`,
                    backgroundColor: customBg || avatarBg
                  }}
                />
                <span className="ml-3 font-semibold text-[#5a5255]">{post.name}</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    setCustomizingNpc(post);
                    npcCustomAvatarInputRef.current?.click();
                  }}
                  className="p-1.5 bg-white/50 rounded-full text-[#F3B4C2] hover:bg-white transition-colors"
                  title="Đổi Avatar"
                >
                  <Upload size={14} />
                </button>
                <button 
                  onClick={() => {
                    setCustomizingNpc(post);
                    npcCustomBgInputRef.current?.click();
                  }}
                  className="p-1.5 bg-white/50 rounded-full text-[#F3B4C2] hover:bg-white transition-colors"
                  title="Đổi Nền"
                >
                  <ImageIcon size={14} />
                </button>
              </div>
            </div>
            <img src={post.image} className="w-full h-auto block" />
            <div className="p-3 flex items-center justify-between">
              <span className="text-[#F3B4C2]"><Heart size={24} /></span>
              <button 
                onClick={() => handleNpcPostHeart(post.id, post.name)}
                className="w-10 h-10 rounded-full bg-[#F3B4C2] text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <Sparkles size={18} />
              </button>
            </div>
            <div className="px-3 pb-3 text-sm text-[#5a5255]">
              <b>{post.name}</b> {post.content || 'Đang lướt app Sách Thế Giới tìm bạn... ♡ #pinkvibe'}
              {post.comments > 0 && (
                <div className="text-xs text-[#8c8286] mt-1">Đã kết nối {post.comments} người ngẫu nhiên tương tác ♡</div>
              )}
              {post.commentsList && post.commentsList.length > 0 && (
                <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                  {post.commentsList.map((comment: string, idx: number) => (
                    <div key={idx} className="bg-pink-50/50 p-2 rounded-lg text-xs border border-pink-100/50">
                      <span className="font-bold text-[#F3B4C2] mr-1">NPC_{idx + 1}:</span>
                      {comment}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="flex flex-col gap-3 mt-6 px-4">
        <button 
          onClick={() => loadMoreNpcPosts(10)}
          className="w-full py-3 rounded-full bg-[#F3B4C2] text-white font-semibold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Hiện thêm 10 NPC
        </button>
        <button 
          onClick={() => loadMoreNpcPosts(200)}
          className="w-full py-3 rounded-full bg-white border-2 border-[#F3B4C2] text-[#F3B4C2] font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Sparkles size={18} /> + 200 NPC (Vip)
        </button>
      </div>
    </div>
  );

  const renderRandom = () => (
    <div className="p-6 text-center h-full flex flex-col justify-center">
      <div className="text-lg text-[#5a5255] mb-8 font-medium">Mời Sách Thế Giới chọn người duyên phận ♡</div>
      <div className="h-[120px] flex items-center overflow-x-hidden gap-4 px-10 mb-8 relative justify-center">
        {Array.from({ length: 20 }).map((_, i) => (
          <img 
            key={i} 
            src={npcImageLinks[i % npcImageLinks.length]} 
            className={`w-[60px] h-[60px] rounded-full object-cover shrink-0 transition-all duration-300 ${
              matchedIndex === i ? 'scale-150 border-4 border-[#F3B4C2] opacity-100 z-10' : 'opacity-50 scale-100'
            } ${randomMatchState === 'idle' ? 'hidden' : 'block'}`}
            style={{ 
              position: randomMatchState === 'idle' ? 'relative' : 'absolute',
              transform: randomMatchState !== 'idle' ? `translateX(${(i - matchedIndex) * 80}px) ${matchedIndex === i ? 'scale(1.5)' : 'scale(1)'}` : 'none'
            }}
          />
        ))}
        {randomMatchState === 'idle' && (
          <div className="text-[#8c8286] text-sm">Nhấn nút bên dưới để bắt đầu</div>
        )}
      </div>
      <button 
        onClick={startRandomMatch}
        disabled={randomMatchState === 'rolling'}
        className="px-8 py-4 rounded-full bg-[#F3B4C2] text-white font-semibold shadow-md active:scale-95 transition-transform disabled:opacity-50"
      >
        {randomMatchState === 'rolling' ? 'Sách Thế Giới đang xoay chuyển...' : 
         randomMatchState === 'matched' ? 'Đã tìm thấy người phù hợp! (Bắt đầu 5p)' : 'BẮT ĐẦU TÌM KIẾM'}
      </button>
    </div>
  );

  const renderNpcSettings = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 text-center text-[#5a5255] bg-white/30 backdrop-blur-md font-medium shrink-0 relative">
        Thiết lập NPC mong muốn ♡
        <div className="absolute bottom-0 left-0 h-1 bg-[#F3B4C2] transition-all duration-300" style={{ width: `${((npcSettingsStep + 1) / 5) * 100}%` }} />
      </div>
      <div 
        ref={npcSettingsScrollRef}
        onScroll={handleNpcSettingsScroll}
        className="flex-1 overflow-x-auto flex snap-x snap-mandatory hide-scrollbar"
      >
        {/* Age */}
        <div className="min-w-full h-full p-4 overflow-y-auto snap-start shrink-0">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#5a5255] mb-4 flex items-center gap-2">
              <Sparkles className="text-[#F3B4C2]" /> Độ tuổi NPC
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {["18-22", "23-27", "28-32", "33-40", "Trên 40"].map(age => (
                <button 
                  key={age}
                  onClick={() => toggleNpcPreference('age', age)}
                  className={`py-3 rounded-2xl text-sm font-medium transition-all ${npcPreferences.age?.includes(age) ? 'bg-[#F3B4C2] text-white shadow-md' : 'bg-white/50 text-[#8c8286]'}`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="min-w-full h-full p-4 overflow-y-auto snap-start shrink-0">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#5a5255] mb-4 flex items-center gap-2">
              <Heart className="text-[#F3B4C2]" /> Tính cách NPC
            </h3>
            <div className="space-y-6">
              {personalities.map(group => (
                <div key={group.group}>
                  <div className="text-xs font-bold text-[#8c8286] uppercase tracking-wider mb-3 ml-1">{group.group}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <button 
                        key={item}
                        onClick={() => toggleNpcPreference('personality', item)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${npcPreferences.personality?.includes(item) ? 'bg-[#F3B4C2] text-white shadow-sm' : 'bg-white/50 text-[#8c8286]'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Career */}
        <div className="min-w-full h-full p-4 overflow-y-auto snap-start shrink-0">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#5a5255] mb-4 flex items-center gap-2">
              <Sparkles className="text-[#F3B4C2]" /> Nghề nghiệp NPC
            </h3>
            <div className="flex flex-wrap gap-2">
              {careers.map(career => (
                <button 
                  key={career}
                  onClick={() => toggleNpcPreference('career', career)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${npcPreferences.career?.includes(career) ? 'bg-[#F3B4C2] text-white shadow-sm' : 'bg-white/50 text-[#8c8286]'}`}
                >
                  {career}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {npcSettingsStep < 4 && (
        <div className="p-4 bg-white/30 backdrop-blur-md flex justify-center shrink-0">
          <button 
            onClick={scrollToNextNpcSettings}
            className="px-8 py-3 rounded-full bg-[#F3B4C2] text-white font-bold shadow-md active:scale-95 transition-transform flex items-center gap-2"
          >
            Tiếp theo <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );

  const renderInbox = () => (
    <div className="p-4 pb-24">
      <div className="text-center font-medium text-[#5a5255] mb-4 bg-white/30 backdrop-blur-md p-3 rounded-xl">
        Hộp thư nhân duyên ♡
      </div>
      {contacts.length === 0 ? (
        <div className="text-center p-10 text-[#8c8286] italic text-sm">
          Chưa có cuộc trò chuyện nào. Hãy bắt đầu tìm kiếm duyên phận nhé! ♡
        </div>
      ) : (
        contacts.map((contact, i) => {
          const lastMsg = chatMessages[contact.id || contact.name]?.slice(-1)[0];
          const customAvatar = npcCustomAvatars[contact.id || contact.name];
          const customBg = npcCustomBgs[contact.id || contact.name];
          
          return (
            <div 
              key={i} 
              className="flex items-center p-3 bg-white/40 backdrop-blur-sm border-b border-black/5 mb-2 rounded-xl cursor-pointer hover:bg-white/60 transition-colors" 
              onClick={() => handleStartChat(contact)}
            >
              <div 
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-cover bg-center overflow-hidden"
                style={{ 
                  backgroundImage: `url('${customAvatar || contact.avatar}')`,
                  backgroundColor: customBg || avatarBg
                }}
              />
              <div className="ml-4 flex-1">
                <div className="font-semibold text-[#5a5255] mb-1">{contact.name}</div>
                <div className="text-sm text-[#8c8286] truncate max-w-[200px]">
                  {lastMsg ? lastMsg.content : "Bắt đầu trò chuyện ngay... ♡"}
                </div>
              </div>
              {lastMsg && (
                <div className="text-[10px] text-[#F3B4C2] font-medium">
                  {lastMsg.role === 'assistant' ? 'Đã trả lời' : 'Đã gửi'}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderProfile = () => (
    <div 
      className="h-full overflow-y-auto pb-24 bg-cover bg-center transition-all duration-300 relative"
      style={{ backgroundImage: profileBackground ? `url('${profileBackground}')` : 'none', backgroundColor: profileBackground ? 'transparent' : 'rgba(255,255,255,0.8)' }}
    >
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button 
          onClick={() => setShowApiSettings(true)}
          className="p-2 bg-white/50 backdrop-blur-md rounded-full text-[#5a5255] shadow-sm"
          title="Cài đặt API"
        >
          <Settings size={20} />
        </button>
        <button 
          onClick={() => setShowProfileSwitcher(true)}
          className="p-2 bg-white/50 backdrop-blur-md rounded-full text-[#5a5255] shadow-sm"
          title="Chuyển tài khoản"
        >
          <Users size={20} />
        </button>
        <button 
          onClick={() => profileBgInputRef.current?.click()}
          className="p-2 bg-white/50 backdrop-blur-md rounded-full text-[#5a5255] shadow-sm"
        >
          <ImageIcon size={20} />
        </button>
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="p-2 bg-[#F3B4C2] text-white rounded-full shadow-md active:scale-95 transition-transform flex items-center gap-2 px-4"
          >
            <Download size={18} />
            <span className="text-xs font-bold">Tải App</span>
          </button>
        )}
      </div>

      <div className="p-5 flex flex-col items-center border-b border-black/5 bg-white/40 backdrop-blur-md">
        <div className="w-full flex justify-end mb-2">
          <button 
            onClick={handleSaveProfile}
            className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all ${isSaved ? 'bg-green-400 text-white' : 'bg-[#F3B4C2] text-white active:scale-95'}`}
          >
            {isSaved ? '✓ Đã lưu' : 'Lưu hồ sơ'}
          </button>
        </div>
        <div className="flex items-center w-full mb-4">
          <div className="relative cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <img src={userAvatar} className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm" />
            <div className="absolute bottom-0 right-0 bg-[#F3B4C2] text-white rounded-full p-1 border-2 border-white">
              <Upload size={12} />
            </div>
          </div>
          <div className="flex-1 flex justify-around text-center text-[#5a5255]">
            <div><div className="font-bold text-lg">{userPosts.length}</div><div className="text-xs text-[#8c8286]">Posts</div></div>
            <div><div className="font-bold text-lg">{(followerCount / 1000).toFixed(1)}K</div><div className="text-xs text-[#8c8286]">Followers</div></div>
            <div><div className="font-bold text-lg">20</div><div className="text-xs text-[#8c8286]">Following</div></div>
          </div>
        </div>
        <div className="w-full text-sm leading-relaxed text-[#5a5255]">
          <div className="font-bold mb-1 flex items-center gap-2">
            {currentProfile.name}
            <button onClick={() => {
              const newName = prompt('Nhập tên mới cho tài khoản:', currentProfile.name);
              if (newName) renameProfile(currentProfile.id, newName);
            }} className="p-1 hover:bg-black/5 rounded-full">
              <Settings size={12} />
            </button>
          </div>
          <div className="text-[#8c8286] mb-2">✧ Nữ | 23 tuổi | 📍Thái Bình | 🎨 Sách Thế Giới</div>
          <div>Thích lướt TikTok, chụp ảnh outfit, nghe Tarot... đang tìm bạn trai vibe ngoan hiền ♡</div>
        </div>
        <div className="w-full mt-6">
          <button 
            onClick={handleSaveProfile}
            className={`w-full py-4 rounded-2xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-green-500 text-white' : 'bg-[#F3B4C2] text-white active:scale-95'}`}
          >
            {isSaved ? <><Check size={20} /> Đã lưu tất cả dữ liệu</> : <><Save size={20} /> Lưu hồ sơ & Cài đặt</>}
          </button>
          <p className="text-[10px] text-center text-[#8c8286] mt-2 italic">
            * Toàn bộ thông tin, tin nhắn và cài đặt sẽ được lưu trữ trên trình duyệt của bạn.
          </p>
        </div>
      </div>

      {/* User Posts Section */}
      <div className="p-4 space-y-4">
        {userPosts.length === 0 ? (
          <div className="text-center py-10 text-[#8c8286] italic text-sm">
            Bạn chưa có bài đăng nào. Hãy nhấn nút + để bắt đầu chia sẻ nhé ♡
          </div>
        ) : (
          userPosts.map(post => (
            <div key={post.id} className="bg-white/60 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-white/40">
              <div className="flex items-center gap-3 mb-3">
                <img src={userAvatar} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                <div className="flex-1">
                  <div className="font-bold text-sm text-[#5a5255]">{currentProfile.name}</div>
                  <div className="text-[10px] text-[#8c8286]">{new Date(post.createdAt).toLocaleString()}</div>
                </div>
                <button 
                  onClick={() => handleHeartUserPost(post.id)}
                  className="p-2 bg-pink-50 text-[#F3B4C2] rounded-full hover:bg-pink-100 transition-colors"
                  title="Gọi NPC tương tác"
                >
                  <Heart size={18} fill={post.comments.length > 0 ? "#F3B4C2" : "none"} />
                </button>
              </div>
              
              <div className="text-sm text-[#5a5255] leading-relaxed mb-3 whitespace-pre-wrap">
                {post.content}
              </div>
              
              {post.image && (
                <img src={post.image} className="w-full h-auto rounded-2xl mb-3 object-cover max-h-80" />
              )}

              {post.comments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-black/5 space-y-3">
                  <div className="text-[10px] font-bold text-[#8c8286] uppercase tracking-wider mb-2">Bình luận từ NPC ({post.comments.length})</div>
                  {post.comments.map(comment => (
                    <div key={comment.id} className="flex gap-2">
                      <img src={comment.authorAvatar} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      <div className="bg-gray-50/80 rounded-2xl px-3 py-2 flex-1">
                        <div className="font-bold text-[10px] text-[#5a5255]">{comment.authorName}</div>
                        <div className="text-xs text-[#5a5255]">{comment.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowCreatePostModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#F3B4C2] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform z-20"
      >
        <Plus size={28} />
      </button>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePostModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreatePostModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#5a5255] flex items-center gap-2">
                  <Plus className="text-[#F3B4C2]" /> Đăng bài mới
                </h3>
                <button onClick={() => setShowCreatePostModal(false)} className="text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="rotate-90" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <textarea 
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  placeholder="Bạn đang nghĩ gì thế? ♡"
                  className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F3B4C2] transition-colors resize-none"
                />
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => userPostImageInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-xs text-[#5a5255] font-medium hover:bg-gray-200 transition-colors"
                  >
                    <ImageIcon size={16} /> {newPostImage ? 'Đổi ảnh' : 'Thêm ảnh'}
                  </button>
                  <input 
                    type="file" 
                    ref={userPostImageInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleUserPostImageUpload}
                  />
                  {newPostImage && (
                    <div className="relative">
                      <img src={newPostImage} className="w-12 h-12 rounded-lg object-cover" />
                      <button 
                        onClick={() => setNewPostImage(null)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={handleCreateUserPost}
                  className="w-full py-3 bg-[#F3B4C2] text-white rounded-2xl font-bold shadow-md active:scale-95 transition-transform"
                >
                  Đăng bài
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* API Settings Modal */}
      <AnimatePresence>
        {showApiSettings && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApiSettings(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#5a5255] flex items-center gap-2">
                  <Settings className="text-[#F3B4C2]" /> Cài đặt API AI
                </h3>
                <button onClick={() => setShowApiSettings(false)} className="text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="rotate-90" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-pink-50 p-3 rounded-xl text-xs text-pink-600 leading-relaxed">
                  Đảm bảo 100% API KEY & PROXY của bạn được sử dụng cho mọi tính năng AI trong ứng dụng.
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8c8286] uppercase tracking-wider block mb-1.5 ml-1">Loại API (API Type)</label>
                  <select 
                    value={userApiType}
                    onChange={e => setUserApiType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F3B4C2] transition-colors"
                  >
                    <option value="auto">Tự động phát hiện (Auto Detect)</option>
                    <option value="openai">OpenAI-compatible</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="gemini">Gemini</option>
                    <option value="custom">Custom Endpoint</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8c8286] uppercase tracking-wider block mb-1.5 ml-1">API URL (Proxy)</label>
                  <input 
                    type="text" 
                    value={userApiUrl}
                    onChange={e => setUserApiUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1/chat/completions"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F3B4C2] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8c8286] uppercase tracking-wider block mb-1.5 ml-1">API Key</label>
                  <input 
                    type="password" 
                    value={userApiKey}
                    onChange={e => setUserApiKey(e.target.value)}
                    placeholder="Nhập API Key (sk-..., yL9Fw..., v.v.)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F3B4C2] transition-colors"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 ml-1">
                    <label className="text-xs font-bold text-[#8c8286] uppercase tracking-wider block">Model Name</label>
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
                      value={userModelName}
                      onChange={e => setUserModelName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F3B4C2] transition-colors"
                    >
                      {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={userModelName}
                      onChange={e => setUserModelName(e.target.value)}
                      placeholder="gemini-3-flash-preview"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F3B4C2] transition-colors"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${userIsUnlimited ? 'bg-[#F3B4C2]' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${userIsUnlimited ? 'left-6' : 'left-1'}`} />
                    </div>
                    <input 
                      type="checkbox" 
                      checked={userIsUnlimited}
                      onChange={e => setUserIsUnlimited(e.target.checked)}
                      className="hidden"
                    />
                    <span className="text-xs font-bold text-[#5a5255]">Không giới hạn Token (Unlimited)</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1 ml-13">Bỏ qua giới hạn Token để NPC phản hồi dài và sâu sắc nhất.</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setShowApiSettings(false)}
                  className="w-full py-3 bg-[#F3B4C2] text-white rounded-2xl font-bold shadow-md active:scale-95 transition-transform"
                >
                  Lưu cài đặt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Switcher Modal */}
      <AnimatePresence>
        {showProfileSwitcher && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileSwitcher(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#5a5255] flex items-center gap-2">
                  <Users className="text-[#F3B4C2]" /> Quản lý tài khoản
                </h3>
                <button onClick={() => setShowProfileSwitcher(false)} className="text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="rotate-90" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {profiles.map(p => (
                  <div 
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      p.id === currentProfileId 
                        ? 'border-[#F3B4C2] bg-pink-50' 
                        : 'border-gray-100 hover:border-pink-200'
                    }`}
                    onClick={() => switchProfile(p.id)}
                  >
                    <img src={p.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div className="flex-1">
                      <div className="font-semibold text-[#5a5255]">{p.name}</div>
                      <div className="text-xs text-gray-400">{Object.keys(p.chatMessages).length} cuộc hội thoại</div>
                    </div>
                    {p.id !== currentProfileId && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmModal({
                            show: true,
                            title: `Bạn có chắc muốn xóa tài khoản "${p.name}"?`,
                            onConfirm: () => deleteProfile(p.id)
                          });
                        }}
                        className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                <button 
                  onClick={createNewProfile}
                  className="w-full py-3 bg-[#F3B4C2] text-white rounded-2xl font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Tạo tài khoản mới
                </button>
                <button 
                  onClick={() => setShowProfileSwitcher(false)}
                  className="w-full py-3 bg-white text-gray-500 rounded-2xl font-semibold border border-gray-200"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 p-4 overflow-x-auto border-b border-black/5 bg-white/20 backdrop-blur-sm">
        <div className="text-center shrink-0">
          <div className="w-[70px] h-[70px] rounded-full bg-black/5 flex items-center justify-center text-[#F3B4C2] text-2xl cursor-pointer border border-dashed border-[#F3B4C2]">
            +
          </div>
          <div className="text-[11px] mt-1 text-[#5a5255]">Mới</div>
        </div>
        <div className="text-center shrink-0">
          <div className="w-[70px] h-[70px] rounded-full border-2 border-[#F3B4C2] p-[2px]">
            <img src={npcImageLinks[1]} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="text-[11px] mt-1 text-[#5a5255]">My Day</div>
        </div>
        <div className="text-center shrink-0">
          <div className="w-[70px] h-[70px] rounded-full border-2 border-[#F3B4C2] p-[2px]">
            <img src={npcImageLinks[2]} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="text-[11px] mt-1 text-[#5a5255]">Vibe ♡</div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white/60 backdrop-blur-md rounded-[15px] p-4 shadow-sm mb-4">
          <h3 className="font-semibold text-[#5a5255] mb-2">Cài đặt ảnh NPC</h3>
          <p className="text-xs text-[#8c8286] mb-3">Tải ảnh lên để NPC sử dụng khi đăng bài.</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button 
              onClick={() => npcImageInputRef.current?.click()}
              className="w-16 h-16 shrink-0 rounded-[10px] border-2 border-dashed border-[#F3B4C2] flex items-center justify-center text-[#F3B4C2] bg-white/50"
            >
              <Upload size={24} />
            </button>
            {npcUploadedImages.map((img, i) => (
              <img key={i} src={img} className="w-16 h-16 shrink-0 rounded-[10px] object-cover shadow-sm" />
            ))}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            ref={npcImageInputRef} 
            onChange={handleNpcImageUpload} 
            className="hidden" 
          />
        </div>

        <div className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <img key={i} src={npcImageLinks[i % 3]} className="w-full aspect-square object-cover" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
            className="fixed inset-0 z-[1000] bg-gradient-to-br from-[#F3B4C2] to-[#f9d1d9] flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
              transition={{ duration: 0.8, ease: "backOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150" />
              <Heart size={100} fill="white" className="relative drop-shadow-2xl" />
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 text-center"
            >
              <h1 className="text-3xl font-black tracking-[0.2em] uppercase mb-2 drop-shadow-md">
                Dating Hẹn Hò
              </h1>
              <div className="h-1 w-12 bg-white/60 mx-auto rounded-full mb-4" />
              <p className="text-sm font-medium opacity-90 tracking-wide">
                SÁCH THẾ GIỚI KẾT NỐI DUYÊN PHẬN
              </p>
            </motion.div>

            <motion.div 
              className="absolute bottom-12 flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Loader2 className="animate-spin opacity-60" size={24} />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-50">Loading...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 w-full h-full bg-[#FAF9F6] overflow-hidden font-sans flex flex-col z-50 bg-cover bg-center"
        style={{ backgroundImage: appBackground ? `url('${appBackground}')` : 'none' }}
      >
      {/* Hidden file inputs replaced by labels where possible */}
      <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={e => handleImageUpload(e, setUserAvatar)} />
      <input type="file" accept="image/*" className="hidden" ref={npcImageInputRef} onChange={handleNpcImageUpload} />
      <input type="file" accept="image/*" className="hidden" ref={userPostImageInputRef} onChange={e => handleImageUpload(e, setNewPostImage)} />
      <input type="file" accept="image/*" className="hidden" ref={npcCustomAvatarInputRef} onChange={handleNpcCustomAvatarUpload} />
      <input type="file" accept="image/*" className="hidden" ref={npcCustomBgInputRef} onChange={handleNpcCustomBgUpload} />

      {/* Global Processing Bar */}
      <AnimatePresence>
        {(isChatLoading || randomMatchState === 'rolling') && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[1000] bg-[#F3B4C2] text-white py-3 px-4 flex items-center justify-center gap-3 shadow-lg"
          >
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-bold tracking-wide uppercase">Hệ thống đang làm việc... Vui lòng chờ kết quả</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="h-[60px] bg-white/50 backdrop-blur-md flex items-center justify-between px-4 text-[#5a5255] z-10 shadow-sm pt-safe shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="text-lg font-semibold">Dating Hẹn Hò</span>
        <label className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer flex items-center justify-center">
          <ImageIcon size={20} />
          <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, setAppBackground, `dating_bg_${currentProfileId}`)} />
        </label>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'onboarding' && renderOnboarding()}
        {activeTab === 'npc_settings' && renderNpcSettings()}
        {activeTab === 'feed' && <div className="h-full overflow-y-auto">{renderFeed()}</div>}
        {activeTab === 'random' && renderRandom()}
        {activeTab === 'inbox' && <div className="h-full overflow-y-auto">{renderInbox()}</div>}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Bottom Nav */}
      <div className="h-[70px] bg-white/60 backdrop-blur-[20px] flex justify-around items-center border-t border-white/30 pb-safe shrink-0 z-20">
        <NavItem icon={<Sparkles />} active={activeTab === 'onboarding'} onClick={() => setActiveTab('onboarding')} />
        <NavItem icon={<Users />} active={activeTab === 'npc_settings'} onClick={() => setActiveTab('npc_settings')} />
        <NavItem icon={<Heart />} active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
        <NavItem icon={<Dices />} active={activeTab === 'random'} onClick={() => setActiveTab('random')} />
        <NavItem icon={<MessageCircle />} active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
        <NavItem icon={<User />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {loadingMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[80px] left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-sm text-[#5a5255] shadow-md z-[100] whitespace-nowrap"
          >
            {loadingMsg}
          </motion.div>
        )}
      </AnimatePresence>
      {/* NPC Profile Modal */}
      <AnimatePresence>
        {activeNpcProfile && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="absolute inset-0 bg-[#FAF9F6] z-[150] flex flex-col overflow-y-auto pb-24"
          >
            <div className="h-[60px] bg-white/90 backdrop-blur-md flex items-center justify-between px-4 shadow-sm pt-safe shrink-0 sticky top-0 z-10">
              <button onClick={() => setActiveNpcProfile(null)} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                <ChevronLeft size={24} className="text-[#5a5255]" />
              </button>
              <div className="font-medium text-[#5a5255]">{activeNpcProfile.name}</div>
              <button 
                onClick={handleSaveProfile}
                className={`p-2 rounded-full transition-colors ${isSaved ? 'text-green-500' : 'text-[#F3B4C2]'}`}
                title="Lưu hồ sơ"
              >
                {isSaved ? <Check size={20} /> : <Save size={20} />}
              </button>
            </div>
            <input type="file" accept="image/*" className="hidden" ref={npcCustomBgInputRef} onChange={handleNpcCustomBgUpload} />
            
            <div className="flex-1" style={{ backgroundImage: npcCustomBgs[activeNpcProfile.id || activeNpcProfile.name] ? `url('${npcCustomBgs[activeNpcProfile.id || activeNpcProfile.name]}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className={`p-5 flex flex-col items-center border-b border-black/5 ${npcCustomBgs[activeNpcProfile.id || activeNpcProfile.name] ? 'bg-white/60' : 'bg-white/40'} backdrop-blur-md`}>
                <div className="flex items-center w-full mb-4">
                  <div 
                    className="w-20 h-20 rounded-full border-2 border-white shadow-sm bg-cover bg-center overflow-hidden relative"
                    style={{ 
                      backgroundImage: `url('${npcCustomAvatars[activeNpcProfile.id || activeNpcProfile.name] || activeNpcProfile.avatar}')`,
                      backgroundColor: avatarBg
                    }}
                  >
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setCustomizingNpc(activeNpcProfile);
                          npcCustomAvatarInputRef.current?.click();
                        }}
                        className="p-2 bg-white/80 rounded-full text-[#F3B4C2] shadow-sm"
                        title="Đổi Avatar"
                      >
                        <Upload size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setCustomizingNpc(activeNpcProfile);
                          npcCustomBgInputRef.current?.click();
                        }}
                        className="p-2 bg-white/80 rounded-full text-[#5a5255] shadow-sm"
                        title="Đổi Nền Hồ Sơ"
                      >
                        <ImageIcon size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-around text-center text-[#5a5255]">
                    <div><div className="font-bold text-lg">{10 + (npcExtraPosts[activeNpcProfile.name]?.length || 0)}</div><div className="text-xs text-[#8c8286]">Posts</div></div>
                    <div><div className="font-bold text-lg">5.2K</div><div className="text-xs text-[#8c8286]">Followers</div></div>
                    <div><div className="font-bold text-lg">120</div><div className="text-xs text-[#8c8286]">Following</div></div>
                  </div>
                </div>
                <div className="w-full text-sm leading-relaxed text-[#5a5255]">
                  <div className="font-bold mb-1 flex items-center justify-between">
                    {activeNpcProfile.name}
                    <button 
                      onClick={() => {
                        setCustomizingNpc(activeNpcProfile);
                        npcCustomBgInputRef.current?.click();
                      }}
                      className="text-xs text-[#F3B4C2] font-bold flex items-center gap-1"
                    >
                      <ImageIcon size={12} /> Đổi nền
                    </button>
                  </div>
                  <div className="text-[#8c8286] mb-2">✧ Độc thân | Tìm kiếm một nửa yêu thương ♡</div>
                  <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100/30 text-xs italic">
                    {activeNpcProfile.content || 'Đang lướt app Sách Thế Giới tìm bạn... ♡'}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 w-full justify-center">
                  <button 
                    onClick={() => {
                      setFollowedNpcs(prev => {
                        if (prev.includes(activeNpcProfile.name)) {
                          return prev.filter(n => n !== activeNpcProfile.name);
                        } else {
                          return [...prev, activeNpcProfile.name];
                        }
                      });
                    }}
                    className={`px-8 py-2 rounded-full text-sm font-semibold shadow-sm active:scale-95 transition-transform flex items-center gap-2 ${
                      followedNpcs.includes(activeNpcProfile.name)
                        ? 'bg-white text-[#F3B4C2] border border-[#F3B4C2]'
                        : 'bg-[#F3B4C2] text-white'
                    }`}
                  >
                    {followedNpcs.includes(activeNpcProfile.name) ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                  <button 
                    onClick={() => {
                      handleStartChat(activeNpcProfile);
                      setActiveNpcProfile(null);
                    }}
                    className="px-8 py-2 rounded-full bg-[#F3B4C2] text-white text-sm font-semibold shadow-sm active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <MessageCircle size={16} /> Nhắn tin
                  </button>
                </div>
              </div>

              <div className="p-4">
                  <h3 className="font-bold text-[#5a5255]">Tất cả bài đăng</h3>
                  <button 
                    onClick={() => loadMoreNpcProfilePosts(activeNpcProfile.name)}
                    className="px-4 py-1.5 rounded-full bg-pink-100 text-[#F3B4C2] text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-transform"
                  >
                    + Thêm 10 bài
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(npcExtraPosts[activeNpcProfile.name] || []).map((post: any) => (
                    <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-pink-50">
                      <img src={post.image} className="w-full h-48 object-cover" />
                      <div className="p-4">
                        <div className="text-[10px] text-[#8c8286] mb-2">{post.date}</div>
                        <p className="text-sm text-[#5a5255] leading-relaxed">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-[2px] p-[2px]">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <img key={i} src={allNpcImages[i % allNpcImages.length]} className="w-full aspect-square object-cover" />
                    ))}
                  </div>
                </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal?.show && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-[#5a5255] mb-2">Xác nhận xóa</h3>
              <p className="text-sm text-[#8c8286] mb-6">{confirmModal.title}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className="flex-1 py-3 bg-red-400 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-transform"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeChat && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 bg-[#FAF9F6] z-[200] flex flex-col bg-cover bg-center"
            style={{ backgroundImage: chatBackground ? `url('${chatBackground}')` : 'none' }}
          >
            <input type="file" accept="image/*" className="hidden" ref={chatBgInputRef} onChange={e => handleImageUpload(e, setChatBackground)} />
            <div className="h-[60px] bg-white/90 backdrop-blur-md flex items-center justify-between px-4 shadow-sm pt-safe shrink-0">
              <button onClick={() => setActiveChat(null)} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                <ChevronLeft size={24} className="text-[#5a5255]" />
              </button>
              <div className="flex items-center gap-3 ml-2 flex-1">
                <div 
                  className="w-10 h-10 rounded-full border border-[#E6DDD8] bg-cover bg-center overflow-hidden"
                  style={{ 
                    backgroundImage: `url('${npcCustomAvatars[activeChat.id || activeChat.name] || activeChat.avatar}')`,
                    backgroundColor: npcCustomBgs[activeChat.id || activeChat.name] || avatarBg
                  }}
                />
                <div className="flex flex-col">
                  <div className="font-medium text-[#5a5255] leading-tight">{activeChat.name}</div>
                  {activeChat.isTrial && trialTimer !== null && (
                    <div className="text-[10px] font-bold text-pink-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                      THỬ NGHIỆM: {formatTime(trialTimer)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveProfile}
                  className={`p-2 rounded-full transition-colors ${isSaved ? 'text-green-500' : 'text-[#F3B4C2]'}`}
                  title="Lưu tất cả"
                >
                  {isSaved ? <Check size={20} /> : <Save size={20} />}
                </button>
                <button onClick={() => setShowChatSettings(true)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#5a5255]">
                  <Settings size={20} />
                </button>
                <button onClick={() => chatBgInputRef.current?.click()} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#5a5255]">
                  <ImageIcon size={20} />
                </button>
              </div>
            </div>
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" 
              style={{ backgroundColor: chatBackground ? 'rgba(255,255,255,0.6)' : 'transparent' }}
            >
              <div className="text-center text-sm text-[#8c8286] mt-4">Bắt đầu trò chuyện với {activeChat.name} ♡</div>
              
              {(chatMessages[activeChat.id || activeChat.name] || []).map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`group relative max-w-[80%] p-3 rounded-2xl shadow-sm text-[#5a5255] ${
                    msg.role === 'user' 
                      ? 'self-end bg-[#F3B4C2] text-white rounded-tr-sm' 
                      : 'self-start bg-pink-50 backdrop-blur-sm rounded-tl-sm border border-pink-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  
                  {msg.role === 'assistant' && (
                    <div className="absolute -bottom-8 left-0 hidden group-hover:flex items-center gap-1 bg-white rounded-full shadow-md border border-pink-100 p-1 z-10">
                      <button 
                        onClick={() => handleRegenerateMessage(idx)}
                        className="p-1.5 hover:bg-pink-50 rounded-full text-pink-400 transition-colors"
                        title="Tạo lại"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteMessage(idx)}
                        className="p-1.5 hover:bg-pink-50 rounded-full text-pink-400 transition-colors"
                        title="Xoá"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleSendMessage(undefined, true)}
                        className="p-1.5 hover:bg-pink-50 rounded-full text-pink-400 transition-colors"
                        title="Gấu con viết tiếp"
                      >
                        <span className="text-xs">🐻</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="self-start bg-white/80 backdrop-blur-sm p-3 rounded-2xl rounded-tl-sm shadow-sm text-[#8c8286] text-sm flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#F3B4C2] border-t-transparent rounded-full animate-spin" />
                  {chatLoadingMsg}
                </div>
              )}
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-[#E6DDD8] pb-safe shrink-0 flex flex-col gap-2">
              {chatMode === 'online' && (
                <div className="flex justify-end">
                  <button 
                    onClick={() => handleSendMessage("Hãy gửi cho tôi 20 tin nhắn ngắn liên tiếp.", false)}
                    disabled={isChatLoading}
                    className="px-3 py-1.5 bg-pink-50 text-pink-500 rounded-full text-xs font-medium border border-pink-100 hover:bg-pink-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus size={12} /> Thêm 20 tin nhắn
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 bg-[#FAF9F6] rounded-full p-1 border border-[#E6DDD8]">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Nhắn tin..." 
                  className="flex-1 bg-transparent border-none outline-none px-4 text-[#5a5255]" 
                />
                <button 
                  onClick={() => handleSendMessage(undefined, true)}
                  disabled={isChatLoading}
                  className="w-10 h-10 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-pink-200 transition-colors"
                  title="Gấu con trả lời"
                >
                  <span className="text-xl">🐻</span>
                </button>
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="w-10 h-10 rounded-full bg-[#F3B4C2] text-white flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            {/* Chat Settings Modal */}
            <AnimatePresence>
              {showChatSettings && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-16 right-4 w-64 bg-white rounded-2xl shadow-xl border border-pink-100 p-4 z-[210]"
                >
                  <div className="font-semibold text-[#5a5255] mb-3">Cài đặt tin nhắn</div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[#8c8286] block mb-1">Chế độ</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setChatMode('online')}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${chatMode === 'online' ? 'bg-[#F3B4C2] text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          Online ngắn
                        </button>
                        <button 
                          onClick={() => setChatMode('novel')}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${chatMode === 'novel' ? 'bg-[#F3B4C2] text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          Tiểu thuyết off
                        </button>
                      </div>
                    </div>

                    {chatMode === 'novel' && (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium text-[#8c8286] block mb-1">Ký tự tối thiểu (Novel)</label>
                          <input 
                            type="range" 
                            min="500" 
                            max="2000" 
                            step="100"
                            value={novelMinChars}
                            onChange={e => setNovelMinChars(Number(e.target.value))}
                            className="w-full accent-[#F3B4C2]"
                          />
                          <div className="text-[10px] text-right text-gray-400">{novelMinChars} ký tự</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#8c8286] block mb-1">Ký tự tối đa (Novel)</label>
                          <input 
                            type="range" 
                            min="2000" 
                            max="5000" 
                            step="100"
                            value={novelMaxChars}
                            onChange={e => setNovelMaxChars(Number(e.target.value))}
                            className="w-full accent-[#F3B4C2]"
                          />
                          <div className="text-[10px] text-right text-gray-400">{novelMaxChars} ký tự</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setShowChatSettings(false)}
                    className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Đóng
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Pill({ label, selected, onClick }: { label: string, selected?: boolean, onClick?: () => void }) {
  const [internalSelected, setInternalSelected] = useState(false);
  const isSelected = selected !== undefined ? selected : internalSelected;
  
  const handleClick = () => {
    if (onClick) onClick();
    else setInternalSelected(!internalSelected);
  };

  return (
    <div 
      onClick={handleClick}
      className={`px-4 py-2 rounded-full text-[13px] cursor-pointer transition-all border ${
        isSelected 
          ? 'bg-[#F3B4C2] text-white border-[#F3B4C2] shadow-inner' 
          : 'bg-white/50 text-[#5a5255] border-white/30 hover:bg-white/80'
      }`}
    >
      {label}
    </div>
  );
}

function NavItem({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-2 cursor-pointer transition-all duration-300 ${
        active ? 'text-[#F3B4C2] scale-110' : 'text-[#8c8286] hover:text-[#5a5255]'
      }`}
    >
      {icon}
    </div>
  );
}
