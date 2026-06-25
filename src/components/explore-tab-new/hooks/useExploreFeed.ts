import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveActor } from '@/context/ActiveActorContext';
import { mapRowToFeedPost, groupMultiMedia } from '@/components/media-system/utils/feedMapper';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

const PAGE_SIZE = 30;

interface UseExploreFeedParams {
  userId: string | undefined;
  region?: string | null;
  searchQuery?: string;
  enabled?: boolean;
}

export function useExploreFeed({ userId, region, searchQuery, enabled: externalEnabled = true }: UseExploreFeedParams) {
  const seenPostIds = useRef<string[]>([]);
  const { activeActor } = useActiveActor();

  const query = useInfiniteQuery({
    queryKey: ['explore-feed', region ?? null, searchQuery ?? null, userId, activeActor?.type, activeActor?.id],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };

      const cursor = typeof pageParam === 'string' ? pageParam : undefined;

      const params: Record<string, any> = {
        p_user_id: userId,
        p_viewer_actor_type: activeActor?.type ?? 'personal',
        p_viewer_actor_id: activeActor?.id ?? userId,
        p_page_size: PAGE_SIZE,
        p_seen_post_ids: seenPostIds.current,
      };

      if (region) params.p_region = region;
      if (cursor) params.p_cursor = cursor;
      if (searchQuery) params.p_search_query = searchQuery;

      const seenCountBefore = seenPostIds.current.length;
      const { data, error } = await supabase.rpc('get_explore_feed', params as any);

      const returned = Array.isArray(data) ? data.length : 0;
      console.log('[ActorDebug] useExploreFeed fetch', {
        actor: { type: activeActor?.type, id: activeActor?.id },
        cursor: cursor ?? null,
        region: region ?? null,
        seenCount: seenCountBefore,
        returned,
      });

      if (error) {
        console.error('[ExploreFeed] RPC error:', error);
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

      if (!data || data.length === 0) {
        return { posts: [] as FeedPost[], nextCursor: undefined as string | undefined };
      }

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
