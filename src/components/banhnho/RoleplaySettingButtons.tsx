import React from 'react';

export const ProfessionalHeartIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full p-2" fill="#F9C6D4" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round">
     <path d="M50 85 C50 85, 20 60, 20 35 C20 20, 45 20, 50 35 C55 20, 80 20, 80 35 C80 60, 50 85, 50 85 Z" strokeDasharray="4,4"/>
   </svg>
);

export const FlowerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="#F9C6D4" stroke="#FFFFFF" strokeWidth="2">
    <circle cx="50" cy="50" r="15" fill="#FDE2E4"/>
    <circle cx="50" cy="20" r="15"/><circle cx="80" cy="50" r="15"/><circle cx="50" cy="80" r="15"/><circle cx="20" cy="50" r="15"/>
    <circle cx="28" cy="28" r="15"/><circle cx="72" cy="28" r="15"/><circle cx="72" cy="72" r="15"/><circle cx="28" cy="72" r="15"/>
  </svg>
);

export const ProfessionalHeartButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-full border-2 border-dotted border-[#F9C6D4] bg-white/80 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      aria-label="Cài đặt nhân vật người dùng"
    >
      <ProfessionalHeartIcon />
    </button>
  );
};

export const FlowerButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-full border-2 border-dotted border-[#E598A6] bg-white/80 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      aria-label="Xem Tarot Bot Char"
    >
      <FlowerIcon />
    </button>
  );
};
