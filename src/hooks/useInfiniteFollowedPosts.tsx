import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
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
  } = useInfiniteQuery({
    queryKey: ['infinite-followed-posts'],
    queryFn: async ({ pageParam = 0 }) => {
      const posts = await fetchFriendsPosts(pageParam, 10);
      return {
        posts,
        nextCursor: posts.length === 10 ? pageParam + 10 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array with memoization to prevent unnecessary re-renders
  useEffect(() => {
    if (data?.pages) {
      const flattenedPosts = data.pages.flatMap(page => page.posts);
      // Only update if the content actually changed
      setAllPosts(prevPosts => {
        if (JSON.stringify(prevPosts.map(p => p.id)) === JSON.stringify(flattenedPosts.map(p => p.id))) {
          return prevPosts;
        }
        return flattenedPosts;
      });
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