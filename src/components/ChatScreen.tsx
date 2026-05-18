import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';

interface ChatScreenProps {
  prompt: any;
  onBack: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ prompt, onBack }) => {
  const promptTitle = typeof prompt === 'string' ? prompt : prompt?.title || 'Chat';
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Let's talk about: ${promptTitle}` }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: "That's interesting! Tell me more." }]);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-white z-50 flex flex-col"
    >
      <div className="flex items-center p-4 border-b">
        <button onClick={onBack} className="p-2 mr-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-semibold text-lg truncate">{promptTitle}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="p-2 bg-blue-500 text-white rounded-full">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default ChatScreen;
