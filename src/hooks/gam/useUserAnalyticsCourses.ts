import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserAnalyticsCourse {
  course_id: string;
  course_name: string;
  rounds_count: number;
  last_played: string | null;
  /**
   * User's average shots over par for a full round at this course. NULL when
   * the course has rounds but no hole-level data yet (holes not enriched).
   * Derived from the same whs_score_holes aggregation as the Analytics tab's
   * get_my_hole_performance, so the two surfaces never disagree.
   */
  avg_to_par: number | null;
  /** Hole number the user loses most shots on. NULL when hole data is absent. */
  hardest_hole_no: number | null;
  /** That hole's average to par (matches per-hole avg_to_par on Analytics tab). */
  hardest_hole_avg: number | null;
  /**
   * Personal scoring distribution: the user's own hole outcomes at this course,
   * as whole-number percentages that sum to exactly 100. NULL together when the
   * course has rounds but no hole data.
   */
  eagles_plus_pct: number | null;
  birdies_pct: number | null;
  pars_pct: number | null;
  bogeys_plus_pct: number | null;
}

/**
 * Courses the signed-in user has imported rounds at, sourced from the same
 * WHS tables the Analytics tab reads. Ordered by rounds desc.
 *
 * The RPC uses auth.uid() server-side — no user id needed on the client.
 * Shared with the Phase C rail and Phase E chip provider — additive fields
 * only; do not rename or remove existing keys.
 */
export function useUserAnalyticsCourses(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['gam', 'user-analytics-courses'],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<UserAnalyticsCourse[]> => {
      const { data, error } = await supabase.rpc('gam_user_courses' as never);
      if (error) throw error;
      return (data ?? []) as UserAnalyticsCourse[];
    },
  });
}
