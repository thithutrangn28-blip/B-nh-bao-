import { useState, useEffect } from 'react';
import { Plus, Menu, Image as ImageIcon, X, ChevronLeft, Upload, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatScreen from './ChatScreen';
import { saveToDB, getFromDB } from '../utils/indexedDB';
import { compressImage } from '../utils/imageUtils';

interface Prompt {
  id: string;
  title: string;
  avatarUrl: string;
  context: string;
  rules: string;
  length: string;
  ooc: string;
}

export default function KokoScreen({ onBack }: { onBack: () => void }) {
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const saved = localStorage.getItem('koko_prompts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse prompts", e);
      }
    }
    return [
      {
        id: '1',
        title: '🎀 Luật Nhân Vật Yandere',
        avatarUrl: 'https://i.pinimg.com/236x/c5/4c/a3/c54ca3365ce18aef180554157b8fb5ba.jpg',
        context: '',
        rules: '',
        length: '',
        ooc: ''
      },
      {
        id: '2',
        title: '✧ Tiểu thuyết thanh xuân',
        avatarUrl: 'https://i.pinimg.com/236x/8e/08/7b/8e087b7a2bb036329a738fa7b2a95c52.jpg',
        context: '',
        rules: '',
        length: '',
        ooc: ''
      }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeChatPrompt, setActiveChatPrompt] = useState<Prompt | null>(null);
  const [appBackground, setAppBackground] = useState('');

  useEffect(() => {
    const loadBg = async () => {
      const saved = await getFromDB('backgrounds', 'koko_bg');
      if (saved) setAppBackground(saved);
      else {
        const legacy = localStorage.getItem('koko_bg');
        if (legacy) {
          setAppBackground(legacy);
          await saveToDB('backgrounds', 'koko_bg', legacy);
          localStorage.removeItem('koko_bg');
        }
      }
    };
    loadBg();
  }, []);

  // Form state
  const [avatarUrl, setAvatarUrl] = useState('');
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [rules, setRules] = useState('');
  const [length, setLength] = useState('');
  const [ooc, setOoc] = useState('');

  // Persist data
  useEffect(() => {
    localStorage.setItem('koko_prompts', JSON.stringify(prompts));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem('koko_bg', appBackground);
  }, [appBackground]);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setAppBackground(compressed);
        await saveToDB('backgrounds', 'koko_bg', compressed);
      } catch (error) {
        console.error("Failed to upload koko background", error);
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setAvatarUrl(compressed);
      } catch (error) {
        console.error("Failed to upload avatar", error);
      }
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setAvatarUrl('');
    setContext('');
    setRules('');
    setLength('');
    setOoc('');
    setIsModalOpen(true);
  };

  const openEditModal = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setTitle(prompt.title);
    setAvatarUrl(prompt.avatarUrl);
    setContext(prompt.context);
    setRules(prompt.rules);
    setLength(prompt.length);
    setOoc(prompt.ooc);
    setIsModalOpen(true);
  };

  const savePrompt = () => {
    if (editingId) {
      setPrompts(prompts.map(p => p.id === editingId ? {
        ...p,
        title: title || "Danh mục chưa đặt tên",
        avatarUrl: avatarUrl || "https://i.pinimg.com/236x/d4/ec/c9/d4ecc906aef88e367873528b971a815a.jpg",
        context,
        rules,
        length,
        ooc
      } : p));
    } else {
      const newPrompt: Prompt = {
        id: Date.now().toString(),
        title: title || "Danh mục chưa đặt tên",
        avatarUrl: avatarUrl || "https://i.pinimg.com/236x/d4/ec/c9/d4ecc906aef88e367873528b971a815a.jpg",
        context,
        rules,
        length,
        ooc
      };
      setPrompts([...prompts, newPrompt]);
    }
    
    // Reset form
    setTitle('');
    setAvatarUrl('');
    setContext('');
    setRules('');
    setLength('');
    setOoc('');
    setIsModalOpen(false);
  };

  const deletePrompt = () => {
    if (editingId) {
      setPrompts(prompts.filter(p => p.id !== editingId));
      setIsModalOpen(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 w-full h-full bg-[#FAF9F6] overflow-hidden font-sans flex flex-col transition-all duration-300 bg-cover bg-center z-50"
      style={{ backgroundImage: appBackground ? `url('${appBackground}')` : 'none' }}
    >
      {/* HEADER */}
      <div className="h-[60px] bg-[#FAF9F6]/90 backdrop-blur-[10px] flex items-center justify-between px-4 text-[#5a5255] z-10 shadow-sm pt-safe">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-black/5 rounded-[12px] transition-colors cursor-pointer flex items-center gap-1 z-20 relative">
          <ChevronLeft size={24} />
          <span className="text-[14px] font-medium hidden sm:inline">Trang chủ</span>
        </button>
        <span className="text-[18px] font-medium truncate absolute left-0 right-0 text-center pointer-events-none">Koko Sách Thế Giới</span>
        
        <label 
          className="text-[12px] px-2 py-1.5 rounded-[8px] border border-[#8c8286] bg-transparent flex items-center gap-1 cursor-pointer hover:bg-black/5 transition-colors z-20 relative bg-white/50"
        >
          <ImageIcon size={14} />
          Đổi nền
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleBgUpload} 
          />
        </label>
      </div>

      {/* DANH SÁCH TRƯNG BÀY */}
      <div className="flex-1 overflow-y-auto pb-[100px]">
        {prompts.map(prompt => (
          <div 
            key={prompt.id} 
            onClick={() => setActiveChatPrompt(prompt)}
            className="flex items-center p-3 px-4 border-b border-[#E6DDD8] bg-white/60 hover:bg-white/80 transition-colors cursor-pointer backdrop-blur-sm group"
          >
            <div 
              className="w-[46px] h-[46px] rounded-full bg-[#D9CFC9] bg-cover bg-center mr-4 shrink-0 shadow-sm"
              style={{ backgroundImage: `url('${prompt.avatarUrl}')` }}
            />
            <div className="flex-1">
              <div className="text-[16px] font-medium text-[#5a5255] mb-1">{prompt.title}</div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); openEditModal(prompt); }}
              className="p-2 text-[#8c8286] hover:bg-black/5 rounded-full transition-colors"
            >
              <Pencil size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* NÚT THÊM MỚI */}
      <button 
        onClick={openCreateModal}
        className="absolute bottom-6 right-6 w-[60px] h-[60px] rounded-full bg-[#F3B4C2] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(243,180,194,0.5)] z-[100] active:scale-95 transition-transform border-none cursor-pointer hover:bg-[#F9C6D4]"
      >
        <Plus size={32} />
      </button>

      {/* TAB TẠO MỚI (MÀU HỒNG PHẤN) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 w-full h-full bg-[#F9C6D4] z-[1000] flex flex-col overflow-y-auto"
          >
            <div className="p-5 flex justify-between items-center bg-[#F3B4C2] text-white font-bold text-[18px] sticky top-0 z-10 shadow-sm">
              <span>{editingId ? "Chỉnh Sửa Thiết Lập" : "Tạo Thiết Lập Mới"}</span>
              <button onClick={() => setIsModalOpen(false)} className="text-white p-1 bg-transparent border-none cursor-pointer hover:bg-white/20 rounded-full transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4 pb-10 max-w-2xl mx-auto w-full">
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#5a5255]">Ảnh đại diện danh mục</label>
                <div className="flex gap-2 items-center">
                  <div 
                    className="w-[60px] h-[60px] rounded-[12px] bg-[#D9CFC9] bg-cover bg-center shrink-0 border border-[#F3B4C2]"
                    style={{ backgroundImage: avatarUrl ? `url('${avatarUrl}')` : 'none' }}
                  />
                  <label 
                    className="flex-1 p-3 border border-[#D9CFC9] rounded-[12px] bg-white text-[14px] text-[#5a5255] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Upload size={18} />
                    Tải ảnh từ thiết bị
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload} 
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#5a5255]">Tên Danh mục</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="VD: Bối cảnh tận thế..."
                  className="w-full p-3 border border-[#D9CFC9] rounded-[12px] bg-white text-[14px] text-[#5a5255] outline-none focus:border-[#F3B4C2] focus:ring-2 focus:ring-[#F3B4C2]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#5a5255]">Nội dung thông tin quan trọng hệ thống cần nhớ</label>
                <textarea 
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Nhập prompt bối cảnh vào đây..."
                  className="w-full p-3 border border-[#D9CFC9] rounded-[12px] bg-white text-[14px] text-[#5a5255] outline-none h-24 resize-none focus:border-[#F3B4C2] focus:ring-2 focus:ring-[#F3B4C2]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#5a5255]">Quy tắc KHÔNG BAO GIỜ được phản kháng</label>
                <textarea 
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  placeholder="Hệ thống tuyệt đối phải tuân theo..."
                  className="w-full p-3 border border-[#D9CFC9] rounded-[12px] bg-white text-[14px] text-[#5a5255] outline-none h-24 resize-none focus:border-[#F3B4C2] focus:ring-2 focus:ring-[#F3B4C2]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#5a5255]">Độ dài số lượng ký tự đầu ra</label>
                <input 
                  type="text" 
                  value={length}
                  onChange={e => setLength(e.target.value)}
                  placeholder="VD: 500 - 1000 ký tự"
                  className="w-full p-3 border border-[#D9CFC9] rounded-[12px] bg-white text-[14px] text-[#5a5255] outline-none focus:border-[#F3B4C2] focus:ring-2 focus:ring-[#F3B4C2]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#5a5255]">Quy tắc OOC (Out of Character)</label>
                <textarea 
                  value={ooc}
                  onChange={e => setOoc(e.target.value)}
                  placeholder="Quy định để NPC không bị thoát vai..."
                  className="w-full p-3 border border-[#D9CFC9] rounded-[12px] bg-white text-[14px] text-[#5a5255] outline-none h-24 resize-none focus:border-[#F3B4C2] focus:ring-2 focus:ring-[#F3B4C2]/20 transition-all"
                />
              </div>

              <div className="mt-4 flex gap-3">
                {editingId && (
                  <button 
                    onClick={deletePrompt}
                    className="flex-1 p-4 bg-[#ff7b7b] text-white border-none rounded-[12px] text-[16px] font-bold cursor-pointer active:scale-95 transition-transform hover:bg-[#ff6262] shadow-md"
                  >
                    XOÁ
                  </button>
                )}
                <button 
                  onClick={savePrompt}
                  className="flex-[2] p-4 bg-[#5a5255] text-white border-none rounded-[12px] text-[16px] font-bold cursor-pointer active:scale-95 transition-transform hover:bg-[#4a4245] shadow-md"
                >
                  {editingId ? "CẬP NHẬT" : "LƯU THIẾT LẬP"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeChatPrompt && (
          <ChatScreen 
            prompt={activeChatPrompt} 
            onBack={() => setActiveChatPrompt(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
