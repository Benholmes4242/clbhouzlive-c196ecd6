/**
 * THE LONG-FORM READ for the Watch feed (BRIEF_WATCH_MIXED_FEED §2).
 *
 * get_long_form_videos_v2, paginated on SEEN IDS rather than a timestamp
 * cursor, because 'popular' does not order by date and a date cursor would
 * silently truncate it.
 *
 * ERRORED IS NOT EMPTY. The query throws so the feed can show its retry state;
 * a swallowed error and a genuinely empty read must never render the same.
 */
import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';

const PAGE_SIZE = 8;

export function useWatchVideos(params: {
  userId: string | undefined;
  mode: string | null;
  search: string | null;
}) {
  const { userId, mode, search } = params;
  return useInfiniteQuery({
    queryKey: ['explore-watch-videos', userId, mode, search],
    enabled: !!userId && !!mode,
    staleTime: 2 * 60 * 1000,
    initialPageParam: [] as string[],
    queryFn: async ({ pageParam }) => {
      const seen = (pageParam as string[]) ?? [];
      const { data, error } = await supabase.rpc('get_long_form_videos_v2' as never, {
        p_user_id: userId,
        p_mode: mode,
        p_page_size: PAGE_SIZE,
        p_seen_post_ids: seen,
        p_search_query: search,
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
