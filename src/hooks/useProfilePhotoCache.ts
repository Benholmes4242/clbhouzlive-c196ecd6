import { useState, useEffect } from 'react';

// In-memory cache for profile photos
const profilePhotoCache = new Map<string, string>();
const preloadQueue = new Set<string>();

interface UseProfilePhotoCacheOptions {
  src: string;
  size?: number;
  preload?: boolean;
}

export const useProfilePhotoCache = ({ 
  src, 
  size = 80, 
  preload = false 
}: UseProfilePhotoCacheOptions) => {
  const [cachedSrc, setCachedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate cache key
  const cacheKey = `${src}_${size}`;

  useEffect(() => {
    if (!src) {
      setCachedSrc('');
      setIsLoading(false);
      return;
    }

    // Check if already cached
    if (profilePhotoCache.has(cacheKey)) {
      setCachedSrc(profilePhotoCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setCachedSrc('');

    // Simple optimized URL - just use the original src for reliability
    const optimizedUrl = src;

    // Preload and cache
    const img = new Image();

    img.onload = () => {
      profilePhotoCache.set(cacheKey, optimizedUrl);
      setCachedSrc(optimizedUrl);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };

    img.src = optimizedUrl;

    return () => {
      // Cleanup if component unmounts during loading
    };
  }, [src, size, cacheKey]);

  return { cachedSrc, isLoading };
};

// Utility to preload profile photos with mobile optimization
export const preloadProfilePhotos = (urls: string[], size = 80) => {
  // Batch preload for better mobile performance
  const batchSize = 3; // Smaller batches for mobile
  let currentBatch = 0;

  const processBatch = () => {
    const start = currentBatch * batchSize;
    const end = Math.min(start + batchSize, urls.length);
    
    for (let i = start; i < end; i++) {
      const url = urls[i];
      if (!url) continue;
      
      const cacheKey = `${url}_${size}`;
      if (profilePhotoCache.has(cacheKey) || preloadQueue.has(cacheKey)) continue;

      preloadQueue.add(cacheKey);
      
      const mobileOptimizedSize = Math.min(size * 2, 160);
      const optimizedUrl = url.includes('supabase') 
        ? `${url}?width=${mobileOptimizedSize}&height=${mobileOptimizedSize}&quality=75&format=webp&resize=cover`
        : url;

      const img = new Image();
      img.onload = () => {
        profilePhotoCache.set(cacheKey, optimizedUrl);
        preloadQueue.delete(cacheKey);
      };
      img.onerror = () => {
        // Try fallback without WebP
        if (optimizedUrl.includes('format=webp')) {
          const fallbackUrl = optimizedUrl.replace('&format=webp', '&format=jpeg');
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            profilePhotoCache.set(cacheKey, fallbackUrl);
            preloadQueue.delete(cacheKey);
          };
          fallbackImg.onerror = () => preloadQueue.delete(cacheKey);
          fallbackImg.src = fallbackUrl;
        } else {
          preloadQueue.delete(cacheKey);
        }
      };
      img.src = optimizedUrl;
    }

    currentBatch++;
    if (currentBatch * batchSize < urls.length) {
      // Stagger batches for mobile performance
      setTimeout(processBatch, 200);
    }
  };

  processBatch();
};

// Clear cache when memory gets full
export const clearProfilePhotoCache = () => {
  profilePhotoCache.clear();
  preloadQueue.clear();
};