/**
 * Friends feed for the card-style Friends tab UI.
 * NOTE: A separate useFriendsFeed exists at src/components/media-system/hooks/useFriendsFeed.ts
 * for the Clubhouse fullscreen vertical feed.
 * Keep both in sync if the RPC interface changes.
 */
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import { deduplicatePosts } from '@/components/media-system/utils/feedAlgorithm';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

export type FriendsMode = 'latest' | 'popular';

const PAGE_SIZE = 15;

interface UseFriendsFeedParams {
  userId: string | undefined;
  mode: FriendsMode;
  searchQuery?: string;
  enabled?: boolean;
}

export function useFriendsFeed({ userId, mode, searchQuery, enabled: externalEnabled = true }: UseFriendsFeedParams) {
  const seenPostIds = useRef<string[]>([]);

  const query = useInfiniteQuery({
    queryKey: ['friends-feed', mode, searchQuery, userId],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };

      const cursor = typeof pageParam === 'string' ? pageParam : undefined;

      if (searchQuery) seenPostIds.current = [];

      const params: Record<string, unknown> = {
        p_user_id: userId,
        p_mode: mode,
        p_page_size: PAGE_SIZE,
      };

      if (!searchQuery) params.p_seen_post_ids = seenPostIds.current;

      if (cursor) params.p_cursor = cursor;
      if (searchQuery) params.p_search_query = searchQuery;

      const { data, error } = await supabase.rpc('get_friends_feed', params as any);

      if (error) {
        if (import.meta.env.DEV) console.error('[FriendsFeed] RPC error:', error);
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      if (!data || data.length === 0) {
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      const rows = (data as unknown as FeedRpcRow[]);
      const posts = groupMultiMedia(rows.map(mapRowToFeedPost));

      for (const post of posts) {
        if (!seenPostIds.current.includes(post.id)) {
          seenPostIds.current.push(post.id);
        }
      }
      // Prevent unbounded growth — cap at last 200
      if (seenPostIds.current.length > 200) {
        seenPostIds.current = seenPostIds.current.slice(-200);
      }

      const lastRow = rows[rows.length - 1];
      const nextCursor = rows.length >= PAGE_SIZE ? lastRow.post_created_at : undefined;

      return { posts, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId && externalEnabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
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
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    resetSeen,
  };
}
