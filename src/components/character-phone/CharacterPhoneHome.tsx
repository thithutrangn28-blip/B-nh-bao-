import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, BookHeart, UserCircle, Phone, MessageCircle, Map, PieChart, Music, Landmark, Globe } from 'lucide-react';
import CharacterBioApp from './CharacterBioApp';
import CharacterDiaryApp from './CharacterDiaryApp';
import CharacterBrowserHistoryApp from './CharacterBrowserHistoryApp';
import CharacterCallingApp from './CharacterCallingApp';
import CharacterMessageApp from './CharacterMessageApp';

interface CharacterPhoneHomeProps {
  character: any;
  currentStory: any;
  contextString: string;
  apiSettings?: any;
  onLock: () => void;
  onBackToList?: () => void;
}

export default function CharacterPhoneHome({ character, currentStory, contextString, apiSettings, onLock, onBackToList }: CharacterPhoneHomeProps) {
  const [activeApp, setActiveApp] = useState<'bio' | 'diary' | 'browser' | 'calling' | 'message' | null>(null);

  return (
    <div className="w-full h-full bg-[#FFF0F5] relative overflow-hidden flex flex-col">
      {/* Status Bar Mock */}
      <div className="h-12 w-full flex justify-between items-center px-6 text-gray-800 font-medium text-sm pt-2 bg-white/30 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          {onBackToList && (
            <button onClick={onBackToList} className="p-1 hover:bg-black/5 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <span>9:41</span>
        </div>
        <div className="flex gap-2">
          <span>LTE</span>
          <span>100%</span>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Bio App Widget */}
          <div 
            onClick={() => setActiveApp('bio')}
            className="col-span-2 bg-white/80 backdrop-blur-md rounded-[24px] p-5 shadow-sm border-2 border-dotted border-[#D48E9E] cursor-pointer hover:scale-[1.02] transition-transform flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-[#F9C6D4] rounded-2xl flex items-center justify-center text-white shadow-inner">
              <UserCircle size={32} />
            </div>
            <div>
              <h3 className="font-bold text-[#5C4B51] text-lg">Giới thiệu 🎀</h3>
              <p className="text-xs text-[#D48E9E]">About Me & Featured</p>
            </div>
          </div>

          {/* Diary App Widget */}
          <div 
            onClick={() => setActiveApp('diary')}
            className="col-span-2 bg-white/80 backdrop-blur-md rounded-[24px] p-5 shadow-sm border-2 border-dotted border-[#D48E9E] cursor-pointer hover:scale-[1.02] transition-transform flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-[#F9C6D4] rounded-2xl flex items-center justify-center text-white shadow-inner">
              <BookHeart size={32} />
            </div>
            <div>
              <h3 className="font-bold text-[#5C4B51] text-lg">Secret Diaries 🎀</h3>
              <p className="text-xs text-[#D48E9E]">Nhật ký bí mật</p>
            </div>
          </div>

          {/* Browser History App Widget */}
          <div 
            onClick={() => setActiveApp('browser')}
            className="col-span-1 flex flex-col items-center gap-1 mt-4 cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-inner">
              <Globe size={28} />
            </div>
            <span className="text-xs font-medium text-[#5C4B51]">Trình duyệt</span>
          </div>

          {/* Calling App Widget */}
          <div 
            onClick={() => setActiveApp('calling')}
            className="col-span-1 flex flex-col items-center gap-1 mt-4 cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-14 h-14 bg-green-400 rounded-2xl flex items-center justify-center text-white shadow-inner">
              <Phone size={28} />
            </div>
            <span className="text-xs font-medium text-[#5C4B51]">Gọi điện</span>
          </div>

          {/* Message App Widget */}
          <div 
            onClick={() => setActiveApp('message')}
            className="col-span-1 flex flex-col items-center gap-1 mt-4 cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-14 h-14 bg-blue-400 rounded-2xl flex items-center justify-center text-white shadow-inner">
              <MessageCircle size={28} />
            </div>
            <span className="text-xs font-medium text-[#5C4B51]">Tin nhắn</span>
          </div>

          {/* Other Apps (Placeholders) */}
          <div className="col-span-1 flex flex-col items-center gap-1 mt-4 opacity-50 cursor-not-allowed">
            <div className="w-14 h-14 bg-red-400 rounded-2xl flex items-center justify-center text-white shadow-inner">
              <Map size={28} />
            </div>
            <span className="text-xs font-medium text-[#5C4B51]">Bản đồ</span>
          </div>
          <div className="col-span-1 flex flex-col items-center gap-1 mt-4 opacity-50 cursor-not-allowed">
            <div className="w-14 h-14 bg-purple-400 rounded-2xl flex items-center justify-center text-white shadow-inner">
              <PieChart size={28} />
            </div>
            <span className="text-xs font-medium text-[#5C4B51]">Bình chọn</span>
          </div>
          <div className="col-span-1 flex flex-col items-center gap-1 mt-4 opacity-50 cursor-not-allowed">
            <div className="w-14 h-14 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-inner">
              <Music size={28} />
            </div>
            <span className="text-xs font-medium text-[#5C4B51]">Nhạc</span>
          </div>
          <div className="col-span-1 flex flex-col items-center gap-1 mt-4 opacity-50 cursor-not-allowed">
            <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-white shadow-inner">
              <Landmark size={28} />
            </div>
            <span className="text-xs font-medium text-[#5C4B51]">Ngân hàng</span>
          </div>
        </div>
      </div>

      {/* Dock */}
      <div className="h-24 bg-white/50 backdrop-blur-xl border-t border-white/50 flex justify-center items-center pb-4">
        <button 
          onClick={onLock}
          className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <Lock size={20} />
        </button>
      </div>

      {/* Apps */}
      <AnimatePresence>
        {activeApp === 'bio' && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-20 bg-white"
          >
            <CharacterBioApp character={character} currentStory={currentStory} contextString={contextString} apiSettings={apiSettings} onClose={() => setActiveApp(null)} />
          </motion.div>
        )}
        {activeApp === 'diary' && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-20 bg-white"
          >
            <CharacterDiaryApp character={character} currentStory={currentStory} contextString={contextString} apiSettings={apiSettings} onClose={() => setActiveApp(null)} />
          </motion.div>
        )}
        {activeApp === 'browser' && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-20 bg-white"
          >
            <CharacterBrowserHistoryApp character={character} currentStory={currentStory} contextString={contextString} apiSettings={apiSettings} onClose={() => setActiveApp(null)} />
          </motion.div>
        )}
        {activeApp === 'calling' && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-20 bg-white"
          >
            <CharacterCallingApp character={character} currentStory={currentStory} contextString={contextString} apiSettings={apiSettings} onClose={() => setActiveApp(null)} />
          </motion.div>
        )}
        {activeApp === 'message' && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-20 bg-white"
          >
            <CharacterMessageApp character={character} currentStory={currentStory} contextString={contextString} apiSettings={apiSettings} onClose={() => setActiveApp(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
