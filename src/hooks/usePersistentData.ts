import { useState, useEffect } from 'react';
import { persistentLoad, persistentSave } from '../utils/storage';

export function usePersistentData<T>(key: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    persistentLoad(key).then(val => {
      setData(val);
      setIsLoading(false);
    });
  }, [key]);

  const save = async (newValue: T) => {
    await persistentSave(key, newValue);
    setData(newValue);
  };

  return { data, setData, save, isLoading };
}
