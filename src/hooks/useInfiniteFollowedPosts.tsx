import { useState, useEffect, useCallback, useRef } from 'react';
import { useOptimizedInfiniteQuery } from './useOptimizedQuery';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';
import { ExploreContentItem } from '@/components/explore/types';
import { logFeedFetchStart, logFeedFetchSuccess } from '@/utils/bootTimeline';
import { clubhouseDebug } from '@/debug/clubhouseDebug';

// NEW: Hook for Clubhouse explore feed (all users, short videos only)
export const useInfiniteClubhouseShorts = () => {
  const { fetchClubhouseExploreShorts } = useRealPostsFetcher();
  const [allPosts, setAllPosts] = useState<ExploreContentItem[]>([]);
  const fetchStartLogged = useRef(false);

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
    queryKey: ['clubhouse-explore-shorts'],
    queryFn: async ({ pageParam }: { pageParam: unknown }) => {
      // Log fetch start once for boot timeline
      if (!fetchStartLogged.current) {
        fetchStartLogged.current = true;
        logFeedFetchStart();
        clubhouseDebug.fetchStart('clubhouse-explore-shorts');
      }
      
      const fetchStart = performance.now();
      
      // Phase 1 Perf: Reduced from 30 to 12 items for faster initial load
      const posts = await fetchClubhouseExploreShorts(12, pageParam as string | null);
      
      const fetchDuration = Math.round(performance.now() - fetchStart);
      
      // Log fetch success with post count (first page only)
      if (!pageParam) {
        logFeedFetchSuccess(posts.length);
        clubhouseDebug.fetchSuccess('clubhouse-explore-shorts', posts.length, fetchDuration);
      } else {
        clubhouseDebug.fetchPageLoad(data?.pages?.length || 0, posts.length);
      }
      
      return {
        posts,
        nextCursor: posts.length > 0 ? posts[posts.length - 1].createdAt : undefined,
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: null,
    staleTime: 2 * 60 * 1000,   // 2 min – fine for feed scrolling
    gcTime:   5 * 60 * 1000,   // 5 min – limits memory growth
    refetchOnWindowFocus: false,
    refetchOnReconnect:   false,
    dedupe: true,
    ttl: 3000,
  });

  // Flatten all pages
  useEffect(() => {
    if (data?.pages) {
      const flattenedPosts = data.pages.flatMap(page => page.posts);
      setAllPosts(flattenedPosts);
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

// Original hook for followed-users feed
export const useInfiniteFollowedPosts = () => {
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
    queryKey: ['infinite-followed-posts'],
    queryFn: async ({ pageParam }: { pageParam: unknown }) => {
      const posts = await fetchFriendsPosts(pageParam as number ?? 0, 10);
      return {
        posts,
        nextCursor: posts.length === 10 ? (pageParam as number ?? 0) + 10 : undefined,
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,   // 2 min – avoids hammering Supabase
    gcTime:   5 * 60 * 1000,   // 5 min – free memory between sessions
    refetchOnWindowFocus: false,
    refetchOnReconnect:   false,
    dedupe: true,
    ttl: 3000,
  });

  // Flatten all pages into a single array
  useEffect(() => {
    if (data?.pages) {
      const flattenedPosts = data.pages.flatMap(page => page.posts);
      setAllPosts(flattenedPosts);
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