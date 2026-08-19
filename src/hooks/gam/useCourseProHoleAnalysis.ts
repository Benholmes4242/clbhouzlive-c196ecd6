import { useGamRpc } from './_useGamRpc';
import type { CourseHole } from './useCourseHoleAnalysis';

/**
 * PRO hole-by-hole analytics, pooled from tournament data for courses that have
 * hosted professional golf. Mirrors the member contract exactly - same holes[]
 * shape, so CourseAnalyticsPanels renders it with no new component.
 *
 * stroke_index, dist.ace and dist.albatross are NULL on this source (never 0):
 * tournament data carries no stroke index, and neither outcome is reported.
 */
export interface CourseProHole extends Omit<CourseHole, 'stroke_index' | 'dist'> {
  stroke_index: null;
  dist: {
    ace: null;
    albatross: null;
    eagle: number;
    birdie: number;
    par: number;
    bogey: number;
    double: number;
  };
}

export interface CourseProHoleAnalysis {
  available: boolean;
  /** Why the pro view is unavailable - 'no_pro_history' | 'hole_count' | 'no_course'. */
  reason?: string;
  /** Player-rounds pooled (the busiest hole's outcome total). */
  total_rounds?: number;
  /** Tournaments pooled. */
  total_tournaments?: number;
  holes?: CourseProHole[];
}

export function useCourseProHoleAnalysis(courseId: string | undefined) {
  return useGamRpc<CourseProHoleAnalysis>(
    'get_course_pro_hole_analysis',
    courseId ? { p_course_id: courseId } : ({} as { p_course_id: string }),
    { enabled: Boolean(courseId), staleTime: 300_000 },
  );
}
