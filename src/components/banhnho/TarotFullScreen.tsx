import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Image as ImageIcon, Star, Plus, Clock, Trash2, Edit3, X } from 'lucide-react';
import { sendMessageStream, ApiProxySettings } from '../../utils/apiProxy';
import { SmartLoadingBar } from './SmartLoadingBar';
import { saveDraft, loadDraft } from '../../utils/db';

interface TarotFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  bot: any;
  apiSettings: ApiProxySettings;
}

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
} as const;

interface FloatingNote {
  id: string;
  x: number;
  y: number;
  text: string;
}

type HistoryEntry = {
  round: number;
  date: number;
  results: {title: string, content: string}[];
  notes: FloatingNote[]; 
}

export const TarotFullScreen: React.FC<TarotFullScreenProps> = ({ isOpen, onClose, bot, apiSettings }) => {
  const [bgImage, setBgImage] = useState<string>('');
  const [activeTarotId, setActiveTarotId] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [results, setResults] = useState<{title: string, content: string}[]>([]);
  const [notes, setNotes] = useState<FloatingNote[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [historyData, setHistoryData] = useState<Record<number, HistoryEntry[]>>({});

  const [status, setStatus] = useState<'connecting'|'working'|'done'|'error'>('connecting');
  const [tokenCount, setTokenCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (isOpen) {
       loadDraft(`tarot_bg_${bot.name}`).then(res => res && setBgImage(res));
       loadDraft(`tarot_history_${bot.name}`).then(res => res && setHistoryData(res));
    }
  }, [isOpen, bot.name]);

  // Handle saving notes immediately when they change for the current round
  useEffect(() => {
     if (activeTarotId && currentRound && !isReading) {
         setHistoryData(prev => {
             const currentOptHistory = prev[activeTarotId] || [];
             const updatedHistory = currentOptHistory.map(entry => {
                 if (entry.round === currentRound) {
                     return { ...entry, notes: notes };
                 }
                 return entry;
             });
             const newData = { ...prev, [activeTarotId]: updatedHistory };
             saveDraft(`tarot_history_${bot.name}`, newData);
             return newData;
         });
     }
  }, [notes]); // Only trigger when notes change

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         const b64 = reader.result as string;
         setBgImage(b64);
         saveDraft(`tarot_bg_${bot.name}`, b64);
      }
      reader.readAsDataURL(file);
    }
  };

  const tarotOptions = [
    { id: 1, title: '🌷 Xem Tương lai – Điều cần tránh + Phát triển', prompt: 'Dự đoán tương lai BOT CHAR, bài học cuộc đời, cú sốc nhận biết...' },
    { id: 2, title: '🌷 Tarot Tình Yêu', prompt: 'Bot char và người ấy sẽ ra sao, tương lai mối quan hệ, giải mã ngôi sao...' },
    { id: 3, title: '🌷 Tiền Kiếp & Nợ Nghiệp Quả', prompt: 'Tiền kiếp Bot char là ai, nợ nghiệp quả, kiếp trước với người ấy...' },
    { id: 4, title: '🌷 Góc Khuất Tâm Hồn (Shadow Work)', prompt: 'Nỗi sợ hãi sâu thẳm của Bot char, mặt tối, đứa trẻ bên trong...' },
    { id: 5, title: '🌷 Lá Thư Từ Vũ Trụ', prompt: 'Thông điệp khẩn cấp từ vũ trụ, hiệu ứng cánh bướm, bài thánh ca...' }
  ];

  const handleReadTarotNewRound = async (optionId: number) => {
    const option = tarotOptions.find(o => o.id === optionId);
    if(!option) return;

    setActiveTarotId(option.id);
    setIsReading(true);
    setResults([]);
    setNotes([]);
    setStatus('connecting');
    setTokenCount(0);
    setTimeElapsed(0);
    
    // Assign a new round number early to associate notes
    const currentOptHistory = historyData[optionId] || [];
    const newRoundNumber = currentOptHistory.length > 0 ? Math.max(...currentOptHistory.map(h => h.round)) + 1 : 1;
    setCurrentRound(newRoundNumber);

    const timer = setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);

    try {
      const customPrompt = `Hãy xem tarot chủ đề: ${option.title}\nGợi ý: ${option.prompt}\nVui lòng trả về kết quả bằng định dạng Markdown cấu trúc chính xác như sau để hệ thống phần mềm có thể phân giải được:\n\n### Lá Bài 1: Tiêu đề hoặc Tên Lá Bài\n[Nội dung phân tích chi tiết...]\n\n### Lá Bài 2: Tiêu đề hoặc Tên Lá Bài\n[Nội dung phân tích chi tiết...]\n\n[Thêm các lá bài khác nếu muốn, nhưng bắt buộc dùng ba dấu # (###) để chia ranh giới]`;

      const messages = [{ role: 'user', content: customPrompt }] as any;
      const characterInfo = `Name: ${bot.name}\nRole: ${bot.occupation}\nPersonality: ${bot.personality}`;
      
      const stream = sendMessageStream(apiSettings, messages, characterInfo);
      
      let fullText = "";
      setStatus('working');
      
      let chunkCount = 0;
      for await (const chunk of stream) {
         fullText += chunk.text;
         chunkCount += Math.ceil(chunk.text.length / 3.5);
         setTokenCount(chunkCount);
      }
      
      const splits = fullText.split('### ').filter(s => s.trim().length > 0);
      let parsedResults = [];
      
      parsedResults = splits.map((s, i) => {
        const lines = s.trim().split('\n');
        if (lines.length === 1 && splits.length === 1) {
            return { title: 'Thông điệp', content: s.trim() };
        }
        const title = lines[0].replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
        const content = lines.slice(1).join('\n').trim();
        return {
          title: title || `Thông điệp ${i + 1}`,
          content: content || '[Không rõ nội dung]'
        };
      });
      
      if (parsedResults.length === 0) {
          parsedResults = [{ title: 'Dự đoán tổng quan', content: fullText }];
      }

      setResults(parsedResults);
      setStatus('done');

      // Save to history round with empty notes initially
      const newHistoryEntry: HistoryEntry = {
         round: newRoundNumber,
         date: Date.now(),
         results: parsedResults,
         notes: []
      };
      
      const newData = {
         ...historyData,
         [optionId]: [...currentOptHistory, newHistoryEntry]
      };
      setHistoryData(newData);
      saveDraft(`tarot_history_${bot.name}`, newData);
      
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      clearInterval(timer);
      setIsReading(false);
    }
  };

  const handleOpenHistory = (optionId: number, entry: HistoryEntry) => {
     setActiveTarotId(optionId);
     setCurrentRound(entry.round);
     setResults(entry.results);
     setNotes(entry.notes || []);
     setIsReading(false);
     setStatus('done');
  };

  const deleteHistoryEntry = (optionId: number, roundToDel: number) => {
     if(!confirm("Xóa thẻ đợt này?")) return;
     const current = historyData[optionId] || [];
     const filtered = current.filter(h => h.round !== roundToDel);
     const newData = {...historyData, [optionId]: filtered};
     setHistoryData(newData);
     saveDraft(`tarot_history_${bot.name}`, newData);
     if (activeTarotId === optionId && currentRound === roundToDel) {
        setActiveTarotId(null);
        setCurrentRound(null);
        setResults([]);
        setNotes([]);
     }
  }

  // --- Note Logic ---
  const handleAddNote = () => {
    if (activeTarotId === null || isReading) return;
    const newNote: FloatingNote = {
      id: Date.now().toString(),
      x: window.innerWidth / 2 - 100, // Roughly center horizontally
      y: window.scrollY + window.innerHeight / 2 - 50, // Roughly center screen vertically
      text: "Viết ghi chú ở đây..."
    };
    setNotes([...notes, newNote]);
  }

  const updateNoteText = (id: string, text: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, text } : n));
  };

  const updateNotePosition = (id: string, x: number, y: number) => {
    setNotes(notes.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const removeNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           key="tarot-screen"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.3 }}
           className="fixed inset-0 z-[1200] overflow-y-auto overflow-x-hidden"
           style={{ 
             backgroundColor: bgImage ? 'transparent' : '#F9C6D4',
             backgroundImage: bgImage ? `url(${bgImage})` : 'none',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundAttachment: 'fixed'
           }}
           ref={containerRef}
        >
          {bgImage && <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />}

          <div className="fixed top-4 left-4 z-50 flex gap-2 overflow-x-auto max-w-[90vw] pb-2 scrollbar-hide">
             <button onClick={onClose} className="bg-white/80 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-[#b498a5] shadow-md border hover:bg-white transition-all whitespace-nowrap">
               ← Ra ngoài
             </button>
             {activeTarotId !== null && !isReading && (
                <button onClick={() => {setActiveTarotId(null); setCurrentRound(null); setResults([]); setNotes([]);}} className="bg-white/80 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-[#b498a5] shadow-md border hover:bg-white transition-all whitespace-nowrap">
                  ⟲ Về chọn đợt
                </button>
             )}
             <label className="bg-white/80 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-[#b498a5] shadow-md border hover:bg-white cursor-pointer flex items-center gap-2 transition-all whitespace-nowrap">
               <ImageIcon size={16}/> Đổi nền
               <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload}/>
             </label>
             {activeTarotId !== null && !isReading && (
                <button onClick={handleAddNote} className="bg-[#FFF5FB]/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-[#E598A6] shadow-md border border-[#F9C6D4] hover:bg-white flex items-center gap-2 transition-all whitespace-nowrap">
                  <Edit3 size={16}/> Thêm Note
                </button>
             )}
          </div>

          {/* Render Floating Notes */}
          {activeTarotId !== null && !isReading && notes.map(note => (
            <motion.div
              key={note.id}
              drag
              dragMomentum={false}
              onDragEnd={(e, info) => updateNotePosition(note.id, note.x + info.offset.x, note.y + info.offset.y)}
              style={{ x: note.x, y: note.y }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute z-[100] w-64 shadow-xl group"
            >
               <div className="bg-[#FFF5FB]/90 backdrop-blur-md rounded-2xl border-2 border-[#F9C6D4] overflow-hidden">
                 <div className="bg-[#F9C6D4]/30 h-6 flex justify-between items-center px-2 cursor-grab active:cursor-grabbing">
                   <div className="flex gap-1">
                     <span className="w-2 h-2 rounded-full bg-[#E598A6]"></span>
                     <span className="w-2 h-2 rounded-full bg-[#E598A6]"></span>
                     <span className="w-2 h-2 rounded-full bg-[#E598A6]"></span>
                   </div>
                   <button onClick={() => removeNote(note.id)} className="text-[#b498a5] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                   </button>
                 </div>
                 <textarea 
                    className="w-full bg-transparent p-3 text-sm font-bold text-[#8A7D85] placeholder-[#c3b6bf] resize-none focus:outline-none min-h-[100px]"
                    value={note.text}
                    onChange={(e) => updateNoteText(note.id, e.target.value)}
                    placeholder="Viết ghi chú..."
                 />
               </div>
            </motion.div>
          ))}

          <div className="pt-24 p-6 min-h-full relative z-10 pointer-events-none">
             <div className="max-w-3xl mx-auto pointer-events-auto">
                <h1 className="text-3xl font-bold text-center text-white drop-shadow-xl mb-8 tracking-widest" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  🔮 Tarot Cho {bot.name}
                </h1>
                
                {activeTarotId === null && !isReading && (
                  <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
                    {tarotOptions.map((opt) => {
                       const optHistory = historyData[opt.id] || [];
                       return (
                         <motion.div whileHover={{ scale: 1.02 }} key={opt.id} className="bg-white/95 backdrop-blur-md p-5 rounded-[2rem] border border-[#F9C6D4] shadow-xl">
                            <h2 className="font-bold text-[#b498a5] text-lg mb-4 text-center">{opt.title}</h2>
                            <button 
                              onClick={() => handleReadTarotNewRound(opt.id)}
                              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFF5FB] to-[#FDE2E4] p-3 rounded-2xl border border-[#F9C6D4] shadow-sm hover:shadow-md transition-all text-[#E598A6] font-bold mb-4"
                            >
                              <Plus size={20}/> Trải bài Bắt đầu
                            </button>

                            {optHistory.length > 0 && (
                               <div className="grid grid-cols-2 gap-3 mt-2">
                                  {optHistory.map(entry => (
                                     <div key={entry.round} className="relative group">
                                       <button 
                                          onClick={() => handleOpenHistory(opt.id, entry)}
                                          className="w-full flex items-center gap-2 bg-white p-3 rounded-xl border border-[#F9C6D4] text-xs text-[#8A7D85] font-bold hover:bg-[#FFF5FB] transition shadow-sm text-left opacity-90 group-hover:opacity-100"
                                       >
                                          <Clock size={16} className="text-[#F9C6D4] shrink-0" /> 
                                          <span className="truncate">Thẻ Đợt {entry.round}</span>
                                       </button>
                                       <button onClick={(e) => { e.stopPropagation(); deleteHistoryEntry(opt.id, entry.round); }} className="absolute -top-2 -right-2 bg-white text-red-400 rounded-full p-1.5 opacity-0 group-hover:opacity-100 shadow-md transform scale-90 group-hover:scale-100 transition-all border border-[#F9C6D4] z-20">
                                          <Trash2 size={12}/>
                                       </button>
                                     </div>
                                  ))}
                               </div>
                            )}
                         </motion.div>
                       )
                    })}
                  </div>
                )}

                {isReading && (
                  <div className="max-w-2xl mx-auto">
                    <SmartLoadingBar 
                      status={status} 
                      tokenCount={tokenCount} 
                      timeElapsed={timeElapsed} 
                      speed={timeElapsed > 0 ? Math.round(tokenCount / timeElapsed) : 0} 
                      targetTokens={19000} 
                    />
                  </div>
                )}

                {!isReading && activeTarotId !== null && results.length > 0 && (
                  <div className="mt-8 max-w-2xl mx-auto flex flex-col gap-6">
                    {results.map((res, i) => (
                      <motion.div
                        key={i}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.2 }}
                        variants={cardVariants}
                        className="bg-[#FAF9F6]/95 border border-[#F9C6D4] rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                           <Star size={64} className="text-[#F9C6D4]" />
                        </div>
                        <h3 className="text-[#E598A6] font-bold text-xl mb-4 flex items-center gap-2 relative z-10"><Star size={20} className="fill-[#F9C6D4]"/> {res.title}</h3>
                        <div className="text-[#5A5A5A] leading-[1.8] whitespace-pre-wrap font-medium relative z-10 text-sm">{res.content}</div>
                      </motion.div>
                    ))}
                    
                    <div className="text-center mt-4">
                      <p className="text-white drop-shadow-md text-sm font-bold opacity-80">
                         (Bạn có thể nhấn nút "Thêm Note" ở góc trái trên để ghim nhật ký / bùa chú lên ảnh nhé 💕)
                      </p>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
