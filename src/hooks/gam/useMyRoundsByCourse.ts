/**
 * useMyRoundsByCourse — ONE read for the whole course-analytics sheet.
 *
 * The sheet lists ~33 courses and each expanded card wants the member's own
 * per-round scoring history at that course. A query per course is 33 round
 * trips in a scrolling sheet, so this is a SINGLE batched read of
 * gam_round_stats for the signed-in member, grouped client-side into
 * Map<course_id, points>. Same table as useMyRoundsAtCourse (already
 * denormalised: user_id, course_id, gross_score, course_par, play_date) so
 * the two surfaces cannot disagree.
 *
 * Oldest first per course, capped at the most recent 20 rounds so a member
 * with 200 rounds at their home club still draws a readable trend.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface CourseRoundPoint {
  /** YYYY-MM-DD */
  date: string;
  /** Score to par for the round (gross - par). Worse is a higher number. */
  toPar: number;
}

/** Most recent rounds kept per course. */
const PER_COURSE_CAP = 20;
/** Row ceiling for the single read. */
const ROW_CAP = 2000;

export function useMyRoundsByCourse(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { user } = useSupabaseSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['gam', 'my-rounds-by-course', userId],
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Map<string, CourseRoundPoint[]>> => {
      const { data, error } = await supabase
        .from('gam_round_stats')
        .select('course_id, play_date, gross_score, course_par')
        .eq('user_id', userId as string)
        .eq('holes_played', 18)
        .not('course_id', 'is', null)
        .not('gross_score', 'is', null)
        .not('course_par', 'is', null)
        .order('play_date', { ascending: false })
        .limit(ROW_CAP);
      if (error) throw error;

      const byCourse = new Map<string, CourseRoundPoint[]>();
      for (const r of data ?? []) {
        const id = r.course_id as string;
        const arr = byCourse.get(id);
        // Rows arrive newest first, so a full bucket already holds the most
        // recent PER_COURSE_CAP rounds.
        if (arr && arr.length >= PER_COURSE_CAP) continue;
        const point: CourseRoundPoint = {
          date: String(r.play_date).slice(0, 10),
          toPar: (r.gross_score as number) - (r.course_par as number),
        };
        if (arr) arr.push(point);
        else byCourse.set(id, [point]);
      }
      // Oldest first for drawing.
      for (const arr of byCourse.values()) arr.reverse();
      return byCourse;
    },
  });
}
