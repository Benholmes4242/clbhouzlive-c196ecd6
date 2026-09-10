import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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
  /**
   * Raw hole counts backing the distribution percentages. Needed so rare
   * outcomes (e.g. one eagle in 1,800 holes) can render "<1%" instead of
   * being rounded away to 0%. NULL together when hole data is absent.
   */
  eagles_plus_count: number | null;
  birdies_count: number | null;
  pars_count: number | null;
  bogeys_plus_count: number | null;
  /**
   * Unrounded bucket percentages (0..100, full numeric precision). Used to
   * render one-decimal values like "0.1%" when the rounded whole-number
   * percentage would misleadingly read 0 for a bucket that actually has
   * hits. NULL together with the counts when hole data is absent.
   */
  eagles_plus_pct_exact: number | null;
  birdies_pct_exact: number | null;
  pars_pct_exact: number | null;
  bogeys_plus_pct_exact: number | null;
}

/**
 * THE 35 (BRIEF_PROFILE_PASS_ONE §D — the basis line).
 * Courses the signed-in user has IMPORTED ROUNDS AT, sourced from the same WHS
 * tables the Analytics tab reads. Ordered by rounds desc. One row per course
 * that carries at least one MAPPED, NON-PENALTY round; the 239 round basis for
 * the per-course analytics rows is the sum of `rounds_count` across these rows.
 * Measured 10 Sep 2026: 35 courses, 239 rounds.
 *
 * IT IS NOT THE 49 the profile's PLAYED figure states. That counts
 * `user_course_activity` rows — anything the member did at a course, imported
 * round or not (see useUserCourseSummary). Two questions, two answers; a surface
 * must say which one it is asking. Do not present one as a shortfall of the other.
 *
 * The RPC uses auth.uid() server-side, but the signed-in user id IS carried in
 * the query key so a cached result can never be read by a page about somebody
 * else, and so account switching cannot surface the previous member's rows.
 * Shared with the Phase C rail and Phase E chip provider — additive fields
 * only; do not rename or remove existing keys.
 */
export function useUserAnalyticsCourses(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { user } = useSupabaseSession();
  return useQuery({
    queryKey: ['gam', 'user-analytics-courses', user?.id ?? null],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<UserAnalyticsCourse[]> => {
      const { data, error } = await supabase.rpc('gam_user_courses' as never);
      if (error) throw error;
      return (data ?? []) as UserAnalyticsCourse[];
    },
  });
}
