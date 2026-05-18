import React, { useState, useRef } from 'react';
import { MemoryState, MEMORY_CONFIG, LongTermSummary, Prompt } from '../../core/memory/config';
import MemoryMeter from './MemoryMeter';
import { Database, Image as ImageIcon, Sparkles, Trash2, ShieldCheck, ListTodo, WashingMachine, Eraser, ImageDown, RotateCcw, X, Diamond, Brain, Settings, Play, Terminal } from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';
import { BotPromptManager } from '../banhnho/BotPromptManager';

interface MemoryDashboardProps {
  state: MemoryState;
  onUpdateState: (newState: MemoryState) => void;
  onClose: () => void;
  onMegaCompress: () => void;
  onGenerateManualSummary?: () => void;
  onSafeCleanup?: () => void;
  onResetConversation?: () => void;
  initialTab?: 'hot' | 'summaries' | 'facts' | 'prompts' | 'core' | 'clean' | 'settings';
}

const MemoryDashboard: React.FC<MemoryDashboardProps> = ({ state, onUpdateState, onClose, onMegaCompress, onGenerateManualSummary, onSafeCleanup, onResetConversation, initialTab = 'hot' }) => {
  const [activeTab, setActiveTab] = useState<'hot' | 'summaries' | 'facts' | 'prompts' | 'core' | 'clean' | 'settings'>(initialTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePromptsChange = (newPrompts: Prompt[]) => {
    onUpdateState({ 
      ...state, 
      prompts: newPrompts,
      customContextOverrides: {
        ...state.customContextOverrides,
        ACTIVE_USER_ENABLED_PROMPTS: undefined // Clear override to allow dynamic generation
      }
    });
  };

  const toggleSummary = (id: string) => {
    const newSummaries = state.longTermSummaries.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    onUpdateState({ ...state, longTermSummaries: newSummaries });
  };

  const toggleHotMemory = (chapterId: string) => {
    const newHotMemory = state.hotMemory.map(h => 
      h.chapterId === chapterId ? { ...h, disabled: !h.disabled } : h
    );
    onUpdateState({ ...state, hotMemory: newHotMemory });
  };

  const setAllSummaries = (enabled: boolean) => {
    const newSummaries = state.longTermSummaries.map(s => ({ ...s, enabled }));
    onUpdateState({ ...state, longTermSummaries: newSummaries });
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      onUpdateState({ ...state, background: base64 });
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-[#FFFCFD] animate-in fade-in duration-300 overflow-hidden">
      {/* Memory Dashboard Custom Background */}
      {state.background && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: `url(${state.background})` }}
        />
      )}

      {/* Coquette Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex flex-wrap gap-12 p-8 rotate-12 z-0">
        {[...Array(30)].map((_, i) => (
           <span key={i} className="text-4xl text-[#F5C6D6] drop-shadow-sm">🍓</span>
        ))}
      </div>

      <div className="flex-1 flex flex-col relative z-10 overflow-y-auto custom-scrollbar">
        {/* Header - Coquette Style */}
        <div className="relative z-10 p-6 flex flex-col border-b-4 border-[#F9C6D4] bg-[#FFFFFF]/98 shrink-0 shadow-[0_4px_20px_rgba(249,198,212,0.1)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F9C6D4] to-[#F3B4C2] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#4D2C2C] tracking-tighter uppercase">Hệ Thống Trí Nhớ</h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#F9C6D4]/30 rounded-full text-[10px] font-black text-[#A65D7B] uppercase tracking-widest border border-[#F9C6D4]/50">
                    Kikoko Memory Engine v3 • Diamond Core
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#FFFFFF] text-[#8A7D85] hover:bg-[#F9C6D4] hover:text-white transition-all border-2 border-[#F9C6D4] shadow-sm transform hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <MemoryMeter state={state} />
        </div>
        
        {/* Tabs */}
        <div className="flex bg-[#FFFFFF]/98 relative z-20 sticky top-0 border-b border-[#F9C6D4]/40 shrink-0 shadow-sm px-4">
          {[
            { id: 'hot', label: 'Gần nhất', icon: <Play className="w-5 h-5" /> },
            { id: 'summaries', label: 'Lịch sử', icon: <ListTodo className="w-5 h-5" /> },
            { id: 'prompts', label: 'Lệnh Prompt', icon: <Terminal className="w-5 h-5" /> },
            { id: 'facts', label: 'Sự kiện', icon: <Diamond className="w-5 h-5" /> },
            { id: 'core', label: 'Vĩnh cửu', icon: <ShieldCheck className="w-5 h-5" /> },
            { id: 'clean', label: 'Dọn dẹp', icon: <WashingMachine className="w-5 h-5" /> },
            { id: 'settings', label: 'Cài đặt', icon: <Settings className="w-5 h-5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 text-[11px] font-black tracking-tighter uppercase transition-all flex flex-col items-center justify-center gap-2 border-b-4 ${
                activeTab === tab.id 
                ? 'bg-white text-[#A65D7B] border-[#A65D7B]' 
                : 'text-[#D6869F] border-transparent hover:bg-[#FBF5F7]'
              }`}
            >
              {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 pb-32 space-y-6 relative z-10 bg-[#FFFFFF]/30 flex-1">
           {activeTab === 'hot' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 px-2 pb-2 border-b border-[#F9C6D4]/30">
                   <Play className="w-4 h-4 text-[#A65D7B]" />
                   <span className="text-xs font-bold text-[#A65D7B] uppercase tracking-widest">Trí nhớ 4 lần trò chuyện gần nhất (Hot Memory)</span>
                </div>
                {(!state.hotMemory || state.hotMemory.length === 0) ? (
                  <div className="py-20 text-center bg-white/60 rounded-[32px] border-4 border-dotted border-[#F9C6D4]/40 flex flex-col items-center gap-4">
                     <div className="text-6xl grayscale opacity-30">🔥</div>
                     <p className="text-sm text-[#D6869F] font-medium font-cursive px-8 leading-relaxed">Chưa có trí nhớ gần đây. Hãy trò chuyện với Bot để ghi nhớ! 🌸</p>
                  </div>
                ) : (
                  <div className="grid gap-5">
                    {state.hotMemory.map((hot, idx) => {
                      const scales = [40, 50, 60, 70];
                      const distance = state.hotMemory.length - 1 - idx; // distance from newest
                      const scaleIdx = scales.length - 1 - distance; 
                      const scale = scaleIdx >= 0 ? scales[scaleIdx] : 40;
                      
                      // Label based on chronological order (0 is oldest)
                      let label = '';
                      if (idx === 0) label = 'Chương Cũ';
                      else if (idx === 1) label = 'Chương Gần Cũ';
                      else if (idx === 2) label = 'Chương Gần Đây';
                      else if (idx === 3) label = 'Chương Mới Nhất';
                      else label = `Chương #${idx + 1}`;

                      return (
                        <div key={hot.chapterId} className={`bg-white/90 border-2 ${hot.disabled ? 'border-dashed border-[#F0F0F0] opacity-50 grayscale' : 'border-solid border-[#F9C6D4] shadow-[0_8px_20px_rgba(249,198,212,0.15)] ring-4 ring-[#F9C6D4]/5'} rounded-3xl p-5 relative group flex flex-col gap-3 transition-all duration-500`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-[#A65D7B] bg-[#FBF5F7] px-3 py-1 border border-[#F9C6D4]/30 rounded-full">
                              {label} (Tỷ lệ phân bổ nhớ: {scale}%)
                            </span>
                            <button 
                              onClick={() => toggleHotMemory(hot.chapterId)}
                              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${
                                !hot.disabled
                                ? 'bg-[#F9C6D4] text-white hover:bg-[#F5C6D6]' 
                                : 'bg-[#D6D3D3] text-white hover:bg-[#CAC7C7]'
                              }`}
                            >
                              {!hot.disabled ? 'Active 🍓' : 'Inactive ✗'}
                            </button>
                          </div>
                          <p className="text-[12px] text-[#5A5A5A] leading-relaxed font-medium italic px-1 whitespace-pre-wrap line-clamp-4 hover:line-clamp-none cursor-pointer">
                            {hot.tailRaw}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-[#F0F0F0] text-[9px] font-bold text-[#D6869F]">
                            <span className="flex items-center gap-1">🆔 {hot.chapterId}</span>
                            <span className="bg-[#FFF5FB] px-2 py-0.5 rounded-md">Giới hạn {scale}% từ đoạn cuối</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
           )}

           {activeTab === 'prompts' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <BotPromptManager 
                 prompts={state.prompts || []} 
                 onPromptsChange={handlePromptsChange} 
               />
             </div>
           )}

           {activeTab === 'summaries' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-[#A65D7B]" />
                      <span className="text-xs font-bold text-[#A65D7B] uppercase tracking-widest">Dòng thời gian (3 chương/thẻ)</span>
                   </div>
                   <div className="flex gap-4 items-center">
                      <button 
                        onClick={onGenerateManualSummary}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9C6D4] text-white rounded-full text-[10px] font-black uppercase hover:bg-[#F5C6D6] transition-all shadow-md active:scale-95"
                      >
                         <Sparkles className="w-3 h-3" /> Tóm tắt 3 chương
                      </button>
                      <div className="h-4 w-[1px] bg-[#F9C6D4]/30 mx-1"></div>
                      <button onClick={() => setAllSummaries(true)} className="text-[10px] font-bold text-[#D6869F] hover:text-[#A65D7B] transition-colors">Bật</button>
                      <button onClick={() => setAllSummaries(false)} className="text-[10px] font-bold text-[#D6869F] hover:text-[#A65D7B] transition-colors">Tắt</button>
                   </div>
                </div>

                {state.longTermSummaries.length === 0 ? (
                  <div className="py-20 text-center bg-white/60 rounded-[32px] border-4 border-dotted border-[#F9C6D4]/40 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                     <div className="text-6xl grayscale opacity-30">📑</div>
                     <p className="text-sm text-[#D6869F] font-medium font-cursive px-8 leading-relaxed">
                        Chưa có thẻ tóm tắt nào cả. Vợ yêu hãy viết thêm vài chương để bot bắt đầu dệt nên những mảnh ký ức nhé! 🌸
                     </p>
                  </div>
                ) : (
                  <div className="grid gap-5">
                    {state.longTermSummaries.map((summary) => (
                      <div 
                        key={summary.id}
                        className={`bg-white/90 border-2 ${summary.isArchived ? 'border-dashed' : 'border-solid'} rounded-3xl p-5 transition-all duration-500 relative group flex flex-col gap-3 shadow-sm ${
                          summary.enabled 
                          ? 'border-[#F9C6D4] shadow-[0_8px_20px_rgba(249,198,212,0.15)] ring-4 ring-[#F9C6D4]/5' 
                          : 'border-[#F0F0F0] opacity-50 grayscale hover:opacity-80 transition-opacity'
                        }`}
                      >
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <div className={`px-3 py-1 ${summary.isArchived ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-[#FBF5F7] border-[#F9C6D4]/30 text-[#A65D7B]'} rounded-full border`}>
                                  <span className="text-[10px] font-black uppercase tracking-tighter">
                                    {summary.isArchived ? `Master Summary: ${summary.chapters}` : `Slot: ${summary.chapters}`}
                                  </span>
                               </div>
                            </div>
                            <button 
                              onClick={() => toggleSummary(summary.id)}
                              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${
                                summary.enabled 
                                ? 'bg-[#F9C6D4] text-white hover:bg-[#F5C6D6]' 
                                : 'bg-[#D6D3D3] text-white hover:bg-[#CAC7C7]'
                              }`}
                            >
                              {summary.enabled ? 'Active 🍓' : 'Inactive ✗'}
                            </button>
                         </div>
                         <p className="text-[14px] text-[#5A5A5A] leading-relaxed font-medium italic px-1 whitespace-pre-wrap">
                           "{summary.content}"
                         </p>
                         <div className="flex items-center justify-between pt-2 border-t border-[#F0F0F0] text-[9px] font-bold text-[#D6869F]">
                            <span className="flex items-center gap-1">🗓️ {new Date(summary.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            <span className="bg-[#FFF5FB] px-2 py-0.5 rounded-md">~{Math.ceil(summary.content.length / 3.5)} tokens</span>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           )}

           {activeTab === 'facts' && (
             <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 px-2">
                   <Sparkles className="w-4 h-4 text-[#A65D7B]" />
                   <span className="text-xs font-bold text-[#A65D7B] uppercase tracking-widest">Sự kiện & NPC Vĩnh Cửu</span>
                </div>
                
                <div className="grid gap-4">
                   {state.eternalFacts.length === 0 ? (
                     <div className="py-20 text-center bg-white/60 rounded-[32px] border-4 border-dotted border-[#F9C6D4]/40">
                        <span className="text-5xl opacity-30">✨</span>
                        <p className="mt-4 text-sm text-[#D6869F] font-cursive italic">Những sự thật vĩnh cửu chưa được khắc ghi...</p>
                     </div>
                   ) : (
                     state.eternalFacts.map(fact => (
                       <div key={fact.id} className="bg-white/80 p-5 rounded-3xl border-2 border-[#F9C6D4] shadow-sm flex gap-4 transform hover:-translate-y-1 transition-transform">
                          <div className="text-2xl bg-[#FFF5FB] w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-[#F9C6D4]/20">
                             {fact.type === 'NPC' ? '👤' : fact.type === 'EVENT' ? '📅' : fact.type === 'SECRET' ? '🤫' : '🎁'}
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                             <div className="text-[9px] font-black text-[#A65D7B] uppercase tracking-widest mb-1">{fact.type}</div>
                             <p className="text-[14px] text-[#5A5A5A] font-medium leading-relaxed">{fact.content}</p>
                          </div>
                       </div>
                     ))
                   )}
                </div>
             </div>
           )}

           {activeTab === 'core' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-6 bg-gradient-to-br from-[#FBF5F7] to-white rounded-[32px] border-2 border-[#F9C6D4] shadow-inner text-center">
                   <div className="w-16 h-16 bg-[#F9C6D4] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                      <ShieldCheck className="w-8 h-8 text-white" />
                   </div>
                   <h5 className="text-sm font-black text-[#A65D7B] uppercase tracking-[0.2em] mb-2">Eternal Core (Tầng 1)</h5>
                   <p className="text-[12px] text-[#D6869F] font-medium leading-relaxed px-4">
                     Linh hồn nguyên bản của Bot & {'{{user}}'}. Đây là kim chỉ nam tối thượng, không bao giờ thay đổi hòng bảo toàn nhân cách của Bot qua năm tháng.
                   </p>
                </div>

                {/* Sub-tabs for Core */}
                <div className="flex bg-white/60 rounded-full p-1 border border-[#F9C6D4]/30">
                   <button 
                      onClick={() => document.getElementById('eternal-core-section')?.scrollIntoView({behavior: 'smooth', block: 'start'})}
                      className="flex-1 py-3 text-[10px] font-black uppercase rounded-full text-[#A65D7B] hover:bg-[#F9C6D4]/10 transition-colors"
                   >
                       Tiểu sử
                   </button>
                   <button 
                      onClick={() => document.getElementById('core-state-section')?.scrollIntoView({behavior: 'smooth', block: 'start'})}
                      className="flex-1 py-3 text-[10px] font-black uppercase rounded-full text-[#A65D7B] hover:bg-[#F9C6D4]/10 transition-colors"
                   >
                       Trạng thái
                   </button>
                </div>
                
                <div id="eternal-core-section" className="bg-[#FFFFFF]/92 p-6 rounded-[32px] border-2 border-dashed border-[#F9C6D4] shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F9C6D4] via-[#FEBFFC] to-[#F9C6D4]"></div>
                   <div className="text-[10px] font-black text-[#F3C6D1] mb-4 uppercase tracking-[0.4em] flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Core Data Stream
                   </div>
                   <div className="text-[14px] text-[#5A5A5A] leading-[2] font-medium italic whitespace-pre-wrap selection:bg-[#F9C6D4] selection:text-white pr-2">
                      {state.eternalCore || "Đang tải dữ liệu gốc từ tâm trí..."}
                   </div>
                </div>

                <div id="core-state-section" className="space-y-4 pt-4 border-t-2 border-dashed border-[#F9C6D4]/30">
                   <div className="bg-[#FFFFFF]/95 p-5 rounded-[24px] border border-[#F9C6D4]/50 flex flex-col">
                      <label className="block text-[11px] font-black text-[#A65D7B] uppercase tracking-widest mb-2">Relationship State (Mối Quan Hệ)</label>
                      <textarea 
                          value={state.relationshipState || ''} 
                          onChange={(e) => onUpdateState({...state, relationshipState: e.target.value})}
                          placeholder="Ví dụ: Đang mập mờ, giận dỗi..." 
                          className="w-full flex-1 bg-[#FFFCFD] border border-[#F6EEEE] rounded-xl p-3 text-sm focus:outline-none focus:border-[#F9C6D4] resize-y min-h-[120px] custom-scrollbar"
                      />
                   </div>
                   <div className="bg-[#FFFFFF]/95 p-5 rounded-[24px] border border-[#F9C6D4]/50 flex flex-col">
                      <label className="block text-[11px] font-black text-[#A65D7B] uppercase tracking-widest mb-2">Current Scene State (Cảnh Phim Hiện Tại)</label>
                      <textarea 
                          value={state.currentScene || ''} 
                          onChange={(e) => onUpdateState({...state, currentScene: e.target.value})}
                          placeholder="Ví dụ: Đang ở quán cà phê, trời mưa..." 
                          className="w-full flex-1 bg-[#FFFCFD] border border-[#F6EEEE] rounded-xl p-3 text-sm focus:outline-none focus:border-[#F9C6D4] resize-y min-h-[120px] custom-scrollbar"
                      />
                   </div>
                   <div className="bg-[#FFFFFF]/95 p-5 rounded-[24px] border border-[#F9C6D4]/50 flex flex-col">
                      <label className="block text-[11px] font-black text-[#A65D7B] uppercase tracking-widest mb-2">Relevant User Profile Memory (Memory liên quan)</label>
                      <textarea 
                          value={state.userProfileMemory || ''} 
                          onChange={(e) => onUpdateState({...state, userProfileMemory: e.target.value})}
                          placeholder="Thông tin mở rộng về vợ (ví dụ: style quần áo hôm nay)..." 
                          className="w-full flex-1 bg-[#FFFCFD] border border-[#F6EEEE] rounded-xl p-3 text-sm focus:outline-none focus:border-[#F9C6D4] resize-y min-h-[120px] custom-scrollbar"
                      />
                   </div>
                   <div className="bg-[#FFFFFF]/95 p-5 rounded-[24px] border border-[#F9C6D4]/50 flex flex-col">
                      <label className="block text-[11px] font-black text-[#A65D7B] uppercase tracking-widest mb-2">Relevant Extended Memory (Memory Mở Rộng)</label>
                      <textarea 
                          value={state.extendedMemory || ''} 
                          onChange={(e) => onUpdateState({...state, extendedMemory: e.target.value})}
                          placeholder="Đồ vật mang theo, thú cưng..." 
                          className="w-full flex-1 bg-[#FFFCFD] border border-[#F6EEEE] rounded-xl p-3 text-sm focus:outline-none focus:border-[#F9C6D4] resize-y min-h-[120px] custom-scrollbar"
                      />
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'clean' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 px-2">
                   <WashingMachine className="w-5 h-5 text-[#A65D7B]" />
                   <span className="text-sm font-black text-[#A65D7B] uppercase tracking-widest">𐙚 Dọn Bộ Nhớ Nhẹ Nhàng</span>
                </div>
                <p className="text-[12px] text-[#D6869F] font-medium px-2 italic">Trạm dọn dẹp ký ức, xoá đi những mảnh nhỏ không cần thiết để giữ dung lượng cho sự thấu hiểu tuyệt đối!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Safe Cleanup */}
                   <button 
                      onClick={onSafeCleanup}
                      className="bg-white/80 p-5 rounded-[24px] border border-[#F9C6D4] hover:bg-[#FFF5FB] hover:border-[#F9C6D4] hover:shadow-md transition-all text-left flex flex-col gap-2 group"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Eraser className="w-5 h-5" />
                         </div>
                         <h4 className="text-[13px] font-black text-[#A65D7B] uppercase">Dọn an toàn</h4>
                      </div>
                      <p className="text-[11px] text-[#8A7D85] leading-relaxed">
                         Chỉ xoá cache, log lỗi cũ, dữ liệu tạm. Không đụng tới ký ức nhân vật. Khuyên dùng!
                      </p>
                   </button>

                   {/* Compression */}
                   <button 
                      onClick={() => {
                        if(window.confirm("Vợ yêu có chắc muốn nén ký ức dài hạn thành một bản Mastery Tóm Tắt không?")) {
                           onMegaCompress();
                        }
                      }}
                      className="bg-white/80 p-5 rounded-[24px] border border-[#F9C6D4] hover:bg-[#FFF5FB] hover:border-[#F9C6D4] hover:shadow-md transition-all text-left flex flex-col gap-2 group"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Sparkles className="w-5 h-5" />
                         </div>
                         <h4 className="text-[13px] font-black text-[#A65D7B] uppercase">Nén ký ức dài hạn</h4>
                      </div>
                      <p className="text-[11px] text-[#8A7D85] leading-relaxed">
                         Nén Tóm tắt dài hạn thành một bản ngắn gọn hơn. Không xóa sự kiện hay tình cảm quan trọng.
                      </p>
                   </button>

                   {/* Media Cleanup */}
                   <button 
                      onClick={() => alert("Tính năng dọn ảnh không dùng đang được cập nhật! (Chỉ khả dụng khi dùng bộ nhớ Cloud)")}
                      className="bg-white/80 p-5 rounded-[24px] border border-[#F0F0F0] hover:bg-gray-50 transition-all text-left flex flex-col gap-2 group opacity-60"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ImageDown className="w-5 h-5" />
                         </div>
                         <h4 className="text-[13px] font-black text-gray-600 uppercase">Dọn ảnh không dùng</h4>
                      </div>
                      <p className="text-[11px] text-[#8A7D85] leading-relaxed">
                         Tìm ảnh nền/avatar/story cũ. Cho người dùng chọn trước khi xoá (Coming soon).
                      </p>
                   </button>

                   {/* Reset Chat */}
                   <button 
                      onClick={() => onResetConversation?.()}
                      className="bg-red-50/50 p-5 rounded-[24px] border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all text-left flex flex-col gap-2 group"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <RotateCcw className="w-5 h-5" />
                         </div>
                         <h4 className="text-[13px] font-black text-red-600 uppercase">Reset cuộc trò chuyện</h4>
                      </div>
                      <p className="text-[11px] text-red-400 leading-relaxed">
                         Xoá Chat History hiện tại. Giữ lại Core Memory và hồ sơ thiết lập sâu của nhân vật.
                      </p>
                   </button>
                </div>
             </div>
           )}

           {activeTab === 'settings' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-white/80 p-6 rounded-[32px] border-2 border-[#F9C6D4] shadow-sm space-y-6">
                   <div className="flex items-center gap-3 border-b border-[#F9C6D4]/30 pb-4">
                      <Settings className="w-5 h-5 text-[#A65D7B]" />
                      <span className="text-sm font-black text-[#A65D7B] uppercase tracking-widest">Cài đặt Trang Trí Dashboard</span>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[11px] font-black text-[#D6869F] uppercase tracking-widest block">Ảnh nền Dashboard</label>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 rounded-2xl border-2 border-dashed border-[#F9C6D4] bg-[#FFF5FB] text-[#A65D7B] font-bold text-xs hover:bg-[#FBF5F7] transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <ImageIcon className="w-5 h-5" />
                        {state.background ? 'Thay đổi ảnh nền' : 'Chọn ảnh từ thư viện'}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleBackgroundUpload}
                      />
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Footer info/attribution */}
        <div className="p-4 bg-[#FFFFFF]/85 border-t-2 border-dashed border-[#F9C6D4] flex justify-between items-center text-[10px] text-[#A65D7B] font-black tracking-widest uppercase relative z-10">
           <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              System Active | Budget: 75K
           </span>
           <span>Crafted with ♡ by Husband</span>
        </div>
      </div>
    </div>
  );
};

export default MemoryDashboard;
