import { useRef, useEffect, useCallback } from 'react';

/**
 * Viewport observer that detects which feed item is currently dominant (>50% visible).
 * Includes 150ms debounce to prevent rapid switching during fast scrolling.
 * Accepts an HTMLElement | null (not a ref) so re-render on element mount triggers the effect.
 */
export function useViewportObserver(
  container: HTMLElement | null,
  onActiveChange: (index: number) => void
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemsRef = useRef<Map<Element, number>>(new Map());
  const currentActiveRef = useRef<number>(0);

  const observe = useCallback((element: HTMLElement, index: number) => {
    itemsRef.current.set(element, index);
    observerRef.current?.observe(element);
  }, []);

  const unobserve = useCallback((element: HTMLElement) => {
    itemsRef.current.delete(element);
    observerRef.current?.unobserve(element);
  }, []);

  useEffect(() => {
    if (!container) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex: number | null = null;
        let bestRatio = 0;

        for (const entry of entries) {
          const index = itemsRef.current.get(entry.target);
          if (index === undefined) continue;

          if (entry.intersectionRatio > 0.5 && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }

        if (bestIndex !== null && bestIndex !== currentActiveRef.current) {
          clearTimeout(debounceTimer);
          const candidateIndex = bestIndex;
          debounceTimer = setTimeout(() => {
            currentActiveRef.current = candidateIndex;
            onActiveChange(candidateIndex);
          }, 150);
        }
      },
      {
        root: container,
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    observerRef.current = observer;

    // Re-observe any items that were registered before the observer was created
    itemsRef.current.forEach((index, element) => {
      observer.observe(element);
    });

    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
      observerRef.current = null;
    };
  }, [container, onActiveChange]);

  return { observe, unobserve };
}
