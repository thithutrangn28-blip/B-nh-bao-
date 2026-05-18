import React, { useState, useEffect, useRef } from 'react';
import { Camera, Heart, MessageCircle, User, Home, Users, PenTool, Plus, Cat, Image as ImageIcon, Settings, ChevronRight, X, HelpCircle, RefreshCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLargeData, setLargeData } from '../utils/storage';

const IMAGES = [
  "https://i.postimg.cc/g2sJpzTQ/b5bd0d7e59c0f46d4d4ab564f47739a8.jpg",
  "https://i.postimg.cc/N0Dyc5Y7/a2bf893052d9a8ec60fc7a57edd0b25a.jpg",
  "https://i.postimg.cc/D0845F94/b518a1694a11091e43cd72e203204c95.jpg",
  "https://i.postimg.cc/pLDhss6j/bad766039c5d48f97348194069e21e9b.jpg",
  "https://i.postimg.cc/Y0ZGsZkB/Camera-1040g3k831q3vsh48gadg5o3itf208v2muol7cko.jpg",
  "https://i.postimg.cc/44pXZ4Kq/Camera-1040g3k831r1mtlaa7u005o3itf208v2mum2e4dg.jpg",
  "https://i.postimg.cc/43rTkjsQ/65c6cf7f901d2244e7613fbfeb70ac3d.jpg",
  "https://i.postimg.cc/bNzfhxcK/231770bcb8936c32d898b07f7b99b5e2-(1).jpg"
];

const STATUSES = ["feeling: sleepy", "web coding", "graphic making", "curl up...", "time to shine...", "time to be happy", "i love him..."];

const CLUBS = [
  { id: 1, name: "Hội nhóm Ngọt ngào", color: "bg-pink-100" },
  { id: 2, name: "Hội nhóm mê Sublime", color: "bg-purple-100" },
  { id: 3, name: "Hội nhóm mê Đồ ăn & Xem phim", color: "bg-orange-100" },
  { id: 4, name: "Hội nhóm Xem phim Đam mỹ", color: "bg-blue-100" },
  { id: 5, name: "Hội nhóm Chăm sóc Sức khỏe", color: "bg-green-100" }
];

// Removed Mock APIs, will be implemented inside the component to access settings

