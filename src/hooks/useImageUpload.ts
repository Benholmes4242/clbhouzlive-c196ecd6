import { useCallback } from 'react';

const MAX_PROFILE_PX = 800;
const MAX_HEADER_PX = 1600;
const QUALITY = 0.88;

async function compressImage(
  file: File,
  maxPx: number,
  quality: number
): Promise<Blob> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');

  const blob: Blob = isHeic
    ? await convertHeicToJpegBlob(file)
    : file;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function convertHeicToJpegBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('HEIC conversion failed'));
        },
        'image/jpeg',
        QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode image. Please try a different format.'));
    };
    img.src = url;
  });
}

export function useImageUpload() {
  const prepareProfilePhoto = useCallback(async (file: File): Promise<Blob> => {
    return compressImage(file, MAX_PROFILE_PX, QUALITY);
  }, []);

  const prepareHeaderPhoto = useCallback(async (file: File): Promise<Blob> => {
    return compressImage(file, MAX_HEADER_PX, QUALITY);
  }, []);

  return { prepareProfilePhoto, prepareHeaderPhoto };
}
