/** useCourseHoleFacts — the shared hole-facts read: the same
 * get_course_hole_analysis query (and cache key) the course Media tab and the
 * course media viewer use, shaped by courseWalkHoles. Pass `enabled` only
 * once a chip is tapped: nothing fetches at scroll time, and a cached analysis
 * is reused without a new request. */
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { courseWalkHoles } from '@/lib/courseMedia/holeWalk';
import type { HoleWalkData } from '@/lib/courseMedia/holeFacts';

export function useCourseHoleFacts(courseId: string | null | undefined, enabled: boolean): { walk: HoleWalkData | null; isLoading: boolean } {
  const q = useCourseHoleAnalysis(enabled && courseId ? courseId : undefined);
  return { walk: courseWalkHoles(q.data), isLoading: q.isLoading };
}
