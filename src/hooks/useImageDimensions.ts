import { useCallback } from 'react';

export type ImageMeta = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape' | 'square';
};

export function useImageDimensions() {
  const getMeta = useCallback((file: File): Promise<ImageMeta> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const orientation =
          width === height ? 'square' : width > height ? 'landscape' : 'portrait';
        URL.revokeObjectURL(url);
        resolve({ width, height, orientation });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to read image dimensions'));
      };
      img.src = url;
    });
  }, []);

  return { getMeta };
}
