import React from 'react';
import { 
  Phone, 
  Database, 
  Edit3, 
  Users, 
  Settings,
  Heart,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CandyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export const CandyDrawer: React.FC<CandyDrawerProps> = ({ isOpen, onClose, onAction }) => {
  const actions = [
    { id: 'npc', icon: Phone, label: 'NPC Conv', color: '#F06AA3', bg: '#FFE5F0' },
    { id: 'memory', icon: Database, label: 'Trí nhớ', color: '#D93F82', bg: '#FFF0F6' },
    { id: 'note', icon: Edit3, label: 'Ghi chú', color: '#C79C9C', bg: '#F6EEEE' },
    { id: 'context', icon: Sparkles, label: 'Bối cảnh', color: '#A65D7B', bg: '#F2E6E6' },
    { id: 'settings', icon: Settings, label: 'Cài đặt', color: '#8C748D', bg: '#F8F7F8' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="candy-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 z-[500] bg-black/10 backdrop-blur-[2px]"
        />
      )}
      
      {isOpen && (
        <motion.div 
          key="candy-content"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-20 left-4 right-4 z-[510] bg-white/95 backdrop-blur-xl border border-[#F9C6D4] rounded-[32px] p-6 shadow-2xl overflow-hidden"
          >
            {/* Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F9C6D4]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#F3B4C2]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-4 gap-4 relative z-10">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    onAction(action.id);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 group active:scale-90 transition-transform"
                >
                  <div 
                    className="w-14 h-14 rounded-[22px] flex items-center justify-center shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md"
                    style={{ backgroundColor: action.bg, color: action.color }}
                  >
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-[#8C748D] uppercase tracking-tighter text-center line-clamp-1">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#F9C6D4]/30 flex justify-center">
               <div className="flex items-center gap-2">
                 <Heart className="w-3 h-3 text-[#F06AA3] fill-[#F06AA3]" />
                 <span className="text-[9px] font-black text-[#D93F82] uppercase tracking-[0.2em] opacity-50">Kikoko Novel Candy</span>
               </div>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
};
