import { normalizeEndpoint, buildAuthHeaders } from './endpointResolver';

export async function fetchModels(endpoint: string, apiKey: string, customHeaders: Record<string, string> | null = null) {
  const baseUrl = normalizeEndpoint(endpoint);
  
  const possiblePaths = [
    `${baseUrl}/models`,
    `${baseUrl}/v1/models`,
    `${baseUrl}/beta/models`,
  ];
  
  const headers = {
    'Content-Type': 'application/json',
    ...buildAuthHeaders(apiKey, customHeaders),
  };
  
  let lastError: string | null = null;
  
  for (const url of possiblePaths) {
    try {
      const response = await fetch(url, { 
        method: 'GET', 
        headers,
        signal: AbortSignal.timeout(15000),
      });
      
      if (!response.ok) {
        lastError = `${response.status} ${response.statusText}`;
        continue;
      }
      
      const data = await response.json();
      const models = parseModelsResponse(data);
      
      if (models.length > 0) {
        return { success: true, models, sourceUrl: url };
      }
    } catch (err: any) {
      lastError = err.message;
      continue;
    }
  }
  
  throw new Error(`Không tìm thấy danh sách model. Lỗi cuối: ${lastError}`);
}

function parseModelsResponse(data: any): any[] {
  if (Array.isArray(data?.data)) {
    return data.data.map((m: any) => ({
      id: m.id || m.name,
      displayName: m.name || m.id || m.model,
      contextLength: m.context_length || m.context_window || null,
      raw: m,
    }));
  }
  
  if (Array.isArray(data)) {
    return data.map((m: any) => ({
      id: m.id || m.name || m,
      displayName: m.name || m.id || m,
      raw: m,
    }));
  }
  
  if (Array.isArray(data?.models)) {
    return data.models.map((m: any) => ({
      id: m.id || m.name,
      displayName: m.name || m.id,
      raw: m,
    }));
  }
  
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    if (keys.length > 0) {
      return keys.map((k: string) => ({ id: k, displayName: k, raw: data[k] }));
    }
  }
  
  return [];
}
