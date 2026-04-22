import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

export type VideosFilter = 'latest' | 'popular' | 'following';

const PAGE_SIZE = 10;

interface UseVideosFeedParams {
  userId: string | undefined;
  filter: VideosFilter;
  searchQuery?: string;
  enabled?: boolean;
}

export function useVideosFeed({ userId, filter, searchQuery, enabled: externalEnabled = true }: UseVideosFeedParams) {
  const seenPostIds = useRef<string[]>([]);

  const query = useInfiniteQuery({
    queryKey: ['videos-feed', filter, searchQuery, userId],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };

      const cursor = typeof pageParam === 'string' ? pageParam : undefined;

      if (searchQuery) seenPostIds.current = [];

      const params: Record<string, unknown> = {
        p_user_id: userId,
        p_mode: filter,
        p_page_size: PAGE_SIZE,
      };

      if (!searchQuery) params.p_seen_post_ids = seenPostIds.current;

      if (cursor) params.p_cursor = cursor;
      if (searchQuery) params.p_search_query = searchQuery;

      const { data, error } = await supabase.rpc('get_long_form_videos', params as any);

      if (error) {
        console.error('[VideosFeed] RPC error:', error);
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      if (!data || data.length === 0) {
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      // Cast via `unknown`: the generated Supabase types lag behind the migrated
      // RPC return shape (post_-prefixed columns). Runtime payload matches
      // FeedRpcRow — same pattern as useFeedPostsByIds.ts.
      const rows = data as unknown as FeedRpcRow[];
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

  const allPosts = useMemo(() => {
    const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];
    const seen = new Set<string>();
    return posts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [query.data]);

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
