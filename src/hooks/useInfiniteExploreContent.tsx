import { useState, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';
import { useMockPostsHandler } from './explore/useMockPostsHandler';

const POSTS_PER_PAGE = 6; // Reduced for faster loading on mobile

export const useInfiniteExploreContent = () => {
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
      // Try to fetch real posts first
      const realPosts = await fetchRealPosts(currentOffset, POSTS_PER_PAGE);
      
      if (realPosts.length > 0) {
        setContent(prev => [...prev, ...realPosts]);
        setCurrentOffset(prev => prev + POSTS_PER_PAGE);
        
        // If we got fewer posts than requested, we might be at the end
        if (realPosts.length < POSTS_PER_PAGE) {
          setHasMore(true); // Keep loading mock data
        }
      } else {
        // Fallback to mock data
        const mockPosts = getMockPosts(currentMockOffset, POSTS_PER_PAGE);
        
        if (mockPosts.length > 0) {
          setContent(prev => [...prev, ...mockPosts]);
          setCurrentMockOffset(prev => prev + POSTS_PER_PAGE);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading content:', error);
      
      // Fallback to mock data on error
      const mockPosts = getMockPosts(currentMockOffset, POSTS_PER_PAGE);
      if (mockPosts.length > 0) {
        setContent(prev => [...prev, ...mockPosts]);
        setCurrentMockOffset(prev => prev + POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, currentOffset, currentMockOffset, fetchRealPosts, getMockPosts]);

  // Initial load
  useEffect(() => {
    if (content.length === 0 && !loading) {
      loadMore();
    }
  }, []);

  return {
    content,
    loading,
    hasMore,
    loadMore
  };
};