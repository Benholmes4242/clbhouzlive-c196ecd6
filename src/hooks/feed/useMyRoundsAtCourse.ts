/**
 * useMyRoundsAtCourse — the viewer's 18-hole rounds at one course.
 *
 * Source is gam_round_stats (already denormalised: user_id, course_id,
 * gross_score, course_par, holes_played, play_date, tee_marker,
 * whs_score_id). We deliberately do NOT re-derive from whs_scores.
 *
 * Most recent first, capped at 20. Enabled only when a course is tagged.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileData } from '@/hooks/useProfileData';

/** ONE column list for both hooks: MyRoundAtCourse means one shape. */
const ROUND_COLUMNS =
  'whs_score_id, play_date, gross_score, course_par, tee_marker, hcp_at_time, delta_index, front_nine_to_par, back_nine_to_par, eagles, albatrosses, holes_in_one, clean_card';

type RoundRow = {
  whs_score_id: string; play_date: string; gross_score: number | null; course_par: number | null;
  tee_marker: string | null; hcp_at_time: number | null; delta_index: number | null;
  front_nine_to_par: number | null; back_nine_to_par: number | null; eagles: number | null;
  albatrosses: number | null; holes_in_one: number | null; clean_card: boolean | null;
};

/** Every new field is nullable: a null is an empty cell, never zero, never derived. */
function mapRound(r: RoundRow): MyRoundAtCourse {
  return {
    whsScoreId: r.whs_score_id,
    playDate: r.play_date,
    grossScore: r.gross_score ?? null,
    coursePar: r.course_par ?? null,
    teeMarker: r.tee_marker ?? null,
    hcpAtTime: r.hcp_at_time ?? null,
    deltaIndex: r.delta_index ?? null,
    frontNineToPar: r.front_nine_to_par ?? null,
    backNineToPar: r.back_nine_to_par ?? null,
    eagles: r.eagles ?? null,
    albatrosses: r.albatrosses ?? null,
    holesInOne: r.holes_in_one ?? null,
    cleanCard: r.clean_card ?? null,
  };
}

export interface MyRoundAtCourse {
  whsScoreId: string;
  playDate: string;
  grossScore: number | null;
  coursePar: number | null;
  teeMarker: string | null;
  hcpAtTime: number | null;
  deltaIndex: number | null;
  frontNineToPar: number | null;
  backNineToPar: number | null;
  eagles: number | null;
  albatrosses: number | null;
  holesInOne: number | null;
  cleanCard: boolean | null;
}

export function useMyRoundsAtCourse(courseId?: string | null, options?: { limit?: number }) {
  const { profile } = useProfileData();
  const userId = profile?.id ?? null;
  /* The tab's list is capped at 20; the all-rounds page asks for more. The cap
     is part of the key so the two callers cannot share a truncated cache. */
  const limit = options?.limit ?? 20;

  return useQuery({
    queryKey: ['my-rounds-at-course', userId, courseId, limit],
    enabled: !!userId && !!courseId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MyRoundAtCourse[]> => {
      const { data, error } = await supabase
        .from('gam_round_stats')
        .select(ROUND_COLUMNS)
        .eq('user_id', userId as string)
        .eq('course_id', courseId as string)
        .eq('holes_played', 18)
        .order('play_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return ((data ?? []) as unknown as RoundRow[]).map(mapRound);
    },
  });
}

export interface MyRoundsAtCourseResult {
  rounds: MyRoundAtCourse[];
  total: number;
}

/**
 * The complete 18-hole history for the analytical Your rounds sheet.
 *
 * PostgREST responses are capped, so this reads deterministic 500-row pages.
 * The first page also asks Postgres for an exact count; `total` is therefore
 * the real matching total, never the number currently accumulated in memory.
 */
export function useAllMyRoundsAtCourse(courseId?: string | null, enabled = true) {
  const { profile } = useProfileData();
  const userId = profile?.id ?? null;

  return useQuery({
    queryKey: ['my-rounds-at-course', userId, courseId, 'all'],
    enabled: Boolean(enabled && userId && courseId),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MyRoundsAtCourseResult> => {
      const pageSize = 500;
      const rows: RoundRow[] = [];
      let exactTotal: number | null = null;

      for (let from = 0; ; from += pageSize) {
        const query = supabase
          .from('gam_round_stats')
          .select(ROUND_COLUMNS, from === 0 ? { count: 'exact' } : undefined)
          .eq('user_id', userId as string)
          .eq('course_id', courseId as string)
          .eq('holes_played', 18)
          .order('play_date', { ascending: false })
          .order('whs_score_id', { ascending: false })
          .range(from, from + pageSize - 1);
        const { data, error, count } = await query;
        if (error) throw error;
        if (from === 0) exactTotal = count;
        rows.push(...((data ?? []) as unknown as RoundRow[]));
        if ((data?.length ?? 0) < pageSize || (exactTotal != null && rows.length >= exactTotal)) break;
      }

      return {
        total: exactTotal ?? rows.length,
        rounds: rows.map(mapRound),
      };
    },
  });
}

/** Local YYYY-MM-DD for a Date. */
function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole days between a round's play_date and today (viewer local time). */
export function daysSinceRound(playDate: string, now: Date = new Date()): number {
  const [y, m, d] = playDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return 0;
  const then = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - then.getTime()) / 86400000);
}

/**
 * Pre-selection rule: only a round played today or yesterday is offered
 * up front. Anything older is a deliberate choice the member makes.
 */
export function pickPreselectedRound(
  rounds: MyRoundAtCourse[],
  now: Date = new Date(),
): MyRoundAtCourse | null {
  const today = localISODate(now);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterday = localISODate(y);
  const recent = rounds.filter((r) => {
    const d = r.playDate.slice(0, 10);
    return d === today || d === yesterday;
  });
  if (recent.length === 0) return null;
  return recent.reduce((best, r) => (r.playDate > best.playDate ? r : best), recent[0]);
}
