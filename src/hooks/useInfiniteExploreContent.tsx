
import { useState, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';

import { useMockPostsHandler } from './explore/useMockPostsHandler';

const POSTS_PER_PAGE = 15; // Increased to fill viewport better

export const useInfiniteExploreContent = (activeFilter?: string) => {
  // Cache content by filter type to avoid reloading when switching tabs
  const [contentCache, setContentCache] = useState<Record<string, ExploreContentItem[]>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [hasMoreStates, setHasMoreStates] = useState<Record<string, boolean>>({});
  const [offsetStates, setOffsetStates] = useState<Record<string, number>>({});
  const [mockOffsetStates, setMockOffsetStates] = useState<Record<string, number>>({});
  
  const { fetchRealPosts, fetchFriendsPosts } = useRealPostsFetcher();
  
  const { getMockPosts } = useMockPostsHandler();
  
  const currentFilter = activeFilter || 'Friends';
  const content = contentCache[currentFilter] || [];
  const loading = loadingStates[currentFilter] || false;
  const hasMore = hasMoreStates[currentFilter] ?? true;
  const currentOffset = offsetStates[currentFilter] || 0;
  const currentMockOffset = mockOffsetStates[currentFilter] || 0;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
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
  }, [loading, hasMore, offsetStates, fetchRealPosts, fetchFriendsPosts, currentFilter]);

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
