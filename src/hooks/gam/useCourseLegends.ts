import { useGamRpc } from './_useGamRpc';
import type { CourseLegendRow } from '@/lib/gam/types';

export function useCourseLegends(courseId: string | undefined) {
  return useGamRpc<CourseLegendRow[]>(
    'get_course_legends',
    courseId ? { p_course_id: courseId } : ({} as { p_course_id: string }),
    { enabled: Boolean(courseId), staleTime: 60_000 },
  );
}
