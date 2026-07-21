import { useGamRpc } from './_useGamRpc';

export interface MyHolePerformanceRow {
  hole_no: number;
  par: number;
  times_played: number;
  avg_to_par: number;
  best_to_par: number;
  birdie_count: number;
  eagle_or_better_count: number;
  ace_count: number;
}

/**
 * Personal hole-level performance for the viewer at a given course.
 * Returns [] when the viewer hasn't played the course. Only enabled when
 * both userId and courseId are known — callers should also gate on WHS
 * connection to avoid empty-round chatter.
 */
export function useMyHolePerformance(
  userId: string | undefined,
  courseId: string | undefined,
  options?: { enabled?: boolean },
) {
  const enabled = Boolean(userId && courseId) && (options?.enabled ?? true);
  return useGamRpc<MyHolePerformanceRow[]>(
    'get_my_hole_performance',
    userId && courseId ? { p_user_id: userId, p_course_id: courseId } : ({} as { p_user_id: string; p_course_id: string }),
    { enabled, staleTime: 60_000 },
  );
}
