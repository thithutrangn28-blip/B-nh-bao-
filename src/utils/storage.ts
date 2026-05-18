import { get, set, del, keys, createStore } from 'idb-keyval';

// Create a custom store to avoid version conflicts with the default 'keyval-store'.
// We use a different name to distinguish from what might already be there.
const customStore = createStore('kikoko-db', 'kikoko-store');

/**
 * Persists data. Attempts to save to IndexedDB first (which supports large data).
 * If IndexedDB fails, attempts localStorage.
 * 
 * USE THIS for any key that might hold large data (images, long conversations, etc).
 */
export const persistentSave = async (key: string, value: any): Promise<boolean> => {
  try {
    // 1. Try IndexedDB first
    await set(key, value, customStore);
    
    // 2. Clear from localStorage if it was previously there
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
    return true;
  } catch (e) {
    console.error(`Failed to save key ${key} to IndexedDB, trying localStorage:`, e);
    // Fallback to localStorage
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    } catch (e2) {
      console.error(`Failed to save key ${key} to localStorage:`, e2);
      return false;
    }
  }
};

/**
 * Loads data. Attempts IndexedDB first, then localStorage (for migration/backwards compatibility).
 */
export const persistentLoad = async (key: string): Promise<any | null> => {
  try {
    // 1. Try IndexedDB
    const val = await get(key, customStore);
    if (val !== undefined) return val;

    // 2. If not in IndexedDB, check localStorage
    const local = localStorage.getItem(key);
    if (local) {
      try {
        // Return parsed if JSON, else raw
        return JSON.parse(local);
      } catch {
        return local;
      }
    }
    return null;
  } catch (e) {
    console.error(`Failed to load key ${key}:`, e);
    return null;
  }
};

export const persistentRemove = async (key: string): Promise<void> => {
  try {
    await del(key, customStore);
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`Failed to remove key ${key}:`, e);
  }
};

export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      // Quota exceeded. Try to clear old data
      Object.keys(localStorage).forEach(k => {
        if (
          k.startsWith('koko_npc_msgs_') || 
          k.startsWith('kikoko_story_') ||
          k.startsWith('banhnho_posts_') ||
          k.startsWith('banhnho_promote_') ||
          k.startsWith('banhnho_approved_') ||
          k.startsWith('banhnho_npc_posts_') ||
          k === 'banhnho_groups' ||
          k === 'banhnho_form_data' ||
          k === 'banhnho_new_post_content' ||
          k === 'banhnho_promote_content' ||
          k === 'kikoko_story_ids'
        ) {
          localStorage.removeItem(k);
        }
      });
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e2) {
        console.error('Failed to save to localStorage even after clearing old data:', e2);
        return false;
      }
    } else {
      console.error('Failed to save to localStorage:', e);
      return false;
    }
  }
};

export const setLargeData = async (key: string, value: any): Promise<void> => {
  try {
    await set(key, value, customStore);
  } catch (e) {
    console.error('Failed to save large data to IndexedDB:', e);
  }
};

export const getLargeData = async (key: string): Promise<any> => {
  try {
    return await get(key, customStore);
  } catch (e) {
    console.error('Failed to get large data from IndexedDB:', e);
    return null;
  }
};

export const removeLargeData = async (key: string): Promise<void> => {
  try {
    await del(key, customStore);
  } catch (e) {
    console.error('Failed to remove large data from IndexedDB:', e);
  }
};

export const getAllLargeDataKeys = async (): Promise<IDBValidKey[]> => {
  try {
    return await keys(customStore);
  } catch (e) {
    console.error('Failed to get keys from IndexedDB:', e);
    return [];
  }
};
