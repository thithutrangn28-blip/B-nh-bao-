export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      // Return the raw data URL to preserve original quality and size
      resolve(event.target?.result as string);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

