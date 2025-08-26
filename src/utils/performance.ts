// Performance utilities for React components

// Debounce utility for search and input fields
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for scroll and resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Virtual scrolling utility for large lists
export const calculateVisibleItems = (
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  overscan: number = 5
) => {
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    Number.MAX_SAFE_INTEGER
  );
  
  return {
    start: Math.max(0, visibleStart - overscan),
    end: visibleEnd + overscan,
    visibleStart,
    visibleEnd
  };
};

// Image optimization utilities
export const optimizeImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
} = {}): string => {
  if (!url.includes('supabase') || !url.includes('/storage/')) {
    return url;
  }
  
  const { width, height, quality = 85, format = 'webp' } = options;
  const separator = url.includes('?') ? '&' : '?';
  
  let params = `quality=${quality}&format=${format}`;
  if (width) params += `&width=${width}`;
  if (height) params += `&height=${height}`;
  
  return `${url}${separator}${params}`;
};

// Request deduplication for identical API calls - simplified for better performance
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>();

export const dedupeRequest = <T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = 3000 // Reduced TTL for faster cache eviction
): Promise<T> => {
  const now = Date.now();
  const cached = requestCache.get(key);
  
  // Return cached if exists and not expired
  if (cached && (now - cached.timestamp) < ttl) {
    return cached.promise;
  }
  
  // Clear expired entry immediately
  if (cached && (now - cached.timestamp) >= ttl) {
    requestCache.delete(key);
  }
  
  const request = requestFn().finally(() => {
    // Clean up on completion with shorter delay
    setTimeout(() => {
      requestCache.delete(key);
    }, 500);
  });
  
  requestCache.set(key, { promise: request, timestamp: now });
  
  return request;
};

// Simplified cleanup - more frequent but lighter
setInterval(() => {
  const now = Date.now();
  for (const [key, { timestamp }] of requestCache.entries()) {
    if (now - timestamp > 10000) { // 10 seconds instead of 30
      requestCache.delete(key);
    }
  }
}, 30000); // Run every 30 seconds instead of 60

// Batch DOM updates to prevent layout thrashing
export const batchDOMUpdates = (updates: (() => void)[]): void => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

// Check if element is in viewport efficiently
export const isInViewport = (element: Element, threshold: number = 0): boolean => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = rect.top <= windowHeight && rect.bottom >= 0;
  const horInView = rect.left <= windowWidth && rect.right >= 0;
  
  if (threshold === 0) {
    return vertInView && horInView;
  }
  
  const elementArea = rect.width * rect.height;
  const visibleArea = Math.max(0, Math.min(rect.right, windowWidth) - Math.max(rect.left, 0)) *
                     Math.max(0, Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0));
  
  return (visibleArea / elementArea) >= threshold;
};