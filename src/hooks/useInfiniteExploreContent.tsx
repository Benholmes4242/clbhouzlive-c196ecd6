
import { useState, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';

import { useMockPostsHandler } from './explore/useMockPostsHandler';

const POSTS_PER_PAGE = 15; // Increased to fill viewport better

export const useInfiniteExploreContent = (activeFilter?: string) => {
  const currentFilter = activeFilter || 'Friends';
  
  // Initialize all states in a single useState to prevent multiple re-renders
  const [state, setState] = useState<{
    contentCache: Record<string, ExploreContentItem[]>;
    loadingStates: Record<string, boolean>;
    hasMoreStates: Record<string, boolean>;
    offsetStates: Record<string, number>;
    initialized: Record<string, boolean>;
  }>(() => ({
    contentCache: {},
    loadingStates: {},
    hasMoreStates: {},
    offsetStates: {},
    initialized: {}
  }));
  
  const { fetchRealPosts, fetchFriendsPosts } = useRealPostsFetcher();
  const { getMockPosts } = useMockPostsHandler();
  
  const content = state.contentCache[currentFilter] || [];
  const loading = state.loadingStates[currentFilter] || false;
  const hasMore = state.hasMoreStates[currentFilter] ?? true;
  const currentOffset = state.offsetStates[currentFilter] || 0;
  const isInitialized = state.initialized[currentFilter] || false;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }
    
    // Set loading for current filter using single state update
    setState(prev => ({
      ...prev,
      loadingStates: { ...prev.loadingStates, [currentFilter]: true }
    }));

    try {
      // Get fresh offset value from current state
      const freshOffset = state.offsetStates[currentFilter] || 0;
      let posts = [];
      
      // Use specific fetcher for Friends filter
      if (currentFilter === 'Friends') {
        posts = await fetchFriendsPosts(freshOffset, POSTS_PER_PAGE);
      } else {
        // Try to fetch real posts with filter
        posts = await fetchRealPosts(freshOffset, POSTS_PER_PAGE, currentFilter);
      }
      
      if (posts.length > 0) {
        // Update all states in a single setState call to prevent multiple re-renders
        setState(prev => ({
          ...prev,
          contentCache: {
            ...prev.contentCache,
            [currentFilter]: [...(prev.contentCache[currentFilter] || []), ...posts]
          },
          offsetStates: {
            ...prev.offsetStates,
            [currentFilter]: freshOffset + POSTS_PER_PAGE
          },
          hasMoreStates: {
            ...prev.hasMoreStates,
            [currentFilter]: posts.length >= POSTS_PER_PAGE
          },
          loadingStates: {
            ...prev.loadingStates,
            [currentFilter]: false
          }
        }));
      } else {
        // No posts available - mark as end
        setState(prev => ({
          ...prev,
          hasMoreStates: { ...prev.hasMoreStates, [currentFilter]: false },
          loadingStates: { ...prev.loadingStates, [currentFilter]: false }
        }));
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setState(prev => ({
        ...prev,
        hasMoreStates: { ...prev.hasMoreStates, [currentFilter]: false },
        loadingStates: { ...prev.loadingStates, [currentFilter]: false }
      }));
    }
  }, [loading, hasMore, currentFilter, state.offsetStates, fetchRealPosts, fetchFriendsPosts]);

  // Initialize states for new filters in a single effect
  useEffect(() => {
    if (!isInitialized) {
      setState(prev => ({
        ...prev,
        contentCache: { ...prev.contentCache, [currentFilter]: [] },
        loadingStates: { ...prev.loadingStates, [currentFilter]: false },
        hasMoreStates: { ...prev.hasMoreStates, [currentFilter]: true },
        offsetStates: { ...prev.offsetStates, [currentFilter]: 0 },
        initialized: { ...prev.initialized, [currentFilter]: true }
      }));
    }
  }, [currentFilter, isInitialized]);

  // Initial load only - prevent infinite loops
  useEffect(() => {
    if (isInitialized && content.length === 0 && !loading && hasMore) {
      loadMore();
    }
  }, [isInitialized, content.length, loading, hasMore, loadMore]);

  return {
    content,
    loading,
    hasMore,
    loadMore
  };
};
