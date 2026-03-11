/**
 * Friends feed for the Clubhouse fullscreen vertical feed.
 * NOTE: A separate useFriendsFeed exists at src/components/friends-tab/hooks/useFriendsFeed.ts
 * for the card-style Friends tab — it supports mode/search params and keepPreviousData.
 * Keep both in sync if the RPC interface changes.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FeedPost, FeedRpcRow } from '../types/media';
import { interleaveReviews, deduplicatePosts } from '../utils/feedAlgorithm';
import { mapRowToFeedPost, groupMultiMedia } from '../utils/feedMapper';

const PAGE_SIZE = 10;

export function useFriendsFeed(userId: string | undefined) {
  const seenPostIds = useRef<string[]>([]);

  const query = useInfiniteQuery({
    queryKey: ['media-feed', 'friends', userId],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };

      try {
        const cursor = typeof pageParam === 'string' ? pageParam : undefined;

        const { data, error } = await supabase.rpc('get_friends_feed' as any, {
          p_user_id: userId,
          p_page_size: PAGE_SIZE,
          ...(cursor ? { p_cursor: cursor } : {}),
          p_seen_post_ids: seenPostIds.current,
        } as any);

        if (error) {
          console.error('[FriendsFeed] RPC error:', error);
          return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
        }

        if (!data || data.length === 0) {
          return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
        }

        const rows = ((data ?? []) as unknown as FeedRpcRow[]);
        const posts = groupMultiMedia(rows.map(mapRowToFeedPost));
        const interleaved = interleaveReviews(posts, 'friends');

        for (const post of interleaved) {
          if (!seenPostIds.current.includes(post.id)) {
            seenPostIds.current.push(post.id);
          }
        }
        // Keep only the last 200 to prevent unbounded growth
        if (seenPostIds.current.length > 200) {
          seenPostIds.current = seenPostIds.current.slice(-200);
        }

        const lastRow = rows[rows.length - 1];
        const nextCursor: string | undefined =
          rows.length >= PAGE_SIZE ? lastRow.post_created_at : undefined;

        return { posts: interleaved, nextCursor };
      } catch (err) {
        console.error('[FriendsFeed] Unexpected error:', err);
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const allPosts = useMemo(
    () => deduplicatePosts(query.data?.pages.flatMap((page) => page.posts) ?? []),
    [query.data]
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
