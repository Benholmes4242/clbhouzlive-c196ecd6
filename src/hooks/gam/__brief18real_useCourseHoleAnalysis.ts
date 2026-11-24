import { useGamRpc } from './_useGamRpc';

export interface HoleDistribution {
  ace: number;
  albatross: number;
  eagle: number;
  birdie: number;
  par: number;
  bogey: number;
  double: number;
}

export interface CourseHole {
  hole_no: number;
  par: number;
  yards: number | null;
  stroke_index: number | null;
  rounds: number;
  avg_to_par: number;
  avg_gross: number;
  dist: HoleDistribution;
}

export interface CourseHoleAnalysis {
  available: boolean;
  total_rounds: number;
  holes: CourseHole[];
}

export function useCourseHoleAnalysis(courseId: string | undefined) {
  return useGamRpc<CourseHoleAnalysis>(
    'get_course_hole_analysis',
    courseId ? { p_course_id: courseId } : ({} as { p_course_id: string }),
    { enabled: Boolean(courseId), staleTime: 60_000 },
  );
}
