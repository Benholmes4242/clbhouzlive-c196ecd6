import { useState, useCallback, useRef } from 'react';

interface UseIntersectionObserverOptions {
  priority?: boolean;
  rootMargin?: string;
  threshold?: number;
}

export const useLazyIntersectionObserver = ({
  priority = false,
  rootMargin = '50px',
  threshold = 0.1,
}: UseIntersectionObserverOptions = {}) => {
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (containerRef.current) {
      containerRef.current = null;
    }
    
    if (node && !priority && !isInView) {
      containerRef.current = node;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin,
          threshold,
        }
      );
      
      observer.observe(node);
      
      return () => {
        observer.unobserve(node);
      };
    }
  }, [priority, isInView, rootMargin, threshold]);

  return { isInView, setContainerRef };
};