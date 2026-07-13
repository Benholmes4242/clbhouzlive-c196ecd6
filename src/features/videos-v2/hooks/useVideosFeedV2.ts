/**
 * useVideosFeedV2 — infinite feed for the /videos-v2-test surface.
 *
 * RPC: get_long_form_videos. Pagination is SEEN-IDS ONLY, matching
 * useHubMixedGrid's contract exactly. This keeps ordering correct for
 * `popular` mode where a created_at cursor would misorder results.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VideosSortId } from '../types';
import type { VideosV2CategoryId } from '../categories';

const PAGE_SIZE = 12;

export interface VideosFeedV2Row {
  post_id: string;
  post_content: string | null;
  post_created_at: string | null;
  poster_url: string | null;
  duration_seconds: number | null;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
  like_count: number | null;
  course_name: string | null;
  [key: string]: unknown;
}

export function useVideosFeedV2(params: {
  userId: string | undefined;
  sort: VideosSortId;
  category: VideosV2CategoryId | null;
}) {
  const { userId, sort, category } = params;
  return useInfiniteQuery({
    queryKey: ['videos-v2-feed', userId, sort, category],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    initialPageParam: [] as string[],
    queryFn: async ({ pageParam }) => {
      const seenIds = (pageParam as string[]) ?? [];
      const { data, error } = await (supabase.rpc as any)('get_long_form_videos', {
        p_user_id: userId,
        p_mode: sort,
        p_category: category,
        p_page_size: PAGE_SIZE,
        p_cursor: null,
        p_seen_post_ids: seenIds,
      });
      if (error) {
        if (import.meta.env.DEV) console.error('[useVideosFeedV2]', error);
        return [] as VideosFeedV2Row[];
      }
      return (data ?? []) as VideosFeedV2Row[];
    },
    getNextPageParam: (lastPage, allPages) => {
      const rows = lastPage as VideosFeedV2Row[];
      if (rows.length < PAGE_SIZE) return undefined;
      const seen: string[] = [];
      for (const page of allPages as VideosFeedV2Row[][]) {
        for (const row of page) seen.push(row.post_id);
      }
      return seen;
    },
  });
}
