
import { useState, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';
import { useMockPostsHandler } from './explore/useMockPostsHandler';

const POSTS_PER_PAGE = 9;

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
      console.log('Skipping load more - loading:', loading, 'hasMore:', hasMore);
      return;
    }

    console.log('Loading more content...');
    setLoading(true);

    try {
      // Try to fetch real posts first
      const realPosts = await fetchRealPosts(currentOffset, POSTS_PER_PAGE);
      console.log('Real posts fetched:', realPosts.length);
      
      if (realPosts.length > 0) {
        setContent(prev => [...prev, ...realPosts]);
        setCurrentOffset(prev => prev + POSTS_PER_PAGE);
        
        // If we got fewer posts than requested, we might be at the end
        if (realPosts.length < POSTS_PER_PAGE) {
          console.log('Reached end of real posts, switching to mock data');
          setHasMore(true); // Keep loading mock data
        }
      } else {
        // Fallback to mock data
        console.log('No real posts, falling back to mock data');
        const mockPosts = getMockPosts(currentMockOffset, POSTS_PER_PAGE);
        
        if (mockPosts.length > 0) {
          setContent(prev => [...prev, ...mockPosts]);
          setCurrentMockOffset(prev => prev + POSTS_PER_PAGE);
        } else {
          console.log('No more mock posts available');
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
      console.log('Initial content load');
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
