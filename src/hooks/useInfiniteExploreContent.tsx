
import { useState, useCallback, useEffect, useRef } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';
import { useMockPostsHandler } from './explore/useMockPostsHandler';
import { logDataFetch, logLoadMore } from '@/utils/debugWatchPage';

const POSTS_PER_PAGE = 20; // Increased for better performance
const PRELOAD_THRESHOLD = 2; // Reduced threshold for faster preloading
const LOAD_MORE_COOLDOWN_MS = 300; // Prevent rapid-fire calls
// Keep Discover feed memory under control – only cache current + previous filter
const MAX_FILTER_CACHE = 2;

type FilterStateMap<T> = Record<string, T>;

function pruneFilterMap<T>(
  map: FilterStateMap<T>,
  activeFilterKey: string,
  maxEntries: number = MAX_FILTER_CACHE
): FilterStateMap<T> {
  const entries = Object.entries(map);

  // If we're already under the limit, nothing to do
  if (entries.length <= maxEntries) return map;

  // Keep the active filter plus the most recent previous ones
  const preservedKeys = new Set<string>();
  preservedKeys.add(activeFilterKey);

  // Walk from the end (newest) backwards, keeping up to maxEntries
  for (let i = entries.length - 1; i >= 0 && preservedKeys.size < maxEntries; i--) {
    const [key] = entries[i];
    if (!preservedKeys.has(key)) {
      preservedKeys.add(key);
    }
  }

  const pruned: FilterStateMap<T> = {};
  for (const [key, value] of entries) {
    if (preservedKeys.has(key)) {
      pruned[key] = value;
    }
  }

  return pruned;
}

