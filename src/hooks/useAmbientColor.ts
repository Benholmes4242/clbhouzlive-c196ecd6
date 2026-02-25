import { useState, useEffect } from 'react';

const FALLBACK_COLOR = 'rgba(34, 197, 94, 0.06)';

/** Deterministic fallback color from post ID */
function hashColor(postId: string): string {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = postId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsla(${hue}, 40%, 50%, 0.06)`;
}

export const useAmbientColor = (imageUrl: string | null | undefined, postId?: string) => {
  const [ambientColor, setAmbientColor] = useState(FALLBACK_COLOR);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);

    if (!imageUrl) {
      setAmbientColor(postId ? hashColor(postId) : FALLBACK_COLOR);
      setIsLoaded(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      setAmbientColor(postId ? hashColor(postId) : FALLBACK_COLOR);
      setIsLoaded(true);
    }, 3000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setAmbientColor(FALLBACK_COLOR);
          setIsLoaded(true);
          return;
        }
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setAmbientColor(`rgba(${r}, ${g}, ${b}, 0.08)`);
      } catch {
        setAmbientColor(postId ? hashColor(postId) : FALLBACK_COLOR);
      }
      setIsLoaded(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      setAmbientColor(postId ? hashColor(postId) : FALLBACK_COLOR);
      setIsLoaded(true);
    };

    img.src = imageUrl;

    return () => clearTimeout(timeout);
  }, [imageUrl, postId]);

  return { ambientColor, isLoaded };
};
