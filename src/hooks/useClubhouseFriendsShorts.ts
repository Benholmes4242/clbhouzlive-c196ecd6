import { useState, useEffect, useCallback, useRef } from 'react';
import { useOptimizedInfiniteQuery } from './useOptimizedQuery';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';
import { FEATURE_FLAGS, VERTICAL_MIN_AR, VERTICAL_MAX_AR } from '@/config/featureFlags';

/**
 * Hook for Clubhouse Friends feed - shows short videos only from followed users/businesses.
 * Uses the same pattern as useInfiniteClubhouseShorts but filters to friends only.
 */
export const useClubhouseFriendsShorts = () => {
  const { fetchFriendsPosts } = useRealPostsFetcher();
  const [allPosts, setAllPosts] = useState<ExploreContentItem[]>([]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useOptimizedInfiniteQuery({
    queryKey: ['clubhouse-friends-shorts'],
    queryFn: async ({ pageParam }: { pageParam: unknown }) => {
      // Fetch friends posts using existing fetcher
      const posts = await fetchFriendsPosts(pageParam as number ?? 0, 20);
      
      // Filter to shorts only (≤120s) and apply vertical-only filter if enabled
      const filteredPosts = posts.filter(post => {
        // Review posts bypass all shorts filters (matches verticalFilter.ts pattern)
        const isReviewPost = post.sourceReviewId != null || (post.categories && post.categories.includes('review'));
        if (isReviewPost) return true;

        // Allow both videos and images (vertical content from friends)
        if (post.type !== 'video' && post.type !== 'image') return false;
        
        // Videos must be ≤120 seconds (images have no duration, so they pass)
        if (post.type === 'video' && post.durationSeconds && post.durationSeconds > 120) return false;
        
        // Apply vertical-only filter if enabled
        if (FEATURE_FLAGS.CLUBHOUSE_VERTICAL_ONLY) {
          if (!post.aspectRatio) return false;
          if (post.aspectRatio < VERTICAL_MIN_AR || post.aspectRatio > VERTICAL_MAX_AR) {
            return false;
          }
        }
        
        return true;
      });
      
      return {
        posts: filteredPosts,
        nextCursor: posts.length === 20 ? (pageParam as number ?? 0) + 20 : undefined,
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,   // 2 min
    gcTime:   5 * 60 * 1000,   // 5 min
    refetchOnWindowFocus: false,
    refetchOnReconnect:   false,
    dedupe: true,
    ttl: 3000,
  });

  // Flatten all pages
  useEffect(() => {
    if (data?.pages) {
      const flattenedPosts = data.pages.flatMap(page => page.posts);
      // Deduplicate by ID
      const seen = new Set<string>();
      const deduped = flattenedPosts.filter(post => {
        if (seen.has(post.id)) return false;
        seen.add(post.id);
        return true;
      });
      setAllPosts(deduped);
    }
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    posts: allPosts,
    isLoading,
    isError,
    error,
    hasMore: hasNextPage,
    loadMore,
    isLoadingMore: isFetchingNextPage,
    refetch
  };
};
