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
  const [isLoading, setIsLoading] = useState(true);

  // Generate cache key
  const cacheKey = `${src}_${size}`;

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    // Check if already cached
    if (profilePhotoCache.has(cacheKey)) {
      setCachedSrc(profilePhotoCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    // Don't reload if already in preload queue, but set current state
    if (preloadQueue.has(cacheKey)) {
      // Set a shorter timeout for mobile optimization
      const checkCache = () => {
        if (profilePhotoCache.has(cacheKey)) {
          setCachedSrc(profilePhotoCache.get(cacheKey)!);
          setIsLoading(false);
        } else {
          setTimeout(checkCache, 100);
        }
      };
      setTimeout(checkCache, 50);
      return;
    }

    preloadQueue.add(cacheKey);
    setIsLoading(true);

    // Mobile-optimized URL with smaller size and better compression
    const mobileOptimizedSize = Math.min(size * 2, 160); // 2x for retina, but cap at 160px
    const optimizedUrl = src.includes('supabase') 
      ? `${src}?width=${mobileOptimizedSize}&height=${mobileOptimizedSize}&quality=75&format=webp&resize=cover`
      : src;

    // Preload and cache with timeout for mobile
    const img = new Image();
    let timeoutId: NodeJS.Timeout;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      preloadQueue.delete(cacheKey);
    };

    img.onload = () => {
      profilePhotoCache.set(cacheKey, optimizedUrl);
      setCachedSrc(optimizedUrl);
      setIsLoading(false);
      cleanup();
    };

    img.onerror = () => {
      // Try fallback without WebP for compatibility
      if (optimizedUrl.includes('format=webp')) {
        const fallbackUrl = optimizedUrl.replace('&format=webp', '&format=jpeg');
        img.src = fallbackUrl;
        return;
      }
      setIsLoading(false);
      cleanup();
    };

    // Set timeout for slow mobile connections
    timeoutId = setTimeout(() => {
      setIsLoading(false);
      cleanup();
    }, 8000); // 8 seconds timeout for mobile

    img.src = optimizedUrl;

    return cleanup;
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