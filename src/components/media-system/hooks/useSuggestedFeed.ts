import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveActor } from '@/context/ActiveActorContext';

import type { FeedPost, FeedRpcRow } from '../types/media';
import { deduplicatePosts } from '../utils/feedAlgorithm';
import { mapRowToFeedPost, groupMultiMedia } from '../utils/feedMapper';

const PAGE_SIZE = 60;

type SuggestedPage = { posts: FeedPost[]; rawRowCount: number };

// Paging excludes only earlier cached pages for this exact viewer/actor identity,
// including hydrated pages; refetch must not exclude its own or later pages.
// Dates cannot cursor a feed ordered by ranked slot position.
export function useSuggestedFeed(userId: string | undefined) {
  const { activeActor } = useActiveActor();
  const queryClient = useQueryClient();
  const queryKey = ['media-feed', 'suggested', userId, activeActor?.type, activeActor?.id];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      if (!userId) return { posts: [] as FeedPost[], rawRowCount: 0 };
      const cachedPages = queryClient.getQueryData<InfiniteData<SuggestedPage>>(queryKey)?.pages ?? [];
      const seenIds = Array.from(new Set(cachedPages.slice(0, pageParam).flatMap(page => page.posts.map(post => post.id)))).slice(-500);

      const { data, error } = await supabase.rpc('get_suggested_feed_v3', {
        p_user_id: userId,
        p_page_size: PAGE_SIZE,
        p_viewer_actor_type: activeActor?.type ?? 'personal',
        p_viewer_actor_id: activeActor?.id ?? userId,
        ...(pageParam > 0 ? { p_seen_post_ids: seenIds } : {}),
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
          rawRowCount: 0,
        };
      }

      const posts = groupMultiMedia(rows.map(mapRowToFeedPost), { portraitOnly: false });


      return { posts, rawRowCount };
    },
    getNextPageParam: (lastPage, allPages) => {
      // Never trust the restored/seeded shape: a page written by another build
      // (or by a prefetcher using a different page shape) may not carry
      // rawRowCount at all. Stop rather than assume.
      if (!lastPage || typeof lastPage !== 'object') return undefined;
      if (typeof lastPage.rawRowCount !== 'number') return undefined;
      // Terminate ONLY when the RPC itself returned zero candidates,
      // not when client-side filtering removed them all.
      if (lastPage.rawRowCount <= 0) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 0,
    /* THE FEED REFRESHES WHEN THE APP COMES BACK. The app-wide default is
       refetchOnWindowFocus: false (App.tsx), and refetchOnMount only fires on a
       MOUNT — so with the Clubhouse feed mounted and the app merely backgrounded,
       `staleTime: 0` marked this query permanently stale and NOTHING ever acted
       on it. Combined with gcTime 24h and 'media-feed' being on the persister
       allowlist, a page fetched before a video's media row landed stayed on
       screen, and survived restarts, as a permanently text-only card. staleTime 0
       is only meaningful if something is allowed to refetch. */
    refetchOnWindowFocus: true,
    // Persisted (see queryPersister.ts): hold 24h so restored entries survive
    // hydrate. Revalidation on mount comes from the global default.
    gcTime: 24 * 60 * 60 * 1000,
  });

  const allPosts = useMemo(
    () => deduplicatePosts(query.data?.pages?.flatMap((page) => page.posts) ?? []),
    [query.data]
  );

  return {
    posts: allPosts,
    isLoading: query.isLoading,
    // Settled flag — the query is gated on userId, so isLoading is false before
    // it has ever run. Callers deciding "feed is empty" must read this.
    isFetched: query.isFetched,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    // True once this feed has fetched at least once (cached). 0 until first success.
    hasEverLoaded: query.dataUpdatedAt > 0,
  };
}
