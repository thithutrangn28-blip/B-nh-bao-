import React from 'react';

interface StrawberryMemoryButtonProps {
  onClick: () => void;
  zone?: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL' | 'BLOCK';
}

const StrawberryMemoryButton: React.FC<StrawberryMemoryButtonProps> = ({ onClick, zone = 'SAFE' }) => {
  const getZoneColor = () => {
    switch (zone) {
      case 'SAFE': return '#F9C6D4'; // Soft pink
      case 'WARNING': return '#F3C6D1'; // Slightly darker
      case 'DANGER': return '#EABDD0'; 
      case 'CRITICAL': return '#D6869F'; 
      case 'BLOCK': return '#A65D7B';
      default: return '#F9C6D4';
    }
  };

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 left-4 z-[400] group transition-all duration-300 hover:scale-110 active:scale-95"
      title="Bánh nhỏ Ghi nhớ"
    >
      <div className="relative">
        {/* Glow effect based on zone */}
        <div 
          className="absolute inset-0 blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full"
          style={{ backgroundColor: getZoneColor() }}
        ></div>
        
        {/* The Strawberry SVG (Hand-drawn style) */}
        <div className="bg-white/60 backdrop-blur-md p-2.5 rounded-2xl border-2 border-[#F9C6D4] shadow-sm relative overflow-hidden">
          <svg width="32" height="32" viewBox="0 10 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
            {/* Strawberry Body */}
            <path d="M100 170C60 170 40 140 40 100C40 60 65 40 100 40C135 40 160 60 160 100C160 140 140 170 100 170Z" fill="#F9C6D4" />
            <path d="M100 170C60 170 40 140 40 100C40 60 65 40 100 40C135 40 160 60 160 100C160 140 140 170 100 170Z" stroke="#D6869F" strokeWidth="4" />
            
            {/* Seeds */}
            <circle cx="70" cy="80" r="3" fill="white" opacity="0.8" />
            <circle cx="100" cy="90" r="3" fill="white" opacity="0.8" />
            <circle cx="130" cy="80" r="3" fill="white" opacity="0.8" />
            <circle cx="80" cy="110" r="3" fill="white" opacity="0.8" />
            <circle cx="120" cy="110" r="3" fill="white" opacity="0.8" />
            <circle cx="100" cy="130" r="3" fill="white" opacity="0.8" />
            
            {/* Leaves */}
            <path d="M100 40C100 40 110 10 130 20C130 20 105 25 100 40Z" fill="#A8D5BA" stroke="#7CB696" strokeWidth="3" />
            <path d="M100 40C100 40 90 10 70 20C70 20 95 25 100 40Z" fill="#A8D5BA" stroke="#7CB696" strokeWidth="3" />
            <path d="M100 40V15" stroke="#7CB696" strokeWidth="4" strokeLinecap="round" />
          </svg>
          
          {/* Badge indicator */}
          {zone !== 'SAFE' && (
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full border border-white" style={{ backgroundColor: getZoneColor() }}></div>
          )}
        </div>
        
        {/* Label on hover */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#F9C6D4] text-[#A65D7B] text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
          Memory Engine V3
        </div>
      </div>
    </button>
  );
};

export default StrawberryMemoryButton;
