import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for preserving and restoring scroll position
 * Stores scroll position in sessionStorage keyed by route
 */
export function useScrollRestoration(routeKey: string) {
  const storageKey = `scroll_${routeKey}`;
  const restoredRef = useRef(false);

  // Restore scroll position on mount
  useEffect(() => {
    if (restoredRef.current) return;
    
    const savedPosition = sessionStorage.getItem(storageKey);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      // Delay to let content render
      requestAnimationFrame(() => {
        window.scrollTo(0, position);
        restoredRef.current = true;
      });
    }
  }, [storageKey]);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    };
  }, [storageKey]);

  // Manual save function for imperative use
  const savePosition = useCallback(() => {
    sessionStorage.setItem(storageKey, String(window.scrollY));
  }, [storageKey]);

  return { savePosition };
}
