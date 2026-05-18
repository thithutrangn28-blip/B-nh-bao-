import { ApiProxySettings } from './apiProxy';

export const loadApiSettings = (): ApiProxySettings => {
  const defaultSettings: ApiProxySettings = {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    timeoutMinutes: 2,
    apiType: 'auto'
  };

  try {
    const saved = localStorage.getItem('kikoko_api_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        endpoint: parsed.proxyEndpoint || defaultSettings.endpoint,
        apiKey: parsed.apiKey || defaultSettings.apiKey,
        model: parsed.model || defaultSettings.model,
        maxTokens: parsed.maxTokens || defaultSettings.maxTokens,
        timeoutMinutes: parsed.timeout || defaultSettings.timeoutMinutes,
        apiType: parsed.apiType || defaultSettings.apiType,
      };
    }
  } catch (e) {
    console.error('Failed to load API settings', e);
  }

  return defaultSettings;
};
