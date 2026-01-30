/**
 * useLazyTiles - Progressive lazy loading hook for grid tiles
 * 
 * Only renders tiles in or near the viewport to prevent:
 * - All 19+ videos mounting/loading simultaneously
 * - Network congestion from parallel HLS manifest + fragment requests
 * - Memory pressure from buffering all videos at once
 * 
 * Uses IntersectionObserver with rootMargin to preload tiles
 * ~2 viewport heights ahead for smooth scrolling.
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface UseLazyTilesOptions {
  /** Total number of items in the grid */
  totalItems: number;
  /** Number of items to initially render (hero row) */
  initialVisible?: number;
  /** How many viewport heights ahead to preload (default: 2) */
  preloadViewports?: number;
  /** Estimated height of each row in pixels (for root margin calc) */
  estimatedRowHeight?: number;
}

interface UseLazyTilesResult {
  /** Set of indices that should be rendered */
  visibleIndices: Set<number>;
  /** Ref to attach to the grid container for observation */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Register a tile element for observation */
  registerTile: (index: number, element: HTMLElement | null) => void;
}

// Debug logging
const DEBUG_LAZY_TILES = true;
const logDebug = (event: string, data?: any) => {
  if (!DEBUG_LAZY_TILES) return;
  const timestamp = performance.now().toFixed(2);
  console.log(`[${timestamp}ms] [LazyTiles] ${event}`, data || '');
};

export function useLazyTiles({
  totalItems,
  initialVisible = 12, // First 12 tiles for better viewport fill
  preloadViewports = 2,
  estimatedRowHeight = 200,
}: UseLazyTilesOptions): UseLazyTilesResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const tileRefs = useRef<Map<number, HTMLElement>>(new Map());
  
  // Track which indices are in or near viewport
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(() => {
    // Start with initial visible set
    const initial = new Set<number>();
    for (let i = 0; i < Math.min(initialVisible, totalItems); i++) {
      initial.add(i);
    }
    logDebug('INITIAL_VISIBLE', { count: initial.size, indices: Array.from(initial) });
    return initial;
  });
  
  // Calculate root margin for preloading
  const rootMargin = useMemo(() => {
    const margin = preloadViewports * estimatedRowHeight * 2; // 2 rows per viewport approx
    return `${margin}px 0px ${margin}px 0px`;
  }, [preloadViewports, estimatedRowHeight]);
  
  // Handle intersection changes
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    // Filter to only intersecting entries with valid indices
    const newIndices = entries
      .filter(entry => entry.isIntersecting)
      .map(entry => parseInt(entry.target.getAttribute('data-lazy-index') || '-1', 10))
      .filter((index): index is number => index >= 0);
    
    if (newIndices.length === 0) return;
    
    setVisibleIndices(prev => {
      // Check if any indices are actually new
      const actuallyNew = newIndices.filter(i => !prev.has(i));
      if (actuallyNew.length === 0) {
        return prev;  // No change = same reference
      }
      
      logDebug('VISIBILITY_UPDATE', { 
        visibleCount: prev.size + actuallyNew.length,
        newlyVisible: actuallyNew,
      });
      
      const next = new Set(prev);
      actuallyNew.forEach(i => next.add(i));
      return next;
    });
  }, []);
  
  // Set up IntersectionObserver
  useEffect(() => {
    // Create observer with preload margin
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold: 0,
    });
    
    logDebug('OBSERVER_CREATED', { rootMargin, totalItems });
    
    // Observe all registered tiles
    tileRefs.current.forEach((element, index) => {
      observerRef.current?.observe(element);
    });
    
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [handleIntersection, rootMargin, totalItems]);
  
  // Register tile for observation
  const registerTile = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      element.setAttribute('data-lazy-index', String(index));
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
  
  // Update initial visible when totalItems changes
  useEffect(() => {
    setVisibleIndices(prev => {
      // Check if we actually need to add any new indices
      let hasNewIndices = false;
      const targetCount = Math.min(initialVisible, totalItems);
      
      for (let i = 0; i < targetCount; i++) {
        if (!prev.has(i)) {
          hasNewIndices = true;
          break;
        }
      }
      
      // Only create new Set if there are actual changes
      if (!hasNewIndices) {
        return prev;  // Same reference = no re-render
      }
      
      const next = new Set(prev);
      for (let i = 0; i < targetCount; i++) {
        next.add(i);
      }
      return next;
    });
  }, [totalItems, initialVisible]);
  
  return {
    visibleIndices,
    containerRef,
    registerTile,
  };
}
