import { useGamRpc } from './_useGamRpc';

export interface CourseMeta {
  available: boolean;
  reason?: string;
  // Course identity (added so route-driven pages can render header from courseId alone)
  course_name: string | null;
  course_region: string | null;
  course_country: string | null;
  course_type: string | null;
  // Stats
  friend_rounds: number;
  your_rounds: number;
  your_best: number | null;
  course_par: number | null;
  course_yards: number | null;
  course_cr: number | null;
  course_slope: number | null;
  avg_over_par: number | null;
  hardest_hole: {
    hole_no: number;
    par: number;
    stroke_index: number;
  } | null;
}

export function useCourseMeta(courseId: string | undefined) {
  return useGamRpc<CourseMeta>(
    'get_course_meta',
    courseId ? { p_course_id: courseId } : ({} as { p_course_id: string }),
    {
      enabled: Boolean(courseId),
      staleTime: 5 * 60_000,
    },
  );
}
