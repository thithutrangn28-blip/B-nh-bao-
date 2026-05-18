import React, { useState } from 'react';
import { MemoryState, MEMORY_CONFIG } from '../../core/memory/config';
import { calculateTierTokens } from '../../core/memory/tokenCounter';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MemoryMeterProps {
  state: MemoryState;
}

const MemoryMeter: React.FC<MemoryMeterProps> = ({ state }) => {
  const { tiers, total } = calculateTierTokens(state);
  const percentage = Math.min((total / MEMORY_CONFIG.TOTAL_CAP) * 100, 100);
  const [expanded, setExpanded] = useState(false);
  
  const getZoneInfo = () => {
    if (total < MEMORY_CONFIG.SAFE_THRESHOLD) return { label: 'SAFE ZONE', color: '#A8D5BA', desc: 'Cốc nước đang ở mức an toàn 🌸' };
    if (total < MEMORY_CONFIG.WARNING_THRESHOLD) return { label: 'WARNING', color: '#F9E3A8', desc: 'Cốc nước sắp đầy rồi, vợ chuẩn bị dọn nhé! 🍵' };
    if (total < MEMORY_CONFIG.DANGER_THRESHOLD) return { label: 'DANGER', color: '#F9C6D4', desc: 'BẮT BUỘC dọn ngay để không bị tràn! 🚨' };
    return { label: 'CRITICAL', color: '#D6869F', desc: 'Dừng lại ngay, cốc nước sắp tràn rồi! 🛑' };
  };

  const zoneInfo = getZoneInfo();

  return (
    <div className="bg-white/92 border-2 border-dashed border-[#F9C6D4] rounded-[20px] p-3 font-mono shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[#A65D7B] font-bold text-xs tracking-wider flex items-center gap-1">
          <span>🥤</span> CONTEXT METER
        </h4>
        <div className="flex items-center gap-2">
            <div className="text-[9px] text-[#A65D7B] font-bold bg-[#F9C6D4]/20 px-1.5 py-0.5 rounded-md border border-[#F9C6D4]/30">
              V3 ENGINE
            </div>
            <button onClick={() => setExpanded(!expanded)} className="text-[#A65D7B] p-1 bg-white/50 rounded-full hover:bg-white transition-colors">
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
        </div>
      </div>

      <div className="space-y-2">
        {/* Progress Bar Container */}
        <div className="relative pt-1">
          <div className="flex mb-1 items-center justify-between">
            <div>
              <span className="text-[9px] font-bold inline-block py-0.5 px-1.5 uppercase rounded-full text-[#A65D7B] bg-[#F9C6D4]/30">
                {zoneInfo.label}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold inline-block text-[#A65D7B]">
                {total.toLocaleString()} / {MEMORY_CONFIG.TOTAL_CAP.toLocaleString()} tokens
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-[#F0F0F0] border border-[#F9C6D4]/30 shadow-inner">
            <div
              style={{ width: `${percentage}%`, backgroundColor: zoneInfo.color }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out relative"
            >
              {/* Dynamic progress highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {expanded && (
           <div className="grid grid-cols-2 gap-2 pt-2 animate-in slide-in-from-top-2 duration-200">
             {[
               { label: 'Eternal Core', value: tiers.eternalCore, color: '#A65D7B' },
               { label: 'Relationship', value: tiers.relationshipState, color: '#A65D7B' },
               { label: 'Scene State', value: tiers.currentScene, color: '#F9C6D4' },
               { label: 'User Profile M.', value: tiers.userProfileMemory, color: '#EABDD0' },
               { label: 'Extended M.', value: tiers.extendedMemory, color: '#D6869F' },
               { label: 'Summaries', value: tiers.longTermSummaries, color: '#EABDD0' },
               { label: 'Active Prompts', value: tiers.prompts, color: '#F9C6D4' },
               { label: 'Hot Memory', value: tiers.hotMemory, color: '#D6869F' },
               { label: 'Buffer', value: tiers.slidingBuffer, color: '#A65D7B' },
             ].map((item, idx) => (
               <div key={idx} className="flex items-center justify-between p-1.5 bg-white/40 rounded-lg border border-dashed border-[#F3C6D1] shadow-sm">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-bold text-[#9E919A] uppercase tracking-tighter">{item.label}</span>
                     <span className="text-[10px] font-bold text-[#8A7D85]">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-1 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
               </div>
             ))}
           </div>
        )}

        <div className="text-center mt-1 px-3 py-1 bg-[#F9C6D4]/10 rounded-lg border border-dotted border-[#F9C6D4]/40">
          <p className="text-[9px] text-[#A65D7B] italic font-medium">
            {zoneInfo.desc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemoryMeter;
