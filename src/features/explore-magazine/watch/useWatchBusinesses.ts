/** Brief 46 — Clubs and brands read: get_watch_businesses, then each business's
 * get_creator_videos('business', id, 24). A failed list read fails the section (absent);
 * a failed per-business read counts as no videos. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toHubRow, type WatchVideoRow } from './watchMiddle';
import { BUSINESS_LIMIT, COACH_VIDEO_LIMIT, newestFirst, orderBusinesses, type BusinessWithVideos, type WatchBusinessRow } from './forYouRules';

export function useWatchBusinesses(enabled: boolean) {
  return useQuery({
    queryKey: ['watch', 'businesses'],
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_businesses', { p_limit: BUSINESS_LIMIT });
      if (error) throw error;
      const list = ((data ?? []) as WatchBusinessRow[]).slice(0, BUSINESS_LIMIT);
      const withVideos: BusinessWithVideos[] = await Promise.all(list.map(async business => {
        const res = await supabase.rpc('get_creator_videos', { p_actor_type: 'business', p_actor_id: business.business_id, p_limit: COACH_VIDEO_LIMIT });
        return { business, videos: res.error ? [] : ((res.data ?? []) as WatchVideoRow[]).map(toHubRow) };
      }));
      const ordered = orderBusinesses(withVideos);
      const seen = new Set<string>();
      const videos = ordered.flatMap(b => b.videos).sort(newestFirst).filter(r => !seen.has(r.post_id) && !!seen.add(r.post_id));
      return { businesses: ordered, videos };
    },
  });
}
