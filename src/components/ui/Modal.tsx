import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-amber-500" size={32} />;
      case 'error': return <AlertTriangle className="text-red-500" size={32} />;
      case 'success': return <CheckCircle className="text-emerald-500" size={32} />;
      default: return <Info className="text-blue-500" size={32} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 p-8 max-w-md w-full flex flex-col items-center text-center gap-6"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              type === 'warning' ? 'bg-amber-50' : 
              type === 'error' ? 'bg-red-50' : 
              type === 'success' ? 'bg-emerald-50' : 'bg-blue-50'
            }`}>
              {getIcon()}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-stone-800">{title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{message}</p>
            </div>

            <div className="flex gap-3 w-full">
              {onConfirm ? (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-6 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-all ${
                      type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                      type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                      'bg-[#DB2777] hover:bg-[#BE185D] shadow-[#DB2777]/20'
                    }`}
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-xl font-bold bg-[#DB2777] text-white hover:bg-[#BE185D] shadow-lg shadow-[#DB2777]/20 transition-all"
                >
                  Đóng
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
