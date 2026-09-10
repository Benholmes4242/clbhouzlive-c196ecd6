/**
 * BATCHED field size: for a set of courses, how many DISTINCT OTHER players
 * have posted a scored round there, with one member excluded.
 *
 * WHY THIS EXISTS. The trophy room needs the contested / uncontested split for
 * every course a member holds a record at — up to ~100 courses for the top
 * holder. get_course_hole_field answers exactly this question but per course,
 * and per-course calls across a list that long is not a read this sheet can
 * make. So the SAME definition is asked for in one round trip.
 *
 * IT IS THE SAME COUNT, NOT A SECOND ONE. p_exclude_user_id excludes the record
 * holder, distinct players are counted from scored rounds, and the threshold is
 * FIELD_MIN_PLAYERS in src/lib/gam/fieldGate.ts. The crown data (gam_course_
 * legends_view) CANNOT answer it: it counts members who hold a crown at the
 * course, includes the holder, and says nothing about players who posted
 * without taking a record.
 *
 * UNTIL get_course_field_sizes IS DEPLOYED this hook returns
 * `{ available: false }` and the calling panel states counts without claiming
 * any course is won or uncontested. A missing function is NOT an excuse to fall
 * back to a head count of crown holders.
 *
 * ZERO IS AMBIGUOUS, AND ONLY SAFE HERE. A course with no qualifying WHS
 * mapping comes back with 0 players, which is indistinguishable from a mapped
 * course nobody else has played. Both are UNCONTESTED, so the won/uncontested
 * split reads it correctly -- but do NOT reuse this zero anywhere as "nobody has
 * played here", because it may mean "not mapped".
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseFieldPlayers {
  available: boolean;
  reason?: string;
  /** course_id -> distinct OTHER players with a scored round there. */
  sizes: Map<string, number>;
}

/**
 * The deployed shape: one row per requested course id, including courses with
 * no qualifying mapping (0 players). course_players is already
 * holder-excluded, so it is used as-is -- nothing is subtracted here.
 */
interface FieldSizeRow {
  course_id: string | null;
  course_players: number | null;
  course_rounds?: number | null;
}

const UNAVAILABLE = (reason: string): CourseFieldPlayers => ({
  available: false,
  reason,
  sizes: new Map(),
});

export function useCourseFieldPlayers(
  courseIds: string[],
  excludeUserId: string | undefined,
  options?: { enabled?: boolean },
) {
  const ids = Array.from(new Set(courseIds.filter(Boolean))).sort();
  const ready = ids.length > 0 && Boolean(excludeUserId);
  return useQuery<CourseFieldPlayers>({
    queryKey: ['gam', 'course-field-players', excludeUserId, ids],
    enabled: ready && (options?.enabled ?? true),
    staleTime: 60 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<CourseFieldPlayers> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_course_field_sizes', {
        p_course_ids: ids,
        p_exclude_user_id: excludeUserId as string,
      });
      // A missing or ungranted function reads as "no field data", never as a
      // field of zero: zero would print "nobody else has played here" on every
      // course on the sheet.
      if (error) return UNAVAILABLE(error.code === '42883' ? 'not_deployed' : 'error');
      const rows = (data ?? []) as FieldSizeRow[];
      if (!Array.isArray(rows)) return UNAVAILABLE('unexpected_shape');
      const sizes = new Map<string, number>();
      for (const row of rows) {
        if (!row?.course_id) continue;
        sizes.set(row.course_id, Number(row.other_players ?? 0));
      }
      return { available: true, sizes };
    },
  });
}

export default useCourseFieldPlayers;
