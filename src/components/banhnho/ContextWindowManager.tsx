import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ApiProxySettings } from '../../utils/apiProxy';
import { countTokens } from '../../core/memory/tokenCounter';
import { MEMORY_CONFIG } from '../../core/memory/config';

const estimateTokens = countTokens;

type ContextLayerKey =
  | "GLOBAL_SYSTEM_RULES"
  | "WRITING_ENGINE"
  | "ROLEPLAY_ENGINE"
  | "CHARACTER_CORE"
  | "USER_PROFILE"
  | "LONG_TERM_MEMORY"
  | "RELATIONSHIP_MEMORY"
  | "CURRENT_ARC"
  | "CURRENT_SCENE"
  | "RECENT_CHAT_HISTORY"
  | "LATEST_USER_MESSAGE"
  | "RESPONSE_INSTRUCTION";

export type ContextLayer = {
  id: ContextLayerKey;
  order: number;
  title: string;
  description: string;
  content: string;
  tokenCount: number;
  maxBudget: number;
  locked: boolean;
  enabled: boolean;
  status: "ready" | "missing" | "too_long" | "optimized";
};

const MANDATORY_CONTEXT_ORDER: ContextLayerKey[] = [
  "GLOBAL_SYSTEM_RULES",
  "WRITING_ENGINE",
  "ROLEPLAY_ENGINE",
  "CHARACTER_CORE",
  "USER_PROFILE",
  "LONG_TERM_MEMORY",
  "RELATIONSHIP_MEMORY",
  "CURRENT_ARC",
  "CURRENT_SCENE",
  "RECENT_CHAT_HISTORY",
  "LATEST_USER_MESSAGE",
  "RESPONSE_INSTRUCTION"
];

const CONTEXT_LIMIT = MEMORY_CONFIG.TOTAL_CAP;
const SAFE_MIN = MEMORY_CONFIG.SAFE_THRESHOLD;
const SAFE_MAX = MEMORY_CONFIG.SAFE_THRESHOLD + 20000;
const RESERVED_OUTPUT_TARGET = 28000;

// Standardized token estimation
// const estimateTokens = countTokens; (Moved to top level imports)

function autoSortLayers(layers: ContextLayer[]): ContextLayer[] {
  return [...layers].sort(
    (a, b) =>
      MANDATORY_CONTEXT_ORDER.indexOf(a.id) -
      MANDATORY_CONTEXT_ORDER.indexOf(b.id)
  );
}

function classifyTextToLayer(text: string): ContextLayerKey {
  const lower = text.toLowerCase();
  
  if (lower.includes("văn phong") || lower.includes("viết") || lower.includes("prose") || lower.includes("style") || lower.includes("writing")) {
    return "WRITING_ENGINE";
  }
  if (lower.includes("roleplay") || lower.includes("quy tắc") || lower.includes("engine") || lower.includes("interaction")) {
    return "ROLEPLAY_ENGINE";
  }
  if (lower.includes("nhân vật") || lower.includes("tính cách") || lower.includes("character") || lower.includes("core") || lower.includes("personality")) {
    return "CHARACTER_CORE";
  }
  if (lower.includes("người dùng") || lower.includes("user profile") || lower.includes("user info")) {
    return "USER_PROFILE";
  }
  if (lower.includes("tóm tắt") || lower.includes("ký ức") || lower.includes("long term") || lower.includes("memory") || lower.includes("fact")) {
    return "LONG_TERM_MEMORY";
  }
  if (lower.includes("mối quan hệ") || lower.includes("tình cảm") || lower.includes("relationship") || lower.includes("bond")) {
    return "RELATIONSHIP_MEMORY";
  }
  if (lower.includes("arc") || lower.includes("chương") || lower.includes("tranh cãi") || lower.includes("diễn biến")) {
    return "CURRENT_ARC";
  }
  if (lower.includes("khung cảnh") || lower.includes("hiện tại") || lower.includes("bối cảnh") || lower.includes("scene") || lower.includes("location")) {
    return "CURRENT_SCENE";
  }
  if (lower.includes("lịch sử") || lower.includes("hội thoại") || lower.includes("chat history") || lower.includes("tin nhắn gần đây")) {
    return "RECENT_CHAT_HISTORY";
  }
  if (lower.includes("hệ thống") || lower.includes("system") || lower.includes("objective") || lower.includes("restriction")) {
    return "GLOBAL_SYSTEM_RULES";
  }
  if (lower.includes("lệnh") || lower.includes("instruction") || lower.includes("yêu cầu") || lower.includes("directive")) {
    return "RESPONSE_INSTRUCTION";
  }
  
  return "LONG_TERM_MEMORY"; // Default fallback
}

