/**
 * useViewportTracking - Track visible items and preload nearby items
 * 
 * Features:
 * - IntersectionObserver-based visibility tracking
 * - Preload items N viewports ahead
 * - Lazy loading support - only mount visible items
 * - Debounced scroll protection
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface UseViewportTrackingOptions {
  /** Total number of items */
  totalItems: number;
  /** Number of items to initially render */
  initialVisible?: number;
  /** Viewports ahead to preload */
  preloadViewports?: number;
  /** Estimated height of each row for margin calculation */
  estimatedRowHeight?: number;
  /** Whether to keep items mounted after leaving viewport */
  keepMounted?: boolean;
}

interface UseViewportTrackingResult {
  /** Set of indices that are visible or should be preloaded */
  visibleIndices: Set<number>;
  /** Register a tile element for observation */
  registerTile: (index: number, element: HTMLElement | null) => void;
  /** Check if an index should be rendered */
  shouldRender: (index: number) => boolean;
  /** Force mark indices as visible */
  forceVisible: (indices: number[]) => void;
}

// Debug mode
const DEBUG = false;
const log = (msg: string, data?: any) => {
  if (!DEBUG) return;
  console.log(`[ViewportTracking] ${msg}`, data ?? '');
};

export function useViewportTracking({
  totalItems,
  initialVisible = 6,
  preloadViewports = 2,
  estimatedRowHeight = 200,
  keepMounted = true,
}: UseViewportTrackingOptions): UseViewportTrackingResult {
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const tileRefs = useRef<Map<number, HTMLElement>>(new Map());
  
  // Track visible indices
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    for (let i = 0; i < Math.min(initialVisible, totalItems); i++) {
      initial.add(i);
    }
    return initial;
  });
  
  // Root margin for preloading
  const rootMargin = useMemo(() => {
    const margin = preloadViewports * estimatedRowHeight * 2;
    return `${margin}px 0px ${margin}px 0px`;
  }, [preloadViewports, estimatedRowHeight]);
  
  // Handle intersection changes
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    setVisibleIndices(prev => {
      const next = new Set(prev);
      let changed = false;
      
      entries.forEach(entry => {
        const index = parseInt(entry.target.getAttribute('data-viewport-index') || '-1', 10);
        if (index < 0) return;
        
        if (entry.isIntersecting) {
          if (!next.has(index)) {
            next.add(index);
            changed = true;
            log('VISIBLE', { index });
          }
        } else if (!keepMounted) {
          // Only remove if keepMounted is false
          if (next.has(index)) {
            next.delete(index);
            changed = true;
            log('HIDDEN', { index });
          }
        }
      });
      
      return changed ? next : prev;
    });
  }, [keepMounted]);
  
  // Setup observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold: 0,
    });
    
    // Observe all registered tiles
    tileRefs.current.forEach((element) => {
      observerRef.current?.observe(element);
    });
    
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [handleIntersection, rootMargin]);
  
  // Register tile
  const registerTile = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      element.setAttribute('data-viewport-index', String(index));
      tileRefs.current.set(index, element);
      observerRef.current?.observe(element);
    } else {
      const existing = tileRefs.current.get(index);
      if (existing) {
        observerRef.current?.unobserve(existing);
        tileRefs.current.delete(index);
      }
    }
  }, []);
  
  // Check if index should render
  const shouldRender = useCallback((index: number): boolean => {
    return visibleIndices.has(index);
  }, [visibleIndices]);
  
  // Force mark indices as visible
  const forceVisible = useCallback((indices: number[]) => {
    setVisibleIndices(prev => {
      const next = new Set(prev);
      indices.forEach(i => next.add(i));
      return next;
    });
  }, []);
  
  // Update initial visible when totalItems changes
  useEffect(() => {
    setVisibleIndices(prev => {
      const next = new Set(prev);
      for (let i = 0; i < Math.min(initialVisible, totalItems); i++) {
        next.add(i);
      }
      return next;
    });
  }, [totalItems, initialVisible]);
  
  return {
    visibleIndices,
    registerTile,
    shouldRender,
    forceVisible,
  };
}
