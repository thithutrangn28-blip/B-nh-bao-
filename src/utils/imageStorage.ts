export const saveImageToDB = async (key: string, dataUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BanhNhoDB');
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        const currentVersion = db.version;
        db.close();
        
        const upgradeReq = indexedDB.open('BanhNhoDB', currentVersion + 1);
        upgradeReq.onupgradeneeded = (e: any) => {
          const upgradeDb = e.target.result;
          if (!upgradeDb.objectStoreNames.contains('images')) {
            upgradeDb.createObjectStore('images', { keyPath: 'id' });
          }
        };
        upgradeReq.onsuccess = (e: any) => {
          const upgradeDb = e.target.result;
          const transaction = upgradeDb.transaction(['images'], 'readwrite');
          const store = transaction.objectStore('images');
          store.put({ id: key, data: dataUrl });
          transaction.oncomplete = () => {
            upgradeDb.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
        upgradeReq.onerror = () => reject(upgradeReq.error);
      } else {
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.put({ id: key, data: dataUrl });
        
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      }
    };

    request.onerror = () => reject(request.error);
  });
};

export const getImageFromDB = async (key: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BanhNhoDB');
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        const currentVersion = db.version;
        db.close();
        
        const upgradeReq = indexedDB.open('BanhNhoDB', currentVersion + 1);
        upgradeReq.onupgradeneeded = (e: any) => {
          const upgradeDb = e.target.result;
          if (!upgradeDb.objectStoreNames.contains('images')) {
            upgradeDb.createObjectStore('images', { keyPath: 'id' });
          }
        };
        upgradeReq.onsuccess = (e: any) => {
          const upgradeDb = e.target.result;
          const transaction = upgradeDb.transaction(['images'], 'readonly');
          const store = transaction.objectStore('images');
          const getRequest = store.get(key);
          
          getRequest.onsuccess = () => {
            upgradeDb.close();
            resolve(getRequest.result ? getRequest.result.data : null);
          };
          getRequest.onerror = () => reject(getRequest.error);
        };
        upgradeReq.onerror = () => reject(upgradeReq.error);
      } else {
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result ? getRequest.result.data : null);
        };
        getRequest.onerror = () => reject(getRequest.error);
      }
    };

    request.onerror = () => reject(request.error);
  });
};
