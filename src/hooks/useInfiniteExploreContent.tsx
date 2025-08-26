
import { useState, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';
import { useMockPostsHandler } from './explore/useMockPostsHandler';
import { microCacheGet, microCacheSet, ultraThrottle } from '@/utils/ultraPerformance';

const POSTS_PER_PAGE = 20; // Increased for better performance
const PRELOAD_THRESHOLD = 2; // Reduced threshold for faster preloading

export const useInfiniteExploreContent = (activeFilter?: string) => {
  // Ultra-fast content caching by filter type
  const [contentCache, setContentCache] = useState<Record<string, ExploreContentItem[]>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [hasMoreStates, setHasMoreStates] = useState<Record<string, boolean>>({});
  const [offsetStates, setOffsetStates] = useState<Record<string, number>>({});
  const [mockOffsetStates, setMockOffsetStates] = useState<Record<string, number>>({});
  
  // Ultra-aggressive preloading cache
  const [preloadedContent, setPreloadedContent] = useState<Record<string, ExploreContentItem[]>>({});
  
  const { fetchRealPosts, fetchFriendsPosts } = useRealPostsFetcher();
  const { getMockPosts } = useMockPostsHandler();
  
  const currentFilter = activeFilter || 'Friends';
  
  // Use micro-cache for current state
  const cacheKey = `explore-content-${currentFilter}`;
  const content = microCacheGet<ExploreContentItem[]>(cacheKey) || contentCache[currentFilter] || [];
  const loading = loadingStates[currentFilter] || false;
  const hasMore = hasMoreStates[currentFilter] ?? true;
  const currentOffset = offsetStates[currentFilter] || 0;
  const currentMockOffset = mockOffsetStates[currentFilter] || 0;

  // Ultra-fast preload with aggressive caching

  const preloadMore = useCallback(ultraThrottle(async () => {
    if (loading || !hasMore || preloadedContent[currentFilter]?.length > 0) {
      return;
    }
    
    try {
      const freshOffset = offsetStates[currentFilter] || 0;
      let posts = [];
      
      if (currentFilter === 'Friends') {
        posts = await fetchFriendsPosts(freshOffset, POSTS_PER_PAGE);
      } else {
        posts = await fetchRealPosts(freshOffset, POSTS_PER_PAGE, currentFilter);
      }
      
      if (posts.length > 0) {
        setPreloadedContent(prev => ({
          ...prev,
          [currentFilter]: posts
        }));
      }
    } catch (error) {
      console.error('Error preloading content:', error);
    }
  }, 300), [loading, hasMore, offsetStates, fetchRealPosts, fetchFriendsPosts, currentFilter, preloadedContent]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }
    
    // Ultra-fast: Check preloaded content first
    const preloaded = preloadedContent[currentFilter];
    if (preloaded && preloaded.length > 0) {
      const newContent = [...content, ...preloaded];
      
      // Update cache and micro-cache instantly
      setContentCache(prev => ({
        ...prev,
        [currentFilter]: newContent
      }));
      microCacheSet(cacheKey, newContent, 5000);
      
      setOffsetStates(prev => ({
        ...prev,
        [currentFilter]: (prev[currentFilter] || 0) + POSTS_PER_PAGE
      }));
      
      // Clear preloaded content and start next preload
      setPreloadedContent(prev => ({
        ...prev,
        [currentFilter]: []
      }));
      
      setTimeout(() => preloadMore(), 50); // Ultra-fast preload trigger
      
      if (preloaded.length < POSTS_PER_PAGE) {
        setHasMoreStates(prev => ({ ...prev, [currentFilter]: false }));
      }
      
      return;
    }
    
    // Set loading for current filter
    setLoadingStates(prev => ({ ...prev, [currentFilter]: true }));

    try {
      // Get fresh offset value from state to avoid stale closure
      const freshOffset = offsetStates[currentFilter] || 0;
      let posts = [];
      
      // Use specific fetcher for Friends filter
      if (currentFilter === 'Friends') {
        posts = await fetchFriendsPosts(freshOffset, POSTS_PER_PAGE);
      } else {
        // Try to fetch real posts with filter
        posts = await fetchRealPosts(freshOffset, POSTS_PER_PAGE, currentFilter);
      }
      
      if (posts.length > 0) {
        // Update content cache for current filter
        setContentCache(prev => ({
          ...prev,
          [currentFilter]: [...(prev[currentFilter] || []), ...posts]
        }));
        
        // Update offset for current filter
        setOffsetStates(prev => ({
          ...prev,
          [currentFilter]: freshOffset + POSTS_PER_PAGE
        }));
        
        // Start preloading next batch
        setTimeout(() => preloadMore(), 100);
        
        // If we got fewer posts than requested, we might be at the end
        if (posts.length < POSTS_PER_PAGE) {
          setHasMoreStates(prev => ({ ...prev, [currentFilter]: false }));
        }
      } else {
        // No posts available - mark as end instead of falling back to mock data
        setHasMoreStates(prev => ({ ...prev, [currentFilter]: false }));
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setHasMoreStates(prev => ({ ...prev, [currentFilter]: false }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [currentFilter]: false }));
    }
  }, [loading, hasMore, offsetStates, fetchRealPosts, fetchFriendsPosts, currentFilter, preloadedContent, preloadMore]);

  // Initialize states for new filters (but don't reset existing ones)
  useEffect(() => {
    if (!(currentFilter in contentCache)) {
      setContentCache(prev => ({ ...prev, [currentFilter]: [] }));
    }
    if (!(currentFilter in loadingStates)) {
      setLoadingStates(prev => ({ ...prev, [currentFilter]: false }));
    }
    if (!(currentFilter in hasMoreStates)) {
      setHasMoreStates(prev => ({ ...prev, [currentFilter]: true }));
    }
    if (!(currentFilter in offsetStates)) {
      setOffsetStates(prev => ({ ...prev, [currentFilter]: 0 }));
    }
    if (!(currentFilter in mockOffsetStates)) {
      setMockOffsetStates(prev => ({ ...prev, [currentFilter]: 0 }));
    }
  }, [currentFilter]);

  // Initial load and auto-load more if viewport isn't filled
  useEffect(() => {
    const autoLoadContent = async () => {
      if (content.length === 0 && !loading) {
        await loadMore();
        
        // After initial load, check if we need more content to fill viewport
        setTimeout(() => {
          const viewportHeight = window.innerHeight;
          const contentHeight = document.body.scrollHeight;
          
          // If content doesn't fill viewport and we have more content, load more
          if (contentHeight <= viewportHeight && hasMore && !loading) {
            loadMore();
          }
        }, 100); // Small delay to allow DOM to update
      }
    };
    
    autoLoadContent();
  }, [content.length, loading, hasMore, loadMore]);

  return {
    content,
    loading,
    hasMore,
    loadMore
  };
};