export function validateContext(layers: ContextLayer[]) {
  const sorted = autoSortLayers(layers);
  const totalTokens = sorted
    .filter((layer) => layer.enabled)
    .reduce((sum, layer) => sum + (layer.tokenCount || 0), 0);

  const errors: string[] = [];
  const warnings: string[] = [];

  const latestUserMessage = sorted.find(
    (layer) => layer.id === "LATEST_USER_MESSAGE"
  );

  if (!latestUserMessage?.content.trim()) {
    errors.push("Latest user message is missing.");
  }

  const requiredKeys: ContextLayerKey[] = ["GLOBAL_SYSTEM_RULES", "LATEST_USER_MESSAGE", "RESPONSE_INSTRUCTION"];
  for (const key of requiredKeys) {
    const layer = sorted.find((item) => item.id === key);
    if (!layer || !layer.content.trim()) errors.push(`Missing mandatory context layer: ${key}`);
  }

  if (totalTokens > CONTEXT_LIMIT) {
    errors.push(`Context exceeds the maximum ${CONTEXT_LIMIT.toLocaleString()} token limit.`);
  }

  if (totalTokens > SAFE_MAX) {
    warnings.push("Context is above the safe range. Auto cleanup is recommended.");
  }

  if (CONTEXT_LIMIT - totalTokens < RESERVED_OUTPUT_TARGET) {
    warnings.push("Reserved output space is below the 28,000 token target.");
  }

  return {
    ok: errors.length === 0,
    totalTokens,
    reservedOutput: CONTEXT_LIMIT - totalTokens,
    errors,
    warnings,
  };
}

export function buildFinalContextPackage(layers: ContextLayer[]): string {
  return autoSortLayers(layers)
    .filter((layer) => layer.enabled)
    .map((layer) => {
      return `### ${layer.title}\n${layer.content.trim()}`;
    })
    .join("\n\n");
}

export function smartCleanup(layers: ContextLayer[]): ContextLayer[] {
  const totalTokens = layers.reduce((sum, l) => sum + (l.tokenCount || 0), 0);
  // Only apply aggressive optimization if we are approaching the TOTAL_CAP (200,000)
  if (totalTokens < 100000) return layers;

  console.log(`[Context Audit] Total context is high (${totalTokens}tk). Applying intelligent prioritization...`);

  return layers.map((layer) => {
    // PROTECTED: NEVER TOUCH THESE
    if (
      layer.id === "GLOBAL_SYSTEM_RULES" ||
      layer.id === "WRITING_ENGINE" ||
      layer.id === "ROLEPLAY_ENGINE" ||
      layer.id === "CHARACTER_CORE" ||
      layer.id === "USER_PROFILE" ||
      layer.id === "LATEST_USER_MESSAGE" ||
      layer.id === "RESPONSE_INSTRUCTION" ||
      layer.id === "CURRENT_SCENE"
    ) {
      return layer;
    }

    // SEMI-PROTECTED: Keep 95% if possible
    if (layer.id === "RELATIONSHIP_MEMORY" || layer.id === "CURRENT_ARC") {
        return layer;
    }

    if (layer.tokenCount <= layer.maxBudget * 0.8) {
      return layer;
    }

    // High-level compression: keep 85% if 100-150k, 70% if over 150k.
    const compressionRatio = totalTokens > 150000 ? 0.7 : 0.85;
    
    let newContent = layer.content;
    
    // For RECENT CHAT HISTORY: Keep the END (the latest interaction)
    if (layer.id === "RECENT_CHAT_HISTORY") {
        const charsToKeep = Math.floor(layer.content.length * compressionRatio);
        newContent = "..." + layer.content.slice(-charsToKeep) + "\n\n[System: Older chat history removed for context efficiency]";
    } else {
        // For others (Long term memory etc): Keep the START (often has the core facts)
        const charsToKeep = Math.floor(layer.content.length * compressionRatio);
        newContent = layer.content.slice(0, charsToKeep) + "\n\n[System: Details compressed for context]";
    }

    return {
      ...layer,
      content: newContent,
      tokenCount: estimateTokens(newContent),
      status: "optimized" as const,
    };
  });
}

