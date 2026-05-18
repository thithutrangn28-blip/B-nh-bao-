import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Send, User, Lock, Save } from 'lucide-react';
import { sendMessage } from '../../utils/apiProxy';
import { persistentLoad, persistentSave } from '../../utils/storage';

interface CharacterMessageAppProps {
  character: any;
  currentStory: any;
  contextString: string;
  apiSettings?: any;
  onClose: () => void;
}

export default function CharacterMessageApp({ character, currentStory, contextString, apiSettings: propApiSettings, onClose }: CharacterMessageAppProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (character?.id) {
      persistentLoad(`char_messages_${character.id}`).then(saved => {
        if (saved) setConversations(saved);
      });
    }
  }, [character?.id]);

  const handleSaveAndLock = async () => {
    if (character?.id) {
      await persistentSave(`char_messages_${character.id}`, conversations);
      setIsLocked(true);
      alert('Đã lưu và khoá dữ liệu!');
      setTimeout(() => setIsLocked(false), 2000);
    }
  };

  const generateMessages = async () => {
    if (isLocked) { alert('Dữ liệu đang bị khoá!'); return; }
    
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
      const prompt = `Hãy tạo danh sách tin nhắn (khoảng 5 cuộc hội thoại) cho nhân vật "${character.name}" trong câu chuyện sau.
      
      NGỮ CẢNH CÂU CHUYỆN:
      ${contextString}
      
      Yêu cầu:
      - Các cuộc hội thoại phải với các nhân vật khác trong truyện hoặc những người liên quan (Mẹ, Bạn thân, Sếp...).
      - Nội dung tin nhắn phải phản ánh đúng tình trạng hiện tại, bí mật, hoặc các sự kiện đang diễn ra trong cốt truyện.
      - Trả về DUY NHẤT định dạng JSON là một mảng các cuộc hội thoại, mỗi cuộc hội thoại có cấu trúc:
      [
        {
          "id": "unique_id",
          "contactName": "Tên người nhắn",
          "lastMessageTime": "Thời gian (ví dụ: 10:30 AM)",
          "messages": [
            {
              "sender": "me" hoặc "them",
              "text": "Nội dung tin nhắn",
              "time": "Thời gian"
            }
          ]
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
      
      setConversations(parsedData);
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi tạo tin nhắn: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (activeChat) {
    return (
      <div className="w-full h-full relative bg-white overflow-hidden flex flex-col font-sans">
        <div className="sticky top-0 bg-blue-500 text-white p-4 flex items-center gap-4 z-30 shadow-md">
          <button onClick={() => setActiveChat(null)} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            <h2 className="font-bold text-lg">{activeChat.contactName}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 pb-20">
          {activeChat.messages.map((msg: any, idx: number) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[75%] p-3 rounded-2xl ${
                  msg.sender === 'me' 
                    ? 'bg-blue-500 text-white rounded-tr-sm' 
                    : 'bg-gray-200 text-gray-800 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-xs text-gray-400 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-400 text-sm">
            Nhắn tin...
          </div>
          <button className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <Send size={18} className="ml-1" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-white overflow-hidden flex flex-col font-sans">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-gray-100 z-30">
        <button onClick={onClose} className="p-2 text-blue-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Tin nhắn</h1>
        <button onClick={handleSaveAndLock} className={`p-2 ${isLocked ? 'text-red-500' : 'text-blue-500'}`}>
           {isLocked ? <Lock size={24} /> : <Save size={24} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {conversations.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50 p-4">
            <MessageCircle size={48} className="mb-4 text-gray-400" />
            <p className="text-gray-500 mb-6">Chưa có tin nhắn nào</p>
            <button 
              onClick={generateMessages}
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium shadow-md hover:bg-blue-600 transition-colors"
            >
              Tạo tin nhắn
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {conversations.length > 0 && (
          <div className="divide-y divide-gray-100">
            <div className="p-4 flex justify-end">
              <button 
                onClick={generateMessages}
                disabled={isLoading}
                className="text-xs text-blue-500 font-medium"
              >
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
            
            {conversations.map((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setActiveChat(conv)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
                    <User size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-gray-800 truncate">{conv.contactName}</h3>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {lastMsg?.sender === 'me' ? 'Bạn: ' : ''}{lastMsg?.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
