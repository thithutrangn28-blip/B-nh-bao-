import React, { useRef } from 'react';
import { MemoryState } from '../../core/memory/config';
import { WRITING_STYLES } from '../../constants/writingStylesV3';
import { Sparkles, Image as ImageIcon, BookOpen, Check, X } from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';

interface WritingStyleDashboardProps {
  state: MemoryState;
  onUpdateState: (newState: MemoryState) => void;
  onClose: () => void;
}

const WritingStyleDashboard: React.FC<WritingStyleDashboardProps> = ({ state, onUpdateState, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedStyles = state.selectedStyles || [];

  const toggleStyle = (title: string) => {
    let newStyles = [...selectedStyles];
    if (newStyles.includes(title)) {
      newStyles = newStyles.filter(s => s !== title);
    } else {
      newStyles.push(title);
    }
    onUpdateState({ ...state, selectedStyles: newStyles });
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      onUpdateState({ ...state, stylesBackground: base64 });
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#FFFCFD] border-4 border-[#F9C6D4] rounded-[40px] overflow-hidden flex flex-col h-[85vh] shadow-2xl animate-in zoom-in-95 relative">
        
        {/* Dashboard Custom Background */}
        {state.stylesBackground && (
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center opacity-25 pointer-events-none" 
            style={{ backgroundImage: `url(${state.stylesBackground})` }}
          />
        )}
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex flex-wrap gap-12 p-8 rotate-12 z-0">
          {[...Array(20)].map((_, i) => <span key={i} className="text-4xl text-[#F5C6D6]">🖋️</span>)}
        </div>

        {/* Header */}
        <div className="p-6 border-b-2 border-dashed border-[#F9C6D4] flex items-center justify-between bg-white/70 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3">
             <div className="bg-[#F9C6D4] p-3 rounded-2xl shadow-sm transform hover:-rotate-12 transition-transform">
                <BookOpen className="w-6 h-6 text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-[#A65D7B]">Văn Phong Kikoko</h2>
                <p className="text-[10px] text-[#D6869F] font-black uppercase tracking-[0.3em]">Hệ thống đa văn phong v3.0</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full bg-white hover:bg-[#F9C6D4]/10 text-[#A65D7B] border-2 border-[#F9C6D4] flex items-center justify-center transition-all shadow-sm"
              title="Thay nền"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#FFF5FB] hover:bg-[#F9C6D4] text-[#A65D7B] border-2 border-[#F9C6D4] flex items-center justify-center transition-all shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBackgroundUpload} />

        {/* Style Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar">
           <div className="grid gap-4">
              {WRITING_STYLES.map((style) => {
                const isSelected = selectedStyles.includes(style.title);
                return (
                  <div 
                    key={style.id}
                    onClick={() => toggleStyle(style.title)}
                    className={`bg-white/80 border-2 rounded-3xl p-5 cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                      isSelected 
                      ? 'border-[#F9C6D4] shadow-lg ring-4 ring-[#F9C6D4]/10' 
                      : 'border-[#F0F0F0] hover:border-[#F9C6D4]/50'
                    }`}
                  >
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-[#F9C6D4] text-white p-2 rounded-bl-2xl">
                        <Check className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[#A65D7B]">{style.title}</h3>
                          <div className="flex gap-1">
                             {style.tags.map((tag, i) => (
                               <span key={i} className="text-[8px] bg-[#FFF5FB] text-[#D6869F] px-1.5 py-0.5 rounded-full border border-[#F9C6D4]/30">{tag}</span>
                             ))}
                          </div>
                       </div>
                       <p className="text-xs text-[#9E919A] font-medium leading-relaxed italic">
                         "{style.description}"
                       </p>
                       <p className="text-[11px] text-[#5A5A5A] leading-relaxed line-clamp-2 mt-2 group-hover:line-clamp-none transition-all duration-500">
                         {style.details}
                       </p>
                    </div>

                    {/* Gradient highlight on hover */}
                    <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-[#F9C6D4] opacity-0 group-hover:opacity-10 rounded-full blur-2xl transition-opacity"></div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/70 backdrop-blur-md border-t-2 border-dashed border-[#F9C6D4] flex items-center justify-center gap-2 text-[10px] text-[#A65D7B] font-black tracking-widest uppercase relative z-10">
           <Sparkles className="w-4 h-4" /> Đã chọn {selectedStyles.length} văn phong
        </div>
      </div>
    </div>
  );
};

export default WritingStyleDashboard;
