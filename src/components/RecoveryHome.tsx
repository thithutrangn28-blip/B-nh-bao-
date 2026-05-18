
import React from 'react';
import { AlertCircle, FileJson, Save } from 'lucide-react';

export default function RecoveryHome({ onExitSafeMode }: { onExitSafeMode: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-white p-8 flex flex-col items-center justify-center text-stone-800">
      <div className="bg-red-50 p-6 rounded-3xl border border-red-100 max-w-lg w-full text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Chế độ phục hồi</h1>
        <p className="text-stone-600 mb-6 font-medium">
          App phát hiện sự cố. Đang ở chế độ phục hồi an toàn để bảo vệ dữ liệu của bạn.
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onExitSafeMode}
            className="px-6 py-3 bg-stone-800 text-white rounded-full font-bold hover:bg-stone-700 transition"
          >
            Thử vào lại chế độ thường
          </button>
        </div>
      </div>
    </div>
  );
}
