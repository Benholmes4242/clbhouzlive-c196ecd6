/**
 * useClubRoundsTracked - tracked rounds across EVERY course of a club.
 *
 * No new query type: it fans out the SAME `course-stats-detail` query key the
 * course panels already use, so a single-course club still issues one request
 * and a 36-hole club reuses whatever is cached.
 */
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';

export function useClubRoundsTracked(courseIds: string[]): number | null {
  const ids = Array.from(new Set(courseIds.filter(Boolean)));
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['course-stats-detail', id],
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
      queryFn: async (): Promise<CourseStatsDetail | null> => {
        const { data, error } = await supabase.rpc(
          'get_course_stats_detail' as never,
          { p_course_id: id } as never,
        );
        if (error) throw error;
        if (!data) return null;
        const row = Array.isArray(data) ? data[0] : data;
        return (row as CourseStatsDetail | null) ?? null;
      },
    })),
  });

  if (ids.length === 0) return null;
  const values = results
    .map((r) => r.data?.rounds_tracked)
    .filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0);
}
