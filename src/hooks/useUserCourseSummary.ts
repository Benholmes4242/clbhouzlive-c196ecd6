/**
 * COURSE-LEGACY SUMMARY — courses played and countries played.
 *
 * COUNTS: distinct rows in `user_course_activity` for the member. That includes
 * courses with no imported round, so it is NOT the mapped-round course count
 * (`gam_user_courses()`, 35 courses for the test member) and NOT the 49-row
 * activity total minus anything. Measured 10 Sep 2026: 49 courses.
 *
 * THREE STATES, NEVER A CONFIDENT ZERO. Both counts previously defaulted to 0,
 * so a failed read rendered "PLAYED 0" — a member with fifty courses told they
 * had none. Now a failed or unrun read returns null and the consumer renders the
 * label without a figure.
 *
 * THE GATE IS `isFetched`, NOT `isLoading`. A disabled React Query v5 query is
 * pending with `fetchStatus: 'idle'`, so `isLoading` is false before it has ever
 * run; gating on it renders a placeholder that never resolves.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTop100ProgressForUser } from './useTop100ProgressForUser';

export function useUserCourseSummary(userId: string | undefined) {
  const enabled = !!userId;

  const coursesQuery = useQuery({
    queryKey: ['user-courses-played-count', userId],
    enabled,
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('user_course_activity' as any)
        .select('course_id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const countriesQuery = useQuery({
    queryKey: ['user-countries-played-count', userId],
    enabled,
    queryFn: async () => {
      if (!userId) return 0;

      const { data: activities, error: actError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id')
        .eq('user_id', userId);

      if (actError) throw actError;

      const courseIds = (activities || []).map((a: any) => a.course_id);
      if (courseIds.length === 0) return 0;

      const { data: courses, error: courseError } = await supabase
        .from('golf_courses')
        .select('id, country')
        .in('id', courseIds);

      if (courseError) throw courseError;

      const uniqueCountries = new Set((courses || []).map(c => c.country));
      return uniqueCountries.size;
    },
    staleTime: 60_000,
  });

  // Reuse the optimized Top 100 progress hook
  const { data: progressData, isFetched: progressFetched } = useTop100ProgressForUser(userId);
  const top100Progress = progressData?.lists || [];

  const coursesKnown = coursesQuery.isFetched && !coursesQuery.isError;
  const countriesKnown = countriesQuery.isFetched && !countriesQuery.isError;

  return {
    /** Null means unknown (unrun or failed read), never "zero courses". */
    totalCoursesPlayed: coursesKnown ? coursesQuery.data ?? null : null,
    countriesPlayed: countriesKnown ? countriesQuery.data ?? null : null,
    top100Progress,
    /** True only while a read is genuinely in flight; an error ends loading. */
    isLoading:
      enabled &&
      (!coursesQuery.isFetched || !countriesQuery.isFetched || !progressFetched),
    isCoursesError: coursesQuery.isError,
    isCountriesError: countriesQuery.isError,
  };
}
