import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import { saveToDB, getFromDB } from '../utils/indexedDB';
import { compressImage } from '../utils/imageUtils';

export default function PasscodeScreen({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [code, setCode] = useState('');
  const [appBackground, setAppBackground] = useState('');
  const CORRECT_CODE = '1234';

  useEffect(() => {
    const loadBg = async () => {
      const saved = await getFromDB('backgrounds', 'passcode_bg');
      if (saved) setAppBackground(saved);
      else {
        const legacy = localStorage.getItem('passcode_bg');
        if (legacy) {
          setAppBackground(legacy);
          await saveToDB('backgrounds', 'passcode_bg', legacy);
          localStorage.removeItem('passcode_bg');
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
        await saveToDB('backgrounds', 'passcode_bg', compressed);
      } catch (error) {
        console.error("Failed to upload passcode background", error);
      }
    }
  };

  const handlePress = (num: string) => {
    if (code.length < 4) {
      const newCode = code + num;
      setCode(newCode);
      if (newCode.length === 4) {
        if (newCode === CORRECT_CODE) {
          setTimeout(onSuccess, 200);
        } else {
          setTimeout(() => setCode(''), 400); // shake and reset
        }
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 w-full h-full bg-[#FAF9F6]/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 bg-cover bg-center transition-all duration-300"
      style={{ backgroundImage: appBackground ? `url('${appBackground}')` : 'none' }}
    >
      {/* Overlay if background is set to ensure readability */}
      {appBackground && <div className="absolute inset-0 w-full h-full bg-[#FAF9F6]/80 backdrop-blur-md" />}

      {/* Top Bar for Background Upload */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-end z-20 pt-safe">
        <label 
          className="text-[12px] px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/40 shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-white/70 transition-colors text-gray-700 font-medium"
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

      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-[#F3B4C2] mb-8">Nhập mật khẩu</h2>
        <div className="flex gap-4 mb-12">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 border-[#F3B4C2] ${code.length > i ? 'bg-[#F3B4C2]' : 'bg-transparent'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num} 
              onClick={() => handlePress(num.toString())}
              className="w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm text-[#F3B4C2] text-3xl font-medium shadow-sm active:bg-[#F9C6D4] transition-colors"
            >
              {num}
            </button>
          ))}
          <button onClick={onCancel} className="w-20 h-20 rounded-full text-[#F3B4C2] font-medium bg-white/30 backdrop-blur-sm">Hủy</button>
          <button 
            onClick={() => handlePress('0')}
            className="w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm text-[#F3B4C2] text-3xl font-medium shadow-sm active:bg-[#F9C6D4] transition-colors"
          >
            0
          </button>
          <button onClick={() => setCode(code.slice(0, -1))} className="w-20 h-20 rounded-full text-[#F3B4C2] font-medium bg-white/30 backdrop-blur-sm">Xóa</button>
        </div>
      </div>
    </motion.div>
  );
}
