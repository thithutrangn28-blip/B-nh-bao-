export function normalizeEndpoint(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let url = input.trim();
  url = url.replace(/\/+$/, '');
  
  if (!/^https?:\/\//.test(url)) {
    url = 'https://' + url;
  }
  
  try {
    new URL(url);
  } catch {
    throw new Error('URL không hợp lệ, vợ kiểm tra lại nhé');
  }
  
  return url;
}

export function buildAuthHeaders(key: string, customHeaders?: Record<string, string> | null): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (customHeaders && Object.keys(customHeaders).length > 0) {
    Object.assign(headers, customHeaders);
    
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === 'string' && v.includes('{{key}}')) {
        headers[k] = v.replace('{{key}}', key);
      }
    }
    return headers;
  }
  
  if (key.toLowerCase().startsWith('bearer ')) {
    headers['Authorization'] = key;
  } else {
    headers['Authorization'] = `Bearer ${key}`;
  }
  
  return headers;
}

export function buildRequestUrl(baseEndpoint: string, taskType: 'chat' | 'models' = 'chat'): string {
  const endpoint = normalizeEndpoint(baseEndpoint);
  
  const fullPathPatterns = [
    '/chat/completions',
    '/completions',
    '/responses',
    '/messages',
    '/generate',
    '/api/chat',
  ];
  
  if (fullPathPatterns.some(p => endpoint.includes(p))) {
    return endpoint;
  }
  
  const defaultPaths = {
    chat: '/chat/completions',
    models: '/models',
  };
  
  return endpoint + defaultPaths[taskType];
}
