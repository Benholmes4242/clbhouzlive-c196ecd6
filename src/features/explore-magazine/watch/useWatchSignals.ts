/**
 * THE READ THE WATCH CARDS NEED (BRIEF_WATCH_PAGE K.1).
 *
 * - The member's saved positions: ONE read of their own video_progress rows.
 *
 * View counts are not shown on Watch (BRIEF_WATCH_NO_VIEWS), so this file no
 * longer reads post_views. Views are still RECORDED by
 * usePostViewTracker/FeedSlide; they are just not shown here.
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
