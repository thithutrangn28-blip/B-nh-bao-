
import { getDB, loadBackgrounds, getAllStories, getAllKikokoStories, loadNPCProfiles } from './db';
import { getLargeData } from './storage';

export async function exportAllData() {
  try {
    const data: any = {};
    
    // 1. Get all localStorage items
    data.localStorage = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('kotokoo_') || key.startsWith('char_') || key.startsWith('banhnho_'))) {
            try {
                data.localStorage[key] = JSON.parse(localStorage.getItem(key) || '');
            } catch {
                data.localStorage[key] = localStorage.getItem(key);
            }
        }
    }
    
    // 2. Get IndexedDB items
    const db = await getDB();
    const stores = Array.from(db.objectStoreNames);
    data.indexedDB = {};
    
    for (const storeName of stores) {
        data.indexedDB[storeName] = await db.getAll(storeName);
    }
    
    // 3. Special handling for large data
    data.largeData = {};
    data.largeData['char_profiles_data_v2'] = await getLargeData('char_profiles_data_v2');

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `kikoko_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}
