
import { useState, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';

const POSTS_PER_PAGE = 12; // Increased for better loading experience

export const useInfiniteExploreContent = () => {
  const [content, setContent] = useState<ExploreContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  
  const { fetchRealPosts } = useRealPostsFetcher();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }
    setLoading(true);

    try {
      // Only fetch real posts from clbhouz users - no mock data
      const realPosts = await fetchRealPosts(currentOffset, POSTS_PER_PAGE);
      
      if (realPosts.length > 0) {
        // Shuffle the fetched posts for variety
        const shuffledPosts = [...realPosts].sort(() => Math.random() - 0.5);
        setContent(prev => [...prev, ...shuffledPosts]);
        setCurrentOffset(prev => prev + POSTS_PER_PAGE);
        
        // If we got fewer posts than requested, we've reached the end
        if (realPosts.length < POSTS_PER_PAGE) {
          setHasMore(false);
        }
      } else {
        // No more real content available
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, currentOffset, fetchRealPosts]);

  // Initial load with randomization
  useEffect(() => {
    if (content.length === 0 && !loading) {
      loadMore();
    }
  }, []);

  // Shuffle content once on initial load for variety
  useEffect(() => {
    if (content.length > 0) {
      setContent(prev => [...prev].sort(() => Math.random() - 0.5));
    }
  }, []);

  return {
    content,
    loading,
    hasMore,
    loadMore
  };
};
