import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import CarrdProfile from '../../components/CarrdProfile';

export default function HubTab({ onSelectChar, onEditChar }: { onSelectChar: (char: any) => void, onEditChar: (char: any) => void }) {
  const [showCarrd, setShowCarrd] = useState(true);
  const [chars, setChars] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('koko_chars');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setChars(parsed);
        } else {
          setChars([]);
        }
      } catch (e) {
        setChars([]);
      }
    }
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân vật này?')) {
      const newChars = chars.filter(c => c.id !== id);
      setChars(newChars);
      localStorage.setItem('koko_chars', JSON.stringify(newChars));
    }
  };

  if (showCarrd) {
    return (
      <div className="relative h-full">
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setShowCarrd(false)}
            className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#F3B4C2] shadow-sm border border-[#F9C6D4]"
          >
            Xem Nhân Vật →
          </button>
        </div>
        <CarrdProfile />
      </div>
    );
  }

  return (
    <div className="p-4 pt-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#F3B4C2]">Nhân Vật Của Tôi ♡</h1>
        <button 
          onClick={() => setShowCarrd(true)}
          className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#F3B4C2] shadow-sm border border-[#F9C6D4]"
        >
          ← Xem Profile
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {chars.length === 0 ? (
          <div className="text-center text-[#9E919A] mt-10">
            Chưa có nhân vật nào. Hãy tạo mới nhé!
          </div>
        ) : (
          chars.map(char => (
            <div 
              key={char.id} 
              onClick={() => onSelectChar(char)}
              className="bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm border border-[#F9C6D4] cursor-pointer hover:shadow-md transition-shadow relative group"
            >
              <img 
                src={char.avatar || 'https://i.pinimg.com/736x/8e/08/7b/8e087b7a2bb036329a738fa7b2a95c52.jpg'} 
                alt={char.name}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditChar(char); }}
                  className="bg-white/80 backdrop-blur p-2 rounded-full text-[#F3B4C2] hover:bg-white shadow-sm"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, char.id)}
                  className="bg-white/80 backdrop-blur p-2 rounded-full text-red-400 hover:bg-white shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-4">
                <h2 className="text-lg font-bold text-[#8A7D85]">{char.name}</h2>
                <p className="text-sm text-[#9E919A] mt-1">Giới tính: {char.gender}</p>
                <p className="text-sm text-[#9E919A] mt-1 line-clamp-2">Tiểu sử: {char.history || 'Chưa có'}</p>
                <p className="text-sm text-[#9E919A] mt-1 line-clamp-1">Tính cách: {char.personality || 'Bí ẩn'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
