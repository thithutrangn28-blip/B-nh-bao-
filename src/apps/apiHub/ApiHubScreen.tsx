import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Check, MoreVertical, X, Save, Eye, EyeOff, Copy } from 'lucide-react';
import { ApiHubConfig, getAllConfigs, saveConfig, deleteConfig, setActiveConfig, getActiveConfig } from '../../core/apiHub/configStorage';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../../core/apiHub/keyEncryption';
import { fetchModels } from '../../core/apiHub/modelFetcher';

interface ApiHubScreenProps {
  onBack: () => void;
}

export default function ApiHubScreen({ onBack }: ApiHubScreenProps) {
  const [configs, setConfigs] = useState<ApiHubConfig[]>([]);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingConfig, setEditingConfig] = useState<ApiHubConfig | null>(null);

  const loadConfigs = async () => {
    const data = await getAllConfigs();
    setConfigs(data || []);
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleSetActive = async (id: string) => {
    await setActiveConfig(id);
    await loadConfigs();
    window.dispatchEvent(new Event('apihub-config-changed'));
  };

  const handleCloneConfig = async (config: ApiHubConfig) => {
    const cloned: ApiHubConfig = {
      ...config,
      id: crypto.randomUUID(),
      name: `${config.name} (copy)`,
      isActive: false,
      createdAt: Date.now(),
    };
    await saveConfig(cloned);
    await loadConfigs();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Vợ chắn chắn muốn xóa cấu hình này chứ?')) {
      await deleteConfig(id);
      await loadConfigs();
      window.dispatchEvent(new Event('apihub-config-changed'));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFF5FB] text-[#5C4A4A]">
      <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-md border-b border-[#F9C6D4] sticky top-0 z-10">
        <button onClick={view === 'list' ? onBack : () => setView('list')} className="p-2 rounded-full hover:bg-white/50 active:scale-95 transition-all">
          <ArrowLeft size={24} className="text-[#D18E9B]" />
        </button>
        <h1 className="text-lg font-bold text-[#5C4A4A]">
          {view === 'list' ? 'API Hub' : (view === 'add' ? 'Thêm cấu hình' : 'Sửa cấu hình')}
        </h1>
        <div className="w-10">
          {/* Settings or context menu can go here later if needed */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {view === 'list' && (
          <ConfigList 
            configs={configs} 
            onSetActive={handleSetActive} 
            onAdd={() => {
              setEditingConfig(null);
              setView('add');
            }}
            onEdit={(cfg) => {
              setEditingConfig(cfg);
              setView('edit');
            }}
            onClone={handleCloneConfig}
            onDelete={handleDelete}
          />
        )}
        {(view === 'add' || view === 'edit') && (
          <ConfigForm 
            initialConfig={editingConfig}
            onSave={async (cfg) => {
              await saveConfig(cfg);
              if (configs.length === 0) {
                await setActiveConfig(cfg.id);
              }
              await loadConfigs();
              window.dispatchEvent(new Event('apihub-config-changed'));
              setView('list');
            }}
            onCancel={() => setView('list')}
          />
        )}
      </div>
    </div>
  );
}

function ConfigList({ configs, onSetActive, onAdd, onEdit, onClone, onDelete }: any) {
  const activeConfig = configs.find((c: ApiHubConfig) => c.isActive);
  const otherConfigs = configs.filter((c: ApiHubConfig) => !c.isActive);

  return (
    <div className="space-y-6">
      {activeConfig && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <h2 className="text-sm font-bold text-[#D18E9B] mb-2 flex items-center gap-2">
            <span className="text-lg">📊</span> Cấu hình đang dùng:
          </h2>
          <div className="bg-white p-4 rounded-2xl border-2 border-[#D18E9B] shadow-[0_4px_15px_rgba(209,142,155,0.2)]">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-[#D18E9B] text-white flex items-center justify-center">
                    <Check size={14} />
                  </div>
                  <h3 className="font-bold text-[#5C4A4A] text-lg">{activeConfig.name}</h3>
                </div>
                <p className="text-sm text-[#C79C9C] font-mono mt-1">{activeConfig.selectedModel}</p>
                <p className="text-xs text-gray-500 mt-1 truncate max-w-[250px]">{activeConfig.endpoint}</p>
              </div>
              <ConfigActions config={activeConfig} onEdit={onEdit} onClone={onClone} onDelete={onDelete} />
            </div>
          </div>
        </div>
      )}

      {otherConfigs.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-3">
          <h2 className="text-sm font-bold text-[#D18E9B] mb-2 flex items-center gap-2">
            <span className="text-lg">📁</span> Danh sách cấu hình:
          </h2>
          <div className="space-y-3">
            {otherConfigs.map((config: ApiHubConfig) => (
              <div key={config.id} className="bg-white/80 p-4 rounded-2xl border border-[#F9C6D4] shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSetActive(config.id)}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#D7B8B8] flex items-center justify-center"></div>
                    <div>
                      <h3 className="font-semibold text-[#5C4A4A]">{config.name}</h3>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{config.selectedModel}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ConfigActions config={config} onEdit={onEdit} onClone={onClone} onDelete={onDelete} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={onAdd}
        className="w-full py-4 bg-white border-2 border-dashed border-[#F3B4C2] text-[#D18E9B] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#FFF5FB] hover:border-[#D18E9B] transition-colors shadow-sm active:scale-[0.98]"
      >
        <Plus size={20} />
        Thêm cấu hình mới
      </button>

      <div className="bg-[#F8EDED] p-4 rounded-xl border border-[#F6E4E4] flex items-start gap-3 text-sm text-[#CBA3A3] mt-8">
        <span className="text-xl">💡</span>
        <p>
          Tất cả app trong điện thoại đều dùng cấu hình này. Chỉ cần đổi ở đây, toàn bộ app sẽ tự động kế thừa cấu hình mới của vợ 💕
        </p>
      </div>
    </div>
  );
}

function ConfigActions({ config, onEdit, onClone, onDelete }: any) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative">
      <button onClick={() => setShow(!show)} className="p-1 rounded hover:bg-[#F9F1F1] text-gray-400">
        <MoreVertical size={18} />
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShow(false)}></div>
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[120px] text-sm overflow-hidden">
            <button onClick={() => { setShow(false); onEdit(config); }} className="w-full text-left px-4 py-2 hover:bg-[#FFF5FB] text-gray-700">Sửa</button>
            <button onClick={() => { setShow(false); onClone(config); }} className="w-full text-left px-4 py-2 hover:bg-[#FFF5FB] text-gray-700">Clone</button>
            <button onClick={() => { setShow(false); onDelete(config.id); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500">Xóa</button>
          </div>
        </>
      )}
    </div>
  );
}

// ConfigForm and ModelSelector

function ConfigForm({ initialConfig, onSave, onCancel }: any) {
  const [name, setName] = useState(initialConfig?.name || '');
  const [endpoint, setEndpoint] = useState(initialConfig?.endpoint || '');
  // Because we encrypted the API key, we fetch plain text on mount
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(initialConfig?.selectedModel || '');
  const [customHeaders, setCustomHeaders] = useState<string>(initialConfig?.customHeaders ? JSON.stringify(initialConfig.customHeaders, null, 2) : '');
  const [models, setModels] = useState<any[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [searchModel, setSearchModel] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (initialConfig?.apiKey) {
      decryptApiKey(initialConfig.apiKey).then(key => setApiKey(key));
    }
  }, [initialConfig]);

  const handleFetchModels = async () => {
    if (!endpoint || !apiKey) {
      alert('Vợ nhập đủ Endpoint và API Key trước khi lấy danh sách model nha!');
      return;
    }
    
    setIsFetchingModels(true);
    try {
      let parsedHeaders = null;
      if (customHeaders.trim()) {
        try {
          parsedHeaders = JSON.parse(customHeaders);
        } catch (e) {
          alert('JSON Header không hợp lệ, vợ kiểm tra lại dấu phẩy, ngoặc kép nha!');
          setIsFetchingModels(false);
          return;
        }
      }
      
      const result = await fetchModels(endpoint, apiKey, parsedHeaders);
      setModels(result.models);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = async () => {
    if (!name || !endpoint || !apiKey) {
      alert('Vợ điền đủ Tên, Endpoint và API Key nha 💕');
      return;
    }
    if (!selectedModel) {
      alert('Vợ nhớ chọn Model nha 💕');
      return;
    }

    let parsedHeaders = undefined;
    if (customHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(customHeaders);
      } catch (e) {
        alert('JSON Header không hợp lệ!');
        return;
      }
    }

    const encryptedPayloadStr = await encryptApiKey(apiKey);

    const config: ApiHubConfig = {
      id: initialConfig?.id || crypto.randomUUID(),
      name,
      endpoint,
      apiKey: encryptedPayloadStr,
      customHeaders: parsedHeaders,
      selectedModel,
      generationConfig: initialConfig?.generationConfig || {
        temperature: 0.95,
        maxOutputTokens: 32768,
      },
      isActive: initialConfig?.isActive || false,
      createdAt: initialConfig?.createdAt || Date.now(),
    };

    onSave(config);
  };

  const filteredModels = models.filter(m => 
    m.displayName.toLowerCase().includes(searchModel.toLowerCase()) || 
    m.id.toLowerCase().includes(searchModel.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2">
      {/* Tên cấu hình */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#F9C6D4]">
        <label className="block text-sm font-bold text-[#D18E9B] mb-2 flex items-center gap-2">
          <span>📝</span> Tên cấu hình *
        </label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='VD: "Cấu hình của vợ"' 
          className="w-full bg-[#FFF5FB] border border-[#F6E4E4] rounded-xl px-4 py-3 text-[#5C4A4A] outline-none focus:border-[#D18E9B] transition-colors shadow-inner"
        />
        <p className="text-xs text-[#CBA3A3] mt-2 flex gap-1 items-start">
          <span className="shrink-0 mt-0.5">💡</span> 
          <span>Đặt tên gì cũng được, miễn vợ dễ nhớ</span>
        </p>
      </div>

      {/* Endpoint */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#F9C6D4]">
        <label className="block text-sm font-bold text-[#D18E9B] mb-2 flex items-center gap-2">
          <span>🌐</span> Endpoint API *
        </label>
        <input 
          type="text" 
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder='Nhập đường dẫn API tại đây' 
          className="w-full bg-[#FFF5FB] border border-[#F6E4E4] rounded-xl px-4 py-3 text-[#5C4A4A] outline-none focus:border-[#D18E9B] transition-colors shadow-inner font-mono text-sm"
        />
        <div className="text-xs text-[#CBA3A3] mt-2 flex gap-1 items-start">
          <span className="shrink-0 mt-0.5">💡</span> 
          <div>
            <p>Hệ thống chấp nhận MỌI dạng URL</p>
            <ul className="list-disc ml-4 space-y-0.5 mt-1 opacity-80">
              <li>Có /v1 hoặc không đều OK</li>
              <li>Full path hoặc base URL đều OK</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#F9C6D4]">
        <label className="block text-sm font-bold text-[#D18E9B] mb-2 flex items-center gap-2">
          <span>🔑</span> API Key *
        </label>
        <div className="relative">
          <input 
            type={showKey ? "text" : "password"} 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder='Dán key của vợ vào đây' 
            className="w-full bg-[#FFF5FB] border border-[#F6E4E4] rounded-xl pl-4 pr-12 py-3 text-[#5C4A4A] outline-none focus:border-[#D18E9B] transition-colors shadow-inner font-mono text-sm"
          />
          <button 
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D7B8B8] hover:text-[#D18E9B] p-1"
          >
            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="text-xs text-[#CBA3A3] mt-2 flex gap-1 items-start">
          <span className="shrink-0 mt-0.5">💡</span> 
          <div>
            <p>Hỗ trợ MỌI định dạng key:</p>
            <p className="opacity-80">sk-, AIza-, JWT, Bearer, custom...</p>
          </div>
        </div>
      </div>

      {/* Advanced Headers */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#F9C6D4]">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex justify-between items-center text-sm font-bold text-[#D18E9B]"
        >
          <span className="flex items-center gap-2"><span>⚙️</span> Header tùy chỉnh (nâng cao)</span>
          <span className="text-lg transition-transform duration-200" style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        
        <AnimatePresence>
          {showAdvanced && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <textarea 
                  value={customHeaders}
                  onChange={(e) => setCustomHeaders(e.target.value)}
                  placeholder='{"x-api-key": "{{key}}"}' 
                  className="w-full h-24 bg-[#FFF5FB] border border-[#F6E4E4] rounded-xl px-4 py-3 text-[#5C4A4A] outline-none focus:border-[#D18E9B] transition-colors shadow-inner font-mono text-xs resize-none"
                />
                <p className="text-xs text-[#CBA3A3] mt-2 flex gap-1 items-start">
                  <span className="shrink-0 mt-0.5">💡</span> 
                  <span>Nếu bên proxy yêu cầu header đặc biệt, thêm bằng JSON tại đây. Dùng {"{{key}}"} để tự động chèn API Key của vợ.</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Models Fetcher */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#F9C6D4]">
        <button 
          onClick={handleFetchModels}
          disabled={isFetchingModels}
          className="w-full py-3 bg-[#F9C6D4] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#F3B4C2] transition-colors shadow-[0_4px_10px_rgba(249,198,212,0.4)] active:scale-[0.98] disabled:opacity-50"
        >
          {isFetchingModels ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><span>📡</span> Lấy danh sách Model</>
          )}
        </button>

        {models.length > 0 && (
          <div className="mt-6 animate-in fade-in">
            <label className="block text-sm font-bold text-[#D18E9B] mb-2 flex items-center gap-2">
              <span>🤖</span> Chọn Model:
            </label>
            <input 
              type="text" 
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
              placeholder="🔍 Tìm kiếm model..." 
              className="w-full bg-[#FFF5FB] border border-[#F6E4E4] rounded-xl px-4 py-2 text-sm text-[#5C4A4A] outline-none focus:border-[#D18E9B] mb-3"
            />
            <div className="max-h-60 overflow-y-auto custom-scrollbar border border-[#F6E4E4] rounded-xl bg-[#FFF5FB]">
              {filteredModels.map(model => (
                <div 
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-3 border-b last:border-b-0 border-[#F6E4E4] cursor-pointer hover:bg-white transition-colors flex items-center gap-3 ${selectedModel === model.id ? 'bg-white' : ''}`}
                >
                  <div className={`w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center ${selectedModel === model.id ? 'border-[#D18E9B]' : 'border-[#D7B8B8]'}`}>
                    {selectedModel === model.id && <div className="w-2 h-2 bg-[#D18E9B] rounded-full" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium truncate text-sm ${selectedModel === model.id ? 'text-[#D18E9B]' : 'text-[#5C4A4A]'}`}>{model.displayName}</p>
                    {model.contextLength && <p className="text-[10px] text-gray-400 font-mono">Context: {(model.contextLength / 1000).toFixed(0)}K</p>}
                  </div>
                </div>
              ))}
              {filteredModels.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-400">Không tìm thấy "{searchModel}"</div>
              )}
            </div>
          </div>
        )}
        
        {/* Allows manual input if fetch fails */}
        {models.length === 0 && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-[#CBA3A3] mb-1">
              Hoặc tự nhập tên Model:
            </label>
            <input 
              type="text" 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder="VD: gemini-2.5-pro" 
              className="w-full bg-[#FFF5FB] border border-[#F6E4E4] rounded-xl px-4 py-2 text-sm text-[#5C4A4A] outline-none focus:border-[#D18E9B]"
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 text-[#D7B8B8] font-bold rounded-xl hover:bg-white transition-colors border border-transparent hover:border-[#F6E4E4]"
        >
          ❌ Hủy
        </button>
        <button 
          onClick={handleSave}
          className="flex-[2] py-3 bg-gradient-to-r from-[#F9C6D4] to-[#F5C6D6] text-white rounded-xl font-bold hover:shadow-[0_4px_15px_rgba(249,198,212,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} />
          💾 Lưu cấu hình
        </button>
      </div>
    </div>
  );
}

