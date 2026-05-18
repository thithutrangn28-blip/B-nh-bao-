import React from 'react';
import { Novel } from '../../types';

interface IntroCardProps {
  bot: Novel | null;
  userName?: string;
}

const IntroCard: React.FC<IntroCardProps> = ({ bot, userName = 'Bạn' }) => {
  const b = bot as any;
  if (!b || !b.storyOpening) return null;

  const formattedStory = b.storyOpening.replace(/{{user}}/g, userName);

  return (
    <div className="w-full max-w-[600px] mx-auto my-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="bg-[rgba(255,245,251,0.5)] border-2 border-dashed border-[#d1c4e9] rounded-[20px] p-5 font-mono shadow-sm relative overflow-hidden">
        {/* Manga Ribbon Header - Tự vẽ bằng SVG */}
        <div className="text-center mb-5 border-b-2 border-dotted border-[#d1c4e9] pb-3 relative">
          <div className="flex justify-center items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#9c88ff]">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="font-bold text-[#9c88ff] text-base tracking-widest uppercase">
              Thiết Lập Câu Chuyện Mở Đầu
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#9c88ff] scale-x-[-1]">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4">
          {/* Info Section - Agnostic Manga Style */}
          <div className="flex items-center gap-4 px-2">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-[#b2bec3] bg-white/60 flex items-center justify-center p-1 overflow-hidden shrink-0">
               {(b.introMainImage || b.avatar || b.coverImage) ? (
                <img src={b.introMainImage || b.avatar || b.coverImage} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a4b0be" strokeWidth="1">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="text-[#9c88ff] text-xs font-bold mb-1 tracking-tighter">CHARACTER IDENTITY</div>
              <div className="text-[#2d3436] text-sm uppercase tracking-widest font-bold">
                {b.name || b.characterName}
              </div>
            </div>
            {/* Manga Flower SVG */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-[#d1c4e9] animate-pulse">
              <path d="M12 12l0-4M12 12l4 0M12 12l0 4M12 12l-4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <path d="M12 6a6 6 0 0 1 0 12M6 12a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </div>

          {/* Text Section */}
          <div className="bg-white/40 border border-dashed border-[#d1c4e9] rounded-[15px] p-4 relative">
            <div className="text-[14px] text-[#9c88ff] mb-3 text-center border-b border-dashed border-[#d1c4e9]/30 pb-2 uppercase tracking-widest">
              Nội dung mở đầu Roleplay
            </div>
            <div className="text-[#2d3436] text-[13px] leading-[1.7] whitespace-pre-wrap text-justify px-1 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-[#d1c4e9] pr-2">
              {formattedStory}
            </div>
            
            {/* Side Images Gallery if available */}
            {b.introSideImages && b.introSideImages.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
                {b.introSideImages.map((img: string, idx: number) => (
                  <div key={idx} className="w-16 h-16 rounded-lg border border-[#d1c4e9]/30 overflow-hidden shrink-0 shadow-sm animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${idx * 100}ms` }}>
                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            )}
            
            {/* Decoration Bunny SVG - Manga Style */}
            <div className="absolute -bottom-2 -left-1 opacity-40">
              <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 40C60 20 80 20 80 40C80 60 60 70 60 80" stroke="#9c88ff" strokeWidth="5" strokeLinecap="round"/>
                <path d="M140 40C140 20 120 20 120 40C120 60 140 70 140 80" stroke="#9c88ff" strokeWidth="5" strokeLinecap="round"/>
                <circle cx="100" cy="120" r="50" stroke="#9c88ff" strokeWidth="5"/>
                <circle cx="80" cy="115" r="5" fill="#9c88ff"/>
                <circle cx="120" cy="115" r="5" fill="#9c88ff"/>
                <path d="M95 130C95 130 100 135 105 130" stroke="#9c88ff" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-dotted border-[#d1c4e9] flex justify-between items-center text-[10px] text-[#a4b0be] uppercase tracking-tighter">
          <span>{b?.name} is waiting...</span>
          <span className="font-bold text-[#d1c4e9]">Made by @taroushop</span>
        </div>
      </div>
    </div>
  );
};

export default IntroCard;