export const useInfiniteExploreContent = (
  activeFilter?: string, 
  subFilter?: string,
  durationFilter?: { from: number; to: number | null },
  sortOption?: string
) => {
  // Fast content caching by filter type (include all filter params in cache key)
  const filterKey = [
    activeFilter || 'Friends',
    subFilter,
    durationFilter ? `${durationFilter.from}-${durationFilter.to}` : '',
    sortOption || 'newest'
  ].filter(Boolean).join('-');
  const cacheKey = filterKey;
  
  const [contentCache, setContentCache] = useState<Record<string, ExploreContentItem[]>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [hasMoreStates, setHasMoreStates] = useState<Record<string, boolean>>({});
  const [offsetStates, setOffsetStates] = useState<Record<string, number>>({});
  const [mockOffsetStates, setMockOffsetStates] = useState<Record<string, number>>({});
  
  // Aggressive preloading cache
  const [preloadedContent, setPreloadedContent] = useState<Record<string, ExploreContentItem[]>>({});
  
  // Load more deduplication guards
  const lastLoadMoreTimeRef = useRef(0);
  const loadMoreInProgressRef = useRef(false); // Immediate synchronous guard
  
  const { fetchRealPosts, fetchFriendsPosts } = useRealPostsFetcher();
  const { getMockPosts } = useMockPostsHandler();
  
  const currentFilter = cacheKey;
  
  // Current state
  const content = contentCache[currentFilter] || [];
  const loading = loadingStates[currentFilter] || false;
  const hasMore = hasMoreStates[currentFilter] ?? true;
  const currentOffset = offsetStates[currentFilter] || 0;
  const currentMockOffset = mockOffsetStates[currentFilter] || 0;

  // Fast preload

  const preloadMore = useCallback(async (abortSignal?: AbortSignal) => {
    if (loading || !hasMore || preloadedContent[currentFilter]?.length > 0) {
      return;
    }
    
    try {
      const freshOffset = offsetStates[currentFilter] || 0;
      let posts = [];
      
      if (activeFilter === 'Friends') {
        posts = await fetchFriendsPosts(freshOffset, POSTS_PER_PAGE);
      } else {
        posts = await fetchRealPosts(freshOffset, POSTS_PER_PAGE, activeFilter, subFilter, durationFilter, sortOption);
      }
      
      // Check if aborted before setting state
      if (abortSignal?.aborted) return;
      
      if (posts.length > 0) {
        setPreloadedContent(prev => {
          const updated: FilterStateMap<ExploreContentItem[]> = {
            ...prev,
            [currentFilter]: posts
          };
          return pruneFilterMap(updated, currentFilter);
        });
      }
    } catch (error) {
      console.error('Error preloading content:', error);
    }
  }, [loading, hasMore, offsetStates, fetchRealPosts, fetchFriendsPosts, currentFilter, preloadedContent, activeFilter, subFilter, durationFilter, sortOption]);

  const loadMore = useCallback(async (abortSignal?: AbortSignal) => {
    // Immediate synchronous guard - prevents parallel calls
    if (loadMoreInProgressRef.current) {
      return;
    }
    loadMoreInProgressRef.current = true;
    
    // Time-based deduplication as secondary guard
    const now = Date.now();
    if (now - lastLoadMoreTimeRef.current < LOAD_MORE_COOLDOWN_MS) {
      loadMoreInProgressRef.current = false;
      return;
    }
    lastLoadMoreTimeRef.current = now;
    
    // Debug: Log load more call
    logLoadMore({
      currentCount: content.length,
      hasMore,
      isLoading: loading,
      action: 'called',
    });

    if (loading || !hasMore) {
      logLoadMore({
        currentCount: content.length,
        hasMore,
        isLoading: loading,
        action: 'skipped',
      });
      loadMoreInProgressRef.current = false;
      return;
    }
    
    // Fast: Check preloaded content first
    const preloaded = preloadedContent[currentFilter];
    if (preloaded && preloaded.length > 0) {
      const newContent = [...content, ...preloaded];
      
      // Update cache instantly
      setContentCache(prev => {
        const updated: FilterStateMap<ExploreContentItem[]> = {
          ...prev,
          [currentFilter]: newContent
        };
        return pruneFilterMap(updated, currentFilter);
      });
      
      setOffsetStates(prev => {
        const updated: FilterStateMap<number> = {
          ...prev,
          [currentFilter]: (prev[currentFilter] || 0) + POSTS_PER_PAGE
        };
        return pruneFilterMap(updated, currentFilter);
      });
      
      // Clear preloaded content and start next preload
      setPreloadedContent(prev => {
        const updated: FilterStateMap<ExploreContentItem[]> = {
          ...prev,
          [currentFilter]: []
        };
        return pruneFilterMap(updated, currentFilter);
      });
      
      setTimeout(() => preloadMore(abortSignal), 50); // Fast preload trigger
      
      if (preloaded.length < POSTS_PER_PAGE) {
        setHasMoreStates(prev => {
          const updated: FilterStateMap<boolean> = { ...prev, [currentFilter]: false };
          return pruneFilterMap(updated, currentFilter);
        });
      }
      
      loadMoreInProgressRef.current = false;
      return;
    }
    
    // Set loading for current filter
    setLoadingStates(prev => {
      const updated: FilterStateMap<boolean> = { ...prev, [currentFilter]: true };
      return pruneFilterMap(updated, currentFilter);
    });

    try {
      // Get fresh offset value from state to avoid stale closure
      const freshOffset = offsetStates[currentFilter] || 0;
      let posts: ExploreContentItem[] = [];
      
      if (activeFilter === 'Friends') {
        // Use specific fetcher for Friends filter
        posts = await fetchFriendsPosts(freshOffset, POSTS_PER_PAGE);
      } else {
        // Try to fetch real posts with filter and subfilter
        posts = await fetchRealPosts(freshOffset, POSTS_PER_PAGE, activeFilter, subFilter, durationFilter, sortOption);
      }
      
      // Check if aborted before setting state
      if (abortSignal?.aborted) {
        setLoadingStates(prev => {
          const updated: FilterStateMap<boolean> = { ...prev, [currentFilter]: false };
          return pruneFilterMap(updated, currentFilter);
        });
        loadMoreInProgressRef.current = false;
        return;
      }
      
      if (posts.length > 0) {
        // Debug: Log successful fetch
        logLoadMore({
          currentCount: content.length,
          hasMore: true,
          isLoading: false,
          action: 'success',
          newItemsCount: posts.length,
        });
        
        // Debug: Log data fetch details
        logDataFetch({
          firstPageCount: posts.length,
          totalItems: content.length + posts.length,
          filterKey: currentFilter,
        });

        // Update content cache for current filter
        setContentCache(prev => {
          const updated: FilterStateMap<ExploreContentItem[]> = {
            ...prev,
            [currentFilter]: [...(prev[currentFilter] || []), ...posts]
          };
          return pruneFilterMap(updated, currentFilter);
        });
        
        // Update offset for current filter
        setOffsetStates(prev => {
          const updated: FilterStateMap<number> = {
            ...prev,
            [currentFilter]: freshOffset + POSTS_PER_PAGE
          };
          return pruneFilterMap(updated, currentFilter);
        });
        
        // Start preloading next batch
        setTimeout(() => preloadMore(abortSignal), 100);
        
        // If we got fewer posts than requested, we might be at the end
        if (posts.length < POSTS_PER_PAGE) {
          setHasMoreStates(prev => {
            const updated: FilterStateMap<boolean> = { ...prev, [currentFilter]: false };
            return pruneFilterMap(updated, currentFilter);
          });
        }
      } else {
        // No posts available - mark as end instead of falling back to mock data
        setHasMoreStates(prev => {
          const updated: FilterStateMap<boolean> = { ...prev, [currentFilter]: false };
          return pruneFilterMap(updated, currentFilter);
        });
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setHasMoreStates(prev => {
        const updated: FilterStateMap<boolean> = { ...prev, [currentFilter]: false };
        return pruneFilterMap(updated, currentFilter);
      });
    } finally {
      setLoadingStates(prev => {
        const updated: FilterStateMap<boolean> = { ...prev, [currentFilter]: false };
        return pruneFilterMap(updated, currentFilter);
      });
      loadMoreInProgressRef.current = false;
    }
  }, [loading, hasMore, offsetStates, fetchRealPosts, fetchFriendsPosts, currentFilter, preloadedContent, preloadMore, activeFilter, subFilter, durationFilter, sortOption]);

  // Initialize states for new filters (but don't reset existing ones)
  useEffect(() => {
    if (!(currentFilter in contentCache)) {
      setContentCache(prev => {
        const updated: FilterStateMap<ExploreContentItem[]> = { ...prev, [currentFilter]: [] };
        return pruneFilterMap(updated, currentFilter);
      });
    }
    if (!(currentFilter in loadingStates)) {
      setLoadingStates(prev => {
        const updated: FilterStateMap<boolean> = { ...prev, [currentFilter]: false };
        return pruneFilterMap(updated, currentFilter);
      });
    }
    if (!(currentFilter in hasMoreStates)) {
      setHasMoreStates(prev => {
        const updated: FilterStateMap<boolean> = { ...prev, [currentFilter]: true };
        return pruneFilterMap(updated, currentFilter);
      });
    }
    if (!(currentFilter in offsetStates)) {
      setOffsetStates(prev => {
        const updated: FilterStateMap<number> = { ...prev, [currentFilter]: 0 };
        return pruneFilterMap(updated, currentFilter);
      });
    }
    if (!(currentFilter in mockOffsetStates)) {
      setMockOffsetStates(prev => {
        const updated: FilterStateMap<number> = { ...prev, [currentFilter]: 0 };
        return pruneFilterMap(updated, currentFilter);
      });
    }
  }, [currentFilter]);

  // Initial load and auto-load more if viewport isn't filled
  // Add AbortController to cancel requests on filter change
  useEffect(() => {
    const abortController = new AbortController();
    
    const autoLoadContent = async () => {
      if (content.length === 0 && !loading) {
        await loadMore(abortController.signal);
        
        // After initial load, check if we need more content to fill viewport
        setTimeout(() => {
          const viewportHeight = window.innerHeight;
          const contentHeight = document.body.scrollHeight;
          
          // If content doesn't fill viewport and we have more content, load more
          if (contentHeight <= viewportHeight && hasMore && !loading && !abortController.signal.aborted) {
            loadMore(abortController.signal);
          }
        }, 100); // Small delay to allow DOM to update
      }
    };
    
    autoLoadContent();
    
    // Cancel in-flight requests when filter changes
    return () => {
      abortController.abort();
    };
  }, [currentFilter]);

  return {
    content,
    loading,
    hasMore,
    loadMore
  };
};
