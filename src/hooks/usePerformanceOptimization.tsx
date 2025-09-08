import { useEffect, useCallback, useMemo } from 'react';

// Performance optimization utilities for heavy pages
export const usePageLoadOptimization = () => {
  // Preload critical resources
  const preloadCriticalResources = useCallback(() => {
    // Preload commonly used images
    const criticalImages = [
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center'
    ];
    
    criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Request idle callback for non-critical operations
  const scheduleIdleTask = useCallback((task: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(task);
    } else {
      setTimeout(task, 0);
    }
  }, []);

  // Memory cleanup for heavy components
  const scheduleMemoryCleanup = useCallback(() => {
    scheduleIdleTask(() => {
      // Clear any cached data that's no longer needed
      if (window.gc && process.env.NODE_ENV === 'development') {
        window.gc();
      }
    });
  }, [scheduleIdleTask]);

  useEffect(() => {
    preloadCriticalResources();
    
    // Schedule cleanup on component unmount
    return () => {
      scheduleMemoryCleanup();
    };
  }, [preloadCriticalResources, scheduleMemoryCleanup]);

  return {
    scheduleIdleTask,
    scheduleMemoryCleanup
  };
};

// Debounced scroll handler for better performance
export const useDebouncedScroll = (callback: () => void, delay = 100) => {
  const debouncedCallback = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  }, [callback, delay]);

  return debouncedCallback;
};

// Throttled event handler
export const useThrottledCallback = (callback: () => void, delay = 250) => {
  const throttledCallback = useMemo(() => {
    let isThrottled = false;
    return () => {
      if (!isThrottled) {
        callback();
        isThrottled = true;
        setTimeout(() => {
          isThrottled = false;
        }, delay);
      }
    };
  }, [callback, delay]);

  return throttledCallback;
};