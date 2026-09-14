/**
 * THE CLIPS READ for the Watch feed (BRIEF_WATCH_MIXED_FEED §2, §4).
 *
 * get_watch_shorts_v2, seen-ids pagination — the same contract as
 * useClipsWallFeed and useHubMixedGrid, so the three cannot drift.
 *
 * THE RAILS ARE WINDOWS INTO THIS FEED. Every rail takes the NEXT window of
 * rows, never the first window again, which is what makes a repeat rail fresh
 * content rather than the same tiles.
 */
import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';

const PAGE_SIZE = 18;

export function useWatchClips(params: {
  userId: string | undefined;
  mode: string | null;
  filter?: string;
  search: string | null;
}) {
  const { userId, mode, filter, search } = params;
  return useInfiniteQuery({
    queryKey: ['explore-watch-clips', userId, mode, filter ?? null, search],
    enabled: !!userId && !!mode,
    staleTime: 2 * 60 * 1000,
    initialPageParam: [] as string[],
    queryFn: async ({ pageParam }) => {
      const seen = (pageParam as string[]) ?? [];
      const { data, error } = await supabase.rpc('get_watch_shorts_v2' as never, {
        p_user_id: userId,
        p_mode: mode,
        p_page_size: PAGE_SIZE,
        p_seen_ids: seen,
        p_search_query: search,
        ...(filter ? { p_filter: filter } : {}),
      } as never);
      if (error) throw error;
      return ((data ?? []) as unknown) as HubRpcRow[];
    },
    getNextPageParam: (lastPage, allPages) => {
      const rows = (lastPage ?? []) as HubRpcRow[];
      if (!Array.isArray(rows) || rows.length < PAGE_SIZE) return undefined;
      const seen: string[] = [];
      for (const page of (allPages ?? []) as HubRpcRow[][]) {
        if (!Array.isArray(page)) continue;
        for (const row of page) if (row?.post_id) seen.push(row.post_id);
      }
      return seen;
    },
  });
}
