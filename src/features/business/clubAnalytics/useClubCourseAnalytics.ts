/**
 * BRIEF_CLUB_ANALYTICS_MULTI_COURSE §1 — THE EMPTY STATE MUST STOP ASSERTING
 * WHAT IT CANNOT KNOW.
 *
 * The old hook collapsed three different outcomes into `null` — function
 * missing, caller not entitled, and genuinely no rounds — and the page then
 * stated the third as fact. It told every club nothing had been scored on their
 * course while 817 rounds of hole-by-hole data sat in whs_score_holes.
 *
 * So this resolves a DISCRIMINATED RESULT. The RPC returns NO ROWS when the
 * caller is not entitled — that is deliberate, so the function cannot leak
 * whether a club exists — which means 'empty' is "not available", never "no
 * rounds here".
 *
 * BEN OWNS ALL SQL. Nothing here creates or patches the function.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClubCourseAnalytics } from './types';

export const CLUB_ANALYTICS_RPC = 'get_club_course_analytics';

export type ClubAnalyticsResult =
  | { state: 'ok'; data: ClubCourseAnalytics }
  /** Any error from the RPC. The reason is logged, never put on screen. */
  | { state: 'unavailable'; reason: string }
  /** Zero rows: no entitlement OR no data. We cannot tell, so we do not claim. */
  | { state: 'empty' };

/** Defensive coercion — jsonb columns arrive as unknown until we look. */
function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function useClubCourseAnalytics(courseId: string | undefined, enabled = true) {
  return useQuery<ClubAnalyticsResult>({
    queryKey: ['club-course-analytics', courseId],
    enabled: !!courseId && enabled,
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      // NOTE: .rpc must be called on the client object — do not destructure.
      const { data, error } = await supabase.rpc(
        CLUB_ANALYTICS_RPC as never,
        { p_golf_course_id: courseId } as never,
      );

      if (error) {
        console.error('[clubAnalytics] rpc failed', { courseId, reason: error.message });
        return { state: 'unavailable', reason: error.message };
      }

      const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null | undefined;
      if (!row) return { state: 'empty' };

      const shaped: ClubCourseAnalytics = {
        ...(row as unknown as ClubCourseAnalytics),
        club_courses: arr(row.club_courses),
        holes: arr(row.holes),
        months: arr(row.months),
        weekdays: arr(row.weekdays),
        years: arr(row.years),
        tees: arr(row.tees),
        handicap_bands: arr(row.handicap_bands),
        si_advice: Array.isArray(row.si_advice) ? (row.si_advice as ClubCourseAnalytics['si_advice']) : null,
      };
      return { state: 'ok', data: shaped };
    },
  });
}
