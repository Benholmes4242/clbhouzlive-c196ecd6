/**
 * Canonical Friends feed hook.
 *
 * Phase 3: consolidated from the former `media-system/hooks/useFriendsFeed`.
 * Supports both card-style surfaces (friends-tab) and the Clubhouse snap-feed
 * (via the optional `interleave` flag, which runs `buildFriendsFeed`).
 */
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveActor } from '@/context/ActiveActorContext';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import { buildFriendsFeed, deduplicatePosts } from '@/components/media-system/utils/feedAlgorithm';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

export type FriendsMode = 'latest' | 'popular';

const PAGE_SIZE_DEFAULT = 15;

interface UseFriendsFeedParams {
  userId: string | undefined;
  mode: FriendsMode;
  searchQuery?: string;
  enabled?: boolean;
  /** When true, run `buildFriendsFeed` interleave on the returned posts (Clubhouse snap-feed). */
  interleave?: boolean;
  /** Override page size (Clubhouse historically used 10; default 15). */
  pageSize?: number;
}

export function useFriendsFeed({
  userId,
  mode,
  searchQuery,
  enabled: externalEnabled = true,
  interleave = false,
  pageSize = PAGE_SIZE_DEFAULT,
}: UseFriendsFeedParams) {
  const { activeActor } = useActiveActor();
  const seenPostIds = useRef<string[]>([]);

  const query = useInfiniteQuery({
    queryKey: ['friends-feed', mode, searchQuery, userId, interleave, pageSize, activeActor?.type, activeActor?.id],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };

      const cursor = typeof pageParam === 'string' ? pageParam : undefined;

      if (searchQuery) seenPostIds.current = [];

      const params: Record<string, unknown> = {
        p_user_id: userId,
        p_viewer_actor_type: activeActor?.type ?? 'personal',
        p_viewer_actor_id: activeActor?.id ?? userId,
        p_mode: mode,
        p_page_size: pageSize,
      };

      if (!searchQuery) params.p_seen_post_ids = seenPostIds.current;

      if (cursor) params.p_cursor = cursor;
      if (searchQuery) params.p_search_query = searchQuery;

      const { data, error } = await supabase.rpc('get_friends_feed', params as any);

      if (error) {
        if (import.meta.env.DEV) console.error('[FriendsFeed] RPC error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      const rows = (data as unknown as FeedRpcRow[]);
      const mapped = groupMultiMedia(rows.map(mapRowToFeedPost));
      const posts = interleave ? buildFriendsFeed(mapped) : mapped;

      for (const post of posts) {
        if (!seenPostIds.current.includes(post.id)) {
          seenPostIds.current.push(post.id);
        }
      }
      // Cap to last 200 to prevent unbounded growth
      if (seenPostIds.current.length > 200) {
        seenPostIds.current = seenPostIds.current.slice(-200);
      }

      const lastRow = rows[rows.length - 1];
      const nextCursor = rows.length >= pageSize ? lastRow.post_created_at : undefined;

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
    isRefetching: query.isRefetching,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    resetSeen,
  };
}
