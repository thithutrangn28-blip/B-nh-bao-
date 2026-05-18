import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Image as ImageIcon, Camera, User, Heart, Star, Sun, Moon, Instagram, MoreHorizontal, Settings, Edit3, Save, X, ChevronRight, MessageCircle, Info } from 'lucide-react';
import { saveBackground, loadBackgrounds, saveDraft, loadDraft } from '../../utils/db';
import { compressImage } from '../../utils/imageUtils';

interface RoleplayIntroProps {
  bot: any;
  onEnterChat: () => void;
  onBack: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 100,
    scale: 0.8,
    rotateX: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
} as const;

const ScrollRevealSection = ({ children, id }: { children: React.ReactNode, id: string }) => {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
      variants={containerVariants}
      className="min-h-screen w-full relative flex flex-col items-center justify-center py-20 px-4 scroll-mt-0"
    >
      {children}
    </motion.section>
  );
};

const ScrollRevealCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <motion.div variants={cardVariants} className={className}>
      {children}
    </motion.div>
  );
};

const BackgroundPickerButton = ({ onSelect, position = 'top-right' }: { onSelect: () => void, position?: 'top-right' | 'top-left' }) => {
  const positionStyles = {
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' },
  };

  return (
    <button
      onClick={onSelect}
      className="absolute z-[100] w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
      style={{
        backgroundColor: 'rgba(255, 240, 245, 0.85)',
        border: '1.5px dotted #F9C6D4',
        ...positionStyles[position],
      }}
      title="Đổi hình nền"
    >
      <ImageIcon size={18} className="text-[#F3B4C2]" />
    </button>
  );
};

const PillTag = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-block px-3 py-1 bg-[rgba(255,245,251,0.90)] border-[1.5px] border-dotted border-[#F9C6D4] rounded-full text-xs text-[#A65D7B] m-1"
  >
    [ {children} ]
  </span>
);

const Y2KWindow = ({ title, children, style = {}, className = "" }: { title: string, children: React.ReactNode, style?: React.CSSProperties, className?: string }) => (
  <div
    className={`flex flex-col overflow-hidden ${className}`}
    style={{
      backgroundColor: 'rgba(250, 249, 246, 0.85)',
      border: '2px solid #F9C6D4',
      borderRadius: '16px',
      boxShadow: '4px 4px 0px rgba(241, 163, 184, 0.4)',
      ...style,
    }}
  >
    <div
      className="bg-[#F9C6D4] px-2 py-1 flex justify-between items-center rounded-t-[14px]"
    >
      <span className="text-[12px] font-bold text-white uppercase tracking-wider">
        {title}
      </span>
      <div className="flex gap-1">
        <div className="w-2.5 h-2.5 rounded-full border border-white opacity-60" />
        <div className="w-2.5 h-2.5 rounded-full border border-white opacity-80" />
        <div className="w-2.5 h-2.5 rounded-full border border-white" />
      </div>
    </div>
    <div className="p-3 flex-1 overflow-auto">
      {children}
    </div>
  </div>
);

