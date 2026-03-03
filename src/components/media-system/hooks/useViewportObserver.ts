import { useRef, useEffect, useCallback } from 'react';

/**
 * Viewport observer that detects which feed item is currently dominant (>50% visible).
 * Includes 150ms debounce to prevent rapid switching during fast scrolling.
 */
export function useViewportObserver(
  containerRef: React.RefObject<HTMLElement | null>,
  onActiveChange: (index: number) => void
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemsRef = useRef<Map<Element, number>>(new Map());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
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
          // Debounce to prevent rapid switching
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => {
            currentActiveRef.current = bestIndex!;
            onActiveChange(bestIndex!);
          }, 150);
        }
      },
      {
        root: container,
        threshold: [0, 0.5, 1.0],
      }
    );

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      observerRef.current?.disconnect();
    };
  }, [containerRef, onActiveChange]);

  return { observe, unobserve };
}
