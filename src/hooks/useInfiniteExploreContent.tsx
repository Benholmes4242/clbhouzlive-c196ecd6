
import { useState, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';

import { useMockPostsHandler } from './explore/useMockPostsHandler';

const POSTS_PER_PAGE = 6; // Reduced for faster loading on mobile

export const useInfiniteExploreContent = (activeFilter?: string) => {
  const [content, setContent] = useState<ExploreContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [currentMockOffset, setCurrentMockOffset] = useState(0);
  
  const { fetchRealPosts } = useRealPostsFetcher();
  
  const { getMockPosts } = useMockPostsHandler();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }
    setLoading(true);

    try {
      // Try to fetch real posts with filter
      const realPosts = await fetchRealPosts(currentOffset, POSTS_PER_PAGE, activeFilter);
      
      if (realPosts.length > 0) {
        setContent(prev => [...prev, ...realPosts]);
        setCurrentOffset(prev => prev + POSTS_PER_PAGE);
        
        // If we got fewer posts than requested, we might be at the end
        if (realPosts.length < POSTS_PER_PAGE) {
          setHasMore(false); // No more real posts available
        }
      } else {
        // No real posts available - mark as end instead of falling back to mock data
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setHasMore(false); // Stop loading on error instead of falling back to mock data
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, currentOffset, currentMockOffset, fetchRealPosts, getMockPosts, activeFilter]);

  // Reset content when filter changes
  useEffect(() => {
    setContent([]);
    setCurrentOffset(0);
    setCurrentMockOffset(0);
    setHasMore(true);
  }, [activeFilter]);

  // Initial load
  useEffect(() => {
    if (content.length === 0 && !loading) {
      loadMore();
    }
  }, [loadMore]);

  return {
    content,
    loading,
    hasMore,
    loadMore
  };
};
