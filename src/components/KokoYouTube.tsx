import React, { useState } from 'react';
import { Search, Play, X } from 'lucide-react';

const videos = [
  { id: '1', title: 'Koko Vlog 1', thumbnail: 'https://picsum.photos/seed/koko1/300/200' },
  { id: '2', title: 'Koko Vlog 2', thumbnail: 'https://picsum.photos/seed/koko2/300/200' },
  { id: '3', title: 'Koko Vlog 3', thumbnail: 'https://picsum.photos/seed/koko3/300/200' },
];

export default function KokoYouTube({ onClose }: { onClose: () => void }) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col z-50">
      <div className="p-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Koko YouTube</h1>
        <button onClick={onClose} className="p-2 bg-gray-800 rounded-full"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {videos.map(video => (
          <div key={video.id} className="mb-4 cursor-pointer" onClick={() => setSelectedVideo(video.id)}>
            <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover rounded-lg" />
            <p className="mt-2 font-medium">{video.title}</p>
          </div>
        ))}
      </div>
      {selectedVideo && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="w-full max-w-lg p-4">
            <button onClick={() => setSelectedVideo(null)} className="mb-4 p-2 bg-gray-800 rounded-full"><X /></button>
            <div className="aspect-video bg-gray-800 flex items-center justify-center">Video Player Placeholder</div>
          </div>
        </div>
      )}
    </div>
  );
}
