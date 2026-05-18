import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Image as ImageIcon } from 'lucide-react';
import { sendCoreMessageStream } from '../../services/coreAi';
import { compressImage } from '../../utils/imageUtils';
import { ApiProxySettings } from '../../utils/apiProxy';
import { loadApiSettings } from '../../utils/settings';
import { debounce } from '../../utils/utils';

export default function NotebooksView({ char, onBack }: { char: any, onBack: () => void }) {
  const [openedNotebook, setOpenedNotebook] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetLength, setTargetLength] = useState(5000);
  const [covers, setCovers] = useState<Record<number, string>>({});

  const notebooks = [
    { id: 1, title: 'Cuộc đời & Tiểu sử' },
    { id: 2, title: 'Dự định tương lai' },
    { id: 3, title: 'Bí mật & Tiết kiệm' },
    { id: 4, title: 'Sở thích & Gia đình' },
    { id: 5, title: 'Tài chính cá nhân' },
    { id: 6, title: 'Những giấc mơ' },
    { id: 7, title: 'Điều hối tiếc' },
    { id: 8, title: 'Mối quan hệ' },
    { id: 9, title: 'Nhật ký hàng ngày' },
    { id: 10, title: 'Suy nghĩ vẩn vơ' },
  ];

  useEffect(() => {
    const savedCovers = localStorage.getItem(`koko_notebook_covers_${char.id}`);
    if (savedCovers) {
      try { setCovers(JSON.parse(savedCovers)); } catch(e){}
    }
  }, [char.id]);

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        const newCovers = { ...covers, [id]: compressedBase64 };
        setCovers(newCovers);
        localStorage.setItem(`koko_notebook_covers_${char.id}`, JSON.stringify(newCovers));
      } catch (error) {
        console.error("Failed to compress image", error);
      }
      e.target.value = ''; // Reset input so same file can be selected again
    }
  };

  const handleOpenNotebook = (id: number) => {
    setOpenedNotebook(id);
    const savedContent = localStorage.getItem(`koko_notebook_content_${char.id}_${id}`);
    setContent(savedContent || '');
  };

  useEffect(() => {
    if (openedNotebook !== null && content !== '') {
      localStorage.setItem(`koko_notebook_content_${char.id}_${openedNotebook}`, content);
    }
  }, [content, openedNotebook, char.id]);

  const handleGenerate = async () => {
    setLoading(true);
    setContent('');
    try {
      const prompt = `Viết nội dung cho cuốn sổ "${notebooks[openedNotebook! - 1].title}" của nhân vật ${char.name}. Độ dài yêu cầu: khoảng ${targetLength} ký tự. Thông tin nhân vật: ${char.history} ${char.personality}`;
      
      const apiSettings = loadApiSettings();

      const response = await sendCoreMessageStream(
        prompt, [], 
        { title: 'Koko Notebook', context: 'Viết nhật ký', rules: 'CHỈ VIẾT VĂN BẢN THUẦN TÚY. KHÔNG DÙNG JSON HAY CODE.', length: `${targetLength} ký tự`, ooc: 'Không' },
        { mode: 'novel', minChars: targetLength - 500, maxChars: targetLength + 500, maxTokens: apiSettings.maxTokens, timeoutMinutes: apiSettings.timeoutMinutes },
        apiSettings
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const json = JSON.parse(line.slice(6));
                  if (json.choices?.[0]?.delta?.content) {
                    setContent(prev => prev + json.choices[0].delta.content);
                  }
                } catch(e) {
                  console.error("Error parsing JSON chunk:", e, line);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (e) {
      console.error(e);
      setContent('Có lỗi xảy ra khi tạo nội dung.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDebounced = useRef(
    debounce(handleGenerate, 1000)
  ).current;

  if (openedNotebook !== null) {
    return (
      <div className="w-full h-full flex flex-col absolute top-0 left-0 z-50">
        <div className="p-4 pt-10 flex items-center gap-4 bg-white/80 backdrop-blur-md border-b border-[#F9C6D4]/30">
          <button onClick={() => setOpenedNotebook(null)} className="text-[#F3B4C2]"><ChevronLeft size={28} /></button>
          <h2 className="font-bold text-[#8A7D85]">{notebooks[openedNotebook - 1].title}</h2>
        </div>
        
        <div className="p-4 flex gap-2 items-center bg-white/60 backdrop-blur-sm">
          <label className="text-sm text-[#8A7D85] font-bold">Số ký tự:</label>
          <input 
            type="number" 
            value={targetLength}
            onChange={e => setTargetLength(parseInt(e.target.value))}
            className="w-24 p-2 rounded-lg border border-[#F9C6D4] outline-none text-sm bg-white/80"
          />
          <button 
            onClick={handleGenerateDebounced}
            disabled={loading}
            className="bg-[#F3B4C2] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 shadow-sm"
          >
            <Plus size={16} /> {loading ? 'Đang viết...' : 'Tạo nội dung'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white/90 backdrop-blur-sm min-h-full rounded-xl shadow-md border border-[#F9C6D4]/50 p-6 text-[#8A7D85] whitespace-pre-wrap leading-relaxed">
            {content || 'Chưa có nội dung. Hãy bấm "Tạo nội dung" để bắt đầu.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center absolute top-0 left-0 z-40">
      <div className="absolute top-10 left-4 z-10">
        <button onClick={onBack} className="bg-white/80 backdrop-blur p-2 rounded-full text-[#F3B4C2] shadow-lg border border-[#F9C6D4]/50">
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="w-full h-full overflow-x-auto flex items-center gap-8 snap-x snap-mandatory px-[10vw] scrollbar-hide">
        {notebooks.map(nb => (
          <div 
            key={nb.id}
            className="snap-center shrink-0 w-[80vw] max-w-[400px] aspect-[1/1.4] relative group cursor-pointer"
            onClick={() => handleOpenNotebook(nb.id)}
          >
            {/* Notebook Container */}
            <div className="w-full h-full relative rounded-r-3xl rounded-l-md shadow-2xl overflow-hidden border-l-[16px] border-[#D4A3B3] bg-white transition-transform duration-300 group-hover:scale-[1.02]">
              
              {/* Layer 1: Base Image with Contrast/Brightness Filter */}
              <img 
                src={covers[nb.id] || char.avatar || 'https://i.pinimg.com/236x/01/a9/4b/01a94b465b8df4d9d10e5bd7875955a0.jpg'} 
                className="absolute inset-0 w-full h-full object-cover"
                alt="Notebook Cover"
              />
              
              {/* Layer 2: Subtle Overlay */}
              <div className="absolute inset-0 bg-white/10 pointer-events-none"></div>
              
              {/* Layer 3: CSS Lace Frame (Khung Viền Ren) */}
              <div className="absolute inset-3 border-2 border-dashed border-white/60 rounded-xl pointer-events-none"></div>
              <div className="absolute inset-4 border border-white/40 rounded-lg pointer-events-none"></div>

              {/* Notebook Title Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/85 backdrop-blur-md px-6 py-4 rounded-sm border border-[#F9C6D4] shadow-lg text-center min-w-[70%] max-w-[90%]">
                <div className="text-xs text-[#D4A3B3] mb-1 uppercase tracking-widest font-semibold">Tập {nb.id}</div>
                <h3 className="font-serif italic text-[#8A7D85] text-xl leading-snug">{nb.title}</h3>
              </div>

              {/* Upload Cover Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const input = document.getElementById(`upload-cover-${char.id}-${nb.id}`);
                  if (input) input.click();
                }}
                className="absolute bottom-4 right-4 bg-white/60 backdrop-blur-md p-3 rounded-full text-[#8A7D85] hover:bg-white transition-colors shadow-md z-20 cursor-pointer"
              >
                <ImageIcon size={20} />
              </button>
              <input 
                type="file" 
                id={`upload-cover-${char.id}-${nb.id}`} 
                className="hidden" 
                accept="image/*" 
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleUploadCover(e, nb.id)} 
              />
            </div>
            
            {/* Notebook Shadow/Thickness Effect */}
            <div className="absolute top-2 -right-2 w-full h-full bg-black/20 rounded-r-3xl rounded-l-md -z-10 blur-sm"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
