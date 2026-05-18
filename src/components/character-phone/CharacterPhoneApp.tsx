import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, ChevronUp } from 'lucide-react';
import { getKikokoStory } from '../../utils/db';
import CharacterPhoneHome from './CharacterPhoneHome';
import CharacterList from './CharacterList';

interface CharacterPhoneAppProps {
  currentStory?: any;
  apiSettings?: any;
  onBack: () => void;
}

export default function CharacterPhoneApp({ currentStory: propStory, apiSettings, onBack }: CharacterPhoneAppProps) {
  const [currentStory, setCurrentStory] = useState<any>(propStory || null);
  const [contextString, setContextString] = useState<string>('');
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [lockBg, setLockBg] = useState('https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg');

  useEffect(() => {
    const loadStory = async () => {
      let story = propStory;
      if (!story) {
        const storyId = localStorage.getItem('kikoko_current_story_id');
        if (storyId) {
          story = await getKikokoStory(storyId);
          setCurrentStory(story);
        }
      } else {
        setCurrentStory(story);
      }
      
      if (story) {
        let ctx = `[THIẾT LẬP NHÂN VẬT]\n`;
        ctx += `Bot: ${story.botChar || ''}\n`;
        ctx += `User: ${story.userChar || ''}\n`;
        ctx += `Memory: ${story.memory || ''}\n`;
        ctx += `Character Memory: ${story.characterMemory || ''}\n\n`;
        
        if (story.chapters && story.chapters.length > 0) {
          ctx += `[CÁC CHƯƠNG TRUYỆN]\n`;
          const MAX_LENGTH = 70000;
          let currentLength = ctx.length;
          const includedChapters: string[] = [];
          
          // Duyệt từ chương mới nhất ngược về trước để ưu tiên ngữ cảnh gần nhất
          for (let i = story.chapters.length - 1; i >= 0; i--) {
            const ch = story.chapters[i];
            const chText = `--- ${ch.title} ---\n${ch.content}\n\n`;
            
            if (currentLength + chText.length > MAX_LENGTH) {
              // Nếu vượt quá giới hạn 70.000 ký tự, ta dừng lại không lấy thêm chương cũ nữa
              break;
            }
            
            // Thêm vào đầu mảng để giữ đúng thứ tự thời gian (cũ -> mới)
            includedChapters.unshift(chText);
            currentLength += chText.length;
          }
          
          ctx += includedChapters.join('');
        }
        setContextString(ctx);
      }
    };
    loadStory();
    
    const savedBg = localStorage.getItem('char_phone_lock_bg');
    if (savedBg) setLockBg(savedBg);
  }, [propStory]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLockBg(result);
        localStorage.setItem('char_phone_lock_bg', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasscodeEnter = (digit: string) => {
    if (passcode.length < 4) {
      const newPass = passcode + digit;
      setPasscode(newPass);
      if (newPass === '1234') {
        setTimeout(() => {
          setIsLocked(false);
          setShowPasscode(false);
          setPasscode('');
        }, 300);
      } else if (newPass.length === 4) {
        setTimeout(() => setPasscode(''), 500);
      }
    }
  };

  const mappedApiSettings = apiSettings ? {
    apiKey: apiSettings.apiKey,
    endpoint: apiSettings.proxyEndpoint || apiSettings.endpoint,
    model: apiSettings.model,
    maxTokens: apiSettings.maxTokens,
    isUnlimited: apiSettings.isUnlimited,
    timeoutMinutes: apiSettings.timeout || apiSettings.timeoutMinutes,
    apiType: apiSettings.apiType
  } : undefined;

  if (!selectedCharacter) {
    return <CharacterList currentStory={currentStory} onSelect={setSelectedCharacter} onBack={onBack} />;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex justify-center items-center">
      {/* Close Button */}
      <button 
        onClick={onBack}
        className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all z-[110] border border-white/20"
        title="Đóng điện thoại"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <div className="w-full h-full max-w-[390px] bg-white relative overflow-hidden shadow-2xl md:rounded-[40px] md:h-[844px] md:border-[8px] md:border-gray-900">
        <AnimatePresence mode="wait">
          {isLocked ? (
            <motion.div 
              key="lockscreen"
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${lockBg})` }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute top-4 left-4 z-20">
                <button onClick={() => setSelectedCharacter(null)} className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md">
                  <ArrowLeft size={20} />
                </button>
              </div>
              
              <label className="absolute top-4 right-4 z-20 p-2 bg-black/20 rounded-full text-white backdrop-blur-md cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                Đổi nền
              </label>

              {!showPasscode ? (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-end pb-12 cursor-pointer"
                  onClick={() => setShowPasscode(true)}
                >
                  <div className="text-white text-center animate-bounce">
                    <ChevronUp size={32} />
                    <p className="text-sm font-medium drop-shadow-md">Vuốt lên để mở</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center pt-20">
                  <h2 className="text-white text-xl mb-6">Nhập mật khẩu (1234)</h2>
                  <div className="flex gap-4 mb-12">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={`w-4 h-4 rounded-full border-2 border-white ${passcode.length > i ? 'bg-white' : 'bg-transparent'}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-6 px-12">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button 
                        key={num} 
                        onClick={() => handlePasscodeEnter(num.toString())}
                        className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl font-light hover:bg-white/30 transition-colors"
                      >
                        {num}
                      </button>
                    ))}
                    <div />
                    <button 
                      onClick={() => handlePasscodeEnter('0')}
                      className="w-16 h-16 rounded-full bg-white/20 text-white text-2xl font-light hover:bg-white/30 transition-colors"
                    >
                      0
                    </button>
                    <button 
                      onClick={() => setShowPasscode(false)}
                      className="w-16 h-16 rounded-full text-white text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <CharacterPhoneHome 
              key="homescreen" 
              character={selectedCharacter} 
              currentStory={currentStory}
              contextString={contextString}
              apiSettings={mappedApiSettings}
              onLock={() => setIsLocked(true)} 
              onBackToList={() => setSelectedCharacter(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
