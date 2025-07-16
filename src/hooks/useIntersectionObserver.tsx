
import { useEffect, useState, useRef } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number | number[];
  rootMargin?: string;
  onIntersect?: () => void;
}

// Shared observer instance to reduce overhead
const observerCache = new Map<string, IntersectionObserver>();

export const useIntersectionObserver = ({ 
  threshold = 0.5, 
  rootMargin = '0px',
  onIntersect
}: UseIntersectionObserverProps = {}) => {
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef<(entry: IntersectionObserverEntry) => void>();

  // Create stable callback reference
  callbackRef.current = (entry: IntersectionObserverEntry) => {
    setIsInView(entry.isIntersecting);
    if (entry.isIntersecting && onIntersect) {
      onIntersect();
    }
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create cache key for observer reuse
    const cacheKey = `${threshold}-${rootMargin}`;
    
    let observer = observerCache.get(cacheKey);
    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const callback = (entry.target as any)._callback;
            if (callback) callback(entry);
          });
        },
        { threshold, rootMargin }
      );
      observerCache.set(cacheKey, observer);
    }

    // Attach callback to element
    (element as any)._callback = callbackRef.current;
    observer.observe(element);

    return () => {
      observer?.unobserve(element);
      delete (element as any)._callback;
    };
  }, [threshold, rootMargin]);

  return { ref: elementRef, isInView };
};
