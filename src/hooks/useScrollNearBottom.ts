import { useEffect, useRef, useCallback } from 'react';

interface UseScrollNearBottomOptions {
  /** Distance from bottom in pixels to trigger callback (default: 600) */
  threshold?: number;
  /** Whether infinite scroll is enabled */
  enabled?: boolean;
  /** Whether more content is available */
  hasMore: boolean;
  /** Whether content is currently loading */
  isLoading: boolean;
  /** Callback when user scrolls near bottom */
  onLoadMore: () => void;
}

/**
 * Simple infinite scroll hook - triggers onLoadMore when user scrolls within
 * `threshold` pixels of the page bottom.
 * 
 * Much simpler than IntersectionObserver sentinel approach.
 */
export function useScrollNearBottom({
  threshold = 600,
  enabled = true,
  hasMore,
  isLoading,
  onLoadMore,
}: UseScrollNearBottomOptions) {
  // Use refs to avoid stale closures in scroll handler
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);
  const onLoadMoreRef = useRef(onLoadMore);
  const loadingLockRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    hasMoreRef.current = hasMore;
    isLoadingRef.current = isLoading;
    onLoadMoreRef.current = onLoadMore;
  }, [hasMore, isLoading, onLoadMore]);

  const handleScroll = useCallback(() => {
    if (!hasMoreRef.current || isLoadingRef.current || loadingLockRef.current) {
      return;
    }

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

    if (distanceFromBottom <= threshold) {
      loadingLockRef.current = true;
      onLoadMoreRef.current();
      
      // Reset lock after a short delay to prevent rapid-fire calls
      setTimeout(() => {
        loadingLockRef.current = false;
      }, 300);
    }
  }, [threshold]);

  useEffect(() => {
    if (!enabled) return;

    // Check immediately in case already near bottom
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, handleScroll]);
}
