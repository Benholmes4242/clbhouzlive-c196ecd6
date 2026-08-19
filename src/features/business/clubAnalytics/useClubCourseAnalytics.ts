/**
 * BRIEF_CLUB_ANALYTICS_TAB §7 — WIRING.
 *
 * ONE RPC, course-scoped, everything the tab needs in one round trip. The
 * function is SECURITY DEFINER and verifies the caller manages a verified Golf
 * Club whose claim resolves to that course; it returns AGGREGATES ONLY.
 *
 * BEN RUNS ALL SQL. The function is not created here and there is no migration.
 * Until it exists, an error resolves to `null` and the tab says the measurement
 * is not available yet — it does NOT render placeholder rows (§6.2).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClubCourseAnalytics } from './types';

export const CLUB_ANALYTICS_RPC = 'get_club_course_analytics';

export function useClubCourseAnalytics(courseId: string | undefined) {
  return useQuery<ClubCourseAnalytics | null>({
    queryKey: ['club-course-analytics', courseId],
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      // NOTE: .rpc must be called on the client object — do not destructure.
      const { data, error } = await supabase.rpc(
        CLUB_ANALYTICS_RPC as never,
        { p_golf_course_id: courseId } as never,
      );
      // Function missing / caller not permitted → the tab renders its
      // "not measured" state. Never a fabricated payload.
      if (error) return null;
      if (!data) return null;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as ClubCourseAnalytics | null) ?? null;
    },
  });
}