export default function RenGram({ onBack }: { onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('rengram_active_tab') || 'home');
  const [globalBg, setGlobalBg] = useState('#FFF0F5'); // Baby pink default
  const [globalBgImage, setGlobalBgImage] = useState(() => localStorage.getItem('rengram_bg_image') || '');
  
  useEffect(() => {
    localStorage.setItem('rengram_active_tab', activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    localStorage.setItem('rengram_bg_image', globalBgImage);
  }, [globalBgImage]);

  // Settings States
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('rengram_tutorial') !== 'done';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('rengram_settings');
    const defaults = {
      proxyEndpoint: '',
      proxyKey: '',
      model: '',
      maxTokens: 30000,
      isUnlimitedTokens: false,
      timeoutMinutes: 0,
      isSetupComplete: false
    };
    try {
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem('rengram_settings', JSON.stringify(settings));
  }, [settings]);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const fetchModels = async () => {
    if (!settings.proxyEndpoint || !settings.proxyKey) {
      alert("Vui lòng nhập Proxy Endpoint và API Key trước khi lấy danh sách Model.");
      return;
    }
    setIsFetchingModels(true);
    try {
      let apiUrl = settings.proxyEndpoint.trim();
      if (!apiUrl.startsWith('http')) apiUrl = 'https://' + apiUrl;
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      const modelsUrl = apiUrl.endsWith('/v1') ? `${apiUrl}/models` : `${apiUrl}/v1/models`;

      const res = await fetch(modelsUrl, {
        headers: { 'Authorization': `Bearer ${settings.proxyKey}` }
      });
      if (!res.ok) throw new Error("Lỗi khi lấy model");
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setAvailableModels(data.data.map((m: any) => m.id));
      } else {
        alert("Không tìm thấy danh sách model từ API này.");
      }
    } catch (e) {
      alert("Lỗi kết nối đến API để lấy model. Vui lòng kiểm tra lại Endpoint và API Key.");
    }
    setIsFetchingModels(false);
  };

  const callApi = async (prompt: string, systemInstruction: string, customSignal?: AbortSignal) => {
    if (!settings.proxyEndpoint || !settings.proxyKey || !settings.model) {
      setShowSettings(true);
      throw new Error("Vui lòng cài đặt API trước.");
    }

    let apiUrl = settings.proxyEndpoint.trim();
    if (!apiUrl.startsWith('http')) apiUrl = 'https://' + apiUrl;
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    
    const completionUrl = apiUrl.endsWith('/chat/completions') 
      ? apiUrl 
      : apiUrl.endsWith('/v1') 
        ? `${apiUrl}/chat/completions`
        : `${apiUrl}/v1/chat/completions`;

    const abortController = new AbortController();
    if (customSignal) {
      customSignal.addEventListener('abort', () => abortController.abort(customSignal.reason));
    }
    let timeoutId: any;
    if (settings.timeoutMinutes && settings.timeoutMinutes > 0) {
      timeoutId = setTimeout(() => abortController.abort('TIMEOUT'), settings.timeoutMinutes * 60 * 1000);
    }

    let maxTokensValue = settings.isUnlimitedTokens ? 500000 : (settings.maxTokens || 30000);

    try {
      const response = await fetch(completionUrl, {
        method: 'POST',
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.proxyKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: maxTokensValue
        })
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("API Error: 429 (Too Many Requests). Vui lòng đợi một chút rồi thử lại.");
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let rawData = '';

      if (reader) {
        // Nâng cấp cơ chế đọc dữ liệu thô (Raw Stream Parsing)
        // Hút dữ liệu thô từ API về từng mảnh nhỏ (chunk) rồi ghép lại trong bộ nhớ an toàn
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawData += decoder.decode(value, { stream: true });
        }
        rawData += decoder.decode();
      }

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // Hệ thống thông minh tự xử lý dữ liệu API để trả về kết quả tốt không bị lỗi
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(rawData);
      } catch (e) {
        console.warn("Lỗi parse JSON toàn cục, hệ thống thông minh đang cố gắng khôi phục dữ liệu thô...");
        const contentMatch = rawData.match(/"content"\s*:\s*"([\s\S]*?)"\s*}/);
        if (contentMatch) {
          jsonResponse = { choices: [{ message: { content: contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') } }] };
        } else {
          throw new Error("Dữ liệu API trả về bị hỏng nặng và không thể phục hồi.");
        }
      }

      const content = jsonResponse.choices?.[0]?.message?.content || '';
      
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(content);
      } catch (e) {
        // Trả về text thô nếu không phải JSON (dùng cho viết truyện)
        return content;
      }

    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error("API Call failed:", error);
      if (error.name === 'AbortError' || error === 'TIMEOUT') {
        throw new Error("Lỗi: Quá thời gian chờ API. Vui lòng tăng thời gian chờ trong Cài đặt.");
      }
      let errorMsg = error.message || 'Lỗi khi gọi API. Vui lòng thử lại.';
      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'Không thể kết nối với Proxy Endpoint. Vui lòng kiểm tra lại URL Proxy, kết nối mạng hoặc CORS settings.';
      }
      throw new Error(errorMsg);
    }
  };

  const generateNPCs = async (count: number, topic?: string, customSignal?: AbortSignal) => {
    try {
      const topicContext = topic ? ` liên quan đến chủ đề "${topic}"` : '';
      const prompt = `Tạo một mảng JSON chứa chính xác ${count} đối tượng NPC. Mỗi đối tượng có các trường: "name" (tên ngẫu nhiên), "status" (trạng thái ngắn gọn${topicContext}), "level" (số từ 1-100). Chỉ trả về mảng JSON, không có văn bản nào khác.`;
      const systemInstruction = "Bạn là một API trả về dữ liệu JSON hợp lệ. Luôn trả về một mảng JSON.";
      const data = await callApi(prompt, systemInstruction, customSignal);
      
      if (Array.isArray(data)) {
        return data.map((item, i) => ({
          id: `npc_${Date.now()}_${i}`,
          name: item.name || `NPC_${i + 1}`,
          avatar: IMAGES[i % IMAGES.length],
          status: item.status || STATUSES[i % STATUSES.length],
          level: item.level || Math.floor(Math.random() * 10) + 1,
          date: "06.18.24"
        }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err === 'AbortError') {
        throw err;
      }
      console.error(err);
    }
    // Fallback
    return Array.from({ length: count }).map((_, i) => ({
      id: `npc_${Date.now()}_${i}`,
      name: `NPC_${i + 1}`,
      avatar: IMAGES[i % IMAGES.length],
      status: STATUSES[i % STATUSES.length],
      level: Math.floor(Math.random() * 10) + 1,
      date: "06.18.24"
    }));
  };

  const generatePosts = async (count: number, customSignal?: AbortSignal) => {
    try {
      const prompt = `Tạo một mảng JSON chứa chính xác ${count} đối tượng bài đăng. Mỗi đối tượng có các trường: "author" (tên tác giả), "caption" (nội dung bài đăng ngắn gọn, dễ thương). Chỉ trả về mảng JSON.`;
      const systemInstruction = "Bạn là một API trả về dữ liệu JSON hợp lệ. Luôn trả về một mảng JSON.";
      const data = await callApi(prompt, systemInstruction, customSignal);
      
      if (Array.isArray(data)) {
        return data.map((item, i) => ({
          id: `post_${Date.now()}_${i}`,
          author: item.author || `NPC_${i + 1}`,
          avatar: IMAGES[i % IMAGES.length],
          image: IMAGES[(i + 1) % IMAGES.length],
          caption: item.caption || `This is a cute post number ${i + 1} 🎀✨`,
          likes: Math.floor(Math.random() * 1000),
          comments: []
        }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err === 'AbortError') {
        throw err;
      }
      console.error(err);
    }
    return Array.from({ length: count }).map((_, i) => ({
      id: `post_${Date.now()}_${i}`,
      author: `NPC_${i + 1}`,
      avatar: IMAGES[i % IMAGES.length],
      image: IMAGES[(i + 1) % IMAGES.length],
      caption: `This is a cute post number ${i + 1} 🎀✨`,
      likes: Math.floor(Math.random() * 1000),
      comments: []
    }));
  };

  const generateComments = async (count: number, isPersonal = false, customSignal?: AbortSignal) => {
    try {
      const roles = ["Bố mẹ", "Bạn bè", "Người hàng xóm", "Cô giáo"];
      const prompt = isPersonal 
        ? `Tạo một mảng JSON chứa chính xác ${count} đối tượng bình luận. Mỗi đối tượng có trường "author" (chọn ngẫu nhiên từ: Bố mẹ, Bạn bè, Người hàng xóm, Cô giáo) và "text" (nội dung bình luận khen ngợi, dễ thương). Chỉ trả về mảng JSON.`
        : `Tạo một mảng JSON chứa chính xác ${count} đối tượng bình luận. Mỗi đối tượng có trường "author" (tên người bình luận) và "text" (nội dung bình luận dễ thương). Chỉ trả về mảng JSON.`;
      const systemInstruction = "Bạn là một API trả về dữ liệu JSON hợp lệ. Luôn trả về một mảng JSON.";
      const data = await callApi(prompt, systemInstruction, customSignal);
      
      if (Array.isArray(data)) {
        return data.map((item, i) => ({
          id: `comment_${Date.now()}_${i}`,
          author: item.author || (isPersonal ? `${roles[i % roles.length]} ${i + 1}` : `NPC_${i + 1}`),
          avatar: IMAGES[i % IMAGES.length],
          text: item.text || (isPersonal ? `Tuyệt vời quá con/bạn/em ơi! 💖✨` : `So cute! 💖✨ Comment ${i + 1}`)
        }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err === 'AbortError') {
        throw err;
      }
      console.error(err);
    }
    const roles = ["Bố mẹ", "Bạn bè", "Người hàng xóm", "Cô giáo"];
    return Array.from({ length: count }).map((_, i) => ({
      id: `comment_${Date.now()}_${i}`,
      author: isPersonal ? `${roles[i % roles.length]} ${i + 1}` : `NPC_${i + 1}`,
      avatar: IMAGES[i % IMAGES.length],
      text: isPersonal ? `Tuyệt vời quá con/bạn/em ơi! 💖✨ (${roles[i % roles.length]})` : `So cute! 💖✨ Comment ${i + 1}`
    }));
  };
  
  // Data States
  const [npcs, setNpcs] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const savedNpcs = await getLargeData('rengram_npcs');
      if (savedNpcs) {
        setNpcs(savedNpcs);
      } else {
        const localNpcs = localStorage.getItem('rengram_npcs');
        if (localNpcs) {
          setNpcs(JSON.parse(localNpcs));
          localStorage.removeItem('rengram_npcs');
        }
      }

      const savedPosts = await getLargeData('rengram_posts');
      if (savedPosts) {
        setPosts(savedPosts);
      } else {
        const localPosts = localStorage.getItem('rengram_posts');
        if (localPosts) {
          setPosts(JSON.parse(localPosts));
          localStorage.removeItem('rengram_posts');
        }
      }
      setIsDataLoaded(true);
    };
    loadData();
  }, []);

  const [loadingNPCs, setLoadingNPCs] = useState(false);
  const [npcAbortController, setNpcAbortController] = useState<AbortController | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [threadsAbortController, setThreadsAbortController] = useState<AbortController | null>(null);
  const [novelAbortController, setNovelAbortController] = useState<AbortController | null>(null);
  const [flippedPosts, setFlippedPosts] = useState<Record<string, boolean>>({});
  const [cardBgs, setCardBgs] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadCardBgs = async () => {
      const savedBgs = await getLargeData('rengram_card_bgs');
      if (savedBgs) {
        setCardBgs(savedBgs);
      } else {
        const localBgs = localStorage.getItem('rengram_card_bgs');
        if (localBgs) {
          setCardBgs(JSON.parse(localBgs));
          localStorage.removeItem('rengram_card_bgs');
        }
      }
    };
    loadCardBgs();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      setLargeData('rengram_card_bgs', cardBgs);
    }
  }, [cardBgs, isDataLoaded]);

  const handleCardBgUpload = (e: React.ChangeEvent<HTMLInputElement>, cardId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardBgs(prev => ({ ...prev, [cardId]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFlip = (postId: string) => {
    setFlippedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  useEffect(() => {
    if (isDataLoaded) {
      setLargeData('rengram_npcs', npcs);
    }
  }, [npcs, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      setLargeData('rengram_posts', posts);
    }
  }, [posts, isDataLoaded]);
  
  // Profile States
  const [userProfile, setUserProfile] = useState<any>({
    name: "RenGram User",
    avatar: IMAGES[0],
    cover: IMAGES[1],
    bio: "feeling: sleepy 🎀✨",
    myPosts: [] as any[]
  });

  useEffect(() => {
    const loadProfile = async () => {
      const savedProfile = await getLargeData('rengram_profile');
      if (savedProfile) {
        setUserProfile(savedProfile);
      } else {
        const localProfile = localStorage.getItem('rengram_profile');
        if (localProfile) {
          const parsed = JSON.parse(localProfile);
          setUserProfile({
            ...parsed,
            avatar: parsed.avatar || IMAGES[0],
            cover: parsed.cover || IMAGES[1],
            myPosts: parsed.myPosts?.map((post: any) => ({
              ...post,
              image: post.image || IMAGES[Math.floor(Math.random() * IMAGES.length)],
              avatar: post.avatar || IMAGES[0]
            })) || []
          });
          localStorage.removeItem('rengram_profile');
        }
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      setLargeData('rengram_profile', userProfile);
    }
  }, [userProfile, isDataLoaded]);

  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editCaption, setEditCaption] = useState('');

  const handleDeletePost = (postId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
      setUserProfile(prev => ({
        ...prev,
        myPosts: prev.myPosts.filter(p => p.id !== postId)
      }));
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setEditCaption(post.caption);
  };

  const saveEditPost = () => {
    setUserProfile(prev => ({
      ...prev,
      myPosts: prev.myPosts.map(p => p.id === editingPost.id ? { ...p, caption: editCaption } : p)
    }));
    setEditingPost(null);
    setEditCaption('');
  };


  const [homeTopic, setHomeTopic] = useState(() => localStorage.getItem('rengram_home_topic') || '');
  
  useEffect(() => {
    localStorage.setItem('rengram_home_topic', homeTopic);
  }, [homeTopic]);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostData, setNewPostData] = useState({ image: '', caption: '' });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'cover' | 'bg' | 'post') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'bg') setGlobalBgImage(reader.result as string);
        else if (field === 'post') setNewPostData(prev => ({ ...prev, image: reader.result as string }));
        else setUserProfile(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Club States
  const [activeClub, setActiveClub] = useState<any>(null);
  const [clubNPCs, setClubNPCs] = useState<any[]>([]);
  const [showClubsMenu, setShowClubsMenu] = useState(false);

  // Smart System States
  const [suggestionModal, setSuggestionModal] = useState<{show: boolean, charCount: number, suggestedMinutes: number} | null>(null);
  const [novelResult, setNovelResult] = useState('');
  const [isGeneratingNovel, setIsGeneratingNovel] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  const LOADING_MESSAGES = [
    "Chờ xíu em bé ơi... 🌸",
    "Đang vắt óc suy nghĩ nè... 🎀",
    "Sắp xong rồi, ráng đợi nha... ✨",
    "Đang nặn chữ cho em bé... 📝",
    "Uống miếng nước đi rồi đọc tiếp... 🧋",
    "Hệ thống đang chạy hết công suất... 🚀"
  ];

  useEffect(() => {
    let interval: any;
    if (isGeneratingNovel) {
      interval = setInterval(() => {
        setLoadingMessageIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    } else {
      setLoadingMessageIdx(0);
    }
    return () => clearInterval(interval);
  }, [isGeneratingNovel]);

  // Novel States
  const [novelCards, setNovelCards] = useState<any[]>([
    { id: 'genre', title: 'Thể loại Việt', content: '', image: '', isEditing: true },
    { id: 'direction', title: 'Hướng phát triển câu chuyện', content: '', image: '', isEditing: true },
    { id: 'couple', title: 'Thông tin cặp đôi chính', content: '', image: '', isEditing: true },
    { id: 'subGenre', title: 'Thể loại phụ', content: '', image: '', isEditing: true },
    { id: 'history', title: 'Lịch sử/Quá khứ của nhân vật chính', content: '', image: '', isEditing: true },
    { id: 'length', title: 'Yêu cầu độ dài ký tự cho chương truyện', content: '', image: '', isEditing: true }
  ]);

  useEffect(() => {
    const loadNovelCards = async () => {
      const savedCards = await getLargeData('rengram_novel_cards');
      if (savedCards) {
        setNovelCards(savedCards);
      } else {
        const localCards = localStorage.getItem('rengram_novel_cards');
        if (localCards) {
          try {
            setNovelCards(JSON.parse(localCards));
            localStorage.removeItem('rengram_novel_cards');
          } catch (e) {}
        }
      }
    };
    loadNovelCards();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      setLargeData('rengram_novel_cards', novelCards);
    }
  }, [novelCards, isDataLoaded]);

  // Initial API Call 1: 300 NPCs
  const handleLoadHomeNPCs = async () => {
    if (!settings.isSetupComplete) {
      setShowSettings(true);
      return;
    }
    const controller = new AbortController();
    setNpcAbortController(controller);
    setLoadingNPCs(true);
    try {
      const data = await generateNPCs(300, homeTopic, controller.signal);
      setNpcs(data);
    } catch (error: any) {
      if (error.name === 'AbortError' || error === 'AbortError') {
        console.log('NPC generation stopped by user');
      } else {
        console.error(error);
      }
    } finally {
      setLoadingNPCs(false);
      setNpcAbortController(null);
    }
  };

  const handleStopNPCGeneration = () => {
    if (npcAbortController) {
      npcAbortController.abort('AbortError');
      setNpcAbortController(null);
      setLoadingNPCs(false);
    }
  };

  // API Call 2: 200 Posts manually triggered
  const handleGenerateThreads = async () => {
    if (!settings.isSetupComplete) {
      setShowSettings(true);
      return;
    }
    const controller = new AbortController();
    setThreadsAbortController(controller);
    setLoadingPosts(true);
    try {
      const data = await generatePosts(200, controller.signal);
      setPosts(data);
    } catch (error: any) {
      if (error.name === 'AbortError' || error === 'AbortError') {
        console.log('Threads generation stopped by user');
      } else {
        console.error(error);
      }
    } finally {
      setLoadingPosts(false);
      setThreadsAbortController(null);
    }
  };

  const handleStopThreadsGeneration = () => {
    if (threadsAbortController) {
      threadsAbortController.abort('AbortError');
      setThreadsAbortController(null);
      setLoadingPosts(false);
    }
  };

  const handleLoadMorePosts = async () => {
    if (!settings.isSetupComplete) {
      setShowSettings(true);
      return;
    }
    const morePosts = await generatePosts(100);
    setPosts(prev => [...prev, ...morePosts]);
  };

  const handleLoadComments = async (postId: string, isPersonal = false) => {
    if (!settings.isSetupComplete) {
      setShowSettings(true);
      return;
    }
    // API Call 3: 200 Comments
    const newComments = await generateComments(200, isPersonal);
    if (isPersonal) {
      setUserProfile(prev => ({
        ...prev,
        myPosts: prev.myPosts.map(p => p.id === postId ? { ...p, comments: newComments } : p)
      }));
    } else {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: newComments } : p));
    }
  };

  // handleCreatePost moved inline

  const handleJoinClub = async (club: any) => {
    setActiveClub(club);
    setShowClubsMenu(false);
    if (!settings.isSetupComplete) {
      setShowSettings(true);
      return;
    }
    const initialNPCs = await generateNPCs(100);
    setClubNPCs(initialNPCs);
  };

  const handleAddClubNPCs = async () => {
    if (!settings.isSetupComplete) {
      setShowSettings(true);
      return;
    }
    const moreNPCs = await generateNPCs(100);
    setClubNPCs(prev => [...prev, ...moreNPCs]);
  };

  return (
    <div 
      className="absolute inset-0 overflow-y-auto w-full font-serif text-stone-800 transition-colors duration-500 pb-24 custom-scrollbar bg-cover bg-center bg-fixed"
      style={{ 
        backgroundColor: globalBg,
        backgroundImage: globalBgImage ? `url(${globalBgImage})` : 'none'
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-md border-b-2 border-dashed border-pink-200 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors mr-2">
              <ChevronRight className="w-5 h-5 text-pink-500 rotate-180" />
            </button>
          )}
          <div className="relative w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
            <div className="absolute inset-0 border-[3px] border-dotted border-pink-300 rounded-xl opacity-50"></div>
            <Camera className="w-6 h-6 text-pink-500 z-10" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-pink-600 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>RenGram</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTutorial(true)} className="p-2 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors" title="Hướng dẫn">
            <HelpCircle className="w-5 h-5 text-pink-500" />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors" title="Cài đặt API">
            <Settings className="w-5 h-5 text-pink-500" />
          </button>
          <button onClick={() => setActiveTab('novel')} className="p-2 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors" title="Góc sáng tác">
            <PenTool className="w-5 h-5 text-pink-500" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Status Area */}
            <div 
              className="bg-white/80 rounded-3xl p-6 shadow-sm border border-pink-100 relative overflow-hidden bg-cover bg-center group"
              style={{ backgroundImage: cardBgs['status'] ? `url(${cardBgs['status']})` : 'none' }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-200 via-white to-pink-200 z-10"></div>
              {cardBgs['status'] && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0"></div>}
              
              <label className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full cursor-pointer hover:bg-pink-100 text-pink-500" title="Đổi nền thẻ">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleCardBgUpload(e, 'status')} />
              </label>

              <div className="relative z-10">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400 fill-pink-400" /> 
                  My Digital Diary
                </h2>
                <div className="space-y-3 font-mono text-sm text-stone-600">
                  <p className="border-b border-dotted border-pink-200 pb-2">feeling: sleepy 🎀</p>
                  <p className="border-b border-dotted border-pink-200 pb-2">web coding 💻</p>
                  <p className="border-b border-dotted border-pink-200 pb-2">graphic making 🎨</p>
                </div>
              </div>
            </div>

            {/* Customization Area */}
            <div 
              className="bg-white/80 rounded-3xl p-6 shadow-sm border border-pink-100 relative bg-cover bg-center group"
              style={{ backgroundImage: cardBgs['custom'] ? `url(${cardBgs['custom']})` : 'none' }}
            >
              {cardBgs['custom'] && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-3xl z-0"></div>}
              
              <label className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full cursor-pointer hover:bg-pink-100 text-pink-500" title="Đổi nền thẻ">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleCardBgUpload(e, 'custom')} />
              </label>

              <div className="relative z-10">
                <h2 className="text-lg font-bold mb-4">Tùy chỉnh Avatar & Cover</h2>
                <div className="grid grid-cols-4 gap-2">
                  {IMAGES.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-400 cursor-pointer transition-all">
                      <img src={img} alt="custom" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NPC Database */}
            <div 
              className="bg-white/80 rounded-3xl p-6 shadow-sm border border-pink-100 relative bg-cover bg-center group"
              style={{ backgroundImage: cardBgs['npc'] ? `url(${cardBgs['npc']})` : 'none' }}
            >
              {cardBgs['npc'] && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-3xl z-0"></div>}
              
              <label className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full cursor-pointer hover:bg-pink-100 text-pink-500" title="Đổi nền thẻ">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleCardBgUpload(e, 'npc')} />
              </label>

              <div className="relative z-10">
                <div className="flex flex-col gap-4 mb-6 border-b-2 border-dashed border-pink-200 pb-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-pink-500">{npcs.length > 0 ? npcs.length : '300'}</h2>
                    <p className="text-sm font-mono text-stone-500 uppercase tracking-widest">NPCs</p>
                  </div>
                  {loadingNPCs && <span className="text-xs font-mono animate-pulse text-pink-400">Đang gọi API...</span>}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={homeTopic}
                    onChange={e => setHomeTopic(e.target.value)}
                    placeholder="Nhập chủ đề bình luận (VD: Mèo con, Lập trình...)"
                    className="flex-1 px-4 py-2 rounded-xl border border-pink-200 focus:border-pink-400 outline-none text-sm"
                  />
                  {loadingNPCs ? (
                    <button 
                      onClick={handleStopNPCGeneration}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Dừng tạo
                    </button>
                  ) : (
                    <button 
                      onClick={handleLoadHomeNPCs}
                      className="px-4 py-2 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Đổi mới 300 NPC
                    </button>
                  )}
                </div>
              </div>
              
              <div className="h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {npcs.map(npc => (
                  <div key={npc.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-pink-50 transition-colors border border-transparent hover:border-pink-100">
                    <img src={npc.avatar} alt={npc.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-stone-700">{npc.name}</h3>
                        <span className="text-xs font-mono text-stone-400">{npc.date} (Lv {npc.level})</span>
                      </div>
                      <p className="text-sm text-stone-500 italic">{npc.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* THREADS TAB */}
        {activeTab === 'threads' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center bg-white/80 p-4 rounded-3xl shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-pink-500">Bảng tin (Threads)</h2>
              {loadingPosts ? (
                <button 
                  onClick={handleStopThreadsGeneration}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-colors flex items-center gap-2 text-sm"
                >
                  <X className="w-4 h-4" />
                  Dừng tạo
                </button>
              ) : (
                <button 
                  onClick={handleGenerateThreads}
                  className="px-4 py-2 bg-pink-100 text-pink-600 rounded-xl font-bold hover:bg-pink-200 transition-colors flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Đổi mới 200 Bài đăng
                </button>
              )}
            </div>

            {/* NPC Stories */}
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {npcs.slice(0, 20).map(npc => (
                <div key={`story_${npc.id}`} className="flex flex-col items-center gap-1 min-w-[72px]">
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-300 to-pink-100">
                    <img src={npc.avatar} alt="story" className="w-full h-full rounded-full object-cover border-2 border-white" />
                  </div>
                  <span className="text-xs font-mono truncate w-16 text-center">{npc.name}</span>
                </div>
              ))}
            </div>

            {/* Posts Feed */}
            <div className="space-y-8">
              {loadingPosts && (
                <div className="text-center py-10 font-mono text-pink-500 flex flex-col items-center gap-4">
                  <svg className="animate-spin h-8 w-8 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="animate-pulse text-lg font-bold">{LOADING_MESSAGES[loadingMessageIdx]}</span>
                </div>
              )}
              
              {!loadingPosts && posts.length === 0 && (
                <div className="text-center py-20 bg-white/50 rounded-3xl border border-pink-100">
                  <p className="text-pink-400 mb-4 font-mono">Chưa có bài đăng nào. Hãy tạo mới nhé! 🌸</p>
                  <button 
                    onClick={handleGenerateThreads}
                    className="px-6 py-3 bg-pink-400 text-white rounded-full font-bold hover:bg-pink-500 transition-colors shadow-sm"
                  >
                    Tạo 200 Bài đăng
                  </button>
                </div>
              )}
              
              {posts.map((post, idx) => (
                <div key={post.id} className="perspective-1000 w-full mb-8">
                  <div className={`relative w-full transition-transform duration-700 preserve-3d ${flippedPosts[post.id] ? 'rotate-y-180' : ''}`}>
                    
                    {/* Front of the card */}
                    <div 
                      className={`backface-hidden bg-white/90 rounded-[2rem] overflow-hidden shadow-sm border border-pink-100 bg-cover bg-center sparkle-effect-${idx % 4}`}
                      style={{ backgroundImage: post.bgImage ? `url(${post.bgImage})` : 'none' }}
                    >
                      {post.bgImage && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0"></div>}
                      
                      <div className="relative z-10">
                        <div className="p-4 flex items-center gap-3">
                          <img src={post.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-pink-200" />
                          <span className="font-bold">{post.author}</span>
                        </div>
                        
                        <div className="relative group cursor-pointer" onClick={() => toggleFlip(post.id)}>
                          <img src={post.image} alt="post" className="w-full aspect-square object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/80 text-pink-600 px-4 py-2 rounded-full font-bold text-sm backdrop-blur-sm">Lật thẻ</span>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          <div className="flex gap-4">
                            <button 
                              onClick={() => handleLoadMorePosts()}
                              className="flex items-center gap-1 text-pink-500 hover:scale-110 transition-transform"
                              title="Tải thêm 100 bài đăng"
                            >
                              <Heart className="w-6 h-6 fill-pink-500" />
                            </button>
                            <button 
                              onClick={() => handleLoadComments(post.id)}
                              className="flex items-center gap-1 text-pink-400 hover:scale-110 transition-transform"
                              title="Gọi 200 bình luận NPC"
                            >
                              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                                <Cat className="w-5 h-5" />
                              </div>
                            </button>
                          </div>
                          
                          <p className="text-sm"><span className="font-bold mr-2">{post.author}</span>{post.caption}</p>
                          
                          {/* Comments Section */}
                          {post.comments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-dashed border-pink-200">
                              <p className="text-xs font-mono text-pink-400 mb-3">Loaded {post.comments.length} comments (API 3)</p>
                              <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                {post.comments.map((cmt: any) => (
                                  <div key={cmt.id} className="flex gap-3">
                                    <img src={cmt.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                    <div className="bg-pink-50 rounded-2xl rounded-tl-none p-3 flex-1">
                                      <span className="font-bold text-sm block mb-1">{cmt.author}</span>
                                      <p className="text-sm">{cmt.text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Back of the card */}
                    <div 
                      className={`absolute inset-0 backface-hidden bg-pink-50 rounded-[2rem] overflow-hidden shadow-sm border border-pink-200 flex flex-col items-center justify-center p-6 rotate-y-180`}
                    >
                      <h3 className="text-xl font-bold text-pink-600 mb-4">Cài đặt thẻ</h3>
                      <label className="px-6 py-3 bg-white border-2 border-dashed border-pink-300 text-pink-500 rounded-2xl cursor-pointer hover:bg-pink-50 transition-colors flex items-center gap-2 font-bold">
                        <ImageIcon className="w-5 h-5" /> Chọn hình nền cho thẻ này
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setPosts(prev => prev.map(p => p.id === post.id ? { ...p, bgImage: reader.result as string } : p));
                                toggleFlip(post.id); // Flip back after choosing
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {post.bgImage && (
                        <button 
                          onClick={() => {
                            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, bgImage: undefined } : p));
                            toggleFlip(post.id);
                          }}
                          className="mt-4 px-4 py-2 text-red-400 hover:bg-red-50 rounded-xl font-bold text-sm"
                        >
                          Xóa hình nền
                        </button>
                      )}
                      <button 
                        onClick={() => toggleFlip(post.id)}
                        className="mt-8 px-6 py-2 bg-pink-200 text-pink-700 rounded-xl font-bold hover:bg-pink-300 transition-colors"
                      >
                        Quay lại
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Cover & Avatar */}
            <div className="relative rounded-3xl overflow-hidden bg-white/90 shadow-sm border border-pink-100 backdrop-blur-sm">
              <div className="h-48 w-full relative group">
                <img src={userProfile.cover} alt="cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="px-4 py-2 bg-white/80 rounded-full text-sm font-bold cursor-pointer hover:bg-white text-pink-600">
                    Đổi ảnh bìa
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'cover')} />
                  </label>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
              </div>
              
              <div className="px-6 pb-6 relative">
                <div className="flex justify-between items-end -mt-12 mb-4">
                  <div className="relative group">
                    <img src={userProfile.avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md relative z-10" />
                    <label className="absolute inset-0 z-15 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'avatar')} />
                    </label>
                    <button 
                      onClick={() => setShowClubsMenu(true)}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center text-white border-2 border-white z-20 hover:scale-110 transition-transform shadow-sm"
                      title="Mở Hội Nhóm"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <button className="px-4 py-2 bg-pink-100 text-pink-600 rounded-full text-sm font-bold hover:bg-pink-200 transition-colors">
                    Edit Profile
                  </button>
                </div>
                
                <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                <p className="text-stone-500 font-mono text-sm mt-2">{userProfile.bio}</p>
                
                {/* Background Color Picker */}
                <div className="mt-6 pt-4 border-t border-dashed border-pink-200">
                  <p className="text-sm font-bold mb-2">Theme Background</p>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {['#FFF0F5', '#F0F8FF', '#F5FFFA', '#FFFFF0', '#F5F5DC'].map(color => (
                        <button 
                          key={color}
                          onClick={() => { setGlobalBg(color); setGlobalBgImage(''); }}
                          className={`w-8 h-8 rounded-full border-2 ${globalBg === color && !globalBgImage ? 'border-pink-400 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-stone-300">|</span>
                    <label className="px-4 py-1.5 bg-pink-50 text-pink-600 rounded-full text-sm font-bold cursor-pointer hover:bg-pink-100 border border-pink-200">
                      Tải ảnh nền
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'bg')} />
                    </label>
                    {globalBgImage && (
                      <button onClick={() => setGlobalBgImage('')} className="text-xs text-red-400 hover:underline">Xóa ảnh</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Create Post */}
            <div 
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-pink-100 relative bg-cover bg-center group"
              style={{ backgroundImage: cardBgs['create_post'] ? `url(${cardBgs['create_post']})` : 'none' }}
            >
              {cardBgs['create_post'] && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-3xl z-0"></div>}
              
              <label className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full cursor-pointer hover:bg-pink-100 text-pink-500" title="Đổi nền thẻ">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleCardBgUpload(e, 'create_post')} />
              </label>

              <div className="relative z-10">
                {showCreatePost ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={userProfile.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                      <span className="font-bold">{userProfile.name}</span>
                    </div>
                    <textarea 
                      value={newPostData.caption}
                      onChange={e => setNewPostData(p => ({ ...p, caption: e.target.value }))}
                      placeholder="Bạn đang nghĩ gì? 🌸"
                      className="w-full bg-pink-50/50 rounded-xl p-3 border border-pink-100 outline-none min-h-[80px] text-sm"
                    />
                    {newPostData.image && (
                      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-pink-200">
                        <img src={newPostData.image} alt="preview" className="w-full h-full object-cover" />
                        <button onClick={() => setNewPostData(p => ({ ...p, image: '' }))} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <label className="flex items-center gap-2 text-pink-500 cursor-pointer hover:bg-pink-50 px-3 py-2 rounded-xl transition-colors">
                        <ImageIcon className="w-5 h-5" /> Thêm ảnh
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'post')} />
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => setShowCreatePost(false)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-xl font-bold">Hủy</button>
                        <button 
                          onClick={() => {
                            const newPost = {
                              id: `mypost_${Date.now()}`,
                              author: userProfile.name,
                              avatar: userProfile.avatar,
                              image: newPostData.image || IMAGES[Math.floor(Math.random() * IMAGES.length)],
                              caption: newPostData.caption || "My new cute post! 🌸",
                              likes: 0,
                              comments: []
                            };
                                                         setUserProfile(prev => ({ ...prev, myPosts: [newPost, ...prev.myPosts].slice(0, 20) }));
                            setShowCreatePost(false);
                            setNewPostData({ image: '', caption: '' });
                          }}
                          className="px-6 py-2 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600"
                        >
                          Đăng bài
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowCreatePost(true)} className="w-full py-4 border-2 border-dashed border-pink-300 rounded-2xl text-pink-500 font-bold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2">
                    <PenTool className="w-5 h-5" />
                    Bạn đang nghĩ gì? Đăng bài mới...
                  </button>
                )}
              </div>
            </div>

            {/* My Posts Grid */}
            <div className="grid grid-cols-1 gap-6">
              {userProfile.myPosts.map(post => (
                <div 
                  key={post.id} 
                  className="bg-white rounded-3xl overflow-hidden shadow-md border border-pink-100 relative bg-cover bg-center group"
                  style={{ backgroundImage: cardBgs[post.id] ? `url(${cardBgs[post.id]})` : 'none' }}
                >
                  {cardBgs[post.id] && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0"></div>}
                  
                  <label className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full cursor-pointer hover:bg-pink-100 text-pink-500" title="Đổi nền thẻ">
                    <ImageIcon className="w-5 h-5" />
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleCardBgUpload(e, post.id)} />
                  </label>

                  <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => handleEditPost(post)} className="p-2 bg-white/80 rounded-full hover:bg-pink-100 text-pink-500" title="Chỉnh sửa">
                        <PenTool className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-white/80 rounded-full hover:bg-red-100 text-red-500" title="Xóa">
                        <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative z-10">
                    <img src={post.image} alt="post" className="w-full aspect-square object-cover" />
                    <div className="p-6">
                      <button 
                        onClick={() => handleLoadComments(post.id, true)}
                        className="flex items-center gap-2 text-pink-500 mb-4 hover:scale-105 transition-transform bg-pink-50 px-4 py-2 rounded-full border border-pink-100"
                        title="Gọi 200 bình luận NPC (Bạn bè, Bố mẹ...)"
                      >
                        <Cat className="w-5 h-5" />
                        <span className="text-sm font-bold">Gọi NPC Bình luận</span>
                      </button>
                      <p className="text-base text-stone-800">{post.caption}</p>
                      
                      {post.comments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-dashed border-pink-100">
                          <p className="text-xs font-mono text-pink-400 mb-2">{post.comments.length} comments</p>
                          <div className="max-h-48 overflow-y-auto space-y-3 custom-scrollbar">
                            {post.comments.map((cmt: any) => (
                              <div key={cmt.id} className="text-sm bg-pink-50 p-3 rounded-xl">
                                <span className="font-bold block text-pink-600">{cmt.author}</span>
                                {cmt.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CLUBS TAB (Accessed from Profile) */}
        {activeTab === 'clubs' && activeClub && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div 
              className={`${activeClub.color} rounded-3xl p-8 text-center relative overflow-hidden shadow-sm bg-cover bg-center group`}
              style={{ backgroundImage: cardBgs['club_header'] ? `url(${cardBgs['club_header']})` : 'none' }}
            >
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              {cardBgs['club_header'] && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-0"></div>}
              
              <label className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full cursor-pointer hover:bg-pink-100 text-pink-500" title="Đổi nền thẻ">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleCardBgUpload(e, 'club_header')} />
              </label>

              <h2 className="text-3xl font-bold relative z-10">{activeClub.name}</h2>
              <p className="mt-2 font-mono text-sm opacity-70 relative z-10">Nơi hội tụ những tâm hồn đồng điệu</p>
            </div>

            <div 
              className="bg-white/80 rounded-3xl p-6 shadow-sm border border-pink-100 relative bg-cover bg-center group"
              style={{ backgroundImage: cardBgs['club_topics'] ? `url(${cardBgs['club_topics']})` : 'none' }}
            >
              {cardBgs['club_topics'] && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-3xl z-0"></div>}
              
              <label className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full cursor-pointer hover:bg-pink-100 text-pink-500" title="Đổi nền thẻ">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleCardBgUpload(e, 'club_topics')} />
              </label>

              <div className="relative z-10">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-pink-400" />
                  50 Chủ đề bàn luận
                </h3>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-pink-200 rounded-full text-xs font-mono text-pink-600 hover:bg-pink-50 cursor-pointer">
                      #chude_{i + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div 
              className="bg-white/80 rounded-3xl p-6 shadow-sm border border-pink-100 relative bg-cover bg-center group"
              style={{ backgroundImage: cardBgs['club_members'] ? `url(${cardBgs['club_members']})` : 'none' }}
            >
              {cardBgs['club_members'] && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-3xl z-0"></div>}
              
              <label className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full cursor-pointer hover:bg-pink-100 text-pink-500" title="Đổi nền thẻ">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleCardBgUpload(e, 'club_members')} />
              </label>

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold">Thành viên ({clubNPCs.length} NPCs)</h3>
                  <button 
                    onClick={handleAddClubNPCs}
                    className="px-4 py-2 bg-pink-400 text-white rounded-full text-sm font-bold hover:bg-pink-500 transition-colors shadow-sm"
                  >
                    + Thêm 100 NPC
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                  {clubNPCs.map(npc => (
                    <div key={npc.id} className="flex flex-col items-center gap-1">
                      <img src={npc.avatar} alt="npc" className="w-12 h-12 rounded-full object-cover border-2 border-pink-100" />
                      <span className="text-[10px] font-mono truncate w-full text-center">{npc.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* NOVEL WRITING SPACE */}
        {activeTab === 'novel' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-pink-600" style={{ fontFamily: "'Playfair Display', serif" }}>
                Khung Sườn Tiểu Thuyết
              </h2>
              <button 
                onClick={() => setNovelCards([...novelCards, { id: Date.now().toString(), title: 'Thẻ mới', content: '', image: '', isEditing: true }])}
                className="px-4 py-2 bg-pink-400 text-white rounded-full text-sm font-bold hover:bg-pink-500 flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Thêm thẻ
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {novelCards.map((card, idx) => (
                <div 
                  key={card.id} 
                  className={`bg-pink-50 rounded-3xl p-5 shadow-sm border border-pink-200 relative flex flex-col gap-3 bg-cover bg-center sparkle-effect-${idx % 4}`}
                  style={{ backgroundImage: card.bgImage ? `url(${card.bgImage})` : 'none' }}
                >
                  {/* Overlay for readability if bgImage is present */}
                  {card.bgImage && <div className="absolute inset-0 bg-white/60 rounded-3xl backdrop-blur-[2px]"></div>}
                  
                  <div className="relative z-10 flex flex-col gap-3 h-full">
                  {card.isEditing ? (
                    <>
                      <input 
                        type="text" 
                        value={card.title} 
                        onChange={e => setNovelCards(cards => cards.map(c => c.id === card.id ? { ...c, title: e.target.value } : c))}
                        className="font-bold text-pink-700 bg-transparent border-b border-pink-300 outline-none w-full pb-1"
                        placeholder="Tiêu đề thẻ..."
                      />
                      <textarea 
                        value={card.content}
                        onChange={e => setNovelCards(cards => cards.map(c => c.id === card.id ? { ...c, content: e.target.value } : c))}
                        className="w-full bg-white/70 rounded-xl p-3 border border-pink-200 outline-none text-sm min-h-[100px] custom-scrollbar"
                        placeholder="Nội dung chi tiết..."
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 bg-white/80 border border-pink-200 text-pink-500 py-2 rounded-xl cursor-pointer hover:bg-pink-100 transition-colors text-sm">
                          <ImageIcon className="w-4 h-4" /> Ảnh minh họa
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNovelCards(cards => cards.map(c => c.id === card.id ? { ...c, image: reader.result as string } : c));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <label className="flex-1 flex items-center justify-center gap-2 bg-white/80 border border-pink-200 text-pink-500 py-2 rounded-xl cursor-pointer hover:bg-pink-100 transition-colors text-sm">
                          <ImageIcon className="w-4 h-4" /> Nền thẻ
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNovelCards(cards => cards.map(c => c.id === card.id ? { ...c, bgImage: reader.result as string } : c));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {card.image && (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-pink-200">
                          <img src={card.image} alt="preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setNovelCards(cards => cards.map(c => c.id === card.id ? { ...c, image: '' } : c))}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => {
                            setNovelCards(cards => cards.map(c => c.id === card.id ? { ...c, isEditing: false } : c));
                            if (card.id === 'length') {
                              const nums = card.content.match(/\d+/g);
                              if (nums) {
                                const maxNum = Math.max(...nums.map(Number));
                                if (maxNum > 1000) {
                                  const suggested = Math.ceil(maxNum / 2000) + 2;
                                  setSuggestionModal({ show: true, charCount: maxNum, suggestedMinutes: suggested });
                                }
                              }
                            }
                          }}
                          className="flex-1 py-2 bg-pink-400 text-white rounded-xl font-bold hover:bg-pink-500 text-sm"
                        >
                          Lưu thẻ
                        </button>
                        <button 
                          onClick={() => setNovelCards(cards => cards.filter(c => c.id !== card.id))}
                          className="px-3 py-2 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 text-sm font-bold"
                        >
                          Xóa
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-pink-700 text-lg">{card.title}</h3>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setNovelCards(cards => cards.map(c => c.id === card.id ? { ...c, isEditing: true } : c))}
                            className="p-2 text-pink-500 hover:bg-pink-100 rounded-full"
                          >
                            <PenTool className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setNovelCards(cards => cards.filter(c => c.id !== card.id))}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {card.image && (
                        <div className="w-full h-40 rounded-xl overflow-hidden border border-pink-200">
                          <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <p className="text-sm text-stone-700 whitespace-pre-wrap">{card.content || <span className="text-stone-400 italic">Chưa có nội dung... bấm nút sửa để thêm.</span>}</p>
                    </>
                  )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 text-center space-y-4">
              <button 
                onClick={async () => {
                  if (!settings.isSetupComplete) {
                    setShowSettings(true);
                    return;
                  }
                  const controller = new AbortController();
                  setNovelAbortController(controller);
                  setIsGeneratingNovel(true);
                  const promptData = novelCards.map(c => `${c.title}: ${c.content}`).join('\n');
                  const prompt = `Viết chương truyện cho tiểu thuyết dựa trên các thông tin sau:\n${promptData}`;
                  const systemInstruction = "Bạn là một nhà văn. Viết một chương truyện dài và chi tiết. TUYỆT ĐỐI KHÔNG được để các thuật ngữ, tên riêng, hoặc từ ngữ nhấn mạnh trong dấu ngoặc đơn () hoặc dấu sao *. Hãy viết chúng như những từ ngữ bình thường trong văn bản tiểu thuyết. Ví dụ: viết 'shoji' thay vì '*shoji*' hay '(shoji)'.";
                  try {
                    const result = await callApi(prompt, systemInstruction, controller.signal);
                    setNovelResult(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
                  } catch (e: any) {
                    if (e.name === 'AbortError' || e === 'AbortError') {
                      console.log('Novel generation stopped by user');
                    } else {
                      alert("Lỗi khi viết truyện: " + e.message);
                    }
                  } finally {
                    setIsGeneratingNovel(false);
                    setNovelAbortController(null);
                  }
                }}
                disabled={isGeneratingNovel}
                className={`px-8 py-4 rounded-full font-bold transition-all shadow-md w-full md:w-auto text-lg flex items-center justify-center gap-3 mx-auto ${
                  isGeneratingNovel 
                    ? 'bg-pink-200 text-pink-600 cursor-wait' 
                    : 'bg-pink-400 text-white hover:bg-pink-500'
                }`}
              >
                {isGeneratingNovel ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="animate-pulse">{LOADING_MESSAGES[loadingMessageIdx]}</span>
                  </>
                ) : (
                  'Bắt đầu sáng tác (Max Token: Dương Vô Cực)'
                )}
              </button>

              {isGeneratingNovel && (
                <button 
                  onClick={() => {
                    if (novelAbortController) {
                      novelAbortController.abort('AbortError');
                      setNovelAbortController(null);
                      setIsGeneratingNovel(false);
                    }
                  }}
                  className="px-6 py-2 bg-red-100 text-red-500 rounded-full font-bold hover:bg-red-200 transition-colors text-sm flex items-center gap-2 mx-auto"
                >
                  <X className="w-4 h-4" />
                  Dừng sáng tác
                </button>
              )}
            </div>
          </motion.div>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t-2 border-dashed border-pink-200 px-6 py-4 flex justify-center gap-16 items-center z-50">
        <button onClick={() => setActiveTab('home')} className={`p-2 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-pink-100 text-pink-600 scale-110' : 'text-stone-400 hover:text-pink-400'}`}>
          <Home className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('threads')} className={`p-2 rounded-2xl transition-all ${activeTab === 'threads' ? 'bg-pink-100 text-pink-600 scale-110' : 'text-stone-400 hover:text-pink-400'}`}>
          <MessageCircle className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('profile')} className={`p-2 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-pink-100 text-pink-600 scale-110' : 'text-stone-400 hover:text-pink-400'}`}>
          <User className="w-6 h-6" />
        </button>
      </nav>

      {/* Clubs Slide Menu */}
      <AnimatePresence>
        {showClubsMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
              onClick={() => setShowClubsMenu(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[70] p-6 border-l-4 border-double border-pink-200"
            >
              <h2 className="text-2xl font-bold text-pink-500 mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Community Clubs</h2>
              <div className="space-y-4">
                {CLUBS.map(club => (
                  <button 
                    key={club.id}
                    onClick={() => {
                      handleJoinClub(club);
                      setActiveTab('clubs');
                    }}
                    className={`w-full text-left p-4 rounded-2xl ${club.color} hover:brightness-95 transition-all flex justify-between items-center group`}
                  >
                    <span className="font-bold text-stone-700">{club.name}</span>
                    <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Smart Timeout Suggestion Modal */}
      <AnimatePresence>
        {suggestionModal?.show && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border-2 border-pink-200 relative"
            >
              <h3 className="text-xl font-bold text-pink-600 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Gợi ý Cài đặt Thời gian chờ ⏱️</h3>
              <p className="text-sm text-stone-600 mb-4 leading-relaxed">
                Hệ thống nhận thấy bạn muốn viết khoảng <strong className="text-pink-500">{suggestionModal.charCount.toLocaleString()}</strong> ký tự. 
                Để đảm bảo API Proxy không bị lỗi ngắt kết nối giữa chừng, hệ thống thông minh gợi ý cài đặt thời gian chờ là <strong className="text-pink-500">{suggestionModal.suggestedMinutes} phút</strong>.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSuggestionModal(null)} className="flex-1 py-2.5 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors">Bỏ qua</button>
                <button onClick={() => {
                  setSettings(s => ({ ...s, timeoutMinutes: suggestionModal.suggestedMinutes }));
                  setSuggestionModal(null);
                  alert(`Đã áp dụng thời gian chờ: ${suggestionModal.suggestedMinutes} phút!`);
                }} className="flex-1 py-2.5 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors">Áp dụng ngay</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Novel Result Modal */}
      <AnimatePresence>
        {novelResult && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FFFDF8] rounded-3xl p-6 w-full max-w-3xl shadow-2xl border-2 border-amber-200 relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setNovelResult('')}
                className="absolute top-4 right-4 p-2 bg-amber-100 rounded-full text-amber-700 hover:bg-amber-200 z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-amber-800 mb-4 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Tác phẩm của bạn</h2>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white rounded-2xl border border-amber-100 shadow-inner whitespace-pre-wrap text-stone-800 leading-relaxed font-serif text-lg">
                {novelResult}
              </div>
              <div className="mt-4 text-center">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(novelResult);
                    alert("Đã sao chép nội dung!");
                  }}
                  className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors"
                >
                  Sao chép nội dung
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border-2 border-pink-200 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 bg-pink-50 rounded-full text-pink-500 hover:bg-pink-100"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-pink-600 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>API Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Loại API (API Type)</label>
                  <select 
                    value={settings.apiType || 'auto'}
                    onChange={e => setSettings(s => ({ ...s, apiType: e.target.value as any }))}
                    className="w-full px-4 py-2 rounded-xl border border-pink-200 focus:border-pink-400 outline-none"
                  >
                    <option value="auto">Tự động phát hiện (Auto Detect)</option>
                    <option value="openai">OpenAI-compatible</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="gemini">Gemini</option>
                    <option value="custom">Custom Endpoint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Proxy Endpoint</label>
                  <input 
                    type="text" 
                    value={settings.proxyEndpoint}
                    onChange={e => setSettings(s => ({ ...s, proxyEndpoint: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-pink-200 focus:border-pink-400 outline-none"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">API Key</label>
                  <input 
                    type="password" 
                    value={settings.proxyKey}
                    onChange={e => setSettings(s => ({ ...s, proxyKey: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-pink-200 focus:border-pink-400 outline-none"
                    placeholder="Nhập API Key..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Model</label>
                  <div className="flex gap-2">
                    {availableModels.length > 0 ? (
                      <select 
                        value={settings.model}
                        onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
                        className="flex-1 px-4 py-2 rounded-xl border border-pink-200 focus:border-pink-400 outline-none bg-white"
                      >
                        <option value="">Chọn model...</option>
                        {availableModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        value={settings.model}
                        onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
                        className="flex-1 px-4 py-2 rounded-xl border border-pink-200 focus:border-pink-400 outline-none"
                        placeholder="Nhập hoặc kéo model..."
                      />
                    )}
                    <button 
                      onClick={fetchModels}
                      disabled={isFetchingModels}
                      className="px-4 py-2 bg-pink-100 text-pink-600 rounded-xl font-bold hover:bg-pink-200 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {isFetchingModels ? 'Đang kéo...' : 'Kéo Model'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 mt-4 p-4 bg-pink-50/50 rounded-xl border border-pink-100">
                  <h3 className="font-bold text-sm text-pink-600">Cấu hình Token & Thời gian chờ</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">Max Tokens (Output)</label>
                    <div className="flex flex-wrap gap-2">
                      {[30000, 50000, 100000, 'unlimited'].map(val => (
                        <button
                          key={val}
                          onClick={() => {
                            if (val === 'unlimited') {
                              setSettings(s => ({ ...s, isUnlimitedTokens: true }));
                            } else {
                              setSettings(s => ({ ...s, maxTokens: val as number, isUnlimitedTokens: false }));
                            }
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                            (val === 'unlimited' && settings.isUnlimitedTokens) || (val !== 'unlimited' && !settings.isUnlimitedTokens && settings.maxTokens === val) 
                            ? 'bg-pink-500 text-white border-pink-500' 
                            : 'bg-white text-stone-600 border-pink-200 hover:bg-pink-50'
                          }`}
                        >
                          {val === 'unlimited' ? 'Vô cực' : (val as number) >= 100000 ? '100K' : (val as number).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-stone-600 mb-1">Thời gian chờ tối đa (Phút) - Nhập 0 để không giới hạn</label>
                    <input 
                      type="number" 
                      min="0"
                      value={settings.timeoutMinutes}
                      onChange={e => setSettings(s => ({ ...s, timeoutMinutes: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-pink-200 focus:border-pink-400 outline-none text-sm"
                    />
                    <p className="text-[10px] text-stone-400 mt-1 italic">Gợi ý: Nếu tạo dữ liệu lớn hoặc truyện dài, hãy đặt 5-15 phút để hệ thống làm việc tốt nhất mà không bị lỗi ngắt quãng.</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSettings(s => ({ ...s, isSetupComplete: true }));
                    setShowSettings(false);
                  }}
                  className="w-full py-3 mt-4 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors"
                >
                  Lưu Cài Đặt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border-2 border-pink-200 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => {
                  setShowTutorial(false);
                  localStorage.setItem('rengram_tutorial', 'done');
                }}
                className="absolute top-4 right-4 p-2 bg-pink-50 rounded-full text-pink-500 hover:bg-pink-100"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-pink-600 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Chào mừng đến với RenGram 🎀</h2>
              <p className="text-sm text-stone-600 mb-4">Dưới đây là hướng dẫn sử dụng các tính năng của ứng dụng:</p>
              
              <div className="space-y-4 text-sm text-stone-700">
                <div className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                  <strong className="flex items-center gap-2 text-pink-600 mb-1"><Settings className="w-4 h-4"/> 1. Cài đặt API (Bắt buộc)</strong>
                  Bấm vào nút bánh răng ở góc trên cùng bên phải để nhập API Key. Nếu không có API, ứng dụng sẽ không thể tải NPC hay bài đăng.
                </div>
                <div className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                  <strong className="flex items-center gap-2 text-pink-600 mb-1"><Home className="w-4 h-4"/> 2. Trang chủ (Home)</strong>
                  Nơi hiển thị trạng thái của bạn và danh sách 300 NPC được tải tự động qua API.
                </div>
                <div className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                  <strong className="flex items-center gap-2 text-pink-600 mb-1"><MessageCircle className="w-4 h-4"/> 3. Bảng tin (Threads)</strong>
                  Hiển thị 200 bài đăng. 
                  <br/>- Bấm nút <Heart className="w-3 h-3 inline fill-pink-500 text-pink-500"/> để tải thêm 100 bài đăng.
                  <br/>- Bấm nút <Cat className="w-3 h-3 inline text-pink-500"/> để gọi 200 bình luận NPC cho bài viết đó.
                </div>
                <div className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                  <strong className="flex items-center gap-2 text-pink-600 mb-1"><User className="w-4 h-4"/> 4. Hồ sơ (Profile) & Hội nhóm</strong>
                  Đổi màu nền ứng dụng, tạo bài đăng mới. 
                  <br/>- Bấm nút <Plus className="w-3 h-3 inline bg-pink-400 text-white rounded-full"/> ở Avatar để mở danh sách Hội nhóm (Clubs).
                </div>
                <div className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                  <strong className="flex items-center gap-2 text-pink-600 mb-1"><PenTool className="w-4 h-4"/> 5. Góc sáng tác (Novel)</strong>
                  Bấm biểu tượng cây bút ở góc trên cùng để mở trang viết tiểu thuyết với sức chứa "Dương Vô Cực".
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowTutorial(false);
                  localStorage.setItem('rengram_tutorial', 'done');
                }}
                className="w-full py-3 mt-6 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors"
              >
                Đã hiểu, bắt đầu thôi! ✨
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Edit Post Modal */}
        <AnimatePresence>
          {editingPost && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              >
                <h3 className="text-xl font-bold text-pink-500 mb-4">Chỉnh sửa bài đăng</h3>
                <textarea 
                  value={editCaption} 
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full p-3 border border-pink-200 rounded-xl mb-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingPost(null)} className="flex-1 py-2 text-stone-500 hover:bg-stone-100 rounded-xl font-bold">Hủy</button>
                  <button onClick={saveEditPost} className="flex-1 py-2 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600">Lưu</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #fbcfe8;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
