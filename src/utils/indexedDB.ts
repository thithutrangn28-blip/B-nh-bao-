let dbInstance: IDBDatabase | null = null;

export const initKeyValueDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BanhNhoKV', 16); // Bump version to match/exceed existing 16
    
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('backgrounds')) {
        db.createObjectStore('backgrounds');
      }
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveToDB = async (storeName: string, key: string, value: any): Promise<void> => {
  const db = await initKeyValueDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getFromDB = async (storeName: string, key: string): Promise<any> => {
  const db = await initKeyValueDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllFromDB = async (storeName: string): Promise<Record<string, any>> => {
  const db = await initKeyValueDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    const keysRequest = store.getAllKeys();
    
    transaction.oncomplete = () => {
      const result: Record<string, any> = {};
      const keys = keysRequest.result as string[];
      const values = request.result;
      keys.forEach((key, index) => {
        result[key] = values[index];
      });
      resolve(result);
    };
    transaction.onerror = () => reject(transaction.error);
  });
};
