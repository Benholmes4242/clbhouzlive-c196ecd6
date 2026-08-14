import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useMostPlayedThisWeek — tracked WHS rounds per course over a rolling 7 days,
 * with the delta against the prior 7 (BRIEF, section 5).
 *
 * QUERY SHAPE: one client select over gam_round_stats for the 14-day window
 * (course_id + play_date only), counted client-side for both windows. Platform
 * volume is single figures per week, so an RPC would buy nothing; if row volume
 * ever makes this heavy the aggregate belongs in a `discover_most_played` RPC
 * returning (course_id, rounds_7d, rounds_prev_7d).
 *
 * A cooling-off course shows NO delta — never a red one.
 *
 * TWO SUPPRESSIONS, both here so the component never receives a figure it
 * should not draw:
 *  - NO PRIOR WEEK: prev = 0 means the course is APPEARING, not growing. The
 *    delta would equal the count and print the same number twice, so it is
 *    null.
 *  - FLOOR: a single round in the window is not a leaderboard position, so
 *    courses under MIN_ROUNDS are dropped entirely. With none qualifying the
 *    list is empty and the section renders nothing.
 */

/** A course needs at least this many rounds in the 7-day window to appear. */
const MIN_ROUNDS = 2;

/** Every outcome of the week-on-week comparison, none discarded. */
export type MostPlayedMove = 'new' | 'up' | 'down' | 'level';

export interface MostPlayedRow {
  courseId: string;
  courseName: string | null;
  count: number;
  /** Rounds in the prior 7 days. */
  prior: number;
  /** Raw signed change vs the prior 7 days (count - prior). */
  change: number;
  /** Which of the four states the row renders. */
  move: MostPlayedMove;
  /**
   * Average to par over the CURRENT seven days, eighteen-hole scored rounds
   * only. Null when the course has no comparable scored round this week.
   */
  avgToPar: number | null;
}

const DAY = 86_400_000;

export function useMostPlayedThisWeek(limit = 25) {
  return useQuery({
    queryKey: ['courseled', 'most-played', limit],
    queryFn: async (): Promise<MostPlayedRow[]> => {
      const now = Date.now();
      const startPrev = new Date(now - 14 * DAY).toISOString().slice(0, 10);
      const startCur = new Date(now - 7 * DAY).toISOString().slice(0, 10);

      // SAME READ, TWO MORE COLUMNS. gam_round_stats carries NO to-par field,
      // so the average is derived from gross_score - course_par; holes_played
      // keeps nine-hole cards out of that average only.
      const { data, error } = await supabase
        .from('gam_round_stats' as never)
        .select('course_id, course_name, play_date, gross_score, course_par, holes_played')
        .gte('play_date', startPrev)
        .not('course_id', 'is', null);
      if (error) throw error;

      const rows = ((data ?? []) as unknown) as Array<{
        course_id: string | null;
        course_name: string | null;
        play_date: string;
        gross_score: number | null;
        course_par: number | null;
        holes_played: number | null;
      }>;

      const cur = new Map<string, number>();
      const prev = new Map<string, number>();
      const names = new Map<string, string | null>();
      /** Running to-par sum/count for the CURRENT week, 18-hole scored only. */
      const par = new Map<string, { sum: number; n: number }>();
      for (const r of rows) {
        if (!r.course_id) continue;
        names.set(r.course_id, r.course_name ?? names.get(r.course_id) ?? null);
        const isCurrent = r.play_date >= startCur;
        const bucket = isCurrent ? cur : prev;
        bucket.set(r.course_id, (bucket.get(r.course_id) ?? 0) + 1);
        if (
          isCurrent &&
          r.holes_played === 18 &&
          r.gross_score != null &&
          r.course_par != null
        ) {
          const agg = par.get(r.course_id) ?? { sum: 0, n: 0 };
          agg.sum += r.gross_score - r.course_par;
          agg.n += 1;
          par.set(r.course_id, agg);
        }
      }

      return [...cur.entries()]
        .filter(([, count]) => count >= MIN_ROUNDS)
        .map(([courseId, count]) => {
          const before = prev.get(courseId) ?? 0;
          const change = count - before;
          const agg = par.get(courseId);
          return {
            courseId,
            courseName: names.get(courseId) ?? null,
            count,
            prior: before,
            change,
            // FOUR STATES, NONE DISCARDED: a drop and a first appearance are
            // both reportable facts about the week.
            move:
              before === 0 ? 'new' : change > 0 ? 'up' : change < 0 ? 'down' : 'level',
            avgToPar: agg && agg.n > 0 ? agg.sum / agg.n : null,
          } satisfies MostPlayedRow;
        })
        .sort((a, b) => b.count - a.count || (a.courseName ?? '').localeCompare(b.courseName ?? ''))
        .slice(0, limit);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
