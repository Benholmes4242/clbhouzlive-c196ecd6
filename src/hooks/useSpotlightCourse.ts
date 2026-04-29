import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpotlightCourse {
  course_id: string;
  course_name: string;
  club_name: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  image_url: string | null;
  avg_rating: number;
  rating_count: number;
  total_rounds: number;
}

/**
 * useSpotlightCourse
 *
 * Powers the "This Season's Hottest" card on the Courses tab.
 *
 * Uses get_course_leaderboard with:
 *   - p_sort_by: 'most_played'  — ranks by total rounds logged
 *   - p_time_period: 'season'   — scoped to the active season's start_date
 *   - p_limit: 1                — top result only
 *
 * The 'season' time period is handled in the RPC: it looks up
 * championship_seasons WHERE status = 'active' and uses that start_date
 * as the period start. When the season flips automatically, this card
 * resets and re-ranks from the new season start date.
 */
export function useSpotlightCourse() {
  return useQuery<SpotlightCourse | null>({
    queryKey: ['spotlight-course', 'season'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc('get_course_leaderboard', {
        p_sort_by: 'most_played',
        p_sort_order: 'desc',
        p_time_period: 'season',
        p_limit: 1,
        p_offset: 0,
        p_current_user_id: user?.id ?? null,
        p_country: null,
        p_sub_country: null,
        p_exclude_countries: null,
      } as any);

      if (error) {
        console.error('[useSpotlightCourse] RPC error:', error);
        throw error;
      }

      if (!data || data.length === 0) return null;

      const row = data[0];
      return {
        course_id: row.course_id,
        course_name: row.course_name,
        club_name: row.club_name ?? null,
        country: row.country ?? null,
        city: row.city ?? null,
        region: row.region ?? null,
        image_url: row.image_url ?? null,
        avg_rating: Number(row.avg_rating ?? 0),
        rating_count: Number(row.rating_count ?? 0),
        total_rounds: Number(row.total_rounds ?? 0),
      } as SpotlightCourse;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
