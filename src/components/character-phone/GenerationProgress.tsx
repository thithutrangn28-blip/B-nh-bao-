import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GenerationProgressProps {
  content: string;
  isGenerating: boolean;
  onFinish: () => void;
  targetChars?: number;
  targetTokens?: number;
  timeoutSeconds?: number;
}

export default function GenerationProgress({ 
  content, 
  isGenerating, 
  onFinish, 
  targetChars = 12000, 
  targetTokens = 12000,
  timeoutSeconds = 30
}: GenerationProgressProps) {
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  
  // Calculate character and token count
  const charCount = content.length;
  // Approximation for Vietnamese/Mixed content
  const tokenCount = Math.ceil(charCount / 1.5); 

  useEffect(() => {
    if (content.length > 0 && !hasStartedStreaming) {
      setHasStartedStreaming(true);
    }
  }, [content, hasStartedStreaming]);

  useEffect(() => {
    if (isGenerating) {
      const timer = setTimeout(() => {
        if (!hasStartedStreaming) {
          setShowProgress(false);
        }
      }, timeoutSeconds * 1000);
      return () => clearTimeout(timer);
    } else {
      setShowProgress(true);
      setHasStartedStreaming(false);
    }
  }, [isGenerating, hasStartedStreaming, timeoutSeconds]);

  const charPercent = Math.min((charCount / targetChars) * 100, 100);
  const tokenPercent = Math.min((tokenCount / targetTokens) * 100, 100);
  const tokenRemaining = Math.max(targetTokens - tokenCount, 0);

  if (!isGenerating && charCount === 0) return null;
  if (!showProgress && isGenerating) return null;

  return (
    <AnimatePresence>
      {(isGenerating || charCount > 0) && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-[0_20px_50px_rgba(212,142,158,0.3)] border-2 border-pink-100 z-[100] font-mono"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-2 text-[11px] font-bold text-pink-600 uppercase tracking-widest">
              {isGenerating ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                  </span>
                  {hasStartedStreaming ? 'Đang nhận dữ liệu...' : 'Đang khởi tạo đợt viết...'}
                </>
              ) : (
                '🌸 Đã hoàn thành đợt này'
              )}
            </span>
            <div className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              Sàn: {(targetChars ?? 0).toLocaleString()} ký tự
            </div>
          </div>

          <div className="space-y-4">
            {/* Character Progress */}
            <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
              <div className="flex justify-between text-[11px] mb-2">
                <span className="text-gray-600 font-medium">Số ký tự đã viết:</span>
                <span className="font-bold text-pink-600">{(charCount ?? 0).toLocaleString()} / <span className="text-[9px] text-pink-300">{(targetChars ?? 0).toLocaleString()}</span></span>
              </div>
              <div className="h-2.5 bg-pink-100 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-pink-300 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${charPercent}%` || '0%' }}
                />
              </div>
            </div>

            {/* Token Progress (Countdown & Upcount) */}
            <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
              <div className="flex justify-between text-[11px] mb-2">
                <div className="flex flex-col">
                  <span className="text-gray-600 font-medium whitespace-nowrap">Tokens: {(tokenCount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-blue-600">Còn lại: {(tokenRemaining ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-300 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${tokenPercent}%` }}
                />
              </div>
            </div>
          </div>

          {!isGenerating && charCount > 0 && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onFinish}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-pink-400 to-pink-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-pink-200"
            >
              Lưu đợt này & Đóng 🎀
            </motion.button>
          )}

          {isGenerating && hasStartedStreaming && (
            <div className="mt-3 text-[9px] text-gray-400 text-center italic">
              * Dự kiến đạt chỉ tiêu trong ít phút nữa...
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
