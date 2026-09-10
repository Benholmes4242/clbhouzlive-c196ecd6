import { useGamRpc } from './_useGamRpc';

/**
 * get_course_hole_field — per-hole field average at a course EXCLUDING one
 * player, plus the player counts the client needs to decide whether a field
 * exists at all.
 *
 * WHY A SECOND FUNCTION AND NOT get_course_hole_analysis: the analysis function
 * is live on the course pages and includes every player, so on a member's own
 * card it compared the member against a pool containing that member. This one
 * takes the excluded player as a required argument.
 *
 * THE EXCLUDED PLAYER IS THE ROUND'S OWNER, NEVER THE VIEWER. The subject of a
 * scorecard is the member whose round it is, so on someone else's round it is
 * that member who is excluded.
 *
 * `available:false` comes back with reason 'unauthenticated' (auth.uid() null,
 * which a signed-out TourHub viewer hits) or 'no_whs_mapping'. BOTH MEAN NO
 * FIELD. An empty field is NOT null: it returns available:true with
 * course_players 0 and holes [], so branch on course_players, never on null.
 *
 * Grants are authenticated + service_role only. Supabase's default privileges
 * granted anon EXECUTE despite REVOKE ALL FROM PUBLIC and that was revoked
 * explicitly; if the function is ever recreated, RE-CHECK THE ANON GRANT.
 */
export interface CourseHoleFieldHole {
  hole_no: number;
  hole_players: number;
  scored_count: number;
  avg_gross: number | null;
}

export interface CourseHoleField {
  available: boolean;
  reason?: string;
  course_id: string;
  exclude_user_id: string;
  course_players: number;
  course_rounds: number;
  holes: CourseHoleFieldHole[];
}

export function useCourseHoleField(
  courseId: string | undefined,
  excludeUserId: string | undefined,
  options?: { enabled?: boolean },
) {
  const ready = Boolean(courseId && excludeUserId);
  return useGamRpc<CourseHoleField>(
    'get_course_hole_field',
    ready
      ? { p_course_id: courseId as string, p_exclude_user_id: excludeUserId as string }
      : ({} as { p_course_id: string; p_exclude_user_id: string }),
    { enabled: ready && (options?.enabled ?? true), staleTime: 60_000 },
  );
}
