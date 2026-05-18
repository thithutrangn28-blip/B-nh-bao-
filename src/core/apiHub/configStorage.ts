import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'apihub_db';
const STORE_NAME = 'configs';
const VERSION = 1;

export interface ApiHubConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string; // Will store the base64 encrypted object stringified
  customHeaders?: Record<string, string>;
  selectedModel: string;
  generationConfig?: {
    temperature: number;
    maxOutputTokens: number;
    topP?: number;
    topK?: number;
  };
  isActive: boolean;
  createdAt: number;
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function getAllConfigs(): Promise<ApiHubConfig[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function getActiveConfig(): Promise<ApiHubConfig | undefined> {
  const configs = await getAllConfigs();
  return configs.find(c => c.isActive);
}

export async function saveConfig(config: ApiHubConfig): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, config);
}

export async function deleteConfig(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function setActiveConfig(id: string): Promise<void> {
  const configs = await getAllConfigs();
  for (const config of configs) {
    if (config.isActive && config.id !== id) {
      config.isActive = false;
      await saveConfig(config);
    } else if (config.id === id && !config.isActive) {
      config.isActive = true;
      await saveConfig(config);
    }
  }
}
