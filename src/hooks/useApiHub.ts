import { useState, useEffect, useCallback } from 'react';
import { getActiveConfig, ApiHubConfig } from '../core/apiHub/configStorage';
import { decryptApiKey } from '../core/apiHub/keyEncryption';
import { buildRequestUrl, buildAuthHeaders } from '../core/apiHub/endpointResolver';

export function useApiHub() {
  const [activeConfig, setActiveConfig] = useState<ApiHubConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    const loadConfig = async () => {
      try {
        const config = await getActiveConfig();
        if (mounted) {
          setActiveConfig(config || null);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) setIsLoading(false);
      }
    };
    
    // Initial load
    loadConfig();
    
    // We can set up a listener if we want realtime updates, 
    // but for now we'll just re-fetch on mount. Add a custom event if global refresh needed
    const handleConfigChange = () => {
      loadConfig();
    };
    
    window.addEventListener('apihub-config-changed', handleConfigChange);
    return () => {
      mounted = false;
      window.removeEventListener('apihub-config-changed', handleConfigChange);
    };
  }, []);
  
  const callApi = useCallback(async (params: { messages: any[]; signal?: AbortSignal; overrideConfig?: any }) => {
    if (!activeConfig) {
      throw new Error('Vợ chưa cấu hình trong API Hub. Mở app API Hub để thêm cấu hình nha 💕');
    }
    
    const url = buildRequestUrl(activeConfig.endpoint, 'chat');
    const plainKey = await decryptApiKey(activeConfig.apiKey);
    
    const headers = {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(plainKey, activeConfig.customHeaders),
    };
    
    const body = {
      model: activeConfig.selectedModel,
      messages: params.messages,
      ...(activeConfig.generationConfig || {}),
      ...(params.overrideConfig || {}),
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: params.signal,
    });
    
    return response;
  }, [activeConfig]);
  
  return { activeConfig, callApi, isLoading };
}
