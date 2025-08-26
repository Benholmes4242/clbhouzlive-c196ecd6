// Ultra-aggressive performance optimizations

// Micro-cache for frequent operations
const microCache = new Map<string, { value: any; timestamp: number; ttl: number }>();

export const microCacheGet = <T>(key: string): T | null => {
  const cached = microCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    microCache.delete(key);
    return null;
  }
  
  return cached.value;
};

export const microCacheSet = <T>(key: string, value: T, ttl: number = 5000): void => {
  microCache.set(key, { value, timestamp: Date.now(), ttl });
  
  // Auto-cleanup old entries
  if (microCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of microCache.entries()) {
      if (now - v.timestamp > v.ttl) {
        microCache.delete(k);
      }
    }
  }
};

// Ultra-fast debounce
export const ultraDebounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
};

// Ultra-fast throttle
export const ultraThrottle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
};

// Preload critical resources
export const preloadCriticalResources = (urls: string[]) => {
  urls.forEach(url => {
    if (url.includes('.webp') || url.includes('.jpg') || url.includes('.png')) {
      const img = new Image();
      img.src = url;
    } else if (url.includes('.mp4') || url.includes('.m3u8')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
    }
  });
};

// Batch DOM updates for ultra-fast rendering
export const batchDOMUpdates = (updates: (() => void)[]): Promise<void> => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updates.forEach(update => update());
        resolve();
      });
    });
  });
};

// Ultra-fast image URL optimization
export const ultraOptimizeImageUrl = (url: string, width?: number, height?: number): string => {
  if (!url) return '';
  
  // Skip videos
  if (url.includes('cloudflarestream.com') || url.includes('.m3u8') || 
      url.includes('.mp4') || url.includes('.mov')) {
    return url;
  }

  // Optimize R2 and Supabase images with aggressive settings
  if (url.includes('media.clbhouz.co.uk') || 
      (url.includes('supabase') && url.includes('storage'))) {
    const separator = url.includes('?') ? '&' : '?';
    const w = width ? `&w=${width}` : '';
    const h = height ? `&h=${height}` : '';
    return `${url}${separator}q=80&f=webp&fit=cover${w}${h}`;
  }

  return url;
};

// Clean up performance overhead
export const cleanupPerformanceOverhead = () => {
  // Clear micro cache periodically
  if (microCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of microCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        microCache.delete(key);
      }
    }
  }
};

// Run cleanup every 30 seconds
setInterval(cleanupPerformanceOverhead, 30000);