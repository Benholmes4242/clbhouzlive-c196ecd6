/**
 * usePlatformReach - the platform's own scale, for marketing surfaces.
 *
 * One RPC, get_platform_reach(), returns six figures in a single row:
 * courses / rounds / reviews totals plus each one's last-30-days delta.
 *
 * THIS IS A MARKETING SURFACE, NOT A LIVE BOARD. Three COUNT(*) on every mount
 * of an empty state is the wrong trade, so staleTime and gcTime are both one
 * hour. Never count these client-side: do not query golf_courses,
 * gam_round_stats or course_ratings from a component.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformReach {
  coursesTotal: number;
  coursesDelta: number;
  roundsTotal: number;
  roundsDelta: number;
  reviewsTotal: number;
  reviewsDelta: number;
}

const ONE_HOUR = 3_600_000;

export function usePlatformReach() {
  return useQuery<PlatformReach>({
    queryKey: ['platform-reach'],
    staleTime: ONE_HOUR,
    gcTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_platform_reach');
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as Record<string, number> | null;
      return {
        coursesTotal: Number(row?.courses_total ?? 0),
        coursesDelta: Number(row?.courses_delta ?? 0),
        roundsTotal: Number(row?.rounds_total ?? 0),
        roundsDelta: Number(row?.rounds_delta ?? 0),
        reviewsTotal: Number(row?.reviews_total ?? 0),
        reviewsDelta: Number(row?.reviews_delta ?? 0),
      };
    },
  });
}
