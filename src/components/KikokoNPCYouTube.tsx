import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Heart, MessageCircle, Share2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
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

interface KikokoNPCYouTubeProps {
  onClose: () => void;
  apiSettings: any;
  secondaryApiSettings: any;
  currentStory: any;
  currentChapter: any;
  updateStory: (updates: any) => void;
  galleryBackground?: string;
  getCompletionUrl: (baseUrl: string) => string;
}

export default function KikokoNPCYouTube({
  onClose,
  apiSettings,
  secondaryApiSettings,
  currentStory,
  currentChapter,
  updateStory,
  galleryBackground,
  getCompletionUrl
}: KikokoNPCYouTubeProps) {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'subscriptions'>('recommendations');
  const [activeProfile, setActiveProfile] = useState<any | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // History states
  const [recommendationHistory, setRecommendationHistory] = useState<Record<string, any[]>>(currentStory.npcYouTubeRecommendations || {});
  const [subscriptionHistory, setSubscriptionHistory] = useState<Record<string, any[]>>(currentStory.npcYouTubeSubscriptions || {});
  const [subscribedChannels, setSubscribedChannels] = useState<Record<string, any[]>>(currentStory.npcYouTubeChannels || {});
  const [channelPostsHistory, setChannelPostsHistory] = useState<Record<string, any[]>>(currentStory.npcYouTubeChannelPosts || {});
  const [channelBackgrounds, setChannelBackgrounds] = useState<Record<string, string>>(currentStory.npcYouTubeChannelBackgrounds || {});
  const [globalBackground, setGlobalBackground] = useState<string>(currentStory.npcYouTubeGlobalBackground || galleryBackground || '');
  
  const [selectedRecGenId, setSelectedRecGenId] = useState<string | null>(null);
  const [selectedSubGenId, setSelectedSubGenId] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [selectedChannelGenId, setSelectedChannelGenId] = useState<string | null>(null);

  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const [isGeneratingChannels, setIsGeneratingChannels] = useState(false);
  const [isGeneratingChannelPosts, setIsGeneratingChannelPosts] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelFileInputRef = useRef<HTMLInputElement>(null);

  const pollingIntervals = useRef<Record<string, number>>({});

  // Sync state to story
  useEffect(() => {
    updateStory({
      npcYouTubeRecommendations: recommendationHistory,
      npcYouTubeSubscriptions: subscriptionHistory,
      npcYouTubeChannels: subscribedChannels,
      npcYouTubeChannelPosts: channelPostsHistory,
      npcYouTubeChannelBackgrounds: channelBackgrounds,
      npcYouTubeGlobalBackground: globalBackground
    });
  }, [recommendationHistory, subscriptionHistory, subscribedChannels, channelPostsHistory, channelBackgrounds, globalBackground]);

  useEffect(() => {
    return () => {
      // Cleanup
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'global' | 'channel') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'global') {
          setGlobalBackground(base64String);
        } else if (selectedChannel) {
          setChannelBackgrounds(prev => ({ ...prev, [selectedChannel.name]: base64String }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const HandDrawnIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M4.5 18.5C4.5 18.5 5.5 16.5 7.5 16.5C9.5 16.5 10.5 18.5 12.5 18.5C14.5 18.5 15.5 16.5 17.5 16.5C19.5 16.5 20.5 18.5 20.5 18.5" />
      <path d="M20.5 15.5V5.5C20.5 4.5 19.5 3.5 18.5 3.5H5.5C4.5 3.5 3.5 4.5 3.5 5.5V15.5" />
      <path d="M3.5 15.5C3.5 15.5 4.5 13.5 6.5 13.5C8.5 13.5 9.5 15.5 11.5 15.5C13.5 15.5 14.5 13.5 16.5 13.5C18.5 13.5 19.5 15.5 21.5 15.5" />
      <circle cx="8.5" cy="8.5" r="1.8" />
      <path d="M11.5 11.5L14.5 8.5L18.5 12.5" />
      <path d="M2 2C2 2 3 4 2 6" strokeOpacity="0.3" />
      <path d="M22 2C22 2 21 4 22 6" strokeOpacity="0.3" />
    </svg>
  );

  const THUMBNAILS = [
    'https://i.postimg.cc/c1gqP3M8/dbbbd8f7f0ac3352569ea193d49b992f.jpg',
    'https://i.postimg.cc/g2K13Hmc/987727d1717650d6e85c26a4842b8cd7.jpg',
    'https://i.postimg.cc/fL1PMHj3/31852e119a56c6c911b88e16288aa325.jpg',
    'https://i.postimg.cc/ryWnSNNZ/eb9a4782a68c767ff5a7e46ad2b4b0ff.jpg',
    'https://i.postimg.cc/JzTP16RN/f045718d3333f7cd9afd22fd2f5b0567.jpg',
    'https://i.postimg.cc/D0KcCRPH/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg'
  ];

  const AVATAR_IMG = 'https://i.postimg.cc/D0KcCRPH/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg';

  useEffect(() => {
    const loadProfiles = async () => {
      const allProfiles: any[] = [];
      
      // Default User and Char profiles
      allProfiles.push({
        id: 'user',
        name: currentStory.userChar || 'User',
        avatar: 'https://i.postimg.cc/D0KcCRPH/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg',
        bio: 'Người dùng Kikoko Novel',
        type: 'char'
      });
      
      allProfiles.push({
        id: 'char',
        name: currentStory.botChar || 'Character',
        avatar: 'https://i.postimg.cc/D0KcCRPH/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg',
        bio: 'Nhân vật chính trong truyện',
        type: 'char'
      });
      
      try {
        const instagramData = await loadKikokoInstagram(currentStory.id);
        if (instagramData && instagramData.profiles) {
          const npcProfiles = instagramData.profiles.filter((p: any) => p.type === 'npc');
          allProfiles.push(...npcProfiles);
          
          // Update user/char names if they exist in Instagram data
          const igUser = instagramData.profiles.find((p: any) => p.id === 'user');
          if (igUser) {
            allProfiles[0].name = igUser.name;
            allProfiles[0].avatar = igUser.avatar;
            allProfiles[0].bio = igUser.bio;
          }
          const igChar = instagramData.profiles.find((p: any) => p.id === 'char');
          if (igChar) {
            allProfiles[1].name = igChar.name;
            allProfiles[1].avatar = igChar.avatar;
            allProfiles[1].bio = igChar.bio;
          }
        }
      } catch (e) {
        console.error("Failed to load Instagram profiles", e);
      }

      setProfiles(allProfiles);
      if (allProfiles.length > 0 && !activeProfile) {
        setActiveProfile(allProfiles[0]);
      }
    };
    
    loadProfiles();
  }, [currentStory]);

  useEffect(() => {
    if (activeProfile) {
      const recs = recommendationHistory[activeProfile.id] || [];
      if (recs.length > 0 && !selectedRecGenId) {
        setSelectedRecGenId(recs[recs.length - 1].id);
      }
      const subs = subscriptionHistory[activeProfile.id] || [];
      if (subs.length > 0 && !selectedSubGenId) {
        setSelectedSubGenId(subs[subs.length - 1].id);
      }
    }
  }, [activeProfile, recommendationHistory, subscriptionHistory]);

  const robustParseJSON = (content: string) => {
    if (!content || typeof content !== 'string') return [];
    const { isJson, json } = safeParseJson(content);
    if (isJson && Array.isArray(json)) return json;
    if (isJson && !Array.isArray(json)) {
      if (json.data && Array.isArray(json.data)) return json.data;
      if (json.items && Array.isArray(json.items)) return json.items;
      if (json.videos && Array.isArray(json.videos)) return json.videos;
    }
    console.warn("Robust parse failed, falling back to regex");
    // Array regex fallback: attempt to manually extract objects if possible
    try {
      const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch(e) {}
    return [];
  };

  const generateRecommendations = async () => {
    if (!activeProfile) return;
    if (!apiSettings || !apiSettings.proxyEndpoint || !apiSettings.apiKey) {
      alert("Vui lòng cài đặt API Key và Proxy Endpoint trong phần Cài đặt trước.");
      return;
    }
    setIsGeneratingRecs(true);
    setShowOverlay(true);
    
    const newGenId = Date.now().toString();
    const newGen = {
      id: newGenId,
      timestamp: new Date().toISOString(),
      chapterTitle: currentChapter?.title || 'Chương hiện tại',
      data: []
    };

    setRecommendationHistory(prev => {
      const profileHistory = prev[activeProfile.id] || [];
      return {
        ...prev,
        [activeProfile.id]: [...profileHistory, newGen]
      };
    });
    setSelectedRecGenId(newGenId);

    try {
      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là hệ thống tạo đề xuất video YouTube cho nhân vật:
TÊN NHÂN VẬT: "${activeProfile.name}"
VAI TRÒ: ${activeProfile.type === 'npc' ? 'Nhân vật phụ (NPC) / Bạn bè' : 'Nhân vật chính'}

[YÊU CẦU TỐI THƯỢNG]
BẠN TUYỆT ĐỐI CHỈ TẠO ĐỀ XUẤT CHO "${activeProfile.name}". KHÔNG ĐƯỢC NHẦM LẪN VỚI CÁC NHÂN VẬT KHÁC.

[HỒ SƠ/MEMO NHÂN VẬT]: ${activeProfile.description || activeProfile.bio || 'Không có'}

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
- Truyện tổng thể: ${currentStory?.plot || 'Không có'}
- Ký ức chung/Memory: ${currentStory?.memory || currentStory?.characterMemory || 'Không có'}
- Tình huống hiện tại: ${currentStory?.situationTracking || 'Không có'}
- Thời tiết: ${currentStory?.worldState?.weather || 'Không rõ'}
- Thời gian: ${currentStory?.worldState?.time || 'Không rõ'}
- Mùa: ${currentStory?.worldState?.season || 'Không rõ'}

[BỐI CẢNH 3 CHƯƠNG GẦN NHẤT]
${currentStory.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || ''}

[NHIỆM VỤ]
Tạo 30 video đề xuất (JSON array) phù hợp hoàn cảnh của "${activeProfile.name}".
Ghi chú: Summary của mỗi video phải dài 1500-2000 ký tự.
[
  {
    "title": "...",
    "views": "...",
    "likes": "...",
    "summary": "..."
  }
]`;

      // Fetch Recommendations
      const response = await sendMessage(
        apiSettings,
        [{ role: 'user', content: prompt }]
      );

      const responseText = extractTextFromResponse(response);
      const parsed = robustParseJSON(responseText);

      setRecommendationHistory(prev => ({
        ...prev,
        [activeProfile.id]: (prev[activeProfile.id] || []).map(g => 
          g.id === newGenId ? { ...g, data: parsed } : g
        )
      }));
    } catch (e: any) {
      console.error("Generation failed", e);
      alert("Lỗi tạo đề xuất: " + e.message);
    } finally {
      setIsGeneratingRecs(false);
      setShowOverlay(false);
    }
  };

  const generateSubscriptions = async () => {
    if (!activeProfile) return;
    if (!apiSettings || !apiSettings.proxyEndpoint || !apiSettings.apiKey) {
      alert("Vui lòng cài đặt API Key và Proxy Endpoint trong phần Cài đặt trước.");
      return;
    }
    setIsGeneratingSubs(true);
    setShowOverlay(true);
    
    const newGenId = Date.now().toString();
    const newGen = {
      id: newGenId,
      timestamp: new Date().toISOString(),
      chapterTitle: currentChapter?.title || 'Chương hiện tại',
      data: []
    };

    setSubscriptionHistory(prev => {
      const profileHistory = prev[activeProfile.id] || [];
      return {
        ...prev,
        [activeProfile.id]: [...profileHistory, newGen]
      };
    });
    setSelectedSubGenId(newGenId);

    try {
      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là hệ thống tạo bài đăng cộng đồng YouTube cho nhân vật: "${activeProfile.name}".
VAI TRÒ: ${activeProfile.type === 'npc' ? 'NPC / Bạn bè' : 'Nhân vật chính'}

[YÊU CẦU TỐI THƯỢNG]
BẠN TUYỆT ĐỐI CHỈ TẠO BÀI ĐĂNG CHO "${activeProfile.name}". KHÔNG ĐƯỢC NHẦM LẪN.

[BỘ NHỚ THIẾT LẬP]
- Truyện tổng thể: ${currentStory?.plot || 'Không có'}
- Ký ức chung/Memory: ${currentStory?.memory || currentStory?.characterMemory || 'Không có'}
- Thời tiết: ${currentStory?.worldState?.weather || 'Không rõ'}
- Thời gian: ${currentStory?.worldState?.time || 'Không rõ'}
- Mùa: ${currentStory?.worldState?.season || 'Không rõ'}
- Bối cảnh: ${currentStory.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || ''}

[NHIỆM VỤ]
Tạo 30 bài đăng cộng đồng (JSON array) mà "${activeProfile.name}" sẽ thấy trên feed từ các kênh họ theo dõi.
[
  {
    "channelName": "...",
    "timeAgo": "...",
    "content": "..."
  }
]`;

      // Fetch Subscriptions
      const response = await sendMessage(
        apiSettings,
        [{ role: 'user', content: prompt }]
      );

      const responseText = extractTextFromResponse(response);
      const parsed = robustParseJSON(responseText);

      setSubscriptionHistory(prev => ({
        ...prev,
        [activeProfile.id]: (prev[activeProfile.id] || []).map(g => 
          g.id === newGenId ? { ...g, data: parsed } : g
        )
      }));
    } catch (e: any) {
      console.error("Generation failed", e);
      alert("Lỗi tạo bài đăng: " + e.message);
    } finally {
      setIsGeneratingSubs(false);
      setShowOverlay(false);
    }
  };

  const generateChannels = async () => {
    if (!activeProfile) return;
    if (!apiSettings || !apiSettings.proxyEndpoint || !apiSettings.apiKey) {
      alert("Vui lòng cài đặt API Key và Proxy Endpoint trong phần Cài đặt trước.");
      return;
    }
    setIsGeneratingChannels(true);
    setShowOverlay(true);

    try {
      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là hệ thống tạo danh sách kênh YouTube cho nhân vật: "${activeProfile.name}".
VAI TRÒ: ${activeProfile.type === 'npc' ? 'NPC / Bạn bè' : 'Nhân vật chính'}

[YÊU CẦU TỐI THƯỢNG]
BẠN TUYỆT ĐỐI CHỈ TẠO KÊNH PHÙ HỢP VỚI "${activeProfile.name}". 

[BỘ NHỚ THIẾT LẬP]
- Truyện tổng thể: ${currentStory?.plot || 'Không có'}
- Ký ức chung/Memory: ${currentStory?.memory || currentStory?.characterMemory || 'Không có'}
- Thời tiết: ${currentStory?.worldState?.weather || 'Không rõ'}
- Thời gian: ${currentStory?.worldState?.time || 'Không rõ'}
- Mùa: ${currentStory?.worldState?.season || 'Không rõ'}
- Bối cảnh: ${currentStory.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || ''}

[NHIỆM VỤ]
Tạo 200 tên kênh YouTube (JSON array) mà "${activeProfile.name}" đăng ký.
[
  {"n": "Tên kênh 1"},
  {"n": "Tên kênh 2"}
]`;

      // Fetch Channels
      const response = await sendMessage(
        apiSettings,
        [{ role: 'user', content: prompt }]
      );

      const responseText = extractTextFromResponse(response);
      const parsed = robustParseJSON(responseText);

      setSubscribedChannels(prev => {
        const currentChannels = prev[activeProfile.id] || [];
        const normalized = parsed.map((item: any) => ({
          name: item.n || item.name || "Kênh ẩn danh",
          avatar: item.avatar || AVATAR_IMG
        }));
        return {
          ...prev,
          [activeProfile.id]: [...currentChannels, ...normalized]
        };
      });
    } catch (e: any) {
      console.error("Channel generation failed", e);
      alert("Lỗi tạo danh sách kênh: " + e.message);
    } finally {
      setIsGeneratingChannels(false);
      setShowOverlay(false);
    }
  };

  const generateChannelPosts = async (channel: any) => {
    if (!activeProfile || !channel) return;
    if (!apiSettings || !apiSettings.proxyEndpoint || !apiSettings.apiKey) {
      alert("Vui lòng cài đặt API Key và Proxy Endpoint trong phần Cài đặt trước.");
      return;
    }
    setIsGeneratingChannelPosts(true);
    setShowOverlay(true);

    const newGenId = Date.now().toString();
    const newGen = {
      id: newGenId,
      timestamp: new Date().toISOString(),
      data: []
    };

    setChannelPostsHistory(prev => {
      const history = prev[channel.name] || [];
      return {
        ...prev,
        [channel.name]: [...history, newGen]
      };
    });
    setSelectedChannelGenId(newGenId);

    try {
      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là hệ thống tạo bài đăng cho kênh YouTube: "${channel.name}".
Kênh này được theo dõi bởi: "${activeProfile.name}".

[BỘ NHỚ THIẾT LẬP]
- Truyện tổng thể: ${currentStory.plot}
- Ký ức chung/Memory: ${currentStory.memory || currentStory.characterMemory || 'Không có'}
- Thời tiết: ${currentStory?.worldState?.weather || 'Không rõ'}
- Thời gian: ${currentStory?.worldState?.time || 'Không rõ'}
- Mùa: ${currentStory?.worldState?.season || 'Không rõ'}
- Bối cảnh: ${currentStory.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || ''}

[NHIỆM VỤ]
Tạo 30 bài đăng cộng đồng (JSON array) cho kênh "${channel.name}".
[
  {
    "channelName": "${channel.name}",
    "timeAgo": "...",
    "content": "..."
  }
]`;

      // Fetch Channel Posts
      const response = await sendMessage(
        apiSettings,
        [{ role: 'user', content: prompt }]
      );

      const responseText = extractTextFromResponse(response);
      const parsed = robustParseJSON(responseText);

      setChannelPostsHistory(prev => ({
        ...prev,
        [channel.name]: (prev[channel.name] || []).map(g => 
          g.id === newGenId ? { ...g, data: parsed } : g
        )
      }));
    } catch (e: any) {
      console.error("Channel posts generation failed", e);
      alert("Lỗi tạo bài đăng kênh: " + e.message);
    } finally {
      setIsGeneratingChannelPosts(false);
      setShowOverlay(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[5000] flex flex-col"
      style={{
        backgroundImage: globalBackground ? `url(${globalBackground})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Loading Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${globalBackground ? 'bg-white/30' : 'bg-white/60 backdrop-blur-md'}`}
          >
            <div className="w-20 h-20 relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-[#F9C6D4] border-t-transparent rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play size={30} className="text-[#F9C6D4] fill-[#F9C6D4]" />
              </div>
            </div>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-6 text-[#D18E9B] font-bold text-lg"
            >
              {isGeneratingChannels ? 'Kikoko đang tìm kiếm kênh...' : 
               isGeneratingChannelPosts ? 'Kikoko đang tạo bài đăng kênh...' :
               'Kikoko đang tạo nội dung...'}
            </motion.p>
            <p className="text-[#D18E9B]/60 text-sm mt-2">Vui lòng chờ trong giây lát nhen~</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Task Indicator */}
      <AnimatePresence>
        {!showOverlay && (isGeneratingRecs || isGeneratingSubs || isGeneratingChannels || isGeneratingChannelPosts) && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-6 right-6 z-[80] border border-pink-100 px-4 py-2 rounded-full shadow-lg flex items-center gap-3 ${globalBackground ? 'bg-white/50' : 'bg-white/80 backdrop-blur-md'}`}
          >
            <div className="w-4 h-4 relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-[#F9C6D4] border-t-transparent rounded-full"
              />
            </div>
            <span className="text-[10px] font-bold text-[#D18E9B]">Kikoko đang làm việc ngầm...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedChannel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[90] bg-white flex flex-col"
          >
            {/* Channel Header */}
            <div 
              className="h-48 relative bg-cover bg-center"
              style={{ backgroundImage: `url(${channelBackgrounds[selectedChannel.name] || globalBackground || THUMBNAILS[0]})` }}
            >
              <div className="absolute inset-0 bg-black/20" />
              <button 
                onClick={() => setSelectedChannel(null)}
                className={`absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors z-10 ${globalBackground ? 'bg-white/40' : 'bg-white/20 backdrop-blur-md hover:bg-white/40'}`}
              >
                <X size={24} />
              </button>
              
              <div className="absolute -bottom-10 left-6 flex items-end gap-4">
                <div 
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedChannel.avatar || AVATAR_IMG})` }}
                />
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-white drop-shadow-md">{selectedChannel.name}</h2>
                  <p className="text-white/80 text-xs drop-shadow-sm">⸝⸝ ₊˚ 1.2M người đăng ký ✦₊</p>
                </div>
              </div>

            <div className="absolute bottom-4 right-4 flex gap-2">
                <input 
                  type="file" 
                  ref={channelFileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'channel')}
                />
                <button 
                  onClick={() => channelFileInputRef.current?.click()}
                  className="w-12 h-12 rounded-2xl bg-[#FFE4E8] border-2 border-[#F9C6D4] flex items-center justify-center text-[#D18E9B] shadow-sm hover:bg-[#FFD1DA] transition-all transform hover:rotate-3 active:scale-95"
                  title="Chọn ảnh từ máy"
                >
                  <HandDrawnIcon />
                </button>
              </div>
            </div>

            <div className="mt-14 flex-1 overflow-y-auto custom-scrollbar px-6 pb-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {(channelPostsHistory[selectedChannel.name] || []).map((gen, idx) => (
                    <button
                      key={gen.id}
                      onClick={() => setSelectedChannelGenId(gen.id)}
                      className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedChannelGenId === gen.id ? 'bg-[#F9C6D4] text-white shadow-md' : 'bg-white text-[#F9C6D4] border border-[#F9C6D4]/30 hover:bg-pink-50'}`}
                    >
                      Đợt {idx + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => generateChannelPosts(selectedChannel)}
                  disabled={isGeneratingChannelPosts}
                  className="shrink-0 px-4 py-2 rounded-full bg-[#FFF0F5] text-[#D18E9B] flex items-center gap-2 shadow-sm border border-pink-100 hover:bg-pink-50 transition-colors font-bold text-xs"
                >
                  <Plus size={16} />
                  {isGeneratingChannelPosts ? 'Đang tạo...' : 'Tạo 30 bài đăng của kênh này'}
                </button>
              </div>

              {(channelPostsHistory[selectedChannel.name] || []).find(g => g.id === selectedChannelGenId)?.data?.map((post: any, idx: number) => (
                <div key={idx} className="bg-[#FEFBFB] rounded-[16px] mb-6 p-5 border border-dotted border-[#E5C3C6] shadow-sm relative">
                  <div className="absolute top-3 right-4 text-xl">🎀</div>
                  <div className="flex items-center gap-3 mb-4">
                    <img src={selectedChannel.avatar || AVATAR_IMG} alt="Avatar" className="w-[30px] h-[30px] rounded-full object-cover border border-pink-100" />
                    <div>
                      <div className="font-bold text-[#6D5D5D] text-sm">{post.channelName}</div>
                      <div className="text-[10px] text-gray-400 italic font-light">⸝⸝ {post.timeAgo} ✦₊</div>
                    </div>
                  </div>
                  <div 
                    className="p-4 rounded-xl text-[#5C4A4A] text-sm custom-scrollbar"
                    style={{
                      backgroundColor: '#FFF5F7',
                      backgroundImage: 'linear-gradient(90deg, transparent 95%, #FCE4EC 95%), linear-gradient(transparent 95%, #FCE4EC 95%)',
                      backgroundSize: '20px 20px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      lineHeight: 1.7
                    }}
                  >
                    {post.content}
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <button className="text-[#D18E9B] text-xs font-bold hover:opacity-80 transition-opacity">[ ♡ Thích ]</button>
                    <button className="text-[#D18E9B] text-xs font-bold hover:opacity-80 transition-opacity">[ 💬 Trò chuyện ]</button>
                  </div>
                </div>
              ))}

              {(channelPostsHistory[selectedChannel.name] || []).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-[#D18E9B]/50 italic">
                  <p>Chưa có bài đăng nào cho kênh này.</p>
                  <p className="text-xs">Nhấn nút + để tạo 30 bài đăng đầu tiên!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0" style={{
        backgroundColor: globalBackground ? 'rgba(255, 240, 245, 0.3)' : 'rgba(255, 240, 245, 0.85)',
        backdropFilter: globalBackground ? 'none' : 'blur(8px)',
        WebkitBackdropFilter: globalBackground ? 'none' : 'blur(8px)'
      }} />

      {/* Header */}
      <div className={`relative z-10 border-b border-[#F9C6D4] shadow-sm pb-4 pt-6 px-4 shrink-0 ${globalBackground ? 'bg-white/30' : 'bg-white/50 backdrop-blur-md'}`}>
        <div className="absolute top-4 right-4 z-10 flex gap-3 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'global')}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl bg-[#FFE4E8] border-2 border-[#F9C6D4] flex items-center justify-center text-[#D18E9B] shadow-sm hover:bg-[#FFD1DA] transition-all transform hover:-rotate-3 active:scale-95"
            title="Chọn ảnh nền từ máy"
          >
            <HandDrawnIcon />
          </button>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/50 hover:bg-pink-50 flex items-center justify-center text-stone-400 hover:text-[#F9C6D4] transition-colors border border-pink-100"
          >
            <X size={28} />
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex gap-[15px] overflow-x-auto pb-4 custom-scrollbar justify-start items-start px-4">
            {profiles.map(profile => (
              <div key={profile.id} className="flex flex-col items-center gap-1 shrink-0 w-[60px]">
                <button
                  onClick={() => setActiveProfile(profile)}
                  className={`w-[50px] h-[50px] rounded-full border-2 p-[2px] transition-all ${activeProfile?.id === profile.id ? 'border-[#F9C6D4] scale-110 shadow-md' : 'border-pink-100/50 opacity-70 hover:opacity-100'}`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-pink-50">
                    {profile.avatar && <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />}
                  </div>
                </button>
                <span className="text-[10px] font-bold text-[#D18E9B] text-center truncate w-full px-1">
                  {profile.name}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'recommendations' ? 'bg-[#F9C6D4] text-white shadow-md' : 'bg-white/50 text-[#D18E9B] hover:bg-pink-50'}`}
            >
              Đề xuất
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'subscriptions' ? 'bg-[#F9C6D4] text-white shadow-md' : 'bg-white/50 text-[#D18E9B] hover:bg-pink-50'}`}
            >
              Kênh Đăng Ký
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          {activeTab === 'recommendations' && (
            <div className="flex flex-col gap-6">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar justify-start px-4">
                {(recommendationHistory[activeProfile?.id] || []).map((gen, idx) => (
                  <button
                    key={gen.id}
                    onClick={() => setSelectedRecGenId(gen.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedRecGenId === gen.id ? 'bg-[#F9C6D4] text-white shadow-md' : 'bg-white text-[#F9C6D4] border border-[#F9C6D4]/30 hover:bg-pink-50'}`}
                  >
                    Đợt {idx + 1}
                  </button>
                ))}
                <button
                  onClick={generateRecommendations}
                  disabled={isGeneratingRecs}
                  className="shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-pink-50 text-[#F9C6D4] border border-pink-200 hover:bg-pink-100 flex items-center gap-1 disabled:opacity-50"
                >
                  {isGeneratingRecs ? 'Đang tải...' : '+ Tạo 30 video đề xuất mới'}
                </button>
              </div>

              {isGeneratingRecs && (
                <div className="text-center text-[#D18E9B] font-bold py-10 animate-pulse">
                  Đang tải video đề xuất...
                </div>
              )}

              {!isGeneratingRecs && (recommendationHistory[activeProfile?.id] || []).find(g => g.id === selectedRecGenId)?.data?.map((video: any, idx: number) => (
                <div key={idx} className="bg-[#FCF8F8] rounded-[20px] mb-6 overflow-hidden shadow-sm">
                  <img 
                    src={THUMBNAILS[idx % THUMBNAILS.length]} 
                    alt="Thumbnail" 
                    className="w-full aspect-video object-cover rounded-t-[16px]"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-[#5C4A4A] text-lg mb-1">{video.title}</h3>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] text-[#9E8B8B]">⸝⸝ {video.views} lượt xem ✦₊ {video.likes} likes ⸝⸝</span>
                      <div className="flex gap-2">
                        <button className="bg-[#FFE4E8] rounded-[12px] px-[10px] py-[4px] text-[10px] text-[#D18E9B]">[ Chia sẻ ⧣₊˚ ]</button>
                        <button className="bg-[#FFE4E8] rounded-[12px] px-[10px] py-[4px] text-[10px] text-[#D18E9B]">[ Báo cáo ⚠ ]</button>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <button 
                        onClick={() => setExpandedVideoId(expandedVideoId === `${selectedRecGenId}-${idx}` ? null : `${selectedRecGenId}-${idx}`)}
                        className="text-[#D18E9B] text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
                      >
                        ◝⧣₊˚﹒✦₊ Mở rộng nội dung 𓂃★
                      </button>
                      
                      <AnimatePresence>
                        {expandedVideoId === `${selectedRecGenId}-${idx}` && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3"
                          >
                            <div 
                              className="p-4 rounded-xl border border-dashed border-[#F9C6D4] text-[#9E8B8B] text-sm font-light custom-scrollbar"
                              style={{
                                backgroundColor: '#FFF5F7',
                                backgroundImage: 'linear-gradient(45deg, #FCE4EC 25%, transparent 25%, transparent 75%, #FCE4EC 75%, #FCE4EC), linear-gradient(45deg, #FCE4EC 25%, transparent 25%, transparent 75%, #FCE4EC 75%, #FCE4EC)',
                                backgroundSize: '10px 10px',
                                backgroundPosition: '0 0, 5px 5px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                lineHeight: 1.6
                              }}
                            >
                              {video.summary}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="flex flex-col gap-6">
              {/* Channel Avatars */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-4">
                  <span className="text-[11px] font-bold text-[#D18E9B]">
                    ⸝⸝ Đã đăng ký ({(subscribedChannels[activeProfile?.id] || []).length} kênh) ✦₊
                  </span>
                  <button 
                    onClick={generateChannels}
                    disabled={isGeneratingChannels}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#F9C6D4] bg-pink-50 px-2 py-1 rounded-full hover:bg-pink-100 disabled:opacity-50"
                  >
                    <Plus size={12} />
                    {isGeneratingChannels ? 'Đang tạo...' : 'Thêm 200 kênh'}
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start px-4">
                  {(subscribedChannels[activeProfile?.id] || []).map((channel, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setSelectedChannel(channel);
                        const history = channelPostsHistory[channel.name] || [];
                        if (history.length > 0) {
                          setSelectedChannelGenId(history[history.length - 1].id);
                        }
                      }}
                      className="flex flex-col items-center gap-1 shrink-0 w-[70px] cursor-pointer hover:scale-105 transition-transform"
                    >
                      <div 
                        className="w-[50px] h-[50px] rounded-full border border-pink-200 bg-cover bg-center shadow-sm"
                        style={{ backgroundImage: `url(${channel.avatar || AVATAR_IMG})` }}
                      />
                      <span className="text-[9px] text-[#D18E9B] text-center break-words w-full px-1 leading-tight min-h-[2.4em] flex items-center justify-center">
                        {channel.name}
                      </span>
                    </div>
                  ))}
                  {(subscribedChannels[activeProfile?.id] || []).length === 0 && !isGeneratingChannels && (
                    <div className="text-[10px] text-[#D18E9B]/50 italic py-4 px-4 w-full text-center">
                      Chưa có kênh nào. Hãy nhấn nút để tạo 100 kênh đầu tiên!
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar justify-start px-4">
                {(subscriptionHistory[activeProfile?.id] || []).map((gen, idx) => (
                  <button
                    key={gen.id}
                    onClick={() => setSelectedSubGenId(gen.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedSubGenId === gen.id ? 'bg-[#F9C6D4] text-white shadow-md' : 'bg-white text-[#F9C6D4] border border-[#F9C6D4]/30 hover:bg-pink-50'}`}
                  >
                    Đợt {idx + 1}
                  </button>
                ))}
              </div>

              {isGeneratingSubs && (
                <div className="text-center text-[#D18E9B] font-bold py-10 animate-pulse">
                  Đang tải bài đăng...
                </div>
              )}

              {!isGeneratingSubs && (subscriptionHistory[activeProfile?.id] || []).find(g => g.id === selectedSubGenId)?.data?.map((post: any, idx: number) => (
                <div key={idx} className="bg-[#FEFBFB] rounded-[16px] mb-6 p-5 border border-dotted border-[#E5C3C6] shadow-sm relative">
                  <div className="absolute top-3 right-4 text-xl">🎀</div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <img src={AVATAR_IMG} alt="Avatar" className="w-[30px] h-[30px] rounded-full object-cover border border-pink-100" />
                    <div>
                      <div className="font-bold text-[#6D5D5D] text-sm">{post.channelName}</div>
                      <div className="text-[10px] text-gray-400 italic font-light">⸝⸝ {post.timeAgo} ✦₊</div>
                    </div>
                  </div>

                  <div 
                    className="p-4 rounded-xl text-[#5C4A4A] text-sm custom-scrollbar"
                    style={{
                      backgroundColor: '#FFF5F7',
                      backgroundImage: 'linear-gradient(90deg, transparent 95%, #FCE4EC 95%), linear-gradient(transparent 95%, #FCE4EC 95%)',
                      backgroundSize: '20px 20px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      lineHeight: 1.7
                    }}
                  >
                    {post.content}
                  </div>

                  <div className="text-center text-[#D6C4C4] text-xs tracking-widest my-4">
                    . . ╭──∪ ∪──╮ ✦ ⁺ . .
                  </div>

                  <div className="flex justify-center gap-6">
                    <button className="text-[#D18E9B] text-xs font-bold hover:opacity-80 transition-opacity">[ ♡ Thích ]</button>
                    <button className="text-[#D18E9B] text-xs font-bold hover:opacity-80 transition-opacity">[ 💬 Trò chuyện ]</button>
                    <button className="text-[#D18E9B] text-xs font-bold hover:opacity-80 transition-opacity">[ ⧣₊˚ Chia sẻ ]</button>
                  </div>
                </div>
              ))}

              {!isGeneratingSubs && (
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={generateSubscriptions}
                    className="px-6 py-3 bg-[#FFF0F5] text-[#D18E9B] rounded-full font-bold shadow-sm border border-pink-100 hover:bg-pink-50 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Tạo 30 bài đăng cộng đồng tổng hợp
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
