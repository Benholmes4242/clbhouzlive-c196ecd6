import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MixedGridRow {
  post_id: string;
  post_content: string | null;
  derived_format: 'clip' | 'video';
  poster_url: string | null;
  duration_seconds: number | null;
  creator_username: string | null;
  like_count: number;
  course_name: string | null;
  width?: number | null;
  height?: number | null;
}

const PAGE_SIZE = 20;

export function useHubMixedGrid(userId: string | undefined, filter: string = 'all') {
  return useInfiniteQuery({
    queryKey: ['hub-mixed-grid', userId, filter],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    initialPageParam: [] as string[],
    queryFn: async ({ pageParam }) => {
      const seenIds = (pageParam as string[]) ?? [];
      const { data, error } = await (supabase.rpc as any)('get_watch_mixed_grid', {
        p_user_id: userId,
        p_filter: filter,
        p_page_size: PAGE_SIZE,
        p_cursor: null,
        p_seen_ids: seenIds,
      });
      if (error) {
        if (import.meta.env.DEV) console.error(error);
        return [] as MixedGridRow[];
      }
      return (data ?? []) as MixedGridRow[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if ((lastPage as MixedGridRow[]).length < PAGE_SIZE) return undefined;
      const seen: string[] = [];
      for (const page of allPages as MixedGridRow[][]) {
        for (const row of page) seen.push(row.post_id);
      }
      return seen;
    },
  });
}
