import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FeedPost, FeedRpcRow } from '../types/media';
import { buildSuggestedFeed, deduplicatePosts, initSessionSeed } from '../utils/feedAlgorithm';
import { mapRowToFeedPost, groupMultiMedia } from '../utils/feedMapper';

const PAGE_SIZE = 60;

export function useSuggestedFeed(userId: string | undefined) {
  const seenPostIds = useRef<Set<string>>(new Set());

  const query = useInfiniteQuery({
    queryKey: ['media-feed', 'suggested', userId],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };

      // Seed the session entropy for this user+hour combination
      if (userId) initSessionSeed(userId);

      try {
        const cursor = typeof pageParam === 'string' ? pageParam : undefined;

        const { data, error } = await supabase.rpc('get_suggested_feed' as any, {
          p_user_id: userId,
          p_page_size: PAGE_SIZE,
          ...(cursor ? { p_cursor: cursor } : {}),
          ...(cursor ? { p_seen_post_ids: Array.from(seenPostIds.current) } : {}),
        } as any);

        if (error) {
          console.error('[SuggestedFeed] RPC error:', error);
          return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
        }

        if (!data || data.length === 0) {
          return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
        }

        const rows = ((data ?? []) as unknown as FeedRpcRow[]);
        
        const posts = groupMultiMedia(rows.map(mapRowToFeedPost));
        const interleaved = buildSuggestedFeed(posts);

        // Track ALL fetched post IDs — including ones filtered out —
        // so the RPC doesn't waste candidate slots returning them again
        for (const post of posts) {
          seenPostIds.current.add(post.id);
        }
        // Cap at 500 to prevent unbounded growth
        if (seenPostIds.current.size > 500) {
          const arr = Array.from(seenPostIds.current);
          seenPostIds.current = new Set(arr.slice(-500));
        }

        const lastRow = rows[rows.length - 1];
        // Only advance cursor if we got filtered posts AND raw rows.
        // If rows came back but all were filtered, stop pagination to prevent
        // an infinite fetch loop burning through the entire posts table.
        const nextCursor: string | undefined =
          rows.length > 0 && interleaved.length > 0
            ? lastRow.post_created_at
            : undefined;

        return { posts: interleaved, nextCursor };
      } catch (err) {
        console.error('[SuggestedFeed] Unexpected error:', err);
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });

  const allPosts = useMemo(
    () => deduplicatePosts(query.data?.pages.flatMap((page) => page.posts) ?? []),
    [query.data]
  );

  const resetSeen = useCallback(() => {
    seenPostIds.current = new Set();
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
