import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, Music, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { saveDraft, loadDraft } from '../../utils/db'; 
import { compressImage } from '../../utils/imageUtils';

interface UserSettingDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  botId: string;
}

const discImages = [
  "https://i.postimg.cc/prL9YpF4/71440241955cd2c7f25b86826d4e4c56.jpg",
  "https://i.postimg.cc/L5QJy2kf/03bdb34f38e535c596352a8e895088b3-webp.webp",
  "https://i.postimg.cc/QxV9FKsg/109520d9265ffde2a9c213b1722c6deb-webp.webp"
];

const BgWrapper = ({ botId, sectionKey, children, opacity = 0.6 }: { botId: string, sectionKey: string, children: React.ReactNode, opacity?: number }) => {
  const [bg, setBg] = useState<string>('');
  
  useEffect(() => {
    loadDraft(`bg_${sectionKey}_${botId}`).then(res => res && setBg(res));
  }, [botId, sectionKey]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      setBg(base64);
      await saveDraft(`bg_${sectionKey}_${botId}`, base64);
    }
  };

  return (
    <div className="w-full h-full relative overflow-x-hidden overflow-y-auto">
      {bg && (
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${bg})`, opacity }} />
      )}
      <div className="relative z-10 w-full min-h-full">
         <div className="absolute top-4 right-4 z-50">
            <label className="cursor-pointer bg-white p-2 rounded-full shadow-md border border-[#F9C6D4] flex items-center justify-center hover:bg-[#FFF5FB] transition">
              <Camera className="w-5 h-5 text-[#F9C6D4]" />
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
         </div>
         {bg ? children : (
            <div className="flex items-center justify-center h-[80vh] flex-col">
               <label className="cursor-pointer flex flex-col items-center p-6 bg-white/80 rounded-2xl border-2 border-dashed border-[#F9C6D4] shadow-sm hover:bg-[#FFF5FB] transition">
                  <ImageIcon className="w-12 h-12 text-[#F9C6D4] mb-2" />
                  <span className="font-bold text-[#b498a5] text-center">Chọn ảnh nền từ thư viện<br/>để bắt đầu</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
               </label>
            </div>
         )}
      </div>
    </div>
  );
};

export const UserSettingDrawerModal: React.FC<UserSettingDrawerModalProps> = ({ isOpen, onClose, botId }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('https://i.postimg.cc/7Y8JcWDC/eecb552e4b00e57c93c17eea32414dcb-webp.webp');
  const [activeTab, setActiveTab] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDraft(`user_avatar_${botId}`).then(res => {
        if (res) setAvatarUrl(res);
      });
    }
  }, [isOpen, botId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      setAvatarUrl(base64);
      await saveDraft(`user_avatar_${botId}`, base64);
    }
  };

  const sections = [
    { id: 1, title: 'Trang mạng tài khoản của tôi' },
    { id: 2, title: 'Playlist nghe nhạc của tôi' },
    { id: 3, title: 'Tên Tuổi / Hồ sơ tiểu sử / Ngoại hình & tính cách' },
    { id: 4, title: 'Bạn bè / Người thân / Vòng tròn xã hội' },
    { id: 5, title: 'Tâm trạng + Đồ mang theo người' },
    { id: 6, title: 'Ảnh của tôi + Vài thông tin (Đặc biệt)' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           key="user-setting-modal"
           initial={{ y: '100%' }}
           animate={{ y: 0 }}
           exit={{ y: '100%' }}
           transition={{ duration: 0.4, ease: 'easeOut' }}
           style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255, 255, 255, 1)', zIndex: 1000, overflow: 'hidden' }}
           className="flex flex-col"
        >
          {activeTab === null ? (
            <div className="flex-1 p-6 relative overflow-y-auto bg-[#FAF9F6]">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#F9C6D4] text-white rounded-full font-bold shadow-sm z-50 text-xl pb-1 hover:bg-[#F3B4C2] transition">
                &times;
              </button>
              
              <h2 className="text-2xl font-bold text-[#b498a5] text-center mt-6 mb-8 underline decoration-[#F9C6D4] decoration-2 underline-offset-4">
                Cài đặt nhân vật của tôi
              </h2>

              <div className="flex justify-center mb-8 relative">
                <div className="w-32 h-32 rounded-full border-4 border-[#F9C6D4] overflow-hidden shadow-lg relative bg-white group cursor-pointer">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto pb-10">
                {sections.map((sec, i) => (
                  <motion.button
                    key={sec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setActiveTab(sec.id)}
                    className="w-full text-left p-4 rounded-2xl bg-[#FFF5FB] border border-[#F9C6D4] shadow-sm hover:shadow-md hover:bg-[#FDE2E4] transition-all"
                  >
                    <span className="font-bold text-[#b498a5] text-sm">🌷 {sec.title}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-white relative flex flex-col">
               <div className="absolute top-4 left-4 z-50">
                  <button onClick={() => setActiveTab(null)} className="bg-white/90 px-4 py-2 rounded-full text-sm font-bold text-[#F3B4C2] shadow-sm border border-[#F9C6D4] flex items-center gap-2 hover:bg-[#FFF5FB]">
                    <span className="text-lg">←</span> Trở về
                  </button>
               </div>
               
               <div className="flex-1 w-full h-full overflow-hidden">
                 {activeTab === 1 && <InstagramSection botId={botId} avatarUrl={avatarUrl} />}
                 {activeTab === 2 && <PlaylistSection botId={botId} />}
                 {activeTab === 3 && <ProfileSection botId={botId} />}
                 {activeTab === 4 && <FriendsSection botId={botId} />}
                 {activeTab === 5 && <MoodSection botId={botId} />}
                 {activeTab === 6 && <PhotoNotesSection botId={botId} />}
               </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Sub Sections ---

const InstagramSection = ({ botId, avatarUrl }: { botId: string, avatarUrl: string }) => {
  const [data, setData] = useState({
    name: '', age: '', mbti: '', phone: '', hobbies: '', sexuality: '', extra: '',
    stories: [] as {img: string, text: string}[],
    posts: [] as {img: string, excerpt: string}[]
  });
  
  useEffect(() => {
    loadDraft(`insta_${botId}`).then(res => {
      if (res) {
        setData(prev => ({
          ...prev,
          ...res,
          // Đảm bảo các field text không bao giờ bị undefined
          name: res.name || '',
          age: res.age || '',
          mbti: res.mbti || '',
          phone: res.phone || '',
          hobbies: res.hobbies || '',
          sexuality: res.sexuality || '',
          extra: res.extra || ''
        }));
      }
    });
  }, [botId]);

  const updateField = (f: string, v: any) => {
    const nd = {...data, [f]: v};
    setData(nd);
    saveDraft(`insta_${botId}`, nd);
  };

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
       const base64 = await compressImage(file);
       const text = prompt("Nhập nội dung story:");
       updateField('stories', [...data.stories, {img: base64, text: text || ''}]);
    }
  };

  const handleAddPost = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
       const base64 = await compressImage(file);
       const caption = prompt("Nhập nội dung bài đăng:");
       updateField('posts', [{img: base64, excerpt: caption || ''}, ...data.posts]);
    }
  };

  return (
    <BgWrapper botId={botId} sectionKey="insta">
      <div className="flex flex-col items-center p-4 pt-20 pb-20 w-full max-w-md mx-auto">
        <h3 className="font-bold text-[#b498a5] text-xl mb-4 bg-white/80 px-4 py-2 rounded-xl border border-[#F9C6D4]">📱 Vào Instagram thôi nào</h3>
        
        <div className="w-full flex items-center justify-center gap-6 mb-6 bg-white/70 p-4 rounded-2xl shadow-sm border border-[#F9C6D4]">
           <div className="w-20 h-20 rounded-full border-2 border-[#F9C6D4] overflow-hidden p-1 bg-white">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
           </div>
           <div className="flex gap-4 text-center">
              <div><div className="font-bold text-[#8A7D85]">{data.posts.length}</div><div className="text-[#b498a5] text-xs">Bài viết</div></div>
              <div><div className="font-bold text-[#8A7D85]">2.4K</div><div className="text-[#b498a5] text-xs">Theo dõi</div></div>
              <div><div className="font-bold text-[#8A7D85]">120</div><div className="text-[#b498a5] text-xs">Đang theo dõi</div></div>
           </div>
        </div>

        <div className="w-full space-y-2 bg-white/80 p-4 rounded-2xl shadow-sm border border-[#F9C6D4] mb-6">
           {[['name', '‧˚꒰୭ ˚. ᵎᵎ name :'], ['age', 'Initial ゛ ⸝⸝.ᐟ⋆ tuổi :'], ['mbti', '⋮ ⌗ ┆ mbti :'], ['phone', '⸝⸝.ᐟ⋆ Liên lạc :'], ['hobbies', '₊ sở thích :'], ['sexuality', '˚₊ tình dục :'], ['extra', '✩ bổ sung :']].map(([key, label]) => (
             <div key={key} className="flex gap-2 items-center">
               <span className="text-[#F9C6D4] font-bold text-xs shrink-0">{label}</span>
               <input 
                 type="text" value={data[key as keyof typeof data] as string} 
                 onChange={e => updateField(key, e.target.value)}
                 className="flex-1 bg-transparent border-b border-dashed border-[#F9C6D4] outline-none text-[#8A7D85] text-sm"
               />
             </div>
           ))}
        </div>

        <div className="w-full mb-6 relative">
           <p className="font-bold text-[#b498a5] text-sm mb-2 drop-shadow-sm">Stories</p>
           <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <label className="shrink-0 w-16 h-16 rounded-full border-2 border-dashed border-[#F9C6D4] flex items-center justify-center bg-white/50 cursor-pointer hover:bg-white/80 transition">
                 <Plus className="text-[#F9C6D4]" />
                 <input type="file" accept="image/*" className="hidden" onChange={handleAddStory} />
              </label>
              {data.stories.map((st, i) => (
                <div key={i} className="shrink-0 relative group">
                  <div className="w-16 h-16 rounded-full border-2 border-[#F9C6D4] overflow-hidden p-0.5">
                     <img src={st.img} alt="story" className="w-full h-full rounded-full object-cover" />
                  </div>
                  {st.text && <div className="text-center text-[10px] text-[#8A7D85] mt-1 font-medium truncate w-16 px-1 bg-white/70 rounded">{st.text}</div>}
                  <button onClick={() => updateField('stories', data.stories.filter((_, idx)=>idx!==i))} className="absolute -top-1 -right-1 bg-white text-red-400 rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-sm"><Trash2 size={12}/></button>
                </div>
              ))}
           </div>
        </div>

        <div className="w-full space-y-4">
           <div className="flex justify-between items-center mb-2">
             <p className="font-bold text-[#b498a5] text-sm drop-shadow-sm">Bài Đăng</p>
             <label className="cursor-pointer bg-[#FFF5FB] border border-[#F9C6D4] text-[#F9C6D4] px-3 py-1 rounded-full text-xs font-bold shadow-sm hover:bg-[#FDE2E4] transition">
                + Viết Bài Đăng
                <input type="file" accept="image/*" className="hidden" onChange={handleAddPost} />
             </label>
           </div>
           
           {data.posts.map((p, i) => (
             <div key={i} className="w-full bg-white/90 rounded-2xl border border-[#F9C6D4] overflow-hidden shadow-sm relative group">
                <button onClick={() => updateField('posts', data.posts.filter((_, idx)=>idx!==i))} className="absolute top-2 right-2 bg-white/80 text-red-400 rounded-full p-1.5 opacity-0 group-hover:opacity-100 z-10 shadow-sm"><Trash2 size={16}/></button>
                <img src={p.img} alt="post" className="w-full aspect-square object-cover" />
                <div className="p-3 text-sm text-[#8A7D85]">
                   <span className="font-bold text-[#F9C6D4] mr-2">@my_secret_life</span>
                   {p.excerpt}
                </div>
             </div>
           ))}
           {data.posts.length === 0 && <p className="text-center text-xs text-[#b498a5] bg-white/50 py-4 rounded-xl border border-dashed border-[#F9C6D4]">Chưa có bài đăng nào.</p>}
        </div>
      </div>
    </BgWrapper>
  )
}

const PlaylistSection = ({ botId }: { botId: string }) => {
  const [tracks, setTracks] = useState<{song: string}[]>([]);
  const [songName, setSongName] = useState('');
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    loadDraft(`playlist_${botId}`).then(res => res && setTracks(res));
    const inv = setInterval(() => setImgIdx(i => (i+1)%discImages.length), 3000);
    return () => clearInterval(inv);
  }, [botId]);

  const addSong = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter' && songName.trim()) {
       const updated = [...tracks, {song: songName}];
       setTracks(updated);
       saveDraft(`playlist_${botId}`, updated);
       setSongName('');
     }
  };

  const removeSong = (i: number) => {
    const updated = tracks.filter((_, idx) => idx !== i);
    setTracks(updated);
    saveDraft(`playlist_${botId}`, updated);
  }

  return (
    <BgWrapper botId={botId} sectionKey="playlist">
       <div className="flex flex-col items-center p-4 pt-20 w-full max-w-md mx-auto h-full">
         
         <div className="relative w-48 h-48 rounded-full border-4 border-[#F9C6D4] shadow-xl overflow-hidden mb-8 animate-spin" style={{ animationDuration: '8s' }}>
            <img src={discImages[imgIdx]} className="w-full h-full object-cover" alt="disc" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-8 h-8 bg-white/80 rounded-full border-2 border-[#F9C6D4]" />
            </div>
         </div>
         
         <div className="w-full mb-6 flex gap-2">
            <input 
              type="text" value={songName} onChange={e=>setSongName(e.target.value)} onKeyDown={addSong}
              placeholder="Nhập tên bài nhạc rồi bấm Enter..."
              className="flex-1 p-3 bg-white/90 border border-[#F9C6D4] rounded-2xl outline-none text-[#8A7D85] text-sm shadow-sm"
            />
         </div>

         <div className="w-full space-y-2 overflow-y-auto pb-20">
            {tracks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/80 border border-[#F9C6D4] rounded-2xl shadow-sm text-sm font-medium text-[#8A7D85] group">
                 <div className="w-8 h-8 rounded-full bg-[#F9C6D4] text-white flex items-center justify-center shrink-0">
                   <Music size={14} />
                 </div>
                 <div className="flex-1">{t.song}</div>
                 <button onClick={() => removeSong(i)} className="text-[#F9C6D4] opacity-0 group-hover:opacity-100 p-1 bg-white rounded-full shadow-sm">
                   <Trash2 size={14} />
                 </button>
              </div>
            ))}
            {tracks.length === 0 && <p className="text-center text-xs text-[#b498a5] bg-white/50 py-4 rounded-xl border border-dashed border-[#F9C6D4] w-full">Chưa có bài hát nào.</p>}
         </div>
       </div>
    </BgWrapper>
  )
}

const ProfileSection = ({ botId }: { botId: string }) => {
  const [profile, setProfile] = useState('');
  const [history, setHistory] = useState('');

  useEffect(() => {
    loadDraft(`profile_${botId}`).then(res => {
      if(res) {
        setProfile(res.profile || '');
        setHistory(res.history || '');
      }
    });
  }, [botId]);

  const save = (p: string, h: string) => {
    setProfile(p); setHistory(h);
    saveDraft(`profile_${botId}`, {profile: p, history: h});
  };

  return (
    <BgWrapper botId={botId} sectionKey="profile">
      <div className="w-full max-w-md mx-auto p-4 pt-20 pb-20 flex flex-col gap-6 h-full">
         <div className="bg-white/80 p-5 rounded-2xl border border-[#F9C6D4] shadow-sm flex-1 flex flex-col">
            <h3 className="font-bold text-[#b498a5] mb-2 flex items-center gap-2">🌸 Ngoại hình & Tính cách</h3>
            <p className="text-xs text-[#F9C6D4] mb-2">Tối đa 2500 tokens. Chi tiết về con người, sở thích.</p>
            <textarea 
               value={profile} onChange={e => save(e.target.value, history)}
               className="flex-1 w-full bg-white/60 p-3 rounded-xl border border-[#F9C6D4] outline-none text-[#8A7D85] text-sm resize-none"
               placeholder="Miêu tả chi tiết ngoại hình, tính cách, thói quen..."
            />
         </div>
         <div className="bg-white/80 p-5 rounded-2xl border border-[#F9C6D4] shadow-sm flex-[0.7] flex flex-col">
            <h3 className="font-bold text-[#b498a5] mb-2 flex items-center gap-2">🌟 Hành trình trưởng thành</h3>
            <p className="text-xs text-[#F9C6D4] mb-2">Tối đa 500 tokens. Các cột mốc lý lịch.</p>
            <textarea 
               value={history} onChange={e => save(profile, e.target.value)}
               className="flex-1 w-full bg-white/60 p-3 rounded-xl border border-[#F9C6D4] outline-none text-[#8A7D85] text-sm resize-none"
               placeholder="Cột mốc, tự hào, những kiện trong đời..."
            />
         </div>
      </div>
    </BgWrapper>
  )
}

const FriendsSection = ({ botId }: { botId: string }) => {
  const [content, setContent] = useState('');
  useEffect(() => { loadDraft(`friends_${botId}`).then(res => res && setContent(res)); }, [botId]);
  const save = (v: string) => { setContent(v); saveDraft(`friends_${botId}`, v); };

  return (
    <BgWrapper botId={botId} sectionKey="friends">
       <div className="w-full max-w-md mx-auto p-4 pt-20 pb-20 h-full flex flex-col">
          <div className="bg-white/80 p-5 rounded-2xl border border-[#F9C6D4] shadow-sm flex flex-col flex-1">
             <h3 className="font-bold text-[#b498a5] mb-2 text-lg drop-shadow-sm">👥 Vòng tròn xã hội</h3>
             <p className="text-xs text-[#F9C6D4] mb-3">Người thân, bạn bè, gia cảnh, môi trường sống (Tối đa 500 token).</p>
             <textarea 
               value={content} onChange={e => save(e.target.value)}
               className="flex-1 w-full bg-white/60 p-3 rounded-xl border border-[#F9C6D4] outline-none text-[#8A7D85] text-sm resize-none"
               placeholder="Ai là gia đình? Ai là bạn thân?..."
            />
          </div>
       </div>
    </BgWrapper>
  )
}

const MoodSection = ({ botId }: { botId: string }) => {
  const [data, setData] = useState({ mood: '', items: '' });
  useEffect(() => { loadDraft(`mood_${botId}`).then(res => res && setData(res)); }, [botId]);
  const save = (f: string, v: string) => { const nd = {...data, [f]: v}; setData(nd); saveDraft(`mood_${botId}`, nd); };

  return (
    <BgWrapper botId={botId} sectionKey="mood">
       <div className="w-full max-w-md mx-auto p-4 pt-20 pb-20 flex flex-col gap-6 h-full">
         <div className="bg-white/80 p-5 rounded-2xl border border-[#F9C6D4] shadow-sm flex-1 flex flex-col">
            <h3 className="font-bold text-[#b498a5] mb-2">☁️ Tâm trạng</h3>
            <textarea 
               value={data.mood} onChange={e => save('mood', e.target.value)}
               className="flex-1 w-full bg-white/60 p-3 rounded-xl border border-[#F9C6D4] outline-none text-[#8A7D85] text-sm resize-none"
               placeholder="Khi buồn vui giận dỗi sẽ như thế nào?..."
            />
         </div>
         <div className="bg-white/80 p-5 rounded-2xl border border-[#F9C6D4] shadow-sm flex-1 flex flex-col">
            <h3 className="font-bold text-[#b498a5] mb-2">🎀 Đồ mang theo người</h3>
            <textarea 
               value={data.items} onChange={e => save('items', e.target.value)}
               className="flex-1 w-full bg-white/60 p-3 rounded-xl border border-[#F9C6D4] outline-none text-[#8A7D85] text-sm resize-none"
               placeholder="Son môi, điện thoại, bùa xui, gương mini?..."
            />
         </div>
       </div>
    </BgWrapper>
  )
}

const PhotoNotesSection = ({ botId }: { botId: string }) => {
  const [bg, setBg] = useState('');
  const [name, setName] = useState('');
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<{text: string, x: number, y: number, sticker: string}[]>([]);

  const stickers = ["🌸", "🐰", "🎀", "🍓", "✨", "🍬", "☁️"];

  useEffect(() => {
     loadDraft(`photonotes_${botId}`).then(res => {
        if(res) {
          setBg(res.bg || '');
          setName(res.name || '');
          setNotes(res.notes || []);
        }
     });
  }, [botId]);

  const saveAll = (newBg: string, newName: string, newNotes: any[]) => {
      setBg(newBg); setName(newName); setNotes(newNotes);
      saveDraft(`photonotes_${botId}`, {bg: newBg, name: newName, notes: newNotes});
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      saveAll(base64, name, notes);
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter' && noteText.trim()) {
        const newNotes = [...notes, {
           text: noteText,
           x: Math.max(5, Math.random() * 75), // safe bounds
           y: Math.max(20, Math.random() * 65),
           sticker: stickers[Math.floor(Math.random() * stickers.length)]
        }];
        saveAll(bg, name, newNotes);
        setNoteText('');
     }
  };

  const clearNotes = () => {
    if(confirm("Tẩy xóa hết các note?")) saveAll(bg, name, []);
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#FAF9F6]">
      {!bg ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6">
           <label className="cursor-pointer flex flex-col items-center p-8 bg-white rounded-3xl border-2 border-dashed border-[#F9C6D4] shadow-sm hover:bg-[#FFF5FB] transition">
              <ImageIcon className="w-16 h-16 text-[#F9C6D4] mb-4" />
              <span className="font-bold text-[#b498a5] text-lg mb-2">Chọn ảnh nền trang trí</span>
              <span className="text-sm text-[#F9C6D4] text-center max-w-[200px]">Tải ảnh lên để bắt đầu note full màn hình nha!</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
           </label>
        </div>
      ) : (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bg})` }}>
          
           {/* Bunny Message */}
           <div className="absolute top-[80px] left-4 bg-white/95 p-3 rounded-2xl border border-dotted border-[#F9C6D4] flex items-center gap-2 shadow-md max-w-[80%] z-20">
              <span className="text-2xl">🐰</span>
              <span className="text-xs text-[#b498a5] font-bold leading-relaxed">
                ★. Bạn ghi những sở thích của bạn cho bot char biết nào, iu iu
              </span>
           </div>

           {/* Change BG btn */}
           <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button onClick={clearNotes} className="bg-white/80 p-2 rounded-full border border-[#F9C6D4] shadow-sm text-red-300 hover:bg-[#FFF5FB]"><Trash2 size={16}/></button>
              <label className="cursor-pointer bg-white/80 p-2 rounded-full shadow-sm border border-[#F9C6D4] hover:bg-[#FFF5FB]">
                <Camera className="w-4 h-4 text-[#F9C6D4]" />
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
           </div>

           {/* Interactive Notes */}
           {notes.map((n, i) => (
             <div key={i} className="absolute flex items-start gap-1 p-1.5 rounded-lg border-2 border-dashed border-[#F9C6D4] shadow-sm pointer-events-none z-10" 
                  style={{ top: `${n.y}%`, left: `${n.x}%`, backgroundColor: 'rgba(255,255,255,0.75)'}}>
                <span className="text-[14px] leading-none">{n.sticker}</span>
                <span className="text-[#8A7D85] font-bold text-xs" style={{ fontFamily: 'cursive' }}>{n.text}</span>
             </div>
           ))}

           {/* Name Box (if not empty) */}
           {name && (
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#F9C6D4] px-6 py-3 rounded-xl shadow-lg border-2 border-dashed border-white z-10 flex items-center justify-center">
                <div className="absolute -top-3 -left-3 text-xl">🐰</div>
                <div className="absolute -bottom-3 -right-3 text-xl">🌸</div>
                <span className="font-bold text-white text-3xl tracking-wider drop-shadow-md" style={{ fontFamily: 'cursive' }}>{name}</span>
             </div>
           )}

           {/* Input Controls */}
           <div className="absolute bottom-6 left-4 right-4 flex flex-col gap-2 z-30">
              <input 
                 type="text" value={name} onChange={e => saveAll(bg, e.target.value, notes)}
                 placeholder="Chữ ký tên của bạn..."
                 className="w-full max-w-[200px] p-2.5 text-sm bg-white/95 border-2 border-[#F9C6D4] outline-none rounded-xl font-bold text-[#b498a5] shadow-lg"
              />
              <input 
                 type="text" value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={handleEnter}
                 placeholder="Ghi chú sở thích rồi nhấn Enter để dán lên ảnh..."
                 className="w-full p-3 text-sm bg-white/95 border-2 border-[#F9C6D4] outline-none rounded-xl font-bold text-[#8A7D85] shadow-lg"
              />
           </div>

        </div>
      )}
    </div>
  )
}