export const RoleplayIntro: React.FC<RoleplayIntroProps> = ({ bot, onEnterChat, onBack }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [introBgs, setIntroBgs] = useState<Record<string, string>>({});
  const [introData, setIntroData] = useState<any>(null);
  const [selectedNpc, setSelectedNpc] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeBgSection = useRef<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const bId = bot.id || bot.name;
      const bgs = await loadBackgrounds();
      const data = await loadDraft(`intro_data_${bId}`);
      
      setIntroBgs({
        o5: bgs[`intro_bg_${bId}_o5`] || '',
        o6: bgs[`intro_bg_${bId}_o6`] || '',
        o7: bgs[`intro_bg_${bId}_o7`] || '',
        o8: bgs[`intro_bg_${bId}_o8`] || '',
      });

      if (data) {
        setIntroData(data);
      } else {
        setIntroData({
          o5: {
            friends: [
              { id: 1, name: 'Rikka-chan', avatar: 'https://picsum.photos/seed/npc1/100', bio: 'Bạn thân nhất, thích ăn kem.' },
              { id: 2, name: 'Sora', avatar: 'https://picsum.photos/seed/npc2/100', bio: 'Người bí ẩn thường xuất hiện lúc hoàng hôn.' }
            ],
            mainTitle: 'Main.exe',
            aboutTitle: 'About_Me.txt',
            tags: ['Thích ăn bánh', 'Dạo này béo lên', 'Nhăm nhăm'],
            vibe: 'Tâm trạng hôm nay: Hơi mơ mộng một chút, muốn đi dạo dưới tán anh đào và nghe nhạc Lo-fi...'
          },
          o6: {
            heroTitle: 'GIRL LIKE PINK',
            textQuote: 'the kind of peace I never knew I needed until I met you.',
            moodLabel: 'owserae mood',
            moodScore: 7.9,
            coverUrl: bot.coverUrl || 'https://picsum.photos/seed/cover/800/400'
          },
          o7: {
            editoraName: 'BE TI',
            babyTag: '- BABY',
            introText: 'EM UM MUNDO ONDE A REALIDADE SE DISSOLVE EM SONHOS, EU ME REVELO. O AMOR É O TEATRO E EU SOU A ATRIZ PRINCIPAL.',
            editedBy: 'EDIT BETH',
            createdBy: '@O_NL44',
            elements: {
              sun_icon: true,
              butterfly_icon: true,
              moon_icon: true,
              stars_and_sparkles: true,
              hair_flowers_integration: true
            }
          },
          o8: {
            posts: 12,
            followers: '1.2k',
            following: 85,
            bio: '⋆ ˚｡⋆୨୧˚ bio aesthetic ˚୨୧⋆｡˚ ⋆\nJust a dreamer living in a pastel world. 🎀✨\nI love soft things and long conversations.',
            highlights: [
              { id: 1, label: 'Memory', cover: 'https://picsum.photos/seed/h1/100' },
              { id: 2, label: 'Mood', cover: 'https://picsum.photos/seed/h2/100' },
              { id: 3, label: 'Daily', cover: 'https://picsum.photos/seed/h3/100' }
            ],
            openingCover: bot.avatar || 'https://picsum.photos/seed/post/800/800',
            openingStory: bot.intro || 'Câu chuyện bắt đầu vào một buổi chiều rực nắng...'
          }
        });
      }
    };
    loadData();
  }, [bot]);

  const handleSaveData = async () => {
    const bId = bot.id || bot.name;
    await saveDraft(`intro_data_${bId}`, introData);
    setIsEditMode(false);
  };

  const handleBgSelect = (section: string) => {
    activeBgSection.current = section;
    fileInputRef.current?.click();
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeBgSection.current) {
      const base64 = await compressImage(file);
      const bId = bot.id || bot.name;
      const key = `intro_bg_${bId}_${activeBgSection.current}`;
      await saveBackground(key, base64);
      setIntroBgs(prev => ({ ...prev, [activeBgSection.current!]: base64 }));
      activeBgSection.current = null;
      e.target.value = '';
    }
  };

  if (!introData) return null;

  return (
    <div 
      className="w-full h-full bg-[#FFF5FB] overflow-y-auto overflow-x-hidden scroll-smooth relative"
      style={{ perspective: '1200px' }}
    >
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />

      {/* Floating Controls */}
      <div className="fixed top-4 left-4 z-[200] flex gap-2">
        <button 
          onClick={onBack}
          className="bg-white/85 p-3 rounded-full text-[#F3B4C2] shadow-md border border-[#F9C6D4] hover:scale-110 active:scale-95 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        <button 
          onClick={() => setIsEditMode(!isEditMode)}
          className="bg-white/85 p-4 rounded-full text-[#F3B4C2] shadow-xl border border-[#F9C6D4] hover:scale-110 active:scale-95 transition-all"
        >
          {isEditMode ? <Save size={24} onClick={handleSaveData} /> : <Edit3 size={24} />}
        </button>
        <button 
          onClick={onEnterChat}
          className="bg-gradient-to-br from-[#F9C6D4] to-[#F3B4C2] px-6 py-3 rounded-full text-white font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>Vào Roleplay</span>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Section O5: Dashboard Y2K */}
      <ScrollRevealSection id="o5">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: introBgs.o5 ? `url(${introBgs.o5})` : 'none' }}
        >
          <div className="absolute inset-0 bg-[#F9C6D4] opacity-10" />
        </div>
        <BackgroundPickerButton onSelect={() => handleBgSelect('o5')} />

        <div className="relative z-10 w-full max-w-4xl mx-auto h-full min-h-[80vh] flex flex-col items-center justify-center gap-8">
          {/* Main Avatar Window */}
          <ScrollRevealCard className="z-20">
            <Y2KWindow title={isEditMode ? "Tên tệp:" : introData.o5.mainTitle} style={{ width: 'min(90vw, 350px)' }}>
              {isEditMode ? (
                <input 
                  className="w-full bg-transparent border-b border-dashed border-[#F3B4C2] outline-none text-xs mb-2"
                  value={introData.o5.mainTitle}
                  onChange={e => setIntroData({ ...introData, o5: { ...introData.o5, mainTitle: e.target.value } })}
                />
              ) : null}
              <div className="aspect-square w-full border border-dotted border-[#F9C6D4] rounded-lg overflow-hidden relative group">
                <img src={bot.avatar} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 opacity-30 group-hover:opacity-100 transition-opacity">
                  <Star size={16} className="text-[#F9C6D4] fill-[#F9C6D4]" />
                </div>
              </div>
            </Y2KWindow>
          </ScrollRevealCard>

          {/* Friends Sidebar */}
          <div className="w-full flex flex-col md:flex-row gap-6 md:absolute md:inset-0 pointer-events-none">
            <ScrollRevealCard className="pointer-events-auto md:absolute md:left-4 md:top-20">
              <Y2KWindow title="(♡) Friends" style={{ width: 'min(90vw, 250px)' }}>
                <div className="space-y-3">
                  {introData.o5.friends.map((npc: any) => (
                    <div key={npc.id} className="flex items-center gap-3 bg-[rgba(255,255,255,0.4)] p-2 rounded-xl border border-transparent hover:border-[#F9C6D4] transition-all">
                      <img src={npc.avatar} className="w-8 h-8 rounded-full border border-[#F9C6D4]" />
                      <span className="text-xs font-bold text-[#8A7D85]">{npc.name}</span>
                      <button 
                        onClick={() => setSelectedNpc(npc)}
                        className="ml-auto text-[#F9C6D4] hover:scale-125 transition-transform"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </Y2KWindow>
            </ScrollRevealCard>

            {/* Intro & Tags Widget */}
            <ScrollRevealCard className="pointer-events-auto md:absolute md:right-4 md:top-10">
              <div className="bg-[rgba(255,240,245,0.85)] border-[1.5px] border-[#F9C6D4]/60 rounded-[20px] p-5 shadow-lg max-w-[280px]">
                <h3 className="text-[#A65D7B] font-serif font-bold text-lg mb-2">{bot.name}</h3>
                <p className="text-[#5A5A5A] text-xs leading-relaxed mb-4">{bot.about?.slice(0, 100)}...</p>
                <div className="flex flex-wrap gap-1">
                  {introData.o5.tags.map((tag: string, i: number) => (
                    <PillTag key={i}>{tag}</PillTag>
                  ))}
                </div>
              </div>
            </ScrollRevealCard>

            {/* Vibe & Mood Board */}
            <ScrollRevealCard className="pointer-events-auto md:absolute md:left-10 md:bottom-10">
              <Y2KWindow title="Vibe_Board.exe" style={{ width: 'min(90vw, 280px)' }}>
                {isEditMode ? (
                  <textarea 
                    className="w-full bg-transparent border-none outline-none text-sm text-[#5A5A5A] italic min-h-[100px] resize-none"
                    value={introData.o5.vibe}
                    onChange={e => setIntroData({ ...introData, o5: { ...introData.o5, vibe: e.target.value } })}
                  />
                ) : (
                  <p className="text-sm text-[#5A5A5A] italic leading-relaxed font-serif">
                    {introData.o5.vibe}
                  </p>
                )}
              </Y2KWindow>
            </ScrollRevealCard>
          </div>
        </div>
      </ScrollRevealSection>

      {/* Section O6: Bento Grid Coquette */}
      <ScrollRevealSection id="o6">
        <div 
          className="absolute inset-0 z-0 bg-[#FFF5FB] transition-all duration-700"
          style={{ backgroundImage: introBgs.o6 ? `url(${introBgs.o6})` : 'none', backgroundSize: 'cover' }}
        />
        <BackgroundPickerButton onSelect={() => handleBgSelect('o6')} />

        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col gap-6">
          {/* Hero Section */}
          <ScrollRevealCard>
            <div className="relative w-full h-64 bg-[#D6869F] rounded-tl-3xl rounded-br-[80px] overflow-hidden shadow-xl border-2 border-white/50">
              <img 
                src={introData.o6.coverUrl} 
                className="w-full h-full object-cover opacity-90 transition-transform duration-1000 hover:scale-110" 
              />
              <div className="absolute bottom-4 right-4 bg-white/20 px-4 py-2 rounded-2xl">
                <h1 className="text-2xl md:text-3xl font-serif text-[#FFF5FB] tracking-[0.2em] uppercase">
                  {isEditMode ? (
                    <input 
                      className="bg-transparent border-b border-white outline-none w-48"
                      value={introData.o6.heroTitle}
                      onChange={e => setIntroData({ ...introData, o6: { ...introData.o6, heroTitle: e.target.value } })}
                    />
                  ) : introData.o6.heroTitle}
                </h1>
              </div>
            </div>
          </ScrollRevealCard>

          {/* Grid Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Text Widget */}
            <ScrollRevealCard>
              <div className="bg-[#EABDD0] rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[180px] border-2 border-white/30">
                {isEditMode ? (
                  <textarea 
                    className="w-full bg-transparent border-none outline-none text-white text-center italic text-sm placeholder-white/70"
                    value={introData.o6.textQuote}
                    onChange={e => setIntroData({ ...introData, o6: { ...introData.o6, textQuote: e.target.value } })}
                  />
                ) : (
                  <p className="text-white text-center italic text-sm leading-relaxed font-serif">
                    "{introData.o6.textQuote}"
                  </p>
                )}
                <div className="mt-4 w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow-md">
                  <img src={bot.avatar} className="w-full h-full object-cover" />
                </div>
              </div>
            </ScrollRevealCard>

            {/* Mood Widget */}
            <ScrollRevealCard>
              <div className="bg-[#D6869F] rounded-3xl p-6 shadow-xl flex flex-col justify-center min-h-[180px] relative border-2 border-white/30">
                <p className="text-white/80 text-xs uppercase tracking-widest font-light mb-2">{introData.o6.moodLabel}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white font-serif">
                    {isEditMode ? (
                      <input 
                        type="number" step="0.1"
                        className="bg-transparent border-b border-white outline-none w-20"
                        value={introData.o6.moodScore}
                        onChange={e => setIntroData({ ...introData, o6: { ...introData.o6, moodScore: parseFloat(e.target.value) } })}
                      />
                    ) : introData.o6.moodScore}
                  </span>
                  <span className="text-lg text-white/70">/ 10</span>
                </div>
                <button className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-white text-2xl hover:bg-white/50 transition-all border border-white/20">
                  +
                </button>
              </div>
            </ScrollRevealCard>
          </div>
        </div>
      </ScrollRevealSection>

      {/* Section O7: Split-Screen Nano Banana */}
      <ScrollRevealSection id="o7">
        <div 
          className="absolute inset-0 z-0 bg-[#FFF0F5] transition-all duration-700"
          style={{ backgroundImage: introBgs.o7 ? `url(${introBgs.o7})` : 'none', backgroundSize: 'cover' }}
        />
        <BackgroundPickerButton onSelect={() => handleBgSelect('o7')} />

        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-12 bg-[rgba(255,240,245,0.85)] p-8 md:p-12 rounded-[40px] border border-white/60 shadow-2xl overflow-hidden min-h-[80vh]">
          {/* Left Content (70%) */}
          <div className="flex-[7] flex flex-col gap-6">
            <ScrollRevealCard>
              <p className="text-[10px] font-black text-[#A65D7B] tracking-[0.2em] mb-2 uppercase">
                {introData.o7.editedBy}
              </p>
              {introData.o7.elements.sun_icon && (
                <div className="mb-4">
                  <Sun size={40} className="text-[#A65D7B] stroke-[1px] fill-[#F9C6D4]/30" />
                </div>
              )}
              <p className="text-xs text-[#A65D7B] tracking-widest font-bold">EDITORA</p>
              <h1 className="text-7xl md:text-8xl font-serif text-[#A65D7B] font-black -ml-1 transition-all">
                {isEditMode ? (
                  <input 
                    className="bg-transparent border-b border-[#A65D7B] outline-none"
                    value={introData.o7.editoraName}
                    onChange={e => setIntroData({ ...introData, o7: { ...introData.o7, editoraName: e.target.value } })}
                  />
                ) : introData.o7.editoraName}
              </h1>
              
              <div className="flex items-center gap-4 mt-2">
                <span className="text-4xl font-serif text-[#A65D7B]">&</span>
                {introData.o7.elements.butterfly_icon && (
                  <Heart size={32} className="text-[#A65D7B] fill-[#A65D7B]/20 animate-pulse" />
                )}
              </div>

              <p className="text-2xl font-serif text-[#A65D7B] italic">
                {isEditMode ? (
                  <input 
                    className="bg-transparent border-b border-[#A65D7B] outline-none"
                    value={introData.o7.babyTag}
                    onChange={e => setIntroData({ ...introData, o7: { ...introData.o7, babyTag: e.target.value } })}
                  />
                ) : introData.o7.babyTag}
              </p>

              <div className="mt-8 max-w-sm">
                {isEditMode ? (
                  <textarea 
                    className="w-full bg-transparent border-none outline-none text-xs text-[#8C8C8C] uppercase leading-loose font-bold min-h-[120px]"
                    value={introData.o7.introText}
                    onChange={e => setIntroData({ ...introData, o7: { ...introData.o7, introText: e.target.value } })}
                  />
                ) : (
                  <p className="text-xs text-[#8C8C8C] uppercase leading-loose font-bold tracking-wider">
                    {introData.o7.introText}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-8 flex items-center gap-4 border-t border-[rgba(166,93,123,0.1)]">
                <p className="text-[9px] text-[#A65D7B]/60 font-black tracking-widest">
                  ALL RIGHTS RESERVED · {introData.o7.createdBy}
                </p>
              </div>
            </ScrollRevealCard>
          </div>

          {/* Right Image (30%) */}
          <div className="flex-[3] relative min-h-[400px]">
             <ScrollRevealCard className="h-full w-full">
                <div 
                  className="h-full w-full rounded-[30px] overflow-hidden border-4 border-white bg-[#F9C6D4]/30 relative"
                  style={{
                    clipPath: 'inset(10% 0% 15% 0%)'
                  }}
                >
                  <img 
                    src={bot.avatar} 
                    className="w-full h-full object-cover transition-all duration-1000 scale-105 hover:scale-125" 
                  />
                  {/* Decorative Overlays */}
                  {introData.o7.elements.moon_icon && (
                    <div className="absolute top-4 left-4">
                      <Moon size={24} className="text-white fill-white/40" />
                    </div>
                  )}
                  {introData.o7.elements.stars_and_sparkles && (
                    <div className="absolute inset-0 pointer-events-none">
                       {[...Array(5)].map((_, i) => (
                         <div key={i} className="absolute animate-pulse" style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%` }}>
                           <Star size={12} className="text-white fill-white" />
                         </div>
                       ))}
                    </div>
                  )}
                </div>
             </ScrollRevealCard>
          </div>
        </div>
      </ScrollRevealSection>

      {/* Section O8: Instagram Profile Layout */}
      <ScrollRevealSection id="o8">
        <div 
          className="absolute inset-0 z-0 bg-[#FFF5FB] transition-all duration-700"
          style={{ backgroundImage: introBgs.o8 ? `url(${introBgs.o8})` : 'none', backgroundSize: 'cover' }}
        />
        <BackgroundPickerButton onSelect={() => handleBgSelect('o8')} />

        <div className="relative z-10 w-full max-w-2xl mx-auto bg-[rgba(255,255,255,0.85)] rounded-[40px] shadow-2xl border border-white/60 overflow-hidden pb-12">
          {/* IG Header */}
          <div className="flex items-center gap-8 p-8 md:p-10">
            <ScrollRevealCard>
              <div className="w-24 h-24 p-1 rounded-full bg-gradient-to-tr from-[#FAD4E5] via-[#F4C2D7] to-[#EABDD0]">
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden shadow-inner">
                  <img src={bot.avatar} className="w-full h-full object-cover" />
                </div>
              </div>
            </ScrollRevealCard>

            <ScrollRevealCard className="flex flex-1 justify-around text-center gap-4">
              <div>
                <p className="text-xl font-serif font-bold text-[#5A5A5A]">{introData.o8.posts}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#8C8C8C] font-bold">Posts</p>
              </div>
              <div>
                <p className="text-xl font-serif font-bold text-[#5A5A5A]">{introData.o8.followers}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#8C8C8C] font-bold">Followers</p>
              </div>
              <div>
                <p className="text-xl font-serif font-bold text-[#5A5A5A]">{introData.o8.following}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#8C8C8C] font-bold">Following</p>
              </div>
            </ScrollRevealCard>
          </div>

          {/* Bio section */}
          <ScrollRevealCard className="px-8 md:px-12 mb-8">
            <p className="font-serif italic text-[#D8A7B1] text-center text-sm mb-3">⋆ ˚｡⋆୨୧˚ bio aesthetic ˚୨୧⋆｡˚ ⋆</p>
            {isEditMode ? (
              <textarea 
                className="w-full bg-transparent border-none outline-none text-center text-sm text-[#5A5A5A] leading-relaxed font-serif min-h-[80px]"
                value={introData.o8.bio}
                onChange={e => setIntroData({ ...introData, o8: { ...introData.o8, bio: e.target.value } })}
              />
            ) : (
              <p className="text-center text-sm text-[#5A5A5A] leading-relaxed font-serif whitespace-pre-wrap">
                {introData.o8.bio}
              </p>
            )}
          </ScrollRevealCard>

          {/* Highlights */}
          <ScrollRevealCard className="flex gap-4 px-8 md:px-12 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            {introData.o8.highlights.map((h: any) => (
              <div key={h.id} className="flex flex-col items-center flex-shrink-0 group pointer-events-auto">
                <div className="w-16 h-16 rounded-full border-2 border-[#F9C6D4] p-1 group-hover:scale-110 transition-transform cursor-pointer">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img src={h.cover} className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-[10px] text-[#8C8C8C] mt-2 font-bold uppercase">{h.label}</span>
              </div>
            ))}
          </ScrollRevealCard>

          {/* Main Story Post */}
          <ScrollRevealCard className="mx-8 md:mx-12 p-6 bg-[rgba(255,240,245,0.85)] border border-[#F9C6D4]/40 rounded-3xl shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F3B4C2] flex items-center justify-center text-white">
                  <Heart size={14} fill="white" />
                </div>
                <span className="text-sm font-serif font-black text-[#A65D7B]">Opening Story</span>
             </div>
             
             {isEditMode && (
               <div className="mb-4">
                 <label className="text-[10px] text-[#A65D7B] uppercase block mb-1">Ảnh bìa câu chuyện</label>
                 <input 
                   type="text"
                   className="w-full bg-white/50 border border-[#F9C6D4] rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-[#F3B4C2]"
                   value={introData.o8.openingCover}
                   onChange={e => setIntroData({ ...introData, o8: { ...introData.o8, openingCover: e.target.value } })}
                   placeholder="Dán URL ảnh vào đây..."
                 />
               </div>
             )}
             
             {introData.o8.openingCover && (
               <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 shadow-sm border border-white">
                  <img src={introData.o8.openingCover} className="w-full h-full object-cover" />
               </div>
             )}

             <div className="space-y-4">
                <div className="flex gap-4 mb-2">
                   <Heart size={20} className="text-[#A65D7B]" />
                   <MessageCircle size={20} className="text-[#A65D7B]/60" />
                   <ImageIcon size={20} className="ml-auto text-[#A65D7B]" />
                </div>
                {isEditMode ? (
                  <textarea 
                    className="w-full bg-transparent border-none outline-none text-sm text-[#5A5A5A] leading-[1.8] font-serif min-h-[200px]"
                    value={introData.o8.openingStory}
                    onChange={e => setIntroData({ ...introData, o8: { ...introData.o8, openingStory: e.target.value } })}
                  />
                ) : (
                  <p className="text-sm text-[#5A5A5A] leading-[1.8] font-serif">
                    {introData.o8.openingStory}
                  </p>
                )}
             </div>
          </ScrollRevealCard>
        </div>
      </ScrollRevealSection>

      {/* NPC Modal */}
      <AnimatePresence>
        {selectedNpc && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNpc(null)}
              className="absolute inset-0 bg-black/40"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-[rgba(250,249,246,0.95)] w-full max-w-md rounded-3xl shadow-2xl border-2 border-[#F9C6D4] overflow-hidden relative z-10"
            >
               <div className="h-40 bg-[#F9C6D4] relative">
                  <button 
                    onClick={() => setSelectedNpc(null)}
                    className="absolute top-4 right-4 bg-white/50 p-2 rounded-full hover:bg-white transition-all"
                  >
                    <X size={20} className="text-[#A65D7B]" />
                  </button>
                  <div className="absolute -bottom-10 left-8">
                     <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                        <img src={selectedNpc.avatar} className="w-full h-full object-cover" />
                     </div>
                  </div>
               </div>
               <div className="pt-14 pb-8 px-8">
                  <h2 className="text-2xl font-serif font-black text-[#A65D7B] mb-2">{selectedNpc.name}</h2>
                  <div className="inline-block px-3 py-1 bg-[#F9C6D4]/20 rounded-full text-[10px] font-bold text-[#A65D7B] uppercase tracking-widest mb-6">Friend / NPC</div>
                  <p className="text-[#5A5A5A] text-sm leading-relaxed font-serif italic border-l-2 border-[#F9C6D4] pl-4">
                    "{selectedNpc.bio}"
                  </p>
                  
                  <div className="mt-8 flex gap-3">
                    <button className="flex-1 bg-[#F3B4C2] text-white py-3 rounded-2xl font-bold font-serif hover:shadow-lg transition-all active:scale-95 shadow-md">
                      Trò chuyện
                    </button>
                    <button className="p-3 bg-white border-2 border-[#F9C6D4] rounded-2xl text-[#F3B4C2]">
                      <Heart size={20} />
                    </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

const ArrowLeft = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
);