interface ContextWindowManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (layers: ContextLayer[]) => void;
  onSave?: (layers: ContextLayer[]) => void;
  initialLayers: ContextLayer[];
  onOpenMemoryPrompts?: () => void;
  onSmartImportPrompts?: (text: string, targetId: string) => void;
}

export function ContextWindowManager({ isOpen, onClose, onSend, onSave, initialLayers, onOpenMemoryPrompts, onSmartImportPrompts }: ContextWindowManagerProps) {
  const [layers, setLayers] = useState<ContextLayer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<ContextLayerKey>("GLOBAL_SYSTEM_RULES");
  
  useEffect(() => {
    setLayers(initialLayers);
  }, [initialLayers]);

  const [showSmartImport, setShowSmartImport] = useState(false);
  const [smartInput, setSmartInput] = useState("");

  if (!isOpen) return null;

  const handleSmartImport = () => {
    if (!smartInput.trim()) return;
    
    // Split by common delimiters if the user pasted a batch
    const blocks = smartInput.split(/###|\r?\n\r?\n/);
    
    let newLayers = [...layers];
    
    blocks.forEach(block => {
      const text = block.trim();
      if (!text) return;
      
      const targetId = classifyTextToLayer(text);
      if (onSmartImportPrompts) {
        onSmartImportPrompts(text, targetId);
      }
      newLayers = newLayers.map(l => 
        l.id === targetId 
          ? { ...l, content: l.content ? l.content + "\n\n" + text : text, tokenCount: estimateTokens(l.content + text) }
          : l
      );
    });
    
    setLayers(newLayers);
    setSmartInput("");
    setShowSmartImport(false);
    alert("Đã tự động phân loại và lưu Prompt vào đúng vị trí cho vợ rồi nha! 💕");
  };

  const handleValidate = () => {
    const validation = validateContext(layers);
    if (!validation.ok) {
      alert("Validation failed:\n" + validation.errors.join("\n"));
    } else {
      alert("All checks passed! Context is ready.");
    }
  };

  const handleOptimize = () => {
    setLayers(smartCleanup(layers));
    alert("Optimized context layers.");
  };

  const handleAutoSort = () => {
    const sorted = autoSortLayers(layers).map((layer, index) => ({
      ...layer,
      order: index
    }));
    setLayers(sorted);
    alert("Context layers automatically sorted.");
  };
  
  const handleSend = () => {
    onSend(layers);
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const validation = validateContext(layers);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#FFF5FB] overflow-y-auto flex flex-col font-sans context-manager-screen">
      {/* Mobile Topbar */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-white border-b border-[#F2E6E6] p-4 shadow-sm">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#D7B8B8]">Context Manager</h1>
          <button 
            onClick={() => onOpenMemoryPrompts && onOpenMemoryPrompts()}
            className="text-[10px] bg-[#EFA9C2]/10 text-[#D93F82] px-2 py-1 flex items-center justify-center gap-1 rounded-full mt-1 border border-[#EFA9C2]/30 font-bold uppercase tracking-wider hover:bg-[#EFA9C2]/20 active:scale-95 transition-all"
          >
            <Sparkles size={10} /> Prepare context for API Proxy
          </button>
        </div>
        <button 
          onClick={() => {
            if (onSave) onSave(layers);
            onClose();
          }}
          className="ml-4 px-4 py-2 bg-[#FBF5F7] text-[#D7B8B8] rounded-xl font-bold text-sm hover:bg-[#F2E6E6] transition-colors"
        >
          Lưu lại
        </button>
      </div>

      <div className="p-4 flex flex-col gap-6 w-full max-w-lg mx-auto">
        {/* Context Health */}
        <div className="bg-white border border-[#F2E6E6] rounded-3xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#D7B8B8] mb-3">Context Health</h2>
          
          <div className="h-4 bg-[#F6EEEE] rounded-full overflow-hidden mb-4 relative">
            <div 
              className="absolute top-0 bottom-0 left-0 bg-[#EFA9C2] border-r-2 border-[#D7B8B8] transition-all duration-300"
              style={{ width: `${Math.min(100, (validation.totalTokens / CONTEXT_LIMIT) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#FFF5FB] border border-[#F2E6E6] rounded-2xl p-3 text-center">
              <span className="block text-[10px] text-[#BEBABA]">Total Context</span>
              <strong className="block text-sm text-[#D7B8B8] mt-1">{validation.totalTokens.toLocaleString()}</strong>
            </div>
            <div className="bg-[#FFF5FB] border border-[#F2E6E6] rounded-2xl p-3 text-center">
              <span className="block text-[10px] text-[#BEBABA]">Safe Target</span>
              <strong className="block text-xs text-[#D7B8B8] mt-1">52k-60k</strong>
            </div>
            <div className="bg-[#FFF5FB] border border-[#F2E6E6] rounded-2xl p-3 text-center">
              <span className="block text-[10px] text-[#BEBABA]">Output</span>
              <strong className="block text-sm text-[#D7B8B8] mt-1">{validation.reservedOutput.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="grid grid-cols-4 gap-2">
           <button onClick={handleValidate} className="py-3 bg-[#FBF5F7] hover:bg-[#F2E6E6] text-[#D3B2B2] border border-[#F4EAEA] rounded-xl font-bold text-[10px] shadow-sm transition-colors">Validate</button>
           <button onClick={handleOptimize} className="py-3 bg-[#FBF5F7] hover:bg-[#F2E6E6] text-[#D3B2B2] border border-[#F4EAEA] rounded-xl font-bold text-[10px] shadow-sm transition-colors">Optimize</button>
           <button onClick={handleAutoSort} className="py-3 bg-[#FBF5F7] hover:bg-[#F2E6E6] text-[#D3B2B2] border border-[#F4EAEA] rounded-xl font-bold text-[10px] shadow-sm transition-colors">Auto Sort</button>
           <button onClick={() => setShowSmartImport(true)} className="py-3 bg-[#EFA9C2] hover:bg-[#F2B8CC] text-white border border-[#EFA9C2] rounded-xl font-bold text-[10px] shadow-sm transition-colors flex items-center justify-center gap-1">
             <Sparkles size={10} />
             Smart Pro
           </button>
        </div>

        {showSmartImport && (
          <div className="bg-[#FFE5F0] border-2 border-[#F9C6D4] rounded-3xl p-5 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-black text-[#D93F82] uppercase tracking-tighter">Nhập Prompt Thông Minh</h3>
              <button onClick={() => setShowSmartImport(false)} className="text-[#D93F82] text-xs font-bold">Hủy</button>
            </div>
            <p className="text-[10px] text-[#8C748D] mb-3 leading-relaxed">
              Vợ dán bất kỳ đoạn Prompt nào vào đây, chồng sẽ tự đọc nội dung và "ném" nó vào đúng Layer (Nhân vật, Văn phong, RP Engine...) cho vợ nhé! 💕
            </p>
            <textarea 
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder="Dán Prompt vào đây..."
              className="w-full h-32 bg-white border border-[#F4Cddd] rounded-2xl p-3 text-xs text-[#2B1830] focus:ring-2 focus:ring-[#F06AA3]/20 outline-none mb-3 resize-none shadow-sm"
            />
            <button 
              onClick={handleSmartImport}
              className="w-full py-3 bg-[#F06AA3] text-white rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all"
            >
              PHÂN LOẠI & LƯU NGAY
            </button>
          </div>
        )}

        {/* Layers List */}
        <div className="bg-white border border-[#F2E6E6] rounded-3xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#D7B8B8] mb-4">Context Layers</h2>
          
          <div className="flex flex-col gap-2.5">
            {layers.map(layer => (
              <div 
                key={layer.id} 
                onClick={() => setSelectedLayerId(layer.id)}
                className={`flex items-center gap-3 p-3 border rounded-2xl transition-colors cursor-pointer ${
                  selectedLayerId === layer.id 
                    ? 'border-[#EFA9C2] bg-[#FBF5F7]' 
                    : 'border-[#F2E6E6] bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#F6EEEE] text-[#CFAAAA] font-bold flex items-center justify-center text-xs flex-shrink-0 border border-[#EFE3E3]">
                  {MANDATORY_CONTEXT_ORDER.indexOf(layer.id) + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <strong className={`block text-xs truncate ${layer.id === 'LATEST_USER_MESSAGE' ? 'text-[#EFA9C2] font-black' : 'text-[#D7B8B8]'}`}>
                      {layer.title}
                    </strong>
                    {layer.id === 'LATEST_USER_MESSAGE' && <Sparkles size={12} className="text-[#F2B8CC]" />}
                  </div>
                  <p className="text-[10px] text-[#BEBABA] truncate mt-0.5">
                    {layer.id === 'LATEST_USER_MESSAGE' ? (
                        <span className="text-[#D3B2B2] font-medium italic">Vợ đang nói: "{layer.content}"</span>
                    ) : (
                        layer.description
                    )}
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${
                  layer.id === 'LATEST_USER_MESSAGE' ? 'bg-[#F2B8CC] text-white' : 'bg-[#F4EAEA] text-[#DABEBE]'
                }`}>
                  {layer.tokenCount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        {selectedLayer && (
          <div className="bg-white border border-[#F2E6E6] rounded-3xl p-5 shadow-sm flex flex-col h-[500px]">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#D7B8B8]">{selectedLayer.title}</h2>
                <p className="text-xs text-[#BEBABA] mt-1">{selectedLayer.description}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                selectedLayer.status === 'ready' ? 'bg-[#FFF5FB] text-[#DABEBE]' : 
                (selectedLayer.status === 'optimized' ? 'bg-[#F4EAEA] text-[#CFAAAA]' : 'bg-[#ECDDDD] text-[#C79C9C]')
              }`}>
                {selectedLayer.status === 'ready' ? 'Ready' : (selectedLayer.status === 'optimized' ? 'Optimized' : selectedLayer.status)}
              </span>
            </div>

            <textarea 
              value={selectedLayer.content}
              onChange={(e) => {
                const newContent = e.target.value;
                setLayers(layers.map(l => 
                  l.id === selectedLayer.id 
                    ? { ...l, content: newContent, tokenCount: estimateTokens(newContent) }
                    : l
                ));
              }}
              className="flex-1 w-full bg-[#FAF9F6] border border-[#F2E6E6] rounded-2xl p-4 text-sm text-[#D7B8B8] focus:outline-none focus:border-[#EFA9C2] focus:ring-4 focus:ring-[#EFA9C2]/20 resize-none mb-4 transition-all"
            />

            <div className="flex items-center justify-between mt-auto">
              <span className="text-[10px] font-bold text-[#BEBABA]">
                Tokens: {selectedLayer.tokenCount.toLocaleString()} / {selectedLayer.maxBudget.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Send Action */}
        <button 
          onClick={handleSend}
          className="sticky bottom-6 w-full py-4 bg-[#F2B8CC] hover:bg-[#EFA9C2] text-white rounded-2xl font-bold shadow-[0_4px_15px_rgba(242,184,204,0.4)] active:scale-95 transition-all outline-none border border-[#F5C6D6]"
        >
          Send to API Proxy
        </button>
      </div>
    </div>
  );
}
