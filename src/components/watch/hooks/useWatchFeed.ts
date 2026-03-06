import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';
import type { WatchFilter } from '../types';

const dbg = (tag: string, ...args: any[]) => {
  console.log(`[${tag}] ${Date.now() % 100000}`, ...args);
};

const PAGE_SIZE = 30;

interface UseWatchFeedParams {
  userId: string | undefined;
  filter: WatchFilter;
  searchQuery?: string;
  userLat?: number | null;
  userLng?: number | null;
}

export function useWatchFeed({ userId, filter, searchQuery, userLat, userLng }: UseWatchFeedParams) {
  const seenPostIds = useRef<string[]>([]);

  const query = useInfiniteQuery({
    queryKey: ['watch-feed', filter, searchQuery, userId],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };

      const cursor = typeof pageParam === 'string' ? pageParam : undefined;
      dbg('W:FEED', 'Fetching, filter:', filter, 'searchQuery:', searchQuery, 'cursor:', cursor);

      const params: Record<string, any> = {
        p_user_id: userId,
        p_mode: filter,
        p_page_size: PAGE_SIZE,
        p_seen_ids: seenPostIds.current,
      };

      if (cursor) params.p_cursor = cursor;
      if (searchQuery) params.p_search_query = searchQuery;
      if (filter === 'near' && userLat != null && userLng != null) {
        params.p_user_lat = userLat;
        params.p_user_lng = userLng;
      }

      const { data, error } = await supabase.rpc('get_watch_shorts', params as any);

      if (error) {
        console.error('[WatchFeed] RPC error:', error);
        dbg('W:FEED', 'RPC ERROR:', error.message);
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      if (!data || data.length === 0) {
        dbg('W:FEED', 'RPC returned 0 rows');
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      const rows = data as FeedRpcRow[];
      const posts = groupMultiMedia(rows.map(mapRowToFeedPost));
      dbg('W:FEED', 'RPC returned', rows.length, 'rows, mapped to', posts.length, 'posts');

      for (const post of posts) {
        if (!seenPostIds.current.includes(post.id)) {
          seenPostIds.current.push(post.id);
        }
      }

      const lastRow = rows[rows.length - 1];
      const nextCursor = rows.length >= PAGE_SIZE ? lastRow.post_created_at : undefined;

      return { posts, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const allPosts = useMemo(() => {
    const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];
    const seen = new Set<string>();
    const result = posts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    dbg('W:FEED', 'allPosts computed:', result.length, 'total posts');
    return result;
  }, [query.data]);

  const resetSeen = useCallback(() => {
    dbg('W:FEED', 'resetSeen called');
    seenPostIds.current = [];
  }, []);

  return {
    posts: allPosts,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    resetSeen,
  };
}
