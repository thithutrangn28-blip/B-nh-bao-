
export const safeJsonParse = (json: string, fallback: any) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('Safe JSON parse failed:', e);
    return fallback;
  }
};

export const safeLocalStorageGet = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return safeJsonParse(item, fallback);
  } catch (e) {
    console.error('Safe localStorage get failed:', e);
    return fallback;
  }
};

export const safeLocalStorageSet = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Safe localStorage set failed:', e);
  }
};
