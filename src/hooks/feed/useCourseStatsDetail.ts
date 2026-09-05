/**
 * useCourseStatsDetail - ONE course, fetched ONLY while the course stats
 * sheet is open.
 *
 * This RPC is materially more expensive than the batched
 * `get_post_course_context` used by the feed band, so it is deliberately
 * NOT part of the feed query and is NEVER prefetched for visible posts.
 *
 * Exception, by design: the course detail hero (GolfClubView) calls this with
 * `open = true`. That rule exists because a feed renders N courses at once;
 * the course page is ONE course the member deliberately navigated to, so a
 * single call on mount is justified. Caching (staleTime 5 min, no refetch on
 * focus) is unchanged and the sheet opened from that hero reuses this entry.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseStatsDetail {
  course_id: string;
  rounds_tracked: number | null;
  avg_over_par: number | null;
  harder_than_pct: number | null;
  your_rounds: number | null;
  your_best: number | null;
  your_best_at: string | null;
  circle_played: number | null;
  top100_rank: number | null;
  top100_list: string | null;
  hardest_hole_no: number | null;
  hardest_hole_par: number | null;
  hardest_hole_plays: number | null;
}

export function useCourseStatsDetail(courseId: string | null | undefined, open: boolean) {
  return useQuery<CourseStatsDetail | null>({
    // enabled ONLY when the sheet is open and a course id is set.
    enabled: Boolean(open && courseId),
    queryKey: ['course-stats-detail', courseId],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_course_stats_detail' as never,
        { p_course_id: courseId } as never,
      );
      if (error) throw error;
      if (!data) return null;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as CourseStatsDetail | null) ?? null;
    },
    retry: false,
  });
}
