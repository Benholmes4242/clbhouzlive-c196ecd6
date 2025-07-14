import { useEffect, useRef, useCallback } from 'react';
import { debounce, throttle } from '@/utils/performance';

// Custom hook for scroll performance optimizations
export const useScrollPerformance = (callback: () => void, delay: number = 100) => {
  const throttledCallback = useRef(throttle(callback, delay));
  
  useEffect(() => {
    throttledCallback.current = throttle(callback, delay);
  }, [callback, delay]);
  
  return throttledCallback.current;
};

// Custom hook for search input optimizations
export const useDebounceCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
) => {
  const debouncedCallback = useRef(debounce(callback, delay));
  
  useEffect(() => {
    debouncedCallback.current = debounce(callback, delay);
  }, [callback, delay]);
  
  return debouncedCallback.current;
};

// Custom hook to batch DOM updates
export const useBatchedUpdates = () => {
  const pendingUpdates = useRef<(() => void)[]>([]);
  const isScheduled = useRef(false);
  
  const flushUpdates = useCallback(() => {
    const updates = pendingUpdates.current;
    pendingUpdates.current = [];
    isScheduled.current = false;
    
    updates.forEach(update => update());
  }, []);
  
  const addUpdate = useCallback((update: () => void) => {
    pendingUpdates.current.push(update);
    
    if (!isScheduled.current) {
      isScheduled.current = true;
      requestAnimationFrame(flushUpdates);
    }
  }, [flushUpdates]);
  
  return { addUpdate };
};

// Custom hook for image preloading
export const useImagePreloader = (urls: string[]) => {
  useEffect(() => {
    const preloadImages = urls.map(url => {
      const img = new Image();
      img.src = url;
      return img;
    });
    
    return () => {
      preloadImages.forEach(img => {
        img.src = '';
      });
    };
  }, [urls]);
};