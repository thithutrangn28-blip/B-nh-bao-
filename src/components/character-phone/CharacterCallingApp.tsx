import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, PhoneCall, PhoneMissed, Clock, User } from 'lucide-react';
import { sendMessage } from '../../utils/apiProxy';

interface CharacterCallingAppProps {
  character: any;
  currentStory: any;
  contextString: string;
  apiSettings?: any;
  onClose: () => void;
}

export default function CharacterCallingApp({ character, currentStory, contextString, apiSettings: propApiSettings, onClose }: CharacterCallingAppProps) {
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (character?.id) {
      const savedHistory = localStorage.getItem(`char_call_history_${character.id}`);
      if (savedHistory) {
        setCallHistory(JSON.parse(savedHistory));
      }
    }
  }, [character?.id]);

  useEffect(() => {
    if (callHistory.length > 0 && character?.id) {
      localStorage.setItem(`char_call_history_${character.id}`, JSON.stringify(callHistory));
    }
  }, [callHistory, character?.id]);

  const generateCallHistory = async () => {
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
      const prompt = `Hãy tạo lịch sử cuộc gọi (khoảng 15 mục) cho nhân vật "${character.name}" trong câu chuyện sau.
      
      NGỮ CẢNH CÂU CHUYỆN:
      ${contextString}
      
      Yêu cầu:
      - Tên người gọi/người nhận phải là các nhân vật khác trong truyện, hoặc những người liên quan (ví dụ: Mẹ, Sếp, Số lạ, Dịch vụ...).
      - Trả về DUY NHẤT định dạng JSON là một mảng các object, mỗi object có cấu trúc:
      [
        {
          "name": "Tên người liên hệ",
          "type": "incoming" | "outgoing" | "missed",
          "time": "Thời gian (ví dụ: 10:30 AM, Hôm qua, 2 ngày trước)",
          "duration": "Thời lượng (ví dụ: 5 phút, 1 giờ, hoặc null nếu gọi nhỡ)"
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
      
      setCallHistory(parsedData);
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi tạo lịch sử cuộc gọi: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full relative bg-black text-white overflow-hidden flex flex-col font-sans">
      <div className="sticky top-0 bg-black/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-gray-800 z-30">
        <button onClick={onClose} className="p-2 text-blue-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-medium">Gần đây</h1>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {callHistory.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50 p-4">
            <Phone size={48} className="mb-4 text-gray-500" />
            <p className="text-gray-400 mb-6">Chưa có cuộc gọi nào gần đây</p>
            <button 
              onClick={generateCallHistory}
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium shadow-md hover:bg-blue-600 transition-colors"
            >
              Tạo lịch sử cuộc gọi
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {callHistory.length > 0 && (
          <div className="divide-y divide-gray-800">
            <div className="p-4 flex justify-end">
              <button 
                onClick={generateCallHistory}
                disabled={isLoading}
                className="text-xs text-blue-500 font-medium"
              >
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
            
            {callHistory.map((call, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-900 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                    <User size={20} />
                  </div>
                  <div>
                    <p className={`font-medium text-lg ${call.type === 'missed' ? 'text-red-500' : 'text-white'}`}>
                      {call.name}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      {call.type === 'incoming' && <PhoneCall size={14} className="text-gray-500" />}
                      {call.type === 'outgoing' && <PhoneCall size={14} className="text-gray-500" style={{ transform: 'scaleX(-1)' }} />}
                      {call.type === 'missed' && <PhoneMissed size={14} className="text-red-500" />}
                      <span>{call.type === 'missed' ? 'Cuộc gọi nhỡ' : call.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span>{call.time}</span>
                  <button className="text-blue-500 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
