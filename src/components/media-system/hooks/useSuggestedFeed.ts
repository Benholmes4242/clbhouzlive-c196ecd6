import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FeedPost } from '../types/media';
import { interleaveReviews, deduplicatePosts } from '../utils/feedAlgorithm';
import { mapRowToFeedPost, groupMultiMedia } from '../utils/feedMapper';

const PAGE_SIZE = 10;

async function fetchSuggestedPage(
  userId: string,
  cursor: string | null,
  seenPostIds: string[]
): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const { data, error } = await supabase.rpc('get_suggested_feed', {
    p_user_id: userId,
    p_page_size: PAGE_SIZE,
    p_cursor: cursor,
    p_seen_post_ids: seenPostIds,
  });

  if (error) {
    console.error('[SuggestedFeed] RPC error:', error);
    return { posts: [], nextCursor: null };
  }

  if (!data || data.length === 0) {
    return { posts: [], nextCursor: null };
  }

  const posts = groupMultiMedia((data as any[]).map(mapRowToFeedPost));
  const interleaved = interleaveReviews(posts, 'suggested');

  const lastRow = data[data.length - 1] as any;
  const nextCursor = data.length >= PAGE_SIZE ? lastRow.post_created_at : null;

  return { posts: interleaved, nextCursor };
}

export function useSuggestedFeed(userId: string | undefined) {
  const seenPostIds = useRef<string[]>([]);

  const query = useInfiniteQuery({
    queryKey: ['media-feed', 'suggested', userId],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [], nextCursor: null };
      const result = await fetchSuggestedPage(
        userId,
        pageParam as string | null,
        seenPostIds.current
      );
      for (const post of result.posts) {
        if (!seenPostIds.current.includes(post.id)) {
          seenPostIds.current.push(post.id);
        }
      }
      return result;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const allPosts = deduplicatePosts(
    query.data?.pages.flatMap((p) => p.posts) ?? []
  );

  const resetSeen = useCallback(() => {
    seenPostIds.current = [];
  }, []);

  return {
    posts: allPosts,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    resetSeen,
  };
}
