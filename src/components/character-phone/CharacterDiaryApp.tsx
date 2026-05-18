import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, History } from 'lucide-react';
import { sendMessageStream } from '../../utils/apiProxy';
import GenerationProgress from './GenerationProgress';

interface CharacterDiaryAppProps {
  character: any;
  currentStory: any;
  contextString: string;
  apiSettings?: any;
  onClose: () => void;
}

const DIARIES = [
  { id: 1, name: 'Sổ Hạnh Phúc', desc: 'Những niềm vui nhỏ bé', defaultCover: 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg' },
  { id: 2, name: 'Sổ Nỗi Buồn', desc: 'Nơi cất giấu nước mắt', defaultCover: 'https://i.postimg.cc/XqfWPd14/bd70382a8591895d6ed3dc8b1f6ad2e2.jpg' },
  { id: 3, name: 'Điều Ghét Nhất', desc: 'Những thứ không thể chịu đựng', defaultCover: 'https://i.postimg.cc/MGHWGcHt/081957f4e1f018ab629f8eacbd3464cc.jpg' },
  { id: 4, name: 'Hành Trình', desc: 'Nơi từng đi, người từng gặp', defaultCover: 'https://i.postimg.cc/x1r2VzDK/8bf48946a8a6c1c7808055ae66638ecf.jpg' },
  { id: 5, name: 'Giấc Mơ', desc: 'Mơ đẹp và ác mộng', defaultCover: 'https://i.postimg.cc/BQCsc51X/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg' },
  { id: 6, name: 'Tiêu Tiền', desc: 'Những món đồ tiếc nuối', defaultCover: 'https://i.postimg.cc/nhcxds4t/987727d1717650d6e85c26a4842b8cd7.jpg' },
  { id: 7, name: 'Góc Xấu Tính', desc: 'Nhân cách ngầm', defaultCover: 'https://i.postimg.cc/bvZhhKV0/f2fa9f0508bd2415954bc56bb3c62127.jpg' },
  { id: 8, name: 'Ngoại Lệ', desc: 'Người đặc biệt', defaultCover: 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg' },
  { id: 9, name: 'Thầm Thương', desc: 'Crush của tôi', defaultCover: 'https://i.postimg.cc/XqfWPd14/bd70382a8591895d6ed3dc8b1f6ad2e2.jpg' },
  { id: 10, name: 'Lý Do Yêu', desc: 'Tại sao lại là người đó?', defaultCover: 'https://i.postimg.cc/MGHWGcHt/081957f4e1f018ab629f8eacbd3464cc.jpg' },
  { id: 11, name: 'Tương Lai', desc: 'Tôi của sau này', defaultCover: 'https://i.postimg.cc/x1r2VzDK/8bf48946a8a6c1c7808055ae66638ecf.jpg' },
  { id: 12, name: 'Sai Lầm', desc: 'Nuối tiếc nhất', defaultCover: 'https://i.postimg.cc/BQCsc51X/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg' },
  { id: 13, name: 'Cơm Áo Gạo Tiền', desc: 'Áp lực tài chính', defaultCover: 'https://i.postimg.cc/nhcxds4t/987727d1717650d6e85c26a4842b8cd7.jpg' },
  { id: 14, name: 'Kế Hoạch', desc: 'Thay đổi cuộc đời', defaultCover: 'https://i.postimg.cc/bvZhhKV0/f2fa9f0508bd2415954bc56bb3c62127.jpg' },
  { id: 15, name: 'Thư Không Gửi', desc: 'Cho người đã khuất/xa', defaultCover: 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg' },
  { id: 16, name: 'Góc Tối', desc: 'Suy nghĩ điên rồ', defaultCover: 'https://i.postimg.cc/XqfWPd14/bd70382a8591895d6ed3dc8b1f6ad2e2.jpg' },
  { id: 17, name: 'Nhật Ký Chi Tiêu', desc: 'Từng đồng bạc lẻ', defaultCover: 'https://i.postimg.cc/MGHWGcHt/081957f4e1f018ab629f8eacbd3464cc.jpg' },
  { id: 18, name: 'Ao Ước', desc: 'Món đồ khao khát', defaultCover: 'https://i.postimg.cc/x1r2VzDK/8bf48946a8a6c1c7808055ae66638ecf.jpg' },
  { id: 19, name: 'Đối Thủ', desc: 'Phân tích kẻ thù', defaultCover: 'https://i.postimg.cc/BQCsc51X/5b6ae6d1fd5c96e463ca6aa1036bbc88.jpg' },
  { id: 20, name: 'Tự Sự 2h Sáng', desc: 'Rời rạc, yếu đuối', defaultCover: 'https://i.postimg.cc/nhcxds4t/987727d1717650d6e85c26a4842b8cd7.jpg' },
];

export default function CharacterDiaryApp({ character, currentStory, contextString, apiSettings: propApiSettings, onClose }: CharacterDiaryAppProps) {
  const [activeDiary, setActiveDiary] = useState<number | null>(null);
  const [diarySessions, setDiarySessions] = useState<Record<number, any[]>>({});
  const [activeSessionIndices, setActiveSessionIndices] = useState<Record<number, number>>({});
  const [covers, setCovers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (character?.id) {
      const savedSessions = localStorage.getItem(`char_diary_sessions_${character.id}`);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        setDiarySessions(parsed);
        // Set active index to last session for each diary
        const indices: Record<number, number> = {};
        Object.keys(parsed).forEach(id => {
          indices[parseInt(id)] = parsed[id].length - 1;
        });
        setActiveSessionIndices(indices);
      }
      
      const savedCovers = localStorage.getItem(`char_diary_covers_${character.id}`);
      if (savedCovers) setCovers(JSON.parse(savedCovers));
    }
  }, [character?.id]);

  useEffect(() => {
    if (character?.id && Object.keys(diarySessions).length > 0) {
      localStorage.setItem(`char_diary_sessions_${character.id}`, JSON.stringify(diarySessions));
    }
  }, [diarySessions, character?.id]);

  useEffect(() => {
    if (character?.id) {
      localStorage.setItem(`char_diary_covers_${character.id}`, JSON.stringify(covers));
    }
  }, [covers, character?.id]);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCovers(prev => ({ ...prev, [id]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateDiary = async (diary: any) => {
    let apiSettings = propApiSettings;
    if (!apiSettings) {
      const settingsStr = localStorage.getItem('kotokoo_settings');
      if (settingsStr) {
        apiSettings = JSON.parse(settingsStr);
      }
    }

    if (!apiSettings || !apiSettings.apiKey) {
      alert('Vui lòng cài đặt API Key trong phần Cài đặt hệ thống');
      return;
    }

    setIsLoading(true);
    setStreamingContent('');
    setIsFinished(false);

    try {
      const prompt = `Hãy viết một trang nhật ký cực kỳ chi tiết (Tối thiểu 12.000 ký tự) cho nhân vật "${character.name}" trong câu chuyện sau.
      
      TÊN CUỐN SỔ: "${diary.name}"
      MÔ TẢ CUỐN SỔ: "${diary.desc}"
      
      NGỮ CẢNH CÂU CHUYỆN:
      ${contextString}
      
      Yêu cầu:
      - Viết dưới góc nhìn thứ nhất của nhân vật "${character.name}".
      - Phải liên hệ mật thiết với tên cuốn sổ là "${diary.name}".
      - Thể hiện rõ tính cách, suy nghĩ sâu kín, và cảm xúc thật nhất của nhân vật.
      - Độ dài phải đạt ít nhất 12.000 ký tự (khoảng 12.000 - 15.000 token).
      - Trả về văn bản thuần túy, không dùng markdown hay JSON.`;

      const stream = sendMessageStream(apiSettings, [
        { role: 'user', content: prompt }
      ], "Bạn là một nhà văn viết nhật ký nhập vai xuất sắc, chuyên viết những áng văn dài và sâu sắc.");
      
      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk.text || '';
        setStreamingContent(fullContent);
      }
      
      const newSession = { content: fullContent, timestamp: Date.now() };
      const updatedSessions = {
        ...diarySessions,
        [diary.id]: [...(diarySessions[diary.id] || []), newSession]
      };
      setDiarySessions(updatedSessions);
      setActiveSessionIndices(prev => ({ ...prev, [diary.id]: updatedSessions[diary.id].length - 1 }));
      setIsFinished(true);
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi viết nhật ký: ' + e.message);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const activeDiaryInfo = activeDiary ? DIARIES.find(d => d.id === activeDiary) : null;
  const currentSessions = activeDiary ? (diarySessions[activeDiary] || []) : [];
  const activeSessionIndex = activeDiary ? (activeSessionIndices[activeDiary] ?? -1) : -1;
  const currentContent = activeSessionIndex >= 0 ? currentSessions[activeSessionIndex]?.content : '';

  return (
    <div className="w-full h-full relative bg-[#FFF0F5] overflow-hidden flex flex-col font-mono">
      <style dangerouslySetInnerHTML={{__html: `
        .diary-scroll {
          display: flex;
          overflow-x: auto;
          gap: 20px;
          padding: 20px 10px 40px 10px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .diary-scroll::-webkit-scrollbar { display: none; }
        .diary-item {
          min-width: 160px;
          background: rgba(255, 255, 255, 0.85);
          border: 2px solid #F9C6D4;
          border-radius: 15px;
          padding: 12px;
          text-align: center;
          flex-shrink: 0;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          cursor: pointer;
        }
        .diary-item.active-card {
          transform: translateY(-20px) scale(1.05);
          box-shadow: 0 15px 25px rgba(212, 142, 158, 0.5);
          border-color: #D48E9E;
        }
        .version-tag {
          background: #F9C6D4;
          color: white;
          padding: 4px 12px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
          cursor: pointer;
        }
        .version-tag.active {
          background: #D48E9E;
        }
      `}} />

      <div className="sticky top-0 bg-white/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-pink-100 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 bg-pink-50 rounded-full text-pink-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-pink-600">Secret Diaries 🎀</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-6">ʚ Chọn Sổ Nhật Ký ɞ</h2>
        
        <div className="diary-scroll no-scrollbar">
          {DIARIES.map(diary => (
            <div 
              key={diary.id}
              className={`diary-item ${activeDiary === diary.id ? 'active-card' : ''}`}
              onClick={() => setActiveDiary(diary.id)}
            >
              <div className="relative group">
                <img 
                  src={covers[diary.id] || diary.defaultCover} 
                  className="w-full h-[160px] object-cover rounded-xl mb-3 border border-pink-100"
                />
                <label className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                  <ImageIcon size={24} />
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleCoverUpload(e, diary.id)} />
                </label>
              </div>
              <p className="font-bold text-[#5C4B51] text-sm h-10 flex items-center justify-center">{diary.name}</p>
              
              {activeDiary === diary.id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); generateDiary(diary); }}
                  disabled={isLoading}
                  className="w-full mt-2 bg-[#F9C6D4] text-white py-2 rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {isLoading ? 'Đang viết...' : 'Bé API làm việc nè 💖'}
                </button>
              )}
            </div>
          ))}
        </div>

        {activeDiary && (
          <div className="mt-8 bg-white/70 backdrop-blur-md border-2 dotted border-[#D48E9E] rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#D48E9E] font-bold text-lg">
                {activeDiaryInfo?.name}
              </h3>
              <div className="flex gap-1 overflow-x-auto max-w-[150px] no-scrollbar">
                {currentSessions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveSessionIndices(prev => ({ ...prev, [activeDiary]: i }))}
                    className={`version-tag ${activeSessionIndex === i ? 'active' : ''}`}
                  >
                    Đợt {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {currentContent ? (
              <div className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line">
                {currentContent}
              </div>
            ) : isLoading ? (
              <div className="p-10 text-center text-pink-400 animate-pulse">
                Đang hiển thị dữ liệu thô từ API...
                <div className="mt-4 text-left text-[10px] text-gray-500 bg-white/50 p-4 rounded-xl overflow-hidden h-40">
                  {streamingContent}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-10">
                Chưa có nội dung cho cuốn sổ này. Hãy chọn nhân vật và bấm nút viết nhé 🎀
              </div>
            )}
          </div>
        )}
      </div>

      <GenerationProgress 
        content={streamingContent}
        isGenerating={isLoading}
        onFinish={() => setIsFinished(false)}
        targetChars={12000}
        targetTokens={12000}
      />
    </div>
  );
}
