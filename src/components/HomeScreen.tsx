import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, MessageCircle, Image as ImageIcon, Phone, Camera, Heart, Tv, BookOpen, Sparkles } from 'lucide-react';

const pages = [0, 1, 2];

export default function HomeScreen({ openSettings, openKoko, openDating, openYouTube, openLoveShow, openNovel, openKikokoNovel, openRenGram, openKokoRoleplay, openUserProfile, openBanhNho, openCarrd, openCharacterPhone, openApiHub }: { openSettings: () => void, openKoko: () => void, openDating: () => void, openYouTube: () => void, openLoveShow: () => void, openNovel: () => void, openKikokoNovel: () => void, openRenGram: () => void, openKokoRoleplay: () => void, openUserProfile: () => void, openBanhNho: () => void, openCarrd: () => void, openCharacterPhone: () => void, openApiHub: () => void }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [appBackground, setAppBackground] = useState(() => localStorage.getItem('home_bg') || '');
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('home_bg', appBackground);
  }, [appBackground]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppBackground(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="absolute inset-0 w-full h-full bg-[#FAF9F6] overflow-hidden bg-cover bg-center transition-all duration-300"
      style={{ backgroundImage: appBackground ? `url('${appBackground}')` : 'none' }}
    >
      {/* Pattern */}
      {!appBackground && (
        <div 
          className="absolute inset-0 w-full h-full opacity-50"
          style={{ 
            backgroundImage: 'radial-gradient(#00000022 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
      )}

      {/* Top Bar for Background Upload */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-end z-20 pt-safe">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={bgInputRef} 
          onChange={handleBgUpload} 
        />
        <button 
          onClick={() => bgInputRef.current?.click()}
          className="text-[12px] px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/40 shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-white/70 transition-colors text-gray-700 font-medium"
        >
          <ImageIcon size={14} />
          Đổi nền
        </button>
      </div>

      {/* Pages */}
      <motion.div 
        className="flex w-full h-full"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -50 && currentPage < pages.length - 1) setCurrentPage(p => p + 1);
          if (info.offset.x > 50 && currentPage > 0) setCurrentPage(p => p - 1);
        }}
        animate={{ x: `-${currentPage * 100}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {pages.map(page => (
          <div key={page} className="min-w-full h-full pt-16 px-6 relative">
            {page === 0 && (
              <div className="grid grid-cols-4 gap-x-4 gap-y-6 max-w-md mx-auto">
                {/* App Icon */}
                <div className="flex flex-col items-center gap-1" onClick={openSettings}>
                  <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-[#F3B4C2] cursor-pointer active:scale-95 transition-transform">
                    <Settings size={32} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700">Cài đặt API</span>
                </div>
                
                <div className="flex flex-col items-center gap-1" onClick={openKoko}>
                  <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-[#F3B4C2] cursor-pointer active:scale-95 transition-transform">
                    <MessageCircle size={32} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700">Koko</span>
                </div>

                <div className="flex flex-col items-center gap-1" onClick={openDating}>
                  <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-[#F3B4C2] cursor-pointer active:scale-95 transition-transform">
                    <Heart size={32} fill="#F3B4C2" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700">Dating</span>
                </div>

                <div className="flex flex-col items-center gap-1" onClick={openYouTube}>
                  <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-[#F3B4C2] cursor-pointer active:scale-95 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="lucide lucide-youtube"><path d="M2.25 8.025c0-2.071 1.679-3.75 3.75-3.75h12c2.071 0 3.75 1.679 3.75 3.75v7.95c0 2.071-1.679 3.75-3.75 3.75h-12c-2.071 0-3.75-1.679-3.75-3.75v-7.95z"/><path d="m9.75 15.75 6-3.75-6-3.75v7.5z" fill="white"/></svg>
                  </div>
                  <span className="text-[11px] font-medium text-gray-700">YouTube</span>
                </div>

                <div className="flex flex-col items-center gap-1" onClick={openLoveShow}>
                  <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-[#F3B4C2] cursor-pointer active:scale-95 transition-transform">
                    <Tv size={32} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700">Love Show</span>
                </div>

                <div className="flex flex-col items-center gap-1" onClick={openRenGram}>
                  <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-[#F3B4C2] cursor-pointer active:scale-95 transition-transform">
                    <Camera size={32} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700">RenGram</span>
                </div>

                <div className="flex flex-col items-center gap-1" onClick={openKokoRoleplay}>
                  <div className="w-[60px] h-[60px] bg-gradient-to-br from-[#F9C6D4] to-[#F3B4C2] rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform">
                    <Sparkles size={32} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap">Roleplay Koko</span>
                </div>

                <div className="flex flex-col items-center gap-1" onClick={openUserProfile}>
                  <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-[#F3B4C2] cursor-pointer active:scale-95 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap">Hồ sơ User</span>
                </div>

                <div className="flex flex-col items-center gap-1" onClick={openKikokoNovel}>
                  <div className="w-[60px] h-[60px] bg-gradient-to-br from-[#F9C6D4] to-[#EACFD5] rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform">
                    <BookOpen size={32} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700">Kikoko Novel</span>
                </div>

                {/* Widget 2x2 */}
                <div className="col-span-2 row-span-2 bg-white rounded-[22px] shadow-[0_0_20px_#F9C6D4] overflow-hidden relative">
                  <img src="https://i.postimg.cc/9FnXQNpn/e1d0cd594c41440c5e1dadc28f25c69a.jpg" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#F9C6D4]/80 to-transparent flex items-end p-4">
                    <span className="text-white font-semibold">Kotokoo</span>
                  </div>
                </div>
              </div>
            )}
            {page === 1 && (
              <div className="grid grid-cols-4 gap-x-4 gap-y-6 max-w-md mx-auto">
                <div className="flex flex-col items-center gap-1" onClick={openNovel}>
                  <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-[#F3B4C2] cursor-pointer active:scale-95 transition-transform">
                    <BookOpen size={32} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700">Novel</span>
                </div>
                
                <div className="flex flex-col items-center gap-1" onClick={openBanhNho}>
                  <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center cursor-pointer active:scale-95 transition-transform overflow-hidden p-1">
                    <img src="https://i.postimg.cc/yNkB85Dd/662847c19c8cd32d8ffaea098e8d03f2-(1).png" className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">Bánh nhỏ<br/>Trò chuyện</span>
                </div>

                <div className="flex flex-col items-center gap-1" onClick={openCharacterPhone}>
                  <div className="w-[60px] h-[60px] bg-[#F9C6D4] rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform">
                    <Phone size={32} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">Điện thoại<br/>Nhân vật</span>
                </div>

                <div className="flex flex-col items-center gap-1" onClick={openApiHub}>
                  <div className="w-[60px] h-[60px] rounded-[14px] shadow-[0_0_20px_#F9C6D4] flex items-center justify-center cursor-pointer active:scale-95 transition-transform p-2 bg-[#FFF5FB] border border-[#F9C6D4] border-opacity-40">
                    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path d="M10,8 L48,8 L56,16 L56,56 L10,56 Z" fill="#FFF5FB" stroke="rgba(249, 198, 212, 0.5)" strokeWidth="1.5"/>
                      <path d="M48,8 L56,16 L48,16 Z" fill="#F9C6D4" opacity="0.6"/>
                      <line x1="18" y1="24" x2="44" y2="24" stroke="#D7B8B8" strokeWidth="1.2" strokeLinecap="round"/>
                      <line x1="18" y1="32" x2="48" y2="32" stroke="#D7B8B8" strokeWidth="1.2" strokeLinecap="round"/>
                      <line x1="18" y1="40" x2="40" y2="40" stroke="#D7B8B8" strokeWidth="1.2" strokeLinecap="round"/>
                      <circle cx="46" cy="48" r="5" fill="#F5C6D6"/>
                      <line x1="44" y1="48" x2="48" y2="48" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="46" y1="46" x2="46" y2="50" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">API Hub</span>
                </div>
              </div>
            )}
            {page === 2 && (
              <div className="flex items-center justify-center h-full text-gray-400">Trang 3</div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Page Indicators */}
      <div className="absolute bottom-[120px] left-0 w-full flex justify-center gap-2">
        {pages.map(p => (
          <div key={p} className={`w-2 h-2 rounded-full ${currentPage === p ? 'bg-[#F3B4C2]' : 'bg-gray-300'}`} />
        ))}
      </div>

      {/* Dock */}
      <div className="absolute bottom-6 left-5 right-5 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md h-[85px] bg-white/40 backdrop-blur-[20px] rounded-[30px] flex justify-around items-center px-4 shadow-lg border border-white/50">
        <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-sm flex items-center justify-center text-[#F3B4C2]">
          <Phone size={28} />
        </div>
        <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-sm flex items-center justify-center text-[#F3B4C2]">
          <MessageCircle size={28} />
        </div>
        <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-sm flex items-center justify-center text-[#F3B4C2]">
          <Camera size={28} />
        </div>
        <div className="w-[60px] h-[60px] bg-white rounded-[14px] shadow-sm flex items-center justify-center text-[#F3B4C2]">
          <ImageIcon size={28} />
        </div>
      </div>
    </div>
  );
}
