import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Globe, Clock } from 'lucide-react';
import { sendMessage } from '../../utils/apiProxy';

interface CharacterBrowserHistoryAppProps {
  character: any;
  currentStory: any;
  contextString: string;
  apiSettings?: any;
  onClose: () => void;
}

export default function CharacterBrowserHistoryApp({ character, currentStory, contextString, apiSettings: propApiSettings, onClose }: CharacterBrowserHistoryAppProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (character?.id) {
      const savedHistory = localStorage.getItem(`char_browser_history_${character.id}`);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    }
  }, [character?.id]);

  useEffect(() => {
    if (history.length > 0 && character?.id) {
      localStorage.setItem(`char_browser_history_${character.id}`, JSON.stringify(history));
    }
  }, [history, character?.id]);

  const generateHistory = async () => {
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
    try {
      const prompt = `Hãy tạo lịch sử tìm kiếm Google (khoảng 20 mục) cho nhân vật "${character.name}" trong câu chuyện sau.
      
      NGỮ CẢNH CÂU CHUYỆN:
      ${contextString}
      
      Yêu cầu:
      - Các từ khóa tìm kiếm phải phản ánh đúng tính cách, sở thích, những điều thầm kín, hoặc những vấn đề mà nhân vật đang gặp phải trong cốt truyện.
      - Trả về DUY NHẤT định dạng JSON là một mảng các object, mỗi object có cấu trúc:
      [
        {
          "query": "Từ khóa tìm kiếm",
          "time": "Thời gian (ví dụ: 10:30 AM, Hôm qua, 2 ngày trước)",
          "type": "search" hoặc "visit" (tìm kiếm hoặc truy cập trang web)
        }
      ]
      KHÔNG trả về markdown, CHỈ trả về JSON.`;

      const response = await sendMessage(apiSettings, [
        { role: 'user', content: prompt }
      ], "Bạn là một API trả về JSON hợp lệ.");
      
      let parsedData;
      if (typeof response === 'string') {
        const jsonMatch = response.match(/(\[[\s\S]*\])/);
        parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      } else {
        parsedData = response;
      }
      
      setHistory(parsedData);
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi tạo lịch sử: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full relative bg-white overflow-hidden flex flex-col font-sans">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100 z-30">
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2">
          <Search size={16} className="text-gray-400 mr-2" />
          <span className="text-gray-500 text-sm">google.com</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {history.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <Globe size={48} className="mb-4 text-gray-300" />
            <p className="text-gray-500 mb-6">Chưa có lịch sử duyệt web</p>
            <button 
              onClick={generateHistory}
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium shadow-md hover:bg-blue-600 transition-colors"
            >
              Tạo lịch sử
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Lịch sử gần đây</h2>
              <button 
                onClick={generateHistory}
                disabled={isLoading}
                className="text-xs text-blue-500 font-medium"
              >
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
            
            {history.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="mt-1 text-gray-400">
                  {item.type === 'search' ? <Search size={18} /> : <Globe size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium text-sm">{item.query}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
