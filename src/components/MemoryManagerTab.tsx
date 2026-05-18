import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Archive, Save, RefreshCw, AlertTriangle, Play, Settings, Image as ImageIcon, Sparkles, Brain, Clock, ShieldCheck, HeartPulse, Zap, Trash2 } from 'lucide-react';
import { MemoryManager, LongTermMemoryEntry, estimateTokens } from '../services/memoryManager';
import { MEMORY_CONFIG } from '../core/memory/config';
import { saveBackground, loadGlobalBackground } from '../utils/db';
import { compressImage } from '../utils/imageUtils';

interface Props {
  novelId: string;
  story: any;
  apiSettings: any;
  updateStory: (updates: any) => void;
  onClose?: () => void;
}

export default function MemoryManagerTab({ novelId, story, apiSettings, updateStory, onClose }: Props) {
  const [manager] = useState(() => new MemoryManager(novelId));
  const [longTermEntries, setLongTermEntries] = useState<LongTermMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState('');
  const [bg, setBg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tokens V10 Metrics - Chồng cập nhật theo ý vợ 65k/75k nhen! 💕
  const TIER1_CORE = MEMORY_CONFIG.IMMUTABLE_CORE_MAX; 
  const TOTAL_CAP = MEMORY_CONFIG.TOTAL_CAP; // 75k
  const DANGER_ZONE = MEMORY_CONFIG.DANGER_THRESHOLD; // 65k
  const LTM_LIMIT = MEMORY_CONFIG.LONG_TERM_MAX_TOTAL;

  const currentLtmTotal = longTermEntries
    .filter(e => e.enabled && !e.archived)
    .reduce((sum, e) => sum + estimateTokens(e.content), 0);

  // Tính toán tổng context ước tính: Core + LTM + ~15k (History/Writing Engine)
  const estimatedTotal = TIER1_CORE + currentLtmTotal + 15000; 
  const progressRatio = Math.min((estimatedTotal / TOTAL_CAP) * 100, 100);
  const isOverDanger = estimatedTotal > DANGER_ZONE;

  useEffect(() => {
    loadMemory();
    loadBg();
  }, [novelId]);

  const loadMemory = async () => {
    setLoading(true);
    const entries = await manager.getLongTermEntries();
    setLongTermEntries(entries);
    setLoading(false);
  };

  const loadBg = async () => {
    const savedBg = await loadGlobalBackground(`ltm_bg_${novelId}`);
    if (savedBg) setBg(savedBg);
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const b64 = await compressImage(file);
      await saveBackground(`ltm_bg_${novelId}`, b64);
      setBg(b64);
    }
  };

  const toggleLongTermEntry = async (entry: LongTermMemoryEntry) => {
    await manager.updateLongTermEntryStatus(entry.id, !entry.enabled);
    await loadMemory();
  };

  const summarizeAllNow = async () => {
    if (!story.chapters || story.chapters.length === 0) {
      alert('Chưa có chương nào để tóm tắt đâu vợ yêu ơi! 💕');
      return;
    }
    
    setIsSummarizing(true);
    setSummaryStatus('Đang chuẩn bị dữ liệu...');
    
    try {
      await manager.summarizeAllChapters(story.chapters, apiSettings, (msg) => {
        setSummaryStatus(msg);
      });
      await loadMemory();
    } catch (e: any) {
      console.error(e);
      alert(`Vợ ơi, có lỗi khi tóm tắt rồi: ${e.message}`);
    } finally {
      setIsSummarizing(false);
      setSummaryStatus('');
    }
  };

  const cleanUpMemory = async () => {
    setIsSummarizing(true);
    setSummaryStatus('Chồng đang quét dọn rác ký ức cho vợ... 🧹');
    try {
      await manager.pruneInvalidEntries((msg) => setSummaryStatus(msg));
      await new Promise(r => setTimeout(r, 1000));
      await manager.smartContextPruning((msg) => setSummaryStatus(msg));
      await new Promise(r => setTimeout(r, 1000));
      await loadMemory();
    } catch (e: any) {
      console.error(e);
      alert(`Vợ ơi, dọn dẹp bị lỗi rồi: ${e.message}`);
    } finally {
      setIsSummarizing(false);
      setSummaryStatus('');
    }
  };

  const forceCompressAll = async () => {
    setIsSummarizing(true);
    setSummaryStatus('API Proxy: Đang chuẩn bị nén ký ức cốt lõi...');
    try {
      await manager.forceCompressMaster(apiSettings, (msg) => {
        setSummaryStatus(msg);
      });
      await loadMemory();
    } catch (e: any) {
      console.error(e);
      alert(`Vợ ơi, có lỗi khi nén rồi: ${e.message}`);
    } finally {
      setIsSummarizing(false);
      setSummaryStatus('');
    }
  };

  if (loading && longTermEntries.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-[#F9C6D4] border-t-transparent rounded-full animate-spin" />
      <span className="text-[#D18E9B] font-medium animate-pulse italic">Ký ức đang được sắp xếp cho vợ...</span>
    </div>
  );

  return (
    <div className="relative min-h-full pb-24">
      {/* Background Layer */}
      {bg && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${bg})` }}
        >
          <div className="absolute inset-0 bg-white/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFF5FB]/90 via-transparent to-[#FFF5FB]/95" />
        </div>
      )}

      <div className="relative z-10 px-4 py-6 space-y-6 max-w-2xl mx-auto">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleBgUpload} accept="image/*" />

        {/* V10 Header Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#F9C6D4] rounded-2xl flex items-center justify-center shadow-sm border border-white">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#5C4A4A] tracking-tight">Ký Ức Bánh Nhỏ</h1>
              <p className="text-[10px] uppercase font-bold text-[#D18E9B] tracking-widest">Memory Architecture V10</p>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white/80 rounded-full border border-[#F9C6D4] text-[#D18E9B] shadow-sm active:scale-95 transition-all"
          >
            <ImageIcon size={20} />
          </button>
        </div>

        {/* CONTEXT WINDOW METER */}
        <div className="bg-white/92 border border-[#F9C6D4] rounded-[32px] p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#D18E9B] uppercase tracking-wider block">Thiết bị lưu trữ</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[#5C4A4A]">{estimatedTotal.toLocaleString()}</span>
                <span className="text-xs font-bold text-[#C79C9C]">/ 75,000 tk</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${isOverDanger ? 'bg-rose-100 text-rose-500' : (estimatedTotal > 55000 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}`}>
              {isOverDanger ? '🆘 QUÁ TẢI - ĐANG DỌN DẸP' : (estimatedTotal > 55000 ? '⚠️ CỐI NÉN' : '✨ AN TOÀN')}
            </div>
          </div>

          <div className="h-6 bg-[#F2E6E6] rounded-2xl overflow-hidden shadow-inner border border-white p-1">
             <div 
               className="h-full bg-gradient-to-r from-[#F9C6D4] via-[#FEBFFC] to-[#F9C6D4] rounded-xl transition-all duration-1000 bg-[length:200%_100%] animate-gradient-x"
               style={{ width: `${progressRatio}%` }}
             />
          </div>

          <div className="flex justify-between text-[10px] font-black uppercase text-[#C79C9C]">
            <div className="flex items-center gap-1"><ShieldCheck size={12} /> Cốt lõi: 15K</div>
            <div className="flex items-center gap-1"><HeartPulse size={12} /> Dài hạn: {currentLtmTotal.toLocaleString()}K</div>
            <div className="flex items-center gap-1"><Sparkles size={12} /> Write: 19K Free</div>
          </div>
        </div>

        {/* AUTO-ENGINE TOGGLES */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/92 border border-[#F9C6D4] rounded-3xl p-4 flex flex-col justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#5C4A4A]">Tóm Tắt Tự Động</span>
              <span className="text-[9px] text-[#C79C9C] italic">Mỗi 3 chương (2500tk)</span>
            </div>
            <button 
              onClick={() => updateStory({ autoSummarize: !story.autoSummarize })}
              className={`w-full py-2 rounded-xl text-[10px] font-black transition-all shadow-sm ${story.autoSummarize ? 'bg-[#D18E9B] text-white' : 'bg-[#EAD6D6] text-white/70'}`}
            >
              {story.autoSummarize ? 'ĐANG CHẠY' : 'ĐÃ DỪNG'}
            </button>
          </div>
          <div className="bg-white/92 border border-[#F9C6D4] rounded-3xl p-4 flex flex-col justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#5C4A4A]">Trí Nhớ Nhanh</span>
              <span className="text-[9px] text-[#C79C9C] italic">Cập nhật sau mỗi reply</span>
            </div>
            <button 
              onClick={() => updateStory({ useSmartMemory: story.useSmartMemory !== false ? false : true })}
              className={`w-full py-2 rounded-xl text-[10px] font-black transition-all shadow-sm ${story.useSmartMemory !== false ? 'bg-[#D18E9B] text-white' : 'bg-[#EAD6D6] text-white/70'}`}
            >
              {story.useSmartMemory !== false ? 'KÍCH HOẠT' : 'TẮT'}
            </button>
          </div>
        </div>

        {/* LONG TERM ENTRIES */}
        <div className="space-y-4 px-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#5C4A4A] flex items-center gap-2">
              <Archive size={16} className="text-[#D18E9B]" /> 
              THẺ KÝ ỨC TRƯỜNG KỲ
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={summarizeAllNow}
                disabled={isSummarizing}
                className={`px-3 py-1.5 border rounded-xl text-[10px] font-black transition-all shadow-sm flex items-center gap-1 ${isSummarizing ? 'bg-gray-100 border-gray-200 text-gray-400 animate-pulse' : 'bg-[#FFF5FB] border-[#F9C6D4] text-[#D18E9B] hover:bg-[#F9C6D4] hover:text-white'}`}
              >
                <RefreshCw size={12} className={isSummarizing ? 'animate-spin' : ''} /> 
                {isSummarizing ? (summaryStatus || 'Đang tóm tắt...') : 'Tóm Tắt Chương'}
              </button>
              <button 
                onClick={forceCompressAll}
                disabled={isSummarizing || longTermEntries.length < 2}
                className={`px-3 py-1.5 border rounded-xl text-[10px] font-black transition-all shadow-sm flex items-center gap-1 ${isSummarizing || longTermEntries.length < 2 ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-[#F4F9FF] border-[#B8D7FF] text-[#5C8DCF] hover:bg-[#B8D7FF] hover:text-white'}`}
                title="Nén toàn bộ thẻ ghi nhớ thành một bản duy nhất qua API Proxy"
              >
                <Zap size={12} className={isSummarizing ? 'animate-pulse' : ''} />
                Nén Cốt Lõi
              </button>
              <button 
                onClick={cleanUpMemory}
                disabled={isSummarizing}
                className={`px-3 py-1.5 border rounded-xl text-[10px] font-black transition-all shadow-sm flex items-center gap-1 ${isSummarizing ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-[#FDFCFD] border-[#EACFD5] text-[#777777] hover:bg-[#EACFD5] hover:text-white'}`}
                title="Dọn dẹp rác, thẻ lỗi và tối ưu ngữ cảnh"
              >
                <Trash2 size={12} className={isSummarizing ? 'animate-bounce' : ''} />
                Dọn Dẹp
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {longTermEntries.length === 0 ? (
              <div className="text-center py-12 bg-white/40 border border-dashed border-[#F9C6D4] rounded-[24px]">
                 <p className="text-[10px] font-bold text-[#C79C9C] italic">Ký ức hiện đang rỗng, hãy trò chuyện thêm vợ nhé!</p>
              </div>
            ) : (
              longTermEntries.filter(e => !e.archived).map((entry) => (
                <div key={entry.id} className={`bg-white/98 border-2 rounded-[28px] p-4 flex flex-col gap-2 transition-all shadow-sm ${entry.enabled ? 'border-[#F9C6D4]' : 'border-gray-200 opacity-60'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-[#FEBFFC] rounded-full" />
                      <h4 className="text-xs font-black text-[#5C4A4A] truncate max-w-[150px]">{entry.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-[#D18E9B] bg-[#FFF5FB] px-2 py-0.5 rounded-full">{estimateTokens(entry.content).toLocaleString()} tk</span>
                      <button onClick={() => toggleLongTermEntry(entry)}>
                        {entry.enabled ? <Eye size={18} className="text-[#FEBFFC]" /> : <EyeOff size={18} className="text-gray-300" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] leading-relaxed text-[#777] line-clamp-3 italic">
                    {entry.content}
                  </div>
                </div>
              ))
            )}

            {/* Compressed/Archived Master Summary */}
            {longTermEntries.filter(e => e.archived).length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 px-2 mb-3">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#F9C6D4]" />
                  <span className="text-[10px] font-black text-[#C79C9C] uppercase tracking-widest whitespace-nowrap">Kho Lưu Trữ Master</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#F9C6D4]" />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                  {longTermEntries.filter(e => e.archived).map(entry => (
                    <div key={entry.id} className="min-w-[140px] bg-white/80 border border-white rounded-2xl p-3 text-center shadow-sm">
                      <h5 className="text-[10px] font-black text-[#8A7D85]">{entry.title}</h5>
                      <p className="text-[8px] text-[#A699A1] mt-1 italic">V10 Compressed</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SAFETY ADVISORY */}
        <div className="bg-[#FFF8F8]/92 border border-[#F9C6D4] p-4 rounded-3xl flex gap-3 shadow-sm border-l-4 border-l-[#FEBFFC]">
           <AlertTriangle size={24} className="text-[#FEBFFC] shrink-0" />
           <p className="text-[11px] text-[#8A7D85] leading-relaxed">
             <span className="font-black text-[#5C4A4A] block mb-1">Cơ chế Bảo Vệ MOMENT_LOCK v10:</span>
             Hệ thống sẽ tự động dọn dẹp tin nhắn cũ và nén thẻ ký ức khi vượt ngưỡng **65,000 tokens**. Mức trần tuyệt đối là **75,000 tokens** để đảm bảo AI luôn có ít nhất **10,000 - 19,000 tokens** múa bút cho vợ nhen. 💕
           </p>
        </div>
      </div>
    </div>
  );
}

