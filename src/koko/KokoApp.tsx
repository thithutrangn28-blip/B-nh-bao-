import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

export default function KokoApp({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hello! Let\'s roleplay.' }]);
  const [input, setInput] = useState('');

  return (
    <div className="fixed inset-0 bg-white text-black flex flex-col z-50">
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <h1 className="text-xl font-bold">Koko Roleplay</h1>
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          className="flex-1 p-2 border border-gray-300 rounded-lg"
          placeholder="Type a message..."
        />
        <button onClick={() => { setMessages([...messages, { role: 'user', text: input }]); setInput(''); }} className="p-2 bg-blue-600 text-white rounded-lg"><Send /></button>
      </div>
    </div>
  );
}
