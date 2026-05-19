import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, RotateCcw } from 'lucide-react';
import { getSnapshots, restoreSnapshot, deleteSnapshot, getStorageHealth } from '../../utils/snapshotManager';
import { saveKikokoStoryWithSnapshot, loadBackgrounds } from '../../utils/db';

export default function KikokoStorageManager({ novelId, onRestored }: { novelId: string, onRestored?: () => void }) {
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [backgrounds, setBackgrounds] = useState<Record<string, string>>({});
    const [activeBg, setActiveBg] = useState<string>('');

    const refresh = async () => {
        setLoading(true);
        const s = await getSnapshots(novelId);
        const h = await getStorageHealth(novelId);
        setSnapshots(s);
        setHealth(h);
        const bgs = await loadBackgrounds();
        setBackgrounds(bgs);
        setLoading(false);
    };

    useEffect(() => { refresh(); }, [novelId]);

    const handleRestore = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn khôi phục bản sao lưu này? Dữ liệu hiện tại sẽ bị ghi đè!')) return;
        try {
            const data = await restoreSnapshot(id);
            await saveKikokoStoryWithSnapshot(data);
            alert('Khôi phục thành công!');
            if (onRestored) onRestored();
        } catch (e) {
            alert('Lỗi khôi phục');
        }
    };

    return (
        <div 
            className="min-h-screen p-4 bg-cover bg-center rounded-3xl"
            style={{ backgroundImage: activeBg ? `url(${activeBg})` : 'none', backgroundColor: '#FBF5F7' }}
        >
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-pink-100 shadow-xl mb-6">
                <h2 className="text-2xl font-black text-[#555555] mb-4">Quản lý Snapshot</h2>
                
                {health && (
                    <div className="mb-6 p-4 bg-pink-50 rounded-2xl text-xs font-bold text-[#C79C9C]">
                        <p>Số bản snap: {health.snapshotsCount}</p>
                        <p>Dung lượng dự tính: {(health.estimatedSize / 1024).toFixed(1)} KB</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <button onClick={refresh} className="flex items-center gap-1 text-xs px-3 py-2 bg-[#F9C6D4] text-white rounded-full font-bold"><RefreshCw size={12}/> Tải lại</button>
                </div>
            </div>

            <div className="mb-6 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-pink-100">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Thư viện ảnh nền</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {Object.values(backgrounds).map((bg, idx) => (
                        <div 
                            key={idx} 
                            className={`w-16 h-16 rounded-xl border-2 cursor-pointer flex-shrink-0 ${activeBg === bg ? 'border-[#F9C6D4]' : 'border-transparent'}`}
                            onClick={() => setActiveBg(bg)}
                            style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover' }}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {snapshots.map(s => (
                    <div key={s.id} className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(s.timestamp).toLocaleString()}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleRestore(s.id)} className="text-xs px-3 py-1 bg-green-50 text-green-700 rounded-full font-bold flex items-center gap-1"><RotateCcw size={10}/> Khôi phục</button>
                                <button onClick={async () => { await deleteSnapshot(s.id); refresh(); }} className="text-xs px-3 py-1 bg-red-50 text-red-700 rounded-full font-bold flex items-center gap-1"><Trash2 size={10}/> Xóa</button>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-600">ID: {s.id} - Phiên bản {s.version}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
