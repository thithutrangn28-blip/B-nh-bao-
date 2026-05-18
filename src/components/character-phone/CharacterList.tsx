import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { loadKikokoInstagram } from '../../utils/db';

interface CharacterListProps {
  currentStory: any;
  onSelect: (character: any) => void;
  onBack: () => void;
}

export default function CharacterList({ currentStory, onSelect, onBack }: CharacterListProps) {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const loadProfiles = async () => {
      if (currentStory?.id) {
        const igData = await loadKikokoInstagram(currentStory.id);
        if (igData && igData.profiles) {
          // Filter out the user's character if possible. Assuming user character has a specific flag or name.
          // For now, we just exclude the one named like userChar.
          const filtered = igData.profiles.filter((p: any) => p.name !== currentStory.userChar);
          setProfiles(filtered);
        } else {
          // Fallback to story characters
          setProfiles([
            { id: 'char_bot', name: currentStory.botChar || 'Bot', avatar: 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg' }
          ]);
        }
      }
    };
    loadProfiles();
  }, [currentStory]);

  return (
    <div className="absolute inset-0 z-50 bg-[#FFF0F5] overflow-y-auto">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-pink-100 z-10">
        <button onClick={onBack} className="p-2 bg-pink-50 rounded-full text-pink-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-pink-600">Điện thoại nhân vật</h1>
      </div>
      
      <div className="p-4 space-y-3">
        {profiles.map(profile => (
          <div 
            key={profile.id}
            onClick={() => onSelect(profile)}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-pink-100 cursor-pointer hover:bg-pink-50 transition-colors"
          >
            <img 
              src={profile.avatar || 'https://i.postimg.cc/85xsGkzT/dfd1b3a1ae8275de83798a73daa650bd.jpg'} 
              alt={profile.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-pink-200"
            />
            <div>
              <h3 className="font-bold text-gray-800">{profile.name}</h3>
              <p className="text-sm text-gray-500">Xem điện thoại</p>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            Chưa có nhân vật nào. Hãy tạo truyện trước nhé!
          </div>
        )}
      </div>
    </div>
  );
}
