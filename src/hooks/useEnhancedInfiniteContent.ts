import { useState, useCallback, useEffect, useMemo } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';
import { useContentPreloader } from './useContentPreloader';
import { useInfiniteScrollPreloader } from './useInfiniteScrollPreloader';

const POSTS_PER_PAGE = 15;
const PRELOAD_AHEAD_COUNT = 5; // Number of posts to preload ahead

export const useEnhancedInfiniteContent = (activeFilter?: string) => {
  const [content, setContent] = useState<ExploreContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  const { fetchRealPosts } = useRealPostsFetcher();

  // Prepare content for preloader (filter out non-media types)
  const preloadableContent = useMemo(() => {
    return content
      .filter(item => item.type === 'image' || item.type === 'video')
      .map(item => ({
        id: item.id,
        type: item.type as 'image' | 'video',
        url: item.src,
      }));
  }, [content]);

  // Set up content preloader
  const { preloadAhead, isPreloaded } = useContentPreloader({
    preloadDistance: PRELOAD_AHEAD_COUNT,
    enabled: true,
    onPreloadComplete: (id) => {
      console.log(`Preloaded content: ${id}`);
    },
  });

  // Load more posts
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    try {
      const realPosts = await fetchRealPosts(currentOffset, POSTS_PER_PAGE, activeFilter);
      
      if (realPosts.length > 0) {
        setContent(prev => {
          const newContent = [...prev, ...realPosts];
          
          // Trigger preloading for newly added content
          setTimeout(() => {
            const newContentForPreload = realPosts
              .filter(item => item.type === 'image' || item.type === 'video')
              .map(item => ({
                id: item.id,
                type: item.type as 'image' | 'video',
                url: item.src,
              }));
            
            // Preload new content starting from where we left off
            if (newContentForPreload.length > 0) {
              preloadAhead(prev.length, newContentForPreload);
            }
          }, 100);
          
          return newContent;
        });
        
        setCurrentOffset(prev => prev + POSTS_PER_PAGE);
        
        if (realPosts.length < POSTS_PER_PAGE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, currentOffset, fetchRealPosts, activeFilter, preloadAhead]);

  // Set up infinite scroll with preloading
  const { createSentinel } = useInfiniteScrollPreloader({
    threshold: 0.7, // Start preloading when 70% scrolled
    enabled: true,
    onPreloadTrigger: () => {
      // Preload content ahead when approaching end
      preloadAhead(currentViewIndex, preloadableContent);
    },
    onNearEnd: loadMore,
  });

  // Update current view index when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const itemHeight = 600; // Approximate height of each content item
      const newIndex = Math.floor(scrollY / itemHeight);
      
      if (newIndex !== currentViewIndex && newIndex < content.length) {
        setCurrentViewIndex(newIndex);
        
        // Trigger preloading based on current position
        preloadAhead(newIndex, preloadableContent);
      }
    };

    const throttledHandler = throttle(handleScroll, 200);
    window.addEventListener('scroll', throttledHandler, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandler);
    };
  }, [currentViewIndex, content.length, preloadAhead, preloadableContent]);

  // Reset when filter changes
  useEffect(() => {
    setContent([]);
    setCurrentOffset(0);
    setHasMore(true);
    setCurrentViewIndex(0);
  }, [activeFilter]);

  // Initial load and viewport filling
  useEffect(() => {
    const autoLoadContent = async () => {
      if (content.length === 0 && !loading) {
        await loadMore();
        
        // Check if we need more content to fill viewport
        setTimeout(() => {
          const viewportHeight = window.innerHeight;
          const contentHeight = document.body.scrollHeight;
          
          if (contentHeight <= viewportHeight && hasMore && !loading) {
            loadMore();
          }
        }, 100);
      }
    };
    
    autoLoadContent();
  }, [content.length, loading, hasMore, loadMore]);

  // Start preloading immediately after initial load
  useEffect(() => {
    if (content.length > 0 && preloadableContent.length > 0) {
      // Start preloading from the beginning
      preloadAhead(0, preloadableContent);
    }
  }, [content.length, preloadAhead, preloadableContent]);

  return {
    content,
    loading,
    hasMore,
    loadMore,
    createSentinel,
    isPreloaded,
    currentViewIndex,
  };
};

// Throttle utility
function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}