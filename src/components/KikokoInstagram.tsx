import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Heart, MessageCircle, Image as ImageIcon, Send, X, RefreshCw, Sparkles, Search } from 'lucide-react';
import { saveKikokoInstagram, loadKikokoInstagram } from '../utils/db';
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

interface KikokoInstagramProps {
  onClose: () => void;
  apiSettings: any;
  currentStory: any;
}

interface StoryHighlight {
  id: string;
  name: string;
  images: string[];
}

interface Post {
  id: string;
  content: string;
  bgImage: string;
  npcComments?: any[];
}

interface Profile {
  id: string;
  name: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  highlights: StoryHighlight[];
  posts: Post[];
  type: 'char' | 'npc';
  followersCount?: string;
  followingCount?: string;
  likesCount?: string;
  followingList?: { id?: string, name: string, avatar: string }[];
  googleSearchSessions?: { id: string, timestamp: string, queries: string[] }[];
}

export default function KikokoInstagram({ onClose, apiSettings, currentStory }: KikokoInstagramProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [isGeneratingSearches, setIsGeneratingSearches] = useState(false);
  const [showGoogleSearches, setShowGoogleSearches] = useState(false);
  const [viewingSearchSessionId, setViewingSearchSessionId] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<StoryHighlight | null>(null);
  const [storyImageIndex, setStoryImageIndex] = useState(0);
  const [showAddStory, setShowAddStory] = useState(false);
  const [showAddNPC, setShowAddNPC] = useState(false);
  const [newNPCName, setNewNPCName] = useState('');
  const [newStoryName, setNewStoryName] = useState('');
  const [newStoryImages, setNewStoryImages] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewingFollowingProfile, setViewingFollowingProfile] = useState<Profile | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const postBgInputRef = useRef<HTMLInputElement>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const robustParseJSON = (content: string) => {
    const { isJson, json } = safeParseJson(content);
    if (isJson) return json;
    console.warn("Robust parse failed, using raw content");
    return { content: content };
  };
  const [viewingCommentsFor, setViewingCommentsFor] = useState<string | null>(null);
  const [commentDisplayLimit, setCommentDisplayLimit] = useState(100);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  // Load saved data
  useEffect(() => {
    const loadData = async () => {
      if (currentStory?.id) {
        setIsLoaded(false);
        try {
          const parsed = await loadKikokoInstagram(currentStory.id);
          if (parsed && parsed.profiles && parsed.profiles.length > 0) {
            // Ensure User and Bot profiles exist even in saved data
            let updatedProfiles = [...parsed.profiles];
            const hasBot = updatedProfiles.some(p => p.id === 'char_bot');
            const hasUser = updatedProfiles.some(p => p.id === 'char_user');

            if (!hasBot) {
              updatedProfiles.unshift({
                id: 'char_bot',
                name: currentStory.botChar || 'Bot Character',
                avatar: '',
                coverImage: '',
                bio: '',
                highlights: [],
                posts: [],
                type: 'char'
              });
            }
            if (!hasUser) {
              updatedProfiles.unshift({
                id: 'char_user',
                name: currentStory.userChar || 'User Character',
                avatar: '',
                coverImage: '',
                bio: '',
                highlights: [],
                posts: [],
                type: 'char'
              });
            }

            setProfiles(updatedProfiles);
            setActiveProfileId(parsed.activeProfileId || updatedProfiles[0].id);
          } else {
            // Create default profiles
            const botProfile: Profile = {
              id: 'char_bot',
              name: currentStory.botChar || 'Bot Character',
              avatar: '',
              coverImage: '',
              bio: '',
              highlights: [],
              posts: [],
              type: 'char'
            };
            const userProfile: Profile = {
              id: 'char_user',
              name: currentStory.userChar || 'User Character',
              avatar: '',
              coverImage: '',
              bio: '',
              highlights: [],
              posts: [],
              type: 'char'
            };
            setProfiles([botProfile, userProfile]);
            setActiveProfileId(botProfile.id);
          }
        } catch (e) {
          console.error('Failed to load Instagram data from DB', e);
        } finally {
          setIsLoaded(true);
        }
      }
    };
    loadData();
  }, [currentStory?.id]);

  // Save data
  useEffect(() => {
    if (currentStory?.id && isLoaded) {
      saveKikokoInstagram(currentStory.id, {
        profiles,
        activeProfileId
      }).catch(e => console.error('Failed to save Instagram data to DB', e));
    }
  }, [profiles, activeProfileId, currentStory?.id, isLoaded]);

  const updateActiveProfile = (updates: Partial<Profile>) => {
    if (!activeProfileId) return;
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, ...updates } : p));
  };

  // Story playback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeStory && activeStory.images.length > 0) {
      timer = setInterval(() => {
        setStoryImageIndex(prev => {
          if (prev + 1 >= activeStory.images.length) {
            setActiveStory(null);
            return 0;
          }
          return prev + 1;
        });
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [activeStory]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => updateActiveProfile({ avatar: e.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => updateActiveProfile({ coverImage: e.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleStoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewStoryImages(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePostBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePostId && activeProfile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const updatedPosts = activeProfile.posts.map(p => p.id === activePostId ? { ...p, bgImage: e.target?.result as string } : p);
        updateActiveProfile({ posts: updatedPosts });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateBio = async () => {
    if (!apiSettings?.apiKey || !activeProfile) {
      alert('Vui lòng cài đặt API Key trong phần Cài đặt hệ thống');
      return;
    }
    setIsGeneratingBio(true);
    try {
      const latestChapter = currentStory?.chapters?.[currentStory.chapters.length - 1]?.content || '';
      const previousChapters = currentStory?.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || '';
      const otherProfiles = profiles.filter(p => p.id !== activeProfile.id).map(p => ({ id: p.id, name: p.name }));
      
      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là một chuyên gia viết tiểu sử Instagram xuất sắc nhất, có nhiệm vụ xây dựng tiểu sử và các thông số cho nhân vật sau đây:
TÊN NHÂN VẬT MỤC TIÊU: "${activeProfile.name}"
VAI TRÒ: ${activeProfile.type === 'npc' ? 'Nhân vật phụ (NPC) / Bạn bè' : 'Nhân vật chính'}

[YÊU CẦU TỐI THƯỢNG]
BẠN TUYỆT ĐỐI CHỈ LÀM VIỆC CHO "${activeProfile.name}". KHÔNG ĐƯỢC NHẦM LẪN SANG CÁC NHÂN VẬT KHÁC TRONG CỐT TRUYỆN. Mọi thông tin trong bio phải là của "${activeProfile.name}".

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN ĐỂ THAM KHẢO]
- Truyện tổng thể: ${currentStory?.plot || 'Không có'}
- Ký ức chung/Memory: ${currentStory?.memory || currentStory?.characterMemory || 'Không có'}
- Đặc điểm Bot (${currentStory?.botChar || 'Bot'}): ${currentStory?.charDescription || 'Không có'}
- Đặc điểm User (${currentStory?.userChar || 'User'}): ${currentStory?.userDescription || 'Không có'}
- Smart Memory: ${currentStory?.progressSummary || 'Không có'}
- Tình huống hiện tại: ${currentStory?.situationTracking || 'Không có'}
- Thời tiết: ${currentStory?.worldState?.weather || 'Không rõ'}
- Thời gian: ${currentStory?.worldState?.time || 'Không rõ'}
- Mùa: ${currentStory?.worldState?.season || 'Không rõ'}
- Danh sách bạn bè/NPC khác: ${JSON.stringify(otherProfiles)}

[BỐI CẢNH 3 CHƯƠNG GẦN NHẤT]
${latestChapter}
${previousChapters}

[NHIỆM VỤ CHI TIẾT]
Hãy dựa vào ký ức và bối cảnh để viết tiểu sử và thông số cho "${activeProfile.name}".
Yêu cầu trả về DUY NHẤT định dạng JSON (BẮT BUỘC):
{
  "bio": "Tiểu sử cực kỳ chi tiết (5000 ký tự). Bao gồm: Về tôi, sở thích, biệt danh, món ăn, phim, tự nhận xét bản thân, MXH khác, quốc tịch, nghề nghiệp, bạn thân, tình trạng mối quan hệ, quan điểm sống, thói quen, ước mơ... Phong cách dễ thương, dùng nhiều emoji.",
  "followersCount": "Ví dụ: 1.2M",
  "followingCount": "Ví dụ: 120",
  "likesCount": "Ví dụ: 5.6M",
  "followingList": [
    { "name": "...", "avatar": "", "id": "" }
  ]
}`;

      const response = await sendMessage(apiSettings, [{ role: 'user', content: prompt }]);
      const content = extractTextFromResponse(response);
      
      if (!content) throw new Error("API không trả về nội dung.");
      
      let parsedData;
      try {
        parsedData = robustParseJSON(content);
      } catch (e) {
        throw new Error('Không thể phân tích dữ liệu từ API');
      }

      updateActiveProfile({ 
        bio: parsedData.bio,
        followersCount: parsedData.followersCount,
        followingCount: parsedData.followingCount,
        likesCount: parsedData.likesCount,
        followingList: parsedData.followingList
      });
    } catch (e) {
      console.error(e);
      alert('Lỗi khi tạo tiểu sử');
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const generatePosts = async () => {
    if (!apiSettings?.apiKey || !activeProfile) {
      alert('Vui lòng cài đặt API Key trong phần Cài đặt hệ thống');
      return;
    }
    setIsGeneratingPosts(true);
    
    try {
      const latestChapter = currentStory?.chapters?.[currentStory.chapters.length - 1]?.content || '';
      const previousChapters = currentStory?.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || '';
      
      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là một chuyên gia tạo nội dung Instagram, nhiệm vụ: Tạo 20 bài viết cực kỳ chi tiết cho nhân vật:
MỤC TIÊU: "${activeProfile.name}"
VAI TRÒ: ${activeProfile.type === 'npc' ? 'Nhân vật phụ (NPC) / Bạn bè' : 'Nhân vật chính'}

[YÊU CẦU TỐI THƯỢNG]
BẠN TUYỆT ĐỐI CHỈ TẠO NỘI DUNG CHO "${activeProfile.name}". KHÔNG ĐƯỢC NHẦM LẪN VỚI CÁC NHÂN VẬT KHÁC TRONG TRUYỆN. Các bài đăng phải thể hiện góc nhìn cá nhân của "${activeProfile.name}".

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
- Truyện tổng thể: ${currentStory?.plot || 'Không có'}
- Ký ức chung/Memory: ${currentStory?.memory || currentStory?.characterMemory || 'Không có'}
- Đặc điểm Bot (${currentStory?.botChar || 'Bot'}): ${currentStory?.charDescription || 'Không có'}
- Đặc điểm User (${currentStory?.userChar || 'User'}): ${currentStory?.userDescription || 'Không có'}
- Smart Memory: ${currentStory?.progressSummary || 'Không có'}
- Tình huống hiện tại: ${currentStory?.situationTracking || 'Không có'}
- Thời tiết: ${currentStory?.worldState?.weather || 'Không rõ'}
- Thời gian: ${currentStory?.worldState?.time || 'Không rõ'}
- Mùa: ${currentStory?.worldState?.season || 'Không rõ'}

[BỐI CẢNH 3 CHƯƠNG GẦN NHẤT]
${latestChapter}
${previousChapters}

[NHIỆM VỤ]
Thiết kế 20 bài viết (mỗi bài ~1000 ký tự) phản ánh tâm trạng và sự kiện liên quan đến "${activeProfile.name}".
Trả về định dạng JSON array duy nhất: ["bài 1", "bài 2", ..., "bài 20"]`;

      const response = await sendMessage(apiSettings, [{ role: 'user', content: prompt }]);
      const fullContent = extractTextFromResponse(response);
      
      // Try to parse JSON
      try {
        const parsedPosts = robustParseJSON(fullContent);
        
        if (Array.isArray(parsedPosts)) {
          const newPosts = parsedPosts.map((p: string, i: number) => ({
            id: Date.now().toString() + i,
            content: p,
            bgImage: ''
          }));
          updateActiveProfile({ posts: newPosts });
        } else {
          throw new Error('Parsed content is not an array');
        }
      } catch (e) {
        // Fallback: extract strings using regex if JSON parse fails completely
        console.error('JSON Parse Error, trying regex fallback', e);
        const stringMatches = fullContent.match(/"([^"\\]|\\.)*"/g);
        if (stringMatches && stringMatches.length >= 5) {
          const newPosts = stringMatches.map((match, i) => ({
            id: Date.now().toString() + i,
            content: match.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            bgImage: ''
          }));
          updateActiveProfile({ posts: newPosts });
        } else {
          console.log("Raw content:", fullContent);
          alert('Lỗi phân tích dữ liệu từ API. Vui lòng thử lại.');
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error(e);
        alert('Lỗi khi tạo bài đăng');
      }
    } finally {
      setIsGeneratingPosts(false);
    }
  };

  const generateGoogleSearches = async () => {
    if (!apiSettings?.apiKey || !activeProfile) {
      alert('Vui lòng cài đặt API Key trong phần Cài đặt hệ thống');
      return;
    }
    setIsGeneratingSearches(true);
    try {
      const latestChapter = currentStory?.chapters?.[currentStory.chapters.length - 1]?.content || '';
      const previousChapters = currentStory?.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || '';
      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là một chuyên gia tâm lý học, hãy phân tích và tạo 500 từ khóa tìm kiếm Google gần đây của nhân vật tên là "${activeProfile.name}". Bạn tuyệt đối không nhầm lẫn "${activeProfile.name}" với các nhân vật khác được mô tả trong cốt truyện bên dưới.

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
- Truyện tổng thể: ${currentStory?.plot || 'Không có'}
- Ký ức chung/Memory: ${currentStory?.memory || currentStory?.characterMemory || 'Không có'}
- Đặc điểm Bot (${currentStory?.botChar || 'Bot'}): ${currentStory?.charDescription || 'Không có'}
- Đặc điểm User (${currentStory?.userChar || 'User'}): ${currentStory?.userDescription || 'Không có'}
- Smart Memory (Tóm tắt tiến độ): ${currentStory?.progressSummary || 'Không có'}
- Tình huống hiện tại: ${currentStory?.situationTracking || 'Không có'}
- Thời tiết: ${currentStory?.worldState?.weather || 'Không rõ'}
- Thời gian: ${currentStory?.worldState?.time || 'Không rõ'}
- Mùa: ${currentStory?.worldState?.season || 'Không rõ'}

[BỐI CẢNH 3 CHƯƠNG GẦN NHẤT ĐỂ NGHIÊN CỨU]
Chương mới nhất: ${latestChapter}
Các chương trước đó: ${previousChapters}

[NHIỆM VỤ DÀNH RIÊNG CHO BẠN]
Hãy tập trung 100% vào nhân vật mang tên: "${activeProfile.name}". (Tuyệt đối KHÔNG TẠO TỪ KHÓA CHO CÁC NHÂN VẬT CHÍNH TRONG TRUYỆN, CHỈ LÀM CHO "${activeProfile.name}").
Dựa vào dữ liệu bối cảnh trên, hãy tưởng tượng và thiết kế lịch sử tìm kiếm Google của "${activeProfile.name}".

Yêu cầu QUAN TRỌNG TỐI THƯỢNG:
- Tạo ĐÚNG 500 từ khóa tìm kiếm.
- Các từ khóa phải phản ánh chân thực tính cách, sở thích, lo lắng, tò mò và diễn biến câu chuyện của nhân vật "${activeProfile.name}".
- Bao gồm cả những tìm kiếm ngớ ngẩn, thầm kín, hoặc liên quan đến các nhân vật khác.
- BẮT BUỘC trả về DUY NHẤT định dạng JSON array chứa các chuỗi: ["tìm kiếm 1", "tìm kiếm 2", ..., "tìm kiếm 500"]
- KHÔNG TRẢ VỀ markdown, CHỈ trả về JSON array hợp lệ. KHÔNG ĐƯỢC CÓ VĂN BẢN THỪA.`;

      const response = await sendMessage(apiSettings, [{ role: 'user', content: prompt }]);
      const content = extractTextFromResponse(response);
      
      if (!content) throw new Error("API không trả về nội dung.");
      
      let searchQueries;
      try {
        searchQueries = robustParseJSON(content);
      } catch (e) {
        // Regex fallback for array of strings
        const matches = content.match(/"([^"\\]|\\.)*"/g);
        if (matches && matches.length >= 10) {
          searchQueries = matches.map(m => m.slice(1, -1).replace(/\\"/g, '"'));
        } else {
          throw new Error('Không thể phân tích dữ liệu tìm kiếm');
        }
      }

      if (Array.isArray(searchQueries)) {
        const now = new Date().toLocaleString('vi-VN');
        const newSession = {
          id: Date.now().toString(),
          timestamp: now,
          queries: searchQueries
        };
        const updatedSessions = [newSession, ...(activeProfile.googleSearchSessions || [])];
        updateActiveProfile({ googleSearchSessions: updatedSessions });
        setViewingSearchSessionId(newSession.id);
        setShowGoogleSearches(true);
      }
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi tạo lịch sử tìm kiếm: ' + e.message);
    } finally {
      setIsGeneratingSearches(false);
    }
  };

  const [generatingCommentsFor, setGeneratingCommentsFor] = useState<{postId: string, count: number, startTime: number} | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generatingCommentsFor) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - generatingCommentsFor.startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [generatingCommentsFor]);

  const generateNPCComments = async (postId: string, count: number) => {
    if (!apiSettings?.apiKey || !activeProfile) {
      alert('Vui lòng cài đặt API Key trong phần Cài đặt hệ thống');
      return;
    }
    
    setGeneratingCommentsFor({ postId, count, startTime: Date.now() });
    
    const updatedPostsWithLoading = activeProfile.posts.map(p => p.id === postId ? { ...p, npcComments: [{ id: 'loading', text: `Đang tải ${count} bình luận...` }] } : p);
    updateActiveProfile({ posts: updatedPostsWithLoading });
    
    try {
      const post = activeProfile.posts.find(p => p.id === postId);
      const latestChapter = currentStory?.chapters?.[currentStory.chapters.length - 1]?.content || '';
      const previousChapters = currentStory?.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || '';
      
      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn đóng vai cộng đồng người hâm mộ đang bình luận cho nhân vật: "${activeProfile.name}".
BÀI ĐĂNG: "${post?.content}"

[YÊU CẦU TỐI THƯỢNG]
BẠN TUYỆT ĐỐI CHỈ BÀN LUẬN VỀ BÀI ĐĂNG CỦA "${activeProfile.name}". KHÔNG ĐƯỢC NHẦM LẪN VỚI CÁC NHÂN VẬT KHÁC.
Dựa vào bối cảnh truyện bên dưới để tạo các bình luận chân thực.

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
- Truyện tổng thể: ${currentStory?.plot || 'Không có'}
- Ký ức chung/Memory: ${currentStory?.memory || currentStory?.characterMemory || 'Không có'}
- Tình huống hiện tại: ${currentStory?.situationTracking || 'Không có'}
- Thời tiết: ${currentStory?.worldState?.weather || 'Không rõ'}
- Thời gian: ${currentStory?.worldState?.time || 'Không rõ'}
- Mùa: ${currentStory?.worldState?.season || 'Không rõ'}

[BỐI CẢNH]
${latestChapter}
${previousChapters}

[NHIỆM VỤ]
Tạo đúng ${count} bình luận đa dạng (ngắn, dài, emoji, teen code, hỏi han, khen ngợi...).
Trả về JSON array duy nhất: ["bình luận 1", "bình luận 2", ...]`;

      const response = await sendMessage(apiSettings, [{ role: 'user', content: prompt }]);
      const content = extractTextFromResponse(response);
      
      if (!content) throw new Error("API không trả về nội dung.");
      
      // Try to parse JSON from content
      let newComments;
      try {
        newComments = robustParseJSON(content);
        if (!Array.isArray(newComments)) {
          // fallback string match
          const matches = content.match(/"([^"\\]|\\.)*"/g);
          if (matches) {
            newComments = matches.map(m => m.slice(1, -1).replace(/\\"/g, '"'));
          } else {
            throw new Error('Not an array');
          }
        }
      } catch (e) {
        throw new Error('Không thể phân tích dữ liệu bình luận từ API');
      }

      const commentObjects = newComments.slice(0, count).map((text: string, i: number) => ({
        id: Date.now().toString() + i,
        text
      }));

      const newPosts = activeProfile.posts.map(p => 
        p.id === postId ? { ...p, npcComments: commentObjects } : p
      );
      updateActiveProfile({ posts: newPosts });
      setGeneratingCommentsFor(null);
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi tạo bình luận NPC: ' + e.message);
      const resetPosts = activeProfile.posts.map(p => p.id === postId ? { ...p, npcComments: [] } : p);
      updateActiveProfile({ posts: resetPosts });
      setGeneratingCommentsFor(null);
    } finally {
      // Dọn dẹp loading state
    }
  };

  const generateNPCProfile = async (npcName: string) => {
    if (!apiSettings?.apiKey) {
      alert('Vui lòng cài đặt API Key trong phần Cài đặt hệ thống');
      return;
    }
    
    setIsGeneratingProfile(true);
    
    try {
      const latestChapter = currentStory?.chapters?.[currentStory.chapters.length - 1]?.content || '';
      const previousChapters = currentStory?.chapters?.slice(-3).map((c: any) => c.content).join('\n\n') || '';

      const prompt = `[LỆNH HỆ THỐNG CAO CẤP]
Bạn là một chuyên gia, nhiệm vụ: Xây dựng hồ sơ Instagram cho nhân vật chính yếu sau:
MỤC TIÊU: "${npcName}" (NPC/Bạn bè).

[YÊU CẦU TỐI THƯỢNG]
BẠN TUYỆT ĐỐI CHỈ TẠO HỒ SƠ CHO "${npcName}". KHÔNG ĐƯỢC NHẦM LẪN SANG CÁC NHÂN VẬT CHÍNH KHÁC.

[BỘ NHỚ THIẾT LẬP CỐT TRUYỆN]
- Truyện tổng thể: ${currentStory?.plot || 'Không có'}
- Ký ức chung/Memory (HÃY TÌM MÔ TẢ VỀ ${npcName} TẠI ĐÂY LÀM GỐC): ${currentStory?.memory || currentStory?.characterMemory || 'Không có'}
- Tình huống hiện tại: ${currentStory?.situationTracking || 'Không có'}
- Thời tiết: ${currentStory?.worldState?.weather || 'Không rõ'}
- Thời gian: ${currentStory?.worldState?.time || 'Không rõ'}
- Mùa: ${currentStory?.worldState?.season || 'Không rõ'}

[BỐI CẢNH]
${latestChapter}
${previousChapters}

[CHỈ THỊ JSON]
Tạo dữ liệu cho "${npcName}" (JSON Object):
{
  "bio": "Mô tả chi tiết 300-500 từ về nhân vật này.",
  "followersCount": "...",
  "followingCount": "...",
  "likesCount": "...",
  "followingList": ["...", "..."],
  "posts": ["...", "..."]
}
`;

      const response = await sendMessage(apiSettings, [{ role: 'user', content: prompt }]);
      const content = extractTextFromResponse(response);
      
      if (!content) throw new Error("API không trả về nội dung.");
      
      // Try to parse JSON from content
      let npcData;
      try {
        npcData = robustParseJSON(content);
      } catch (e) {
        throw new Error('Không thể phân tích dữ liệu NPC từ API');
      }

      const newProfile: Profile = {
        id: 'npc_' + Date.now(),
        name: npcName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${npcName}`,
        coverImage: '',
        bio: npcData.bio || '',
        followersCount: npcData.followersCount || '0',
        followingCount: npcData.followingCount || '0',
        likesCount: npcData.likesCount || '0',
        followingList: npcData.followingList || [],
        highlights: [],
        posts: (npcData.posts || []).map((p: string, i: number) => ({
          id: Date.now().toString() + i,
          content: p,
          bgImage: ''
        })),
        type: 'npc'
      };

      setProfiles(prev => [...prev, newProfile]);
      setActiveProfileId(newProfile.id);
      setShowAddNPC(false);
      setNewNPCName('');
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi tạo hồ sơ NPC: ' + e.message);
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[100] bg-[#FBF5F7] overflow-y-auto custom-scrollbar font-sans"
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EACFD5] p-4 flex items-center justify-between">
        <button onClick={onClose} className="p-2 hover:bg-pink-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-[#4A4A4A]" />
        </button>
        <h1 className="text-lg font-bold text-[#4A4A4A]">Instagram</h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-[1224px] mx-auto pb-20">
        {/* Profile Switcher */}
        <div className="px-4 py-3 flex gap-4 overflow-x-auto bg-white border-b border-[#EACFD5] custom-scrollbar">
          {profiles.map(p => (
            <div 
              key={p.id} 
              className={`flex flex-col items-center gap-1 shrink-0 cursor-pointer transition-all ${activeProfileId === p.id ? 'scale-110' : 'opacity-60'}`}
              onClick={() => setActiveProfileId(p.id)}
            >
              <div className={`w-14 h-14 rounded-full p-[2px] ${activeProfileId === p.id ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 'bg-gray-200'}`}>
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-pink-50 flex items-center justify-center text-pink-300 font-bold text-xs">
                      {p.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#4A4A4A] truncate w-14 text-center">{p.name}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => setShowAddNPC(true)}>
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <Plus size={24} className="text-gray-400" />
            </div>
            <span className="text-[10px] font-bold text-gray-400">Thêm NPC</span>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-b-3xl shadow-sm mb-6 overflow-hidden">
          {/* Cover Image */}
          <div 
            className="h-32 md:h-48 bg-[#F5F5F5] cursor-pointer relative group"
            onClick={() => coverFileInputRef.current?.click()}
          >
            {activeProfile?.coverImage ? (
              <img src={activeProfile.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                <ImageIcon size={32} />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Thay đổi ảnh nền tiểu sử</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <ImageIcon className="text-white" />
            </div>
            <input type="file" ref={coverFileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
          </div>

          <div className="p-4 md:p-8 -mt-12 relative z-10">
            <div className="flex items-end gap-6 mb-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div 
                  className="w-[86px] h-[86px] rounded-full border-4 border-white p-[1px] cursor-pointer overflow-hidden bg-white shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {activeProfile?.avatar ? (
                    <img src={activeProfile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon size={24} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
              </div>

              {/* Stats */}
              <div className="flex-1 flex justify-around text-center pb-2">
                <div>
                  <div className="text-lg font-bold text-[#4A4A4A]">{activeProfile?.posts.length || 0}</div>
                  <div className="text-xs text-gray-500">Posts</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#4A4A4A]">{activeProfile?.followersCount || '0'}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div 
                  className="cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setViewingFollowingProfile(activeProfile)}
                >
                  <div className="text-lg font-bold text-[#4A4A4A]">{activeProfile?.followingCount || '0'}</div>
                  <div className="text-xs text-gray-500">Following</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#4A4A4A]">{activeProfile?.likesCount || '0'}</div>
                  <div className="text-xs text-gray-500">Likes</div>
                </div>
              </div>
            </div>

          {/* Bio */}
          <div className="mb-4">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              <div className="text-[#4A4A4A] text-[13px] md:text-[14px] whitespace-pre-wrap" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif' }}>
                {activeProfile?.bio || "Chưa có tiểu sử. Hãy bấm nút bên dưới để tạo."}
              </div>
            </div>
            <button 
              onClick={generateBio}
              disabled={isGeneratingBio}
              className="mt-3 bg-[#F9C6D4] text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2"
            >
              {isGeneratingBio ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Cập nhật Tiểu Sử (Mới nhất)
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mb-6">
            <button className="flex-1 h-[32px] bg-[#EFE6E6] text-[#4A4A4A] rounded-lg text-sm font-bold">
              Edit Profile
            </button>
            <button className="flex-1 h-[32px] bg-[#EFE6E6] text-[#4A4A4A] rounded-lg text-sm font-bold">
              Share Profile
            </button>
            <button 
              onClick={() => {
                if (activeProfile?.googleSearchSessions && activeProfile.googleSearchSessions.length > 0) {
                  setShowGoogleSearches(true);
                } else {
                  generateGoogleSearches();
                }
              }}
              disabled={isGeneratingSearches}
              className="flex-1 h-[32px] bg-[#FDF2F5] text-[#D48C9E] rounded-lg text-sm font-bold flex items-center justify-center gap-1 border border-[#F9D9E2]"
            >
              {isGeneratingSearches ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              Google Search
            </button>
          </div>

          {/* Story Highlights */}
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button 
                onClick={() => setShowAddStory(true)}
                className="w-[60px] h-[60px] rounded-full border border-dashed border-[#4A4A4A] flex items-center justify-center bg-gray-50"
              >
                <Plus size={24} className="text-[#4A4A4A]" />
              </button>
              <span className="text-[10px] text-[#4A4A4A]">Mới</span>
            </div>
            
            {activeProfile?.highlights.map(h => (
              <div key={h.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => { setActiveStory(h); setStoryImageIndex(0); }}>
                <div className="w-[60px] h-[60px] rounded-full border border-[#E0D8D8] p-[2px]">
                  <img src={h.images[0]} alt={h.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="text-[10px] text-[#4A4A4A] truncate w-[60px] text-center">{h.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Section */}
        <div className="p-4 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#4A4A4A]">Bài đăng</h2>
            <button 
              onClick={generatePosts}
              disabled={isGeneratingPosts}
              className="bg-[#F9C6D4] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2"
            >
              {isGeneratingPosts ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
              Tạo 20 Bài Đăng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProfile?.posts.map((post, idx) => (
              <div 
                key={post.id} 
                className="relative w-full aspect-[4/5] rounded-[20px] overflow-hidden shadow-md group"
              >
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-gray-200"
                  style={{
                    backgroundImage: post.bgImage ? `url(${post.bgImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-[rgba(239,230,230,0.4)]" />
                
                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col">
                  <div className="flex-1 overflow-y-auto custom-scrollbar text-[#4A4A4A] text-sm md:text-base font-medium whitespace-pre-wrap drop-shadow-sm">
                    {post.content}
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex bg-white/50 backdrop-blur rounded-full p-1 gap-1">
                        <button 
                          onClick={() => generateNPCComments(post.id, 500)}
                          disabled={generatingCommentsFor?.postId === post.id}
                          className="flex items-center gap-1 p-1.5 rounded-full hover:bg-white/80 transition-colors text-pink-400 disabled:opacity-50"
                          title="Tạo 500 bình luận NPC"
                        >
                          <Heart size={16} fill="currentColor" />
                          <span className="text-[10px] font-bold">500</span>
                        </button>
                        <button 
                          onClick={() => generateNPCComments(post.id, 1000)}
                          disabled={generatingCommentsFor?.postId === post.id}
                          className="flex items-center gap-1 p-1.5 rounded-full hover:bg-white/80 transition-colors text-pink-400 disabled:opacity-50"
                          title="Tạo 1000 bình luận NPC"
                        >
                          <Heart size={16} fill="currentColor" />
                          <span className="text-[10px] font-bold">1k</span>
                        </button>
                        <button 
                          onClick={() => generateNPCComments(post.id, 2000)}
                          disabled={generatingCommentsFor?.postId === post.id}
                          className="flex items-center gap-1 p-1.5 rounded-full hover:bg-white/80 transition-colors text-pink-400 disabled:opacity-50"
                          title="Tạo 2000 bình luận NPC"
                        >
                          <Heart size={16} fill="currentColor" />
                          <span className="text-[10px] font-bold">2k</span>
                        </button>
                      </div>
                      <button 
                        onClick={() => { setActivePostId(post.id); postBgInputRef.current?.click(); }}
                        className="p-2 bg-white/50 backdrop-blur rounded-full hover:bg-white/80 transition-colors text-gray-700"
                        title="Đổi ảnh nền"
                      >
                        <ImageIcon size={20} />
                      </button>
                    </div>
                    <div className="flex flex-col items-end">
                      <button 
                        onClick={() => {
                          setViewingCommentsFor(post.id);
                          setCommentDisplayLimit(100);
                        }}
                        className="text-xs font-bold text-gray-600 bg-white/50 px-2 py-1 rounded-md hover:bg-white/80 transition-colors"
                      >
                        {post.npcComments?.length || 0} cmts
                      </button>
                      {generatingCommentsFor?.postId === post.id && (
                        <span className="text-[10px] text-pink-500 font-bold mt-1">{elapsedTime}s</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <input type="file" ref={postBgInputRef} onChange={handlePostBgUpload} accept="image/*" className="hidden" />

      {/* Comments Modal */}
      {viewingCommentsFor && activeProfile && (
        <div className="fixed inset-0 z-[120] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-[#4A4A4A]">Bình luận</h3>
              <button onClick={() => setViewingCommentsFor(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-[#4A4A4A]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {activeProfile.posts.find(p => p.id === viewingCommentsFor)?.npcComments?.slice(0, commentDisplayLimit).map(c => (
                <div key={c.id} className="flex gap-3 p-3 bg-[#FFF0F3] rounded-2xl border border-[#FFE4E9] shadow-sm">
                  {c.avatar && <img src={c.avatar} alt="" className="w-8 h-8 rounded-full shrink-0 border border-white shadow-sm" />}
                  <div className="flex-1">
                    <div className="font-bold text-xs text-pink-500 mb-1">{c.author}</div>
                    <div className="text-sm text-[#4A4A4A] leading-snug">{c.text}</div>
                  </div>
                </div>
              ))}
              
              {activeProfile.posts.find(p => p.id === viewingCommentsFor)?.npcComments?.length === 0 && (
                <div className="text-center text-gray-500 mt-10">Chưa có bình luận nào.</div>
              )}
              
              {(activeProfile.posts.find(p => p.id === viewingCommentsFor)?.npcComments?.length || 0) > commentDisplayLimit && (
                <button 
                  onClick={() => setCommentDisplayLimit(prev => prev + 100)} 
                  className="w-full py-3 text-pink-500 font-bold hover:bg-pink-50 rounded-xl transition-colors mt-2"
                >
                  Tải thêm bình luận
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add NPC Modal */}
      {showAddNPC && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Thêm Hồ Sơ NPC</h3>
            <p className="text-sm text-gray-500 mb-4">Nhập tên NPC bạn muốn xem hồ sơ Instagram. AI sẽ dựa vào cốt truyện để tạo tiểu sử và bài đăng.</p>
            <input 
              type="text" 
              placeholder="Tên nhân vật NPC..." 
              value={newNPCName}
              onChange={e => setNewNPCName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl mb-4 outline-none focus:border-pink-300"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => { setShowAddNPC(false); setNewNPCName(''); }} 
                className="flex-1 py-3 bg-gray-100 rounded-xl font-bold"
                disabled={isGeneratingProfile}
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  if (newNPCName.trim()) {
                    generateNPCProfile(newNPCName.trim());
                  }
                }}
                disabled={isGeneratingProfile || !newNPCName.trim()}
                className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {isGeneratingProfile ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                {isGeneratingProfile ? 'Đang tạo...' : 'Tạo Hồ Sơ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {showAddStory && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Thêm Tin Nổi Bật</h3>
            <input 
              type="text" 
              placeholder="Tên tin nổi bật..." 
              value={newStoryName}
              onChange={e => setNewStoryName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl mb-4"
            />
            <div className="mb-4">
              <button 
                onClick={() => storyFileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-pink-300 rounded-xl text-pink-500 font-bold flex items-center justify-center gap-2"
              >
                <ImageIcon size={20} /> Chọn ảnh ({newStoryImages.length})
              </button>
              <input type="file" ref={storyFileInputRef} onChange={handleStoryImageUpload} accept="image/*" multiple className="hidden" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowAddStory(false); setNewStoryImages([]); setNewStoryName(''); }} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Hủy</button>
              <button 
                onClick={() => {
                  if (newStoryName && newStoryImages.length > 0) {
                    const updatedHighlights = [...(activeProfile?.highlights || []), { id: Date.now().toString(), name: newStoryName, images: newStoryImages }];
                    updateActiveProfile({ highlights: updatedHighlights });
                    setShowAddStory(false);
                    setNewStoryImages([]);
                    setNewStoryName('');
                  }
                }}
                className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-bold"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Search History Modal */}
      <AnimatePresence>
        {showGoogleSearches && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FFF5F7] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh] border border-[#F9D9E2]"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#F9D9E2] flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FDF2F5] flex items-center justify-center text-[#D48C9E]">
                    <Search size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#4A4A4A]">Lịch sử tìm kiếm Google</h3>
                    <p className="text-xs text-[#D48C9E] font-medium">Gần đây của {activeProfile?.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGoogleSearches(false)}
                  className="p-2 hover:bg-[#FDF2F5] rounded-full transition-colors text-[#D48C9E]"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search List */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {viewingSearchSessionId ? (
                  <div className="space-y-3">
                    <button 
                      onClick={() => setViewingSearchSessionId(null)}
                      className="flex items-center gap-2 text-[#D48C9E] text-sm font-bold mb-4 hover:underline"
                    >
                      <ArrowLeft size={16} /> Quay lại danh sách đợt
                    </button>
                    
                    {activeProfile?.googleSearchSessions?.find(s => s.id === viewingSearchSessionId)?.queries.map((query, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.005, 0.3) }}
                        className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#F9D9E2] hover:shadow-sm transition-shadow group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#FDF2F5] flex items-center justify-center text-[#D48C9E] group-hover:bg-[#F9D9E2] transition-colors shrink-0">
                          <Search size={14} />
                        </div>
                        <span className="text-[#4A4A4A] text-sm font-medium flex-1">{query}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProfile?.googleSearchSessions?.map((session, idx) => (
                      <motion.div 
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setViewingSearchSessionId(session.id)}
                        className="p-4 bg-white rounded-2xl border border-[#F9D9E2] hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#FDF2F5] flex items-center justify-center text-[#D48C9E] group-hover:bg-[#F9D9E2] transition-colors">
                            <Search size={24} />
                          </div>
                          <div>
                            <p className="text-[#4A4A4A] font-bold">Đợt tìm kiếm #{activeProfile.googleSearchSessions!.length - idx}</p>
                            <p className="text-xs text-gray-400">{session.timestamp}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#D48C9E]">{session.queries.length} kết quả</p>
                          <p className="text-[10px] text-gray-300">Nhấn để xem chi tiết</p>
                        </div>
                      </motion.div>
                    ))}
                    
                    {(!activeProfile?.googleSearchSessions || activeProfile.googleSearchSessions.length === 0) && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-[#FDF2F5] flex items-center justify-center text-[#D48C9E] mx-auto mb-4">
                          <Search size={32} />
                        </div>
                        <p className="text-[#4A4A4A] font-bold">Chưa có lịch sử tìm kiếm</p>
                        <p className="text-xs text-[#D48C9E] mt-1">Hãy nhấn nút tạo để khám phá bí mật của {activeProfile?.name}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white/50 border-t border-[#F9D9E2] flex flex-col gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tìm kiếm?')) {
                        updateActiveProfile({ googleSearchSessions: [] });
                        setViewingSearchSessionId(null);
                      }
                    }}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    Xóa lịch sử
                  </button>
                  <button 
                    onClick={generateGoogleSearches}
                    disabled={isGeneratingSearches}
                    className="flex-[2] bg-[#F9C6D4] text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:bg-[#F7B1C4] transition-colors disabled:opacity-50"
                  >
                    {isGeneratingSearches ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Tạo 500 tìm kiếm mới
                  </button>
                </div>
                <p className="text-[10px] text-center text-[#D48C9E]">
                  {viewingSearchSessionId ? 'Đang xem chi tiết đợt' : `Tổng cộng: ${activeProfile?.googleSearchSessions?.length || 0} đợt tìm kiếm`}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black flex flex-col"
          >
            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {activeStory.images.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: idx < storyImageIndex ? '100%' : '0%' }}
                    animate={{ width: idx === storyImageIndex ? '100%' : idx < storyImageIndex ? '100%' : '0%' }}
                    transition={{ duration: idx === storyImageIndex ? 5 : 0, ease: "linear" }}
                  />
                </div>
              ))}
            </div>
            
            {/* Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/50 p-[1px]">
                  <img src={activeStory.images[0]} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="text-white font-bold text-sm shadow-sm">{activeStory.name}</span>
              </div>
              <button onClick={() => setActiveStory(null)} className="p-2 text-white">
                <X size={24} />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 relative flex items-center justify-center">
              <img 
                src={activeStory.images[storyImageIndex]} 
                alt="" 
                className="w-full h-full object-contain"
              />
              {/* Navigation overlay */}
              <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full" onClick={() => setStoryImageIndex(prev => Math.max(0, prev - 1))} />
                <div className="w-1/2 h-full" onClick={() => {
                  if (storyImageIndex + 1 >= activeStory.images.length) {
                    setActiveStory(null);
                  } else {
                    setStoryImageIndex(prev => prev + 1);
                  }
                }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Following List Modal */}
        {viewingFollowingProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingFollowingProfile(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-[#4A4A4A]">Đang theo dõi</h3>
                <button onClick={() => setViewingFollowingProfile(null)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                {viewingFollowingProfile.followingList && viewingFollowingProfile.followingList.length > 0 ? (
                  viewingFollowingProfile.followingList.map((item, idx) => {
                    const linkedProfile = item.id ? profiles.find(p => p.id === item.id) : null;
                    const avatar = linkedProfile?.avatar || item.avatar || 'https://i.postimg.cc/5ywFrTmH/eb9a4782a68c767ff5a7e46ad2b4b0ff.jpg';
                    const name = linkedProfile?.name || item.name;

                    return (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 p-3 hover:bg-pink-50 rounded-2xl transition-colors cursor-pointer"
                        onClick={() => {
                          if (linkedProfile) {
                            setActiveProfileId(linkedProfile.id);
                            setViewingFollowingProfile(null);
                          }
                        }}
                      >
                        <div className="w-12 h-12 rounded-full border border-gray-100 overflow-hidden shrink-0">
                          <img src={avatar} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#4A4A4A] truncate">{name}</div>
                          {linkedProfile && (
                            <div className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">Nhân vật trong truyện</div>
                          )}
                        </div>
                        <button className="px-4 py-1.5 bg-[#EFE6E6] text-[#4A4A4A] rounded-lg text-xs font-bold">
                          Đang theo dõi
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-400 italic">
                    Chưa theo dõi ai. Hãy bấm "Cập nhật Tiểu Sử" để tạo danh sách theo dõi.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
