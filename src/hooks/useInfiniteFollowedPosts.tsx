import { useState, useEffect, useCallback } from 'react';
import { useOptimizedInfiniteQuery } from './useOptimizedQuery';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';

// NEW: Hook for Clubhouse explore feed (all users, short videos only)
export const useInfiniteClubhouseShorts = () => {
  const { fetchClubhouseExploreShorts } = useRealPostsFetcher();
  const [allPosts, setAllPosts] = useState<ExploreContentItem[]>([]);
  const [session, setSession] = useState<any>(null);

  // Get session to enable query only when user is authenticated
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

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
    queryKey: ['clubhouse-explore-shorts', session?.user.id],
    queryFn: async ({ pageParam }: { pageParam: unknown }) => {
      const posts = await fetchClubhouseExploreShorts(30, pageParam as string | null);
      return {
        posts,
        nextCursor: posts.length > 0 ? posts[posts.length - 1].createdAt : undefined,
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: null,
    staleTime: 30_000, // 30s for explore feed
    dedupe: true,
    ttl: 3000,
    enabled: !!session, // Only run query when authenticated
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
    staleTime: 2 * 60 * 1000, // 2 minutes for social feed
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