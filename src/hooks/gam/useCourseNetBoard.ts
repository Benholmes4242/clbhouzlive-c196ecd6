import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseLegendRow } from '@/lib/gam/types';

/**
 * BRIEF_STANDING_TAP 2b — CHAMPIONS' NET BOARD.
 *
 * gam_course_legends has no net category, so the standing shelf's DEFAULT board
 * had no destination on Champions. This reads get_course_net_board
 * (docs/sql/champions_net_board.sql), which is built on the SAME
 * board_pool/board_qualifies primitives, the same sort value, the same collapse
 * and the same rank() as get_viewer_standing — the two surfaces cannot state
 * different ranks because they do not contain two implementations.
 *
 * Rows come back in get_course_legends' exact shape with category
 * 'lowest_net_all_time', so the drilldown merges them into the board machinery
 * it already has; no second row type, no second board renderer.
 *
 * FAILURE IS SILENT AND EMPTY, DELIBERATELY: the function is a draft for Ben to
 * run, so until it exists the rpc 404s. An error here must not take the eight
 * boards that do work down with it, and a category with no rows is simply not
 * rendered — the same treatment as a board nobody holds.
 */
export function useCourseNetBoard(courseId: string | undefined, viewerId?: string | null) {
  return useQuery<CourseLegendRow[]>({
    queryKey: ['gam', 'course-net-board', courseId ?? null, viewerId ?? null],
    enabled: Boolean(courseId),
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_net_board' as never, {
        p_course_id: courseId,
        p_viewer_id: viewerId ?? null,
      } as never);
      if (error) return [];
      return (data ?? []) as unknown as CourseLegendRow[];
    },
  });
}
