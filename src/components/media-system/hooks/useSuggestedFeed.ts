import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveActor } from '@/context/ActiveActorContext';
import type { FeedPost, FeedRpcRow } from '../types/media';
import { deduplicatePosts } from '../utils/feedAlgorithm';
import { mapRowToFeedPost, groupMultiMedia } from '../utils/feedMapper';

const PAGE_SIZE = 60;

export function useSuggestedFeed(userId: string | undefined) {
  const { activeActor } = useActiveActor();
  const seenPostIds = useRef<Set<string>>(new Set());

  const query = useInfiniteQuery({
    queryKey: ['media-feed', 'suggested', userId, activeActor?.type, activeActor?.id],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined, rawRowCount: 0 };

      const cursor = typeof pageParam === 'string' ? pageParam : undefined;

      const { data, error } = await supabase.rpc('get_suggested_feed_v2' as any, {
        p_user_id: userId,
        p_page_size: PAGE_SIZE,
        p_viewer_actor_type: activeActor?.type ?? 'personal',
        p_viewer_actor_id: activeActor?.id ?? userId,
        ...(cursor ? { p_cursor: cursor } : {}),
        ...(cursor ? { p_seen_post_ids: Array.from(seenPostIds.current) } : {}),
      } as any);


      if (error) {
        console.error('[SuggestedFeed] RPC error:', error);
        // Surface the error to React Query so the UI can show a retry state
        throw error;
      }

      const rows = ((data ?? []) as unknown as FeedRpcRow[]);
      const rawRowCount = rows.length;

      if (rawRowCount === 0) {
        return {
          posts: [] as FeedPost[],
          nextCursor: undefined as string | undefined,
          rawRowCount: 0,
        };
      }

      const posts = groupMultiMedia(rows.map(mapRowToFeedPost), { portraitOnly: false });

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

      // Cursor advances based on raw rows (not filtered output) so we don't
      // stop prematurely when the client-side filter is aggressive. The RPC
      // returning zero rows is the only true end-of-feed signal.
      const lastRow = rows[rows.length - 1];
      const nextCursor: string | undefined = lastRow.post_created_at;

      return { posts, nextCursor, rawRowCount };
    },
    getNextPageParam: (lastPage) => {
      // Terminate ONLY when the RPC itself returned zero candidates,
      // not when client-side filtering removed them all.
      if (lastPage.rawRowCount === 0) return undefined;
      return lastPage.nextCursor;
    },
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
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    resetSeen,
  };
}
