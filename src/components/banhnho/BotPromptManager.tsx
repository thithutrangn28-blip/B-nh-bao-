import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Folder, FolderPlus, Plus, Search, Trash2, 
  Copy, Edit2, CheckCircle2, Circle, Save, ChevronDown, 
  MoreVertical, Filter, X, ChevronRight, AlertCircle, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Prompt {
  id: string;
  name: string;
  content: string;
  folderId: string;
  enabled: boolean;
  createdAt: number;
  category: string;
}

interface FolderType {
  id: string;
  name: string;
  color?: string;
}

interface BotPromptManagerProps {
  prompts: Prompt[];
  onPromptsChange: (prompts: Prompt[]) => void;
}

const DEFAULT_FOLDERS: FolderType[] = [
  { id: 'roleplay', name: 'Roleplay dài' },
  { id: 'personality', name: 'Tính cách nhân vật' },
  { id: 'dialogue', name: 'Hội thoại' },
  { id: 'writing-style', name: 'Văn phong' },
  { id: 'lorebook', name: 'Lorebook' },
  { id: 'memory', name: 'Bộ nhớ' },
  { id: 'relationship', name: 'Quy tắc tình cảm' },
  { id: 'uncategorized', name: 'Khác' },
];

export const BotPromptManager: React.FC<BotPromptManagerProps> = ({ prompts, onPromptsChange }) => {
  const [folders, setFolders] = useState<FolderType[]>(() => {
    const saved = localStorage.getItem('kikoko_prompt_folders');
    return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formFolderId, setFormFolderId] = useState('uncategorized');

  useEffect(() => {
    localStorage.setItem('kikoko_prompt_folders', JSON.stringify(folders));
  }, [folders]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = selectedFolder === 'all' || p.folderId === selectedFolder;
      return matchesSearch && matchesFolder;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [prompts, searchQuery, selectedFolder]);

  const stats = useMemo(() => {
    const enabled = prompts.filter(p => p.enabled);
    const totalChars = enabled.reduce((acc, p) => acc + p.content.length, 0);
    const estTokens = Math.ceil(totalChars / 4);
    return { count: enabled.length, chars: totalChars, tokens: estTokens };
  }, [prompts]);

  const handleAddPrompt = () => {
    if (!formName.trim() || !formContent.trim()) return;

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      name: formName,
      content: formContent,
      folderId: formFolderId,
      enabled: true,
      createdAt: Date.now(),
      category: folders.find(f => f.id === formFolderId)?.name || 'Khác'
    };

    onPromptsChange([...prompts, newPrompt]);
    resetForm();
  };

  const handleUpdatePrompt = () => {
    if (!editingPromptId || !formName.trim() || !formContent.trim()) return;

    const updated = prompts.map(p => 
      p.id === editingPromptId 
        ? { ...p, name: formName, content: formContent, folderId: formFolderId, category: folders.find(f => f.id === formFolderId)?.name || 'Khác' }
        : p
    );

    onPromptsChange(updated);
    resetForm();
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPromptId(prompt.id);
    setFormName(prompt.name);
    setFormContent(prompt.content);
    setFormFolderId(prompt.folderId);
    setIsAddingPrompt(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormContent('');
    setFormFolderId('uncategorized');
    setIsAddingPrompt(false);
    setEditingPromptId(null);
  };

  const togglePrompt = (id: string) => {
    onPromptsChange(prompts.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const deletePrompt = (id: string) => {
    onPromptsChange(prompts.filter(p => p.id !== id));
    setSelectedPromptIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const duplicatePrompt = (id: string) => {
    const original = prompts.find(p => p.id === id);
    if (original) {
      const duplicated: Prompt = {
        ...original,
        id: crypto.randomUUID(),
        name: `${original.name} (Bản sao)`,
        createdAt: Date.now()
      };
      onPromptsChange([...prompts, duplicated]);
    }
  };

  const handleBulkAction = (action: 'enable' | 'disable' | 'delete' | 'duplicate') => {
    if (selectedPromptIds.size === 0) return;

    if (action === 'delete') {
      onPromptsChange(prompts.filter(p => !selectedPromptIds.has(p.id)));
      setSelectedPromptIds(new Set());
    } else if (action === 'enable') {
      onPromptsChange(prompts.map(p => selectedPromptIds.has(p.id) ? { ...p, enabled: true } : p));
    } else if (action === 'disable') {
      onPromptsChange(prompts.map(p => selectedPromptIds.has(p.id) ? { ...p, enabled: false } : p));
    } else if (action === 'duplicate') {
      const newPrompts = [...prompts];
      prompts.forEach(p => {
        if (selectedPromptIds.has(p.id)) {
          newPrompts.push({
            ...p,
            id: crypto.randomUUID(),
            name: `${p.name} (Bản sao)`,
            createdAt: Date.now()
          });
        }
      });
      onPromptsChange(newPrompts);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedPromptIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: FolderType = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
    };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  return (
    <div className="w-full bg-[#FBF5F7] rounded-3xl overflow-hidden border border-[#F9C6D4] shadow-sm mb-6 font-sans">
      {/* Header */}
      <div className="p-5 bg-white border-b border-[#F9C6D4] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#FBF5F7] border border-[#F9C6D4] flex items-center justify-center text-[#D7B8B8]">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-[#D7B8B8] font-semibold text-lg leading-tight uppercase tracking-wider">Professional Prompt Manager</h3>
              <p className="text-xs text-[#CFAAAA] font-medium italic">Manage behavior & writing rules</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddingPrompt(true)}
            className="flex items-center gap-2 bg-[#F9C6D4] text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-md hover:scale-105 transition-transform active:scale-95"
          >
            <Plus size={18} />
            THÊM PROMPT
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex-shrink-0 bg-[#FBF5F7] border border-[#F9C6D4] px-4 py-2 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#EFA9C2]" />
            <span className="text-xs font-bold text-[#D7B8B8]">{stats.count} Prompt được bật</span>
          </div>
          <div className="flex-shrink-0 bg-[#FBF5F7] border border-[#F9C6D4] px-4 py-2 rounded-2xl flex items-center gap-2">
            <span className="text-xs font-bold text-[#D7B8B8]">{stats.chars.toLocaleString()} Ký tự</span>
          </div>
          <div className="flex-shrink-0 bg-[#FBF5F7] border border-[#F9C6D4] px-4 py-2 rounded-2xl flex items-center gap-2">
            <span className="text-xs font-bold text-[#D7B8B8]">~{stats.tokens.toLocaleString()} Tokens</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#CFAAAA]" size={16} />
            <input 
              type="text"
              placeholder="Tìm kiếm prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#F9C6D4] rounded-2xl py-2 pl-10 pr-4 text-sm text-[#D7B8B8] focus:outline-none focus:ring-2 focus:ring-[#F9C6D4]/50"
            />
          </div>
          <button 
            onClick={() => setIsAddingFolder(true)}
            className="w-10 h-10 flex-shrink-0 bg-white border border-[#F9C6D4] rounded-2xl flex items-center justify-center text-[#D7B8B8] hover:bg-[#FBF5F7]"
          >
            <FolderPlus size={18} />
          </button>
        </div>

        {/* Folders Scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setSelectedFolder('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-colors ${
              selectedFolder === 'all' 
                ? 'bg-[#F9C6D4] text-white shadow-md' 
                : 'bg-white text-[#D7B8B8] border border-[#F9C6D4]'
            }`}
          >
            Tất cả
          </button>
          {folders.map(folder => (
            <button 
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-colors ${
                selectedFolder === folder.id 
                  ? 'bg-[#F9C6D4] text-white shadow-md' 
                  : 'bg-white text-[#D7B8B8] border border-[#F9C6D4]'
              }`}
            >
              {folder.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Header */}
      <AnimatePresence>
        {selectedPromptIds.size > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 overflow-hidden"
          >
            <div className="bg-[#EFA9C2] rounded-2xl p-3 flex items-center justify-between text-white shadow-inner">
              <span className="text-xs font-bold">Đã chọn {selectedPromptIds.size} prompt</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkAction('enable')}
                  className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30"
                  title="Bật tất cả"
                >
                  <CheckCircle2 size={16} />
                </button>
                <button 
                  onClick={() => handleBulkAction('disable')}
                  className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30"
                  title="Tắt tất cả"
                >
                  <Circle size={16} />
                </button>
                <button 
                  onClick={() => handleBulkAction('duplicate')}
                  className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30"
                  title="Nhân bản"
                >
                  <Copy size={16} />
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="p-1.5 bg-red-400/80 rounded-lg hover:bg-red-400"
                  title="Xóa đã chọn"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setSelectedPromptIds(new Set())}
                  className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt List */}
      <div className="px-4 pb-6 flex flex-col gap-3">
        {filteredPrompts.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#CFAAAA] gap-2">
            <AlertCircle size={32} />
            <p className="text-sm font-medium italic">Không tìm thấy prompt nào...</p>
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <motion.div 
              layout
              key={prompt.id}
              className={`bg-white rounded-2xl border transition-all ${
                prompt.enabled ? 'border-[#F9C6D4] shadow-sm' : 'border-gray-200 opacity-75'
              }`}
            >
              <div className="p-4 flex gap-3">
                <button 
                  onClick={() => toggleSelection(prompt.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    selectedPromptIds.has(prompt.id)
                      ? 'bg-[#EFA9C2] border-[#EFA9C2] text-white'
                      : 'border-[#F9C6D4]/50'
                  }`}
                >
                  {selectedPromptIds.has(prompt.id) && <CheckCircle2 size={14} />}
                </button>

                <div className="flex-grow min-w-0" onClick={() => handleEdit(prompt)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#D7B8B8] truncate">{prompt.name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#FBF5F7] text-[#CFAAAA] rounded-full border border-[#F9C6D4]/30 uppercase font-bold">
                      {prompt.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#CFAAAA] line-clamp-2 italic">
                    {prompt.content}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => togglePrompt(prompt.id)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      prompt.enabled ? 'bg-[#EFA9C2]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                      prompt.enabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); duplicatePrompt(prompt.id); }}
                      className="text-[#CFAAAA] hover:text-[#EFA9C2]"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePrompt(prompt.id); }}
                      className="text-[#CFAAAA] hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddingPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-[#FBF5F7] border-b border-[#F9C6D4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#F9C6D4] flex items-center justify-center text-[#EFA9C2]">
                    <Plus size={20} />
                  </div>
                  <h4 className="font-bold text-[#D7B8B8] uppercase tracking-wider">
                    {editingPromptId ? 'Sửa Prompt' : 'Tạo Prompt Mới'}
                  </h4>
                </div>
                <button onClick={resetForm} className="p-2 text-[#CFAAAA] hover:bg-white rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto no-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-[#D7B8B8] uppercase mb-2 ml-1">Tên Prompt Command</label>
                  <input 
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Mô tả biểu cảm khuôn mặt"
                    className="w-full bg-[#FBF5F7] border border-[#F9C6D4] rounded-2xl px-4 py-3 text-sm text-[#D7B8B8] focus:outline-none focus:ring-2 focus:ring-[#F9C6D4]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D7B8B8] uppercase mb-2 ml-1">Chọn Thư Mục</label>
                  <div className="grid grid-cols-2 gap-2">
                    {folders.map(folder => (
                      <button 
                        key={folder.id}
                        onClick={() => setFormFolderId(folder.id)}
                        className={`px-3 py-2 rounded-2xl text-[10px] font-bold border transition-all ${
                          formFolderId === folder.id 
                            ? 'bg-[#F9C6D4] text-white border-[#F9C6D4] shadow-sm'
                            : 'bg-white text-[#D7B8B8] border-[#F9C6D4]/30'
                        }`}
                      >
                        {folder.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-[#D7B8B8] uppercase mb-2 ml-1">Nội dung câu lệnh (Prompt)</label>
                  <textarea 
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Nhập nội dung câu lệnh thủ công tại đây..."
                    className="w-full h-40 bg-[#FBF5F7] border border-[#F9C6D4] rounded-3xl p-4 text-sm text-[#D7B8B8] focus:outline-none focus:ring-2 focus:ring-[#F9C6D4]/50 resize-none font-sans"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#CFAAAA] bg-white px-2 py-1 rounded-full border border-[#F9C6D4]/30">
                      {formContent.length} / ~{Math.ceil(formContent.length / 4)} Tokens
                    </span>
                  </div>
                </div>

                <div className="bg-[#FFF5FB] border border-[#F9C6D4]/50 rounded-2xl p-3 flex gap-3">
                  <div className="text-[#EFA9C2] mt-0.5">
                    <Heart size={16} fill="currentColor" />
                  </div>
                  <p className="text-[10px] text-[#CFAAAA] italic leading-relaxed">
                    Prompt Manager giúp quản lý các quy tắc viết riêng biệt. Chỉ những prompt được BẬT ở ngoài danh sách mới được gửi vào bộ não của Bot khi bắt đầu Roleplay.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-[#F9C6D4] grid grid-cols-2 gap-3">
                <button 
                  onClick={resetForm}
                  className="w-full bg-white border border-[#D7B8B8] text-[#D7B8B8] font-bold py-3 rounded-2xl text-sm"
                >
                  HỦY BỎ
                </button>
                <button 
                  onClick={editingPromptId ? handleUpdatePrompt : handleAddPrompt}
                  className="w-full bg-[#F9C6D4] text-white font-bold py-3 rounded-2xl text-sm shadow-md active:scale-95 transition-transform"
                >
                  {editingPromptId ? 'CẬP NHẬT' : 'LƯU PROMPT'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      <AnimatePresence>
        {isAddingFolder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl border border-[#F9C6D4]"
            >
              <div className="w-12 h-12 bg-[#FBF5F7] rounded-2xl flex items-center justify-center text-[#EFA9C2] mx-auto mb-4 border border-[#F9C6D4]">
                <FolderPlus size={24} />
              </div>
              <h5 className="font-bold text-[#D7B8B8] mb-4">THÊM THƯ MỤC MỚI</h5>
              <input 
                autoFocus
                type="text"
                placeholder="Tên thư mục..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                className="w-full bg-[#FBF5F7] border border-[#F9C6D4] rounded-2xl px-4 py-3 text-sm text-[#D7B8B8] focus:outline-none mb-4"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAddingFolder(false)}
                  className="flex-1 py-3 text-xs font-bold text-[#CFAAAA] hover:bg-[#FBF5F7] rounded-2xl transition-colors"
                >
                  HỦY
                </button>
                <button 
                  onClick={handleAddFolder}
                  className="flex-1 py-3 bg-[#EFA9C2] text-white rounded-2xl text-xs font-bold shadow-md"
                >
                  XÁC NHẬN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
