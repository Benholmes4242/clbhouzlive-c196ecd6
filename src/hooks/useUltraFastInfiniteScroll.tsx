import { useState, useCallback, useEffect, useRef } from 'react';

interface UseUltraFastInfiniteScrollProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number;
  preloadThreshold?: number;
}

export const useUltraFastInfiniteScroll = ({
  loadMore,
  hasMore,
  threshold = 0.8,
  preloadThreshold = 0.5
}: UseUltraFastInfiniteScrollProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const preloadRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Ultra-aggressive content preloading
  const handlePreload = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      await loadMore();
    } catch (error) {
      console.error('Preload failed:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [loadMore, hasMore]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      await loadMore();
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [loadMore, hasMore]);

  // Set up ultra-aggressive intersection observers
  useEffect(() => {
    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handlePreload();
        }
      },
      { threshold: preloadThreshold }
    );

    const loadMoreObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold }
    );

    if (preloadRef.current) {
      preloadObserver.observe(preloadRef.current);
    }

    if (loadMoreRef.current) {
      loadMoreObserver.observe(loadMoreRef.current);
    }

    return () => {
      preloadObserver.disconnect();
      loadMoreObserver.disconnect();
    };
  }, [handlePreload, handleLoadMore, threshold, preloadThreshold]);

  return {
    loadMoreRef,
    preloadRef,
    isLoading
  };
};