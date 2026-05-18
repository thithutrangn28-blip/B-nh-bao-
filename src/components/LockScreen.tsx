import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Fingerprint, Star, Heart, Sparkles, Image as ImageIcon } from 'lucide-react';
import { saveToDB, getFromDB } from '../utils/indexedDB';
import { compressImage } from '../utils/imageUtils';

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [time, setTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [appBackground, setAppBackground] = useState('');

  useEffect(() => {
    const loadBg = async () => {
      const saved = await getFromDB('backgrounds', 'lock_bg');
      if (saved) setAppBackground(saved);
      else {
        const legacy = localStorage.getItem('lock_bg');
        if (legacy) {
          setAppBackground(legacy);
          await saveToDB('backgrounds', 'lock_bg', legacy);
          localStorage.removeItem('lock_bg');
        } else {
          setAppBackground('https://i.postimg.cc/9FnXQNpn/e1d0cd594c41440c5e1dadc28f25c69a.jpg');
        }
      }
    };
    loadBg();
  }, []);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setAppBackground(compressed);
        await saveToDB('backgrounds', 'lock_bg', compressed);
      } catch (error) {
        console.error("Failed to upload lock background", error);
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const greetings = [
      "Chào ngày mới nha! 🌸",
      "Hôm nay cậu thế nào? 💖",
      "Nhớ uống nước đầy đủ nhé! 🎀",
      "Cậu là tuyệt nhất! ✨"
    ];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full flex flex-col items-center bg-black"
      drag="y"
      dragConstraints={{ top: -800, bottom: 0 }}
      onDragEnd={(e, info) => {
        if (info.offset.y < -100) onUnlock();
      }}
    >
      {/* Background */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-300"
        style={{ backgroundImage: `url('${appBackground}')` }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 w-full h-full bg-[#FAF9F6]/75 backdrop-blur-[4px]" />
      {/* Pattern */}
      <div 
        className="absolute inset-0 w-full h-full opacity-40"
        style={{ 
          backgroundImage: 'radial-gradient(#F9C6D4 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Top Bar for Background Upload */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-end z-20 pt-safe">
        <label 
          className="text-[12px] px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-md border border-white/20 shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-white/50 transition-colors text-gray-800 font-medium"
        >
          <ImageIcon size={14} />
          Đổi nền
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleBgUpload} 
          />
        </label>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center pt-24">
        {/* Greeting */}
        <div className="bg-[#F9C6D4]/90 text-white px-6 py-2 rounded-full font-medium shadow-sm mb-6 backdrop-blur-md">
          {greeting}
        </div>

        {/* Time Box */}
        <div className="w-[85%] max-w-sm h-[260px] bg-white/60 rounded-[40px] flex items-center justify-center shadow-lg backdrop-blur-md">
          <span className="text-[100px] font-semibold text-[#F3B4C2] tracking-tighter leading-none">
            {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Icons */}
        <div className="flex justify-between w-[60%] max-w-xs mt-8 text-[#F3B4C2]">
          <Star className="w-12 h-12 drop-shadow-md" fill="currentColor" />
          <Heart className="w-12 h-12 drop-shadow-md" fill="currentColor" />
          <Sparkles className="w-12 h-12 drop-shadow-md" fill="currentColor" />
        </div>

        {/* Battery */}
        <div className="w-[70%] max-w-xs h-[14px] bg-[#E6DDD8] rounded-full mt-8 overflow-hidden shadow-inner">
          <div className="w-[90%] h-full bg-[#F3B4C2]" />
        </div>

        {/* Bottom Icons */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-[#F3B4C2]/80">
          <Fingerprint className="w-20 h-20" />
        </div>
        <div className="absolute bottom-28 right-10 md:right-1/2 md:-mr-[180px] text-[#F3B4C2]/80">
          <Camera className="w-12 h-12" />
        </div>

        <div className="absolute bottom-10 text-[#F3B4C2] font-medium animate-pulse">
          Vuốt lên để mở khoá
        </div>
      </div>
    </motion.div>
  );
}
