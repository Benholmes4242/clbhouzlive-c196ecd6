import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { CourseHonour } from './honoursRules';

/**
 * useCourseHonours — get_course_honours(p_course_id). Rows arrive newest
 * first, then by hole; a par-4 ace arrives twice (ace + albatross). Never
 * re-sort or filter here. Disabled signed out. Until the function exists the
 * read errors and the section stays hidden.
 */
export function useCourseHonours(courseId: string | undefined, userId: string | undefined) {
  return useQuery<CourseHonour[]>({
    queryKey: ['course', 'honours', courseId, userId],
    enabled: !!courseId && !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_course_honours', { p_course_id: courseId });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        kind: r.kind === 'albatross' ? 'albatross' : 'ace',
        whs_score_id: String(r.whs_score_id),
        user_id: String(r.user_id),
        display_name: String(r.display_name ?? ''),
        play_date: String(r.play_date ?? ''),
        hole_no: Number(r.hole_no),
        par: Number(r.par),
        strokes: Number(r.strokes),
        yards: r.yards == null ? null : Number(r.yards),
        is_competition: r.is_competition === true,
      }));
    },
  });
}
