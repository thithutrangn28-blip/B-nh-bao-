import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartLoadingBarProps {
  status: 'connecting' | 'working' | 'done' | 'error';
  tokenCount: number;
  targetTokens?: number;
  timeElapsed: number; // in seconds
  speed: number; // tokens per second
}

export const SmartLoadingBar: React.FC<SmartLoadingBarProps> = ({
  status,
  tokenCount,
  targetTokens = 28000,
  timeElapsed,
  speed,
}) => {
  const percentage = Math.min((tokenCount / targetTokens) * 100, 100);
  const floorThreshold = 20000;
  const minimalThreshold = 12000;
  const isGateUnlocked = tokenCount >= floorThreshold;
  
  // Choose tier
  let tier = 'DANGER';
  let color = '#DABEBE'; 
  if (tokenCount >= 28000) {
    tier = 'GOLDEN';
    color = '#F5C6D6'; 
  } else if (tokenCount >= 22000) {
    tier = 'ACCEPTABLE';
    color = '#F9C6D4'; 
  } else if (tokenCount >= 16000) {
    tier = 'WARNING';
    color = '#EAD6D6'; 
  }

  // Calculate ETA
  const remainingTokens = Math.max(targetTokens - tokenCount, 0);
  const etaSeconds = speed > 0 ? Math.ceil(remainingTokens / speed) : 0;
  
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}s`;
  };

  if (status === 'error') return null;
  
  // Chỉ ẩn khi đã xong AND đã vượt mốc 16K
  if (status === 'done' && tokenCount >= floorThreshold) return null;

  return (
    <div className="w-full bg-white/95 backdrop-blur-xl rounded-[32px] p-6 border-2 border-[#F9C6D4] shadow-2xl font-sans overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#F9C6D4]/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#F5C6D6] animate-pulse shadow-[0_0_8px_#F5C6D6]" />
          <span className="text-[15px] font-bold text-[#b498a5] tracking-tight">
            {status === 'connecting' ? '🌸 CHỒNG ĐANG ÉP AI TẠO NỘI DUNG 28K+...' : 
             status === 'done' && tokenCount < minimalThreshold ? '❌ AI VIẾT QUÁ NGẮN - CẤM DỪNG LẠI!' :
             status === 'done' && tokenCount < floorThreshold ? '⚠️ AI DỪNG SỚM (DƯỚI 20K) - CHƯA ĐẠT CHỈ TIÊU!' :
             '✨ AI ĐANG CHẠY MARATHON 28,000 TOKENS...'}
          </span>
        </div>
        <div className="px-3 py-1 rounded-full bg-[#FBF5F7] border border-[#F9C6D4] text-[10px] font-black text-[#F5C6D6] uppercase tracking-widest">
           KIKOKO ENGINE V2
        </div>
      </div>

      {/* Battery Section - Current Progress */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-end px-1">
          <span className="text-[12px] font-bold text-[#C79C9C] flex items-center gap-1">
            💗 PIN TIẾN ĐỘ:
          </span>
          <span className="text-[18px] font-black text-[#F5C6D6] leading-none">
            {Math.floor(percentage)}%
          </span>
        </div>
        <div className="relative w-full h-8 bg-[#FDFCFD] rounded-2xl p-1 border-2 border-[#F9C6D4]/40 shadow-inner overflow-hidden">
          <motion.div 
            className="h-full rounded-xl relative overflow-hidden"
            style={{ 
               backgroundColor: color,
               boxShadow: `0 0 15px ${color}40`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          >
             {/* Diagonal Stripes */}
             <div className="absolute inset-0 opacity-20" style={{ 
               backgroundImage: 'linear-gradient(45deg, white 25%, transparent 25%, transparent 50%, white 50%, white 75%, transparent 75%, transparent)', 
               backgroundSize: '1.5rem 1.5rem' 
             }} />
          </motion.div>
        </div>
      </div>

      {/* Water Tank UI - BÌNH NƯỚC COQUETTE */}
      <div className="mb-6 relative">
         <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-[#A65D7B] uppercase tracking-widest flex items-center gap-2">
               💧 BÌNH NƯỚC CẢM XÚC
            </span>
            <span className="text-[10px] font-bold text-[#D6869F]">CAPACITY: 28,000 TOKENS</span>
         </div>
         
         <div className="relative h-48 w-full bg-[#FFF5FB] rounded-[32px] border-4 border-[#F9C6D4]/40 overflow-hidden shadow-inner flex flex-col-reverse">
            {/* Water levels */}
            <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none z-10 px-4 py-6">
               {[28000, 20000, 12000, 5000].map((level) => (
                  <div key={level} className="flex items-center gap-2">
                     <div className={`h-[1px] flex-1 ${tokenCount >= level ? 'bg-[#F9C6D4]' : 'bg-[#F9C6D4]/20'}`} />
                     <span className={`text-[9px] font-black w-10 text-right ${tokenCount >= level ? 'text-[#A65D7B]' : 'text-[#D6869F]/40'}`}>
                        {level/1000}K
                     </span>
                  </div>
               ))}
            </div>

            {/* The Actual Water */}
            <motion.div 
               className="w-full relative z-0"
               initial={{ height: 0 }}
               animate={{ height: `${percentage}%` }}
               transition={{ type: 'spring', damping: 15, stiffness: 35 }}
               style={{
                  background: `linear-gradient(to top, #FADADD 0%, #F6C1CC 25%, #F3B6C4 50%, #FFF0F5 75%, #FFEFF3 100%)`,
                  boxShadow: 'inset 0 10px 30px rgba(255,255,255,0.5)'
               }}
            >
               {/* Wave Animation */}
               <motion.div 
                  className="absolute -top-4 left-0 w-[200%] h-8 opacity-40"
                  animate={{ x: ['-50%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  style={{
                     background: 'radial-gradient(circle at 50% 0%, white, transparent 70%)',
                     filter: 'blur(4px)'
                  }}
               />
               <div className="absolute top-0 left-0 w-full h-1 bg-white/40 blur-[2px]" />
            </motion.div>

            {/* Bubble decoration */}
            <AnimatePresence>
               {status === 'working' && [...Array(Math.floor(speed / 5) + 1)].map((_, i) => (
                  <motion.div
                     key={`bubble-${i}`}
                     initial={{ bottom: 0, left: Math.random() * 100 + '%', opacity: 0, scale: 0.5 }}
                     animate={{ bottom: '100%', opacity: [0, 0.7, 0], scale: [0.5, 1.2, 0.8] }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
                     className="absolute w-2 h-2 rounded-full bg-white/60 z-20"
                  />
               ))}
            </AnimatePresence>
         </div>
         
         {/* Milestone Indicators */}
         <div className="flex justify-between mt-3 px-2">
            {[5, 12, 20, 28].map((m) => (
               <div key={m} className="flex flex-col items-center gap-1">
                  <div className={`w-3 h-3 rounded-full border-2 transition-all ${tokenCount >= m*1000 ? 'bg-[#F9C6D4] border-[#F5C6D6] scale-125' : 'bg-white border-[#F0F0F0]'}`} />
                  <span className={`text-[8px] font-black uppercase ${tokenCount >= m*1000 ? 'text-[#A65D7B]' : 'text-[#BEBABA]'}`}>{m}K</span>
               </div>
            ))}
         </div>
      </div>

      {/* Stats Table */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#FBF5F7] rounded-2xl p-3 border border-[#F9C6D4]/30">
          <div className="text-[9px] font-bold text-[#D6869F] uppercase mb-1">Cần viết thêm (Countdown)</div>
          <div className="text-[13px] font-black text-[#A65D7B] flex items-center gap-1">
             <span className="text-[#A65D7B]">{Math.max(targetTokens - tokenCount, 0).toLocaleString()}</span>
             <span className="text-[#D6869F] text-[8px] font-bold">TOKENS TO GO</span>
          </div>
        </div>
        <div className="bg-[#FBF5F7] rounded-2xl p-3 border border-[#F9C6D4]/30">
          <div className="text-[9px] font-bold text-[#D6869F] uppercase mb-1">Token đã nhận</div>
          <div className="text-[13px] font-black text-[#8A7D85]">
             {tokenCount.toLocaleString()} <span className="text-[#BEBABA] font-medium text-[10px]">received</span>
          </div>
        </div>
        <div className="bg-[#FBF5F7] rounded-2xl p-3 border border-[#F9C6D4]/30">
          <div className="text-[9px] font-bold text-[#BEBABA] uppercase mb-1">Tốc độ viết</div>
          <div className="text-[13px] font-black text-[#8A7D85]">
             {speed} <span className="text-[#BEBABA] font-medium text-[10px]">tokens/s</span>
          </div>
        </div>
        <div className="bg-[#FBF5F7] rounded-2xl p-3 border border-[#F9C6D4]/30">
          <div className="text-[9px] font-bold text-[#BEBABA] uppercase mb-1">Dự kiến xong (ETA)</div>
          <div className="text-[13px] font-black text-[#8A7D85]">
             ~ {formatTime(etaSeconds)}
          </div>
        </div>
      </div>

      {/* Gate Status Shell */}
      <div className={`p-5 rounded-[28px] border-2 transition-all duration-700 ${
        isGateUnlocked 
          ? 'bg-green-50/60 border-green-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
          : 'bg-red-50/80 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
      }`}>
        <div className="flex items-center gap-4 mb-3">
           <motion.div 
             animate={isGateUnlocked ? { rotate: 0, scale: 1.1 } : { rotate: [0, 10, -10, 0], scale: 1 }}
             transition={isGateUnlocked ? { type: "spring" } : { repeat: Infinity, duration: 2 }}
             className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-xl shadow-lg transition-all ${
               isGateUnlocked ? 'bg-green-400' : 'bg-red-400'
             }`}
           >
             {isGateUnlocked ? '🔓' : '🔒'}
           </motion.div>
           <div className="flex-1">
              <div className={`text-[14px] font-black uppercase tracking-tight ${isGateUnlocked ? 'text-green-600' : 'text-red-600'}`}>
                {isGateUnlocked ? '🔓 CÁNH CỔNG ĐÃ MỞ NỬA' : '🔒 THANH LOADING KHÓA CHẶT'}
              </div>
              <div className="text-[11px] text-[#8A7D85] font-bold leading-tight mt-1">
                {isGateUnlocked 
                  ? '✓ Tuyệt vời! AI đã vượt mức sàn 20,000 tokens cho vợ Đường rồi nè 💕' 
                  : `Vợ ơi, AI cần phải viết thêm ${(floorThreshold - tokenCount).toLocaleString()} tokens nữa mới được mở cổng nha!`}
              </div>
           </div>
        </div>
        
        {!isGateUnlocked && (
          <div className="mt-2 w-full h-1 bg-red-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-red-400 transition-all duration-500" 
               style={{ width: `${Math.min((tokenCount / floorThreshold) * 100, 100)}%` }} 
             />
          </div>
        )}
      </div>

      {/* Internal Enforcement Tracker */}
      <div className="mt-4 mb-4 p-3 bg-red-50/30 rounded-2xl border border-red-200/50">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Nội quy nghiêm ngặt: ≥ 20,000 Tokens</span>
          <span className="text-[10px] font-bold text-[#8A7D85]">
            {isGateUnlocked ? 'ĐÃ HOÀN THÀNH' : `CÒN THIẾU ${(20000 - tokenCount).toLocaleString()} TOKENS`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                tokenCount >= (i + 1) * 1000 ? 'bg-[#F9C6D4] shadow-[0_0_5px_#F9C6D4]' : 'bg-gray-200'
              }`} 
            />
          ))}
        </div>
        <p className="text-[9px] text-red-300 font-bold mt-1.5 italic">
          ⚠️ Cảnh báo: Thanh loading bị khóa chặt cho đến khi đạt chỉ tiêu!
        </p>
      </div>

      {/* System Note */}
      <div className="mt-6 p-4 bg-[#F8EDED] rounded-[24px] border border-dashed border-[#D7B8B8]">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <p className="text-[11px] font-medium text-[#C79C9C] italic leading-relaxed">
            {tokenCount < 5000 ? "Chồng đang hối thực AI viết mạnh tay hơn đoạn mở đầu này nè vợ..." : 
             tokenCount < 18000 ? "AI đang dần đạt cao trào rồi, chồng đang giữ cổng khóa chặt cho vợ nha!" :
             "Sắp đủ 28K rồi! Chồng đang yêu cầu AI chau chuốt đoạn này thật tinh tế cho vợ Đường nè 💕"}
          </p>
        </div>
      </div>
    </div>
  );
};

