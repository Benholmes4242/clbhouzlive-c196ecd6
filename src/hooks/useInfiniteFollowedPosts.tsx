import { useState, useEffect, useCallback } from 'react';
import { useOptimizedInfiniteQuery } from './useOptimizedQuery';
import { useRealPostsFetcher } from './explore/useRealPostsFetcher';
import { ExploreContentItem } from '@/components/explore/types';

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