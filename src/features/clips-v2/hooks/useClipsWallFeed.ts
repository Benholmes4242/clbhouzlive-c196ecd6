/**
 * useClipsWallFeed — infinite Wall v3 feed for /watch/clips.
 *
 * RPC: get_watch_shorts. Seen-ids-only pagination, matching the
 * useHubMixedGrid contract exactly. Server-side mood mapping — see
 * MOOD_PARAMS below.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RpcClient } from '@/features/watch-v2/hooks/useHubMixedGrid';

// 'trending' removed for launch: it duplicated for_you (same RPC
// params). Reinstate when get_watch_shorts gains a distinct
// personalised for_you mode.
export const CLIPS_V2_MOODS = [
  'for_you',
  'lightning',
  'friends',
  'your_courses',
] as const;
export type ClipsV2Mood = (typeof CLIPS_V2_MOODS)[number];

export interface ClipsWallRow {
  post_id: string;
  post_content: string | null;
  post_created_at: string | null;
  poster_url: string | null;
  duration_seconds: number | null;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
  course_name: string | null;
  width: number | null;
  height: number | null;
  [key: string]: unknown;
}

const PAGE_SIZE = 18;

function moodParams(mood: ClipsV2Mood): Record<string, unknown> {
  switch (mood) {
    case 'lightning':
      return { p_mode: 'trending', p_max_duration: 30 };
    case 'friends':
      return { p_mode: 'latest', p_filter: 'following' };
    case 'your_courses':
      return { p_mode: 'latest', p_filter: 'played_courses' };
    case 'for_you':
    default:
      return { p_mode: 'trending' };
  }
}

export function useClipsWallFeed(params: {
  userId: string | undefined;
  mood: ClipsV2Mood;
}) {
  const { userId, mood } = params;
  return useInfiniteQuery({
    queryKey: ['clips-v2-wall', userId, mood],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    initialPageParam: [] as string[],
    queryFn: async ({ pageParam }) => {
      const seenIds = (pageParam as string[]) ?? [];
      const { data, error } = await (supabase as unknown as RpcClient).rpc('get_watch_shorts', {
        p_user_id: userId,
        p_page_size: PAGE_SIZE,
        p_cursor: null,
        p_seen_ids: seenIds,
        ...moodParams(mood),
      });
      if (error) throw error;
      return (data ?? []) as ClipsWallRow[];
    },
    getNextPageParam: (lastPage, allPages) => {
      const rows = lastPage as ClipsWallRow[];
      if (rows.length < PAGE_SIZE) return undefined;
      const seen: string[] = [];
      for (const page of allPages as ClipsWallRow[][]) {
        for (const row of page) seen.push(row.post_id);
      }
      return seen;
    },
  });
}
