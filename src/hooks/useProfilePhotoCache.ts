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

    // Don't reload if already in preload queue
    if (preloadQueue.has(cacheKey)) return;

    preloadQueue.add(cacheKey);
    setIsLoading(true);

    // Create optimized URL
    const optimizedUrl = src.includes('supabase') 
      ? `${src}?width=${size}&height=${size}&quality=85&format=webp`
      : src;

    // Preload and cache
    const img = new Image();
    img.onload = () => {
      profilePhotoCache.set(cacheKey, optimizedUrl);
      setCachedSrc(optimizedUrl);
      setIsLoading(false);
      preloadQueue.delete(cacheKey);
    };

    img.onerror = () => {
      setIsLoading(false);
      preloadQueue.delete(cacheKey);
    };

    img.src = optimizedUrl;

  }, [src, size, cacheKey]);

  return { cachedSrc, isLoading };
};

// Utility to preload profile photos
export const preloadProfilePhotos = (urls: string[], size = 80) => {
  urls.forEach(url => {
    if (!url) return;
    
    const cacheKey = `${url}_${size}`;
    if (profilePhotoCache.has(cacheKey) || preloadQueue.has(cacheKey)) return;

    preloadQueue.add(cacheKey);
    
    const optimizedUrl = url.includes('supabase') 
      ? `${url}?width=${size}&height=${size}&quality=85&format=webp`
      : url;

    const img = new Image();
    img.onload = () => {
      profilePhotoCache.set(cacheKey, optimizedUrl);
      preloadQueue.delete(cacheKey);
    };
    img.onerror = () => preloadQueue.delete(cacheKey);
    img.src = optimizedUrl;
  });
};

// Clear cache when memory gets full
export const clearProfilePhotoCache = () => {
  profilePhotoCache.clear();
  preloadQueue.clear();
};