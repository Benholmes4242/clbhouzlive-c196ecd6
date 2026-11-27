/** Brief 42 B — Coaching read: get_watch_pros, then each coach's get_creator_videos('personal', id, 24).
 * A failed pros read fails the section (absent); a failed per-coach read counts as no videos. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toHubRow, type WatchVideoRow } from './watchMiddle';
import { COACH_LIMIT, COACH_VIDEO_LIMIT, coachingVideos, orderCoaches, type CoachRow, type CoachWithVideos } from './forYouRules';

export function useWatchCoaching(enabled: boolean) {
  return useQuery({
    queryKey: ['watch', 'coaching'],
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_pros', { p_limit: COACH_LIMIT });
      if (error) throw error;
      const coaches = ((data ?? []) as CoachRow[]).slice(0, COACH_LIMIT);
      const withVideos: CoachWithVideos[] = await Promise.all(coaches.map(async coach => {
        const res = await supabase.rpc('get_creator_videos', { p_actor_type: 'personal', p_actor_id: coach.user_id, p_limit: COACH_VIDEO_LIMIT });
        return { coach, videos: res.error ? [] : ((res.data ?? []) as WatchVideoRow[]).map(toHubRow) };
      }));
      const ordered = orderCoaches(withVideos);
      return { coaches: ordered, videos: coachingVideos(ordered) };
    },
  });
}
