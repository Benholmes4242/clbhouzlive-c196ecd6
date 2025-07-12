import { useEffect, useRef, useCallback } from 'react';
import { useContentPreloader } from './useContentPreloader';

interface ScrollPreloaderOptions {
  threshold?: number; // Percentage of content before triggering preload (0-1)
  enabled?: boolean;
  onPreloadTrigger?: () => void;
  onNearEnd?: () => void;
}

export const useInfiniteScrollPreloader = ({
  threshold = 0.8, // Trigger when 80% scrolled
  enabled = true,
  onPreloadTrigger,
  onNearEnd,
}: ScrollPreloaderOptions = {}) => {
  const lastScrollY = useRef(0);
  const isPreloading = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { preloadAhead } = useContentPreloader({
    preloadDistance: 3,
    enabled,
  });

  // Create intersection observer for bottom detection
  const createBottomObserver = useCallback((callback: () => void) => {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && enabled) {
            callback();
          }
        });
      },
      {
        rootMargin: '200px', // Trigger 200px before reaching the element
        threshold: 0.1,
      }
    );
  }, [enabled]);

  // Set up scroll-based preloading
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollProgress = (currentScrollY + windowHeight) / documentHeight;

      // Only trigger when scrolling down and near threshold
      if (
        currentScrollY > lastScrollY.current && 
        scrollProgress >= threshold && 
        !isPreloading.current
      ) {
        isPreloading.current = true;
        onPreloadTrigger?.();
        
        // Reset preloading flag after a short delay
        setTimeout(() => {
          isPreloading.current = false;
        }, 1000);
      }

      lastScrollY.current = currentScrollY;
    };

    const throttledScrollHandler = throttle(handleScroll, 200);
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
    };
  }, [enabled, threshold, onPreloadTrigger]);

  // Create a sentinel element to observe for infinite loading
  const createSentinel = useCallback((callback: () => void) => {
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    sentinel.style.visibility = 'hidden';
    sentinel.dataset.sentinelType = 'preload';

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = createBottomObserver(callback);
    observerRef.current.observe(sentinel);

    return sentinel;
  }, [createBottomObserver]);

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    preloadAhead,
    createSentinel,
    isPreloading: () => isPreloading.current,
  };
};

// Throttle utility function
function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}