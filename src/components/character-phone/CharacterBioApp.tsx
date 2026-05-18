import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { sendMessageStream } from '../../utils/apiProxy';
import GenerationProgress from './GenerationProgress';

interface CharacterBioAppProps {
  character: any;
  currentStory: any;
  contextString: string;
  apiSettings?: any;
  onClose: () => void;
}

export default function CharacterBioApp({ character, currentStory, contextString, apiSettings: propApiSettings, onClose }: CharacterBioAppProps) {
  const [versions, setVersions] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (character?.id) {
      const savedVersions = localStorage.getItem(`char_bio_versions_${character.id}`);
      if (savedVersions) {
        const parsed = JSON.parse(savedVersions);
        setVersions(parsed);
        setActiveIndex(parsed.length - 1);
      }
    }
  }, [character?.id]);

  useEffect(() => {
    if (versions.length > 0 && character?.id) {
      localStorage.setItem(`char_bio_versions_${character.id}`, JSON.stringify(versions));
    }
  }, [versions, character?.id]);

  // Reveal on scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const reveals = containerRef.current.querySelectorAll('.reveal');
      const windowHeight = window.innerHeight;
      
      reveals.forEach(reveal => {
        const elementTop = reveal.getBoundingClientRect().top;
        const elementVisible = 80;
        if (elementTop < windowHeight - elementVisible) {
          reveal.classList.add('show');
        }
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
    }
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [versions, activeIndex, streamingContent]);

  const generateBio = async () => {
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
      const prompt = `Hãy viết thông tin giới thiệu (Bio) cực kỳ chi tiết cho nhân vật "${character.name}" trong câu chuyện sau.
      
      NGỮ CẢNH CÂU CHUYỆN:
      ${contextString}
      
      Yêu cầu tối thiểu là độ dài 12.000 ký tự (khoảng 12.000 - 15.000 token).
      Hãy viết thật sâu sắc, đa chiều và giàu cảm xúc.
      
      Yêu cầu trả về DUY NHẤT định dạng JSON hợp lệ:
      {
        "quote": "Một câu nói tâm đắc của nhân vật",
        "aboutMe": "Bạn nghĩ tôi là người như nào (khoảng 1500 ký tự)",
        "birthplace": "Tôi sinh ra và lớn lên ở đâu, giới thiệu về nơi ở (khoảng 1500 ký tự)",
        "age": "Tuổi",
        "family": "Giới thiệu chi tiết từng thành viên trong gia đình (khoảng 1500 ký tự)",
        "friends": "Bạn bè thân thiết",
        "achievements": "Những giải thưởng / thành tựu đạt được",
        "childhood": "Kể về tuổi thơ theo từng độ tuổi",
        "selfEvaluation": "Tự đánh giá nhận xét về bản thân (khoảng 1500 ký tự)",
        "bestiesDetail": "Giới thiệu chi tiết về những người bạn của tôi (khoảng 2500 ký tự)",
        "phone": "Số điện thoại liên lạc",
        "talents": "Giới thiệu một số điều mà tôi giỏi (khoảng 2000 ký tự)",
        "favorites": "Giới thiệu một số quán ăn và món ăn yêu thích (khoảng 1500 ký tự)",
        "mindset": "Quan điểm sống / Tư duy",
        "loveForParents": "Bày tỏ tình yêu dành cho bố mẹ (khoảng 2500 ký tự)",
        "loveForOthers": "Bày tỏ tình yêu với những người yêu quý"
      }
      KHÔNG trả về markdown, CHỈ trả về JSON. Đảm bảo nội dung đạt tổng cộng ít nhất 12.000 ký tự.`;

      const stream = sendMessageStream(apiSettings, [
        { role: 'user', content: prompt }
      ], "Bạn là một API trả về JSON hợp lệ với dung lượng cực lớn.");
      
      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk.text || '';
        setStreamingContent(fullContent);
      }
      
      handleFinishGeneration(fullContent);
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi tạo Bio: ' + e.message);
      setIsLoading(false);
    }
  };

  const handleFinishGeneration = (content: string) => {
    try {
      let parsedData;
      const jsonMatch = content.match(/(\{[\s\S]*\})/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      
      const newVersions = [...versions, { ...parsedData, timestamp: Date.now() }];
      setVersions(newVersions);
      setActiveIndex(newVersions.length - 1);
      setIsFinished(true);
    } catch (e) {
      console.error("Parse error:", e);
      // Fallback if JSON is incomplete
      const newVersions = [...versions, { aboutMe: content, timestamp: Date.now(), isBroken: true }];
      setVersions(newVersions);
      setActiveIndex(newVersions.length - 1);
      setIsFinished(true);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const currentBio = versions[activeIndex];

  return (
    <div className="w-full h-full relative bg-[#FFF0F5] overflow-hidden flex flex-col font-mono">
      <style dangerouslySetInnerHTML={{__html: `
        .reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.8s ease-out;
        }
        .reveal.show {
          opacity: 1;
          transform: translateY(0);
        }
        .bio-wrapper {
          background-color: #FFF0F5;
          background-image: url('https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg');
          background-size: cover;
          background-attachment: fixed;
          background-position: center;
        }
        .info-box {
          background: rgba(255, 255, 255, 0.7);
          border: 2px dotted #D48E9E;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 30px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(249, 198, 212, 0.3);
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
          <h1 className="text-xl font-bold text-pink-600">Bio 🎀</h1>
        </div>
        
        <div className="flex gap-2 overflow-x-auto max-w-[150px] no-scrollbar py-1">
          {versions.map((v, i) => (
            <button 
              key={i} 
              onClick={() => setActiveIndex(i)}
              className={`version-tag ${activeIndex === i ? 'active' : ''}`}
            >
              Đợt {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto bio-wrapper p-5 pb-32">
        <button 
          onClick={generateBio}
          disabled={isLoading}
          className="w-full bg-[#F9C6D4] text-white font-bold py-4 rounded-2xl shadow-lg mb-8 hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {isLoading ? 'Đang tạo nội dung...' : 'Tạo Bio cho bạn nè 🎀'}
        </button>

        <div className="text-center mb-10 reveal show">
          <img 
            src={character.avatar || 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg'} 
            alt="Avatar"
            className="w-32 h-32 rounded-full border-4 border-[#F9C6D4] shadow-[0_0_15px_rgba(249,198,212,0.8)] object-cover mx-auto"
          />
          <h2 className="text-2xl text-[#5C4B51] mt-4 font-bold tracking-widest">{character.name}</h2>
          <p className="text-sm italic text-[#D48E9E] mt-2">"{currentBio?.quote || 'Sống sót qua ngày đông, sẽ thấy hoa nở...'}"</p>
        </div>

        {currentBio ? (
          <>
            <div className="info-box reveal">
              <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-4">ʚ About Me ɞ</h2>
              <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line">{currentBio.aboutMe}</p>
            </div>

            <div className="info-box reveal">
              <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-4">ʚ Check out my featured ɞ</h2>
              <div className="grid grid-cols-2 gap-3">
                <img className="w-full h-32 object-cover rounded-xl border border-[#F9C6D4]" src="https://picsum.photos/seed/kikoko1/300/300" />
                <img className="w-full h-32 object-cover rounded-xl border border-[#F9C6D4]" src="https://picsum.photos/seed/kikoko2/300/300" />
                <img className="w-full h-32 object-cover rounded-xl border border-[#F9C6D4]" src="https://picsum.photos/seed/kikoko3/300/300" />
                <img className="w-full h-32 object-cover rounded-xl border border-[#F9C6D4]" src="https://picsum.photos/seed/kikoko4/300/300" />
              </div>
            </div>

            {currentBio.birthplace && (
              <div className="info-box reveal">
                <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-4">ʚ Quê hương & Gia đình ɞ</h2>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line mb-4">{currentBio.birthplace}</p>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line">{currentBio.family}</p>
              </div>
            )}

            {currentBio.childhood && (
              <div className="info-box reveal">
                <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-4">ʚ Hành trình trưởng thành ɞ</h2>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line">{currentBio.childhood}</p>
              </div>
            )}

            {currentBio.selfEvaluation && (
              <div className="info-box reveal">
                <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-4">ʚ Tự đánh giá ɞ</h2>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line">{currentBio.selfEvaluation}</p>
              </div>
            )}

            {currentBio.bestiesDetail && (
              <div className="info-box reveal">
                <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-4">ʚ Besties ɞ</h2>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line">{currentBio.bestiesDetail}</p>
              </div>
            )}

            {currentBio.talents && (
              <div className="info-box reveal">
                <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-4">ʚ Tài năng & Sở thích ɞ</h2>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line mb-4">{currentBio.talents}</p>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line">{currentBio.favorites}</p>
              </div>
            )}

            {currentBio.mindset && (
              <div className="info-box reveal">
                <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-4">ʚ Quan điểm sống ɞ</h2>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line">{currentBio.mindset}</p>
              </div>
            )}

            {currentBio.loveForParents && (
              <div className="info-box reveal">
                <h2 className="text-[#D48E9E] text-center text-xl font-bold mb-4">ʚ Tình yêu thương ɞ</h2>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line mb-4">{currentBio.loveForParents}</p>
                <p className="text-[#5C4B51] text-sm leading-relaxed whitespace-pre-line">{currentBio.loveForOthers}</p>
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="p-10 text-center text-pink-400 animate-pulse">
            Đang hiển thị dữ liệu thô từ API...
            <div className="mt-4 text-left text-[10px] text-gray-500 bg-white/50 p-4 rounded-xl overflow-hidden h-40">
              {streamingContent}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-20">
            Chưa có thông tin Bio. Hãy bấm nút tạo phía trên nhé 🎀
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
