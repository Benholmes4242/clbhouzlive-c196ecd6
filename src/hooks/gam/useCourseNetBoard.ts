import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseLegendRow } from '@/lib/gam/types';

/**
 * BRIEF_STANDING_TAP 2b — CHAMPIONS' NET BOARD.
 *
 * gam_course_legends has no net category. This reads get_course_net_board
 * (docs/sql/champions_net_board.sql), built on the SAME board_pool/
 * board_qualifies primitives as get_viewer_standing. Rows come back in
 * get_course_legends' exact shape with category 'lowest_net_all_time'.
 *
 * CHAMPIONS_NET_SOURCE_1: a failed fetch is NOT an empty board. The function
 * is deployed (CHAMPIONS_STATE_4_V), so the normal all-time cabinet is nine;
 * eight is the source-unavailable fallback only. The result
 * carries `available` from the query outcome; an unavailable source is
 * omitted from the cabinet and every count, while a successful zero-row
 * answer is a real never-claimed board. Failure stays silent for the reader
 * (no other board is taken down) but is warned once for us.
 */
export interface CourseNetBoardResult { available: boolean; rows: CourseLegendRow[] }

export function useCourseNetBoard(courseId: string | undefined, viewerId?: string | null) {
  return useQuery<CourseNetBoardResult>({
    queryKey: ['gam', 'course-net-board', courseId ?? null, viewerId ?? null],
    enabled: Boolean(courseId),
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_net_board' as never, {
        p_course_id: courseId,
        p_viewer_id: viewerId ?? null,
      } as never);
      if (error) {
        console.warn('[champions] lowest_net_all_time unavailable', error.message);
        return { available: false, rows: [] };
      }
      return { available: true, rows: (data ?? []) as unknown as CourseLegendRow[] };
    },
  });
}
