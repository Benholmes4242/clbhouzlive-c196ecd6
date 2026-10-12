/**
 * THE TWO READS THE WATCH CARDS NEED (BRIEF_WATCH_PAGE K.1, K.4).
 *
 * - The member's saved positions: ONE read of their own video_progress rows.
 * - View counts: ONE batched read of post_views for the loaded post ids,
 *   counted client-side. post_views is written by usePostViewTracker/FeedSlide.
 *   If the read fails (e.g. row-level security), the figure is OMITTED from
 *   the card - never invented from likes.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SavedProgress } from './watchRules';

export const VIDEO_PROGRESS_KEY = (userId: string | undefined) => ['video-progress', userId] as const;

export function useWatchProgress(userId: string | undefined) {
  return useQuery({
    queryKey: VIDEO_PROGRESS_KEY(userId),
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_progress')
        .select('post_id, last_position_seconds, duration_seconds')
        .eq('user_id', userId as string);
      if (error) throw error;
      const map = new Map<string, SavedProgress>();
      for (const row of data ?? []) {
        map.set(row.post_id, {
          position: Number(row.last_position_seconds ?? 0),
          duration: row.duration_seconds == null ? null : Number(row.duration_seconds),
        });
      }
      return map;
    },
  });
}

export function useWatchViews(postIds: string[]) {
  const ids = Array.from(new Set(postIds)).sort();
  return useQuery({
    queryKey: ['watch-view-counts', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 0,
    queryFn: async () => {
      const counts = new Map<string, number>();
      const { data, error } = await supabase
        .from('post_views')
        .select('post_id')
        .in('post_id', ids)
        .limit(20000);
      if (error) throw error;
      for (const id of ids) counts.set(id, 0);
      for (const row of data ?? []) counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
      return counts;
    },
  });
}
