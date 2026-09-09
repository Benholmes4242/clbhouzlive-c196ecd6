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

export interface MyRoundAtCourse {
  whsScoreId: string;
  playDate: string;
  grossScore: number | null;
  coursePar: number | null;
  teeMarker: string | null;
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
        .select('whs_score_id, play_date, gross_score, course_par, tee_marker')
        .eq('user_id', userId as string)
        .eq('course_id', courseId as string)
        .eq('holes_played', 18)
        .order('play_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map((r) => ({
        whsScoreId: r.whs_score_id as string,
        playDate: r.play_date as string,
        grossScore: (r.gross_score as number | null) ?? null,
        coursePar: (r.course_par as number | null) ?? null,
        teeMarker: (r.tee_marker as string | null) ?? null,
      }));
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
      const rows: Array<{
        whs_score_id: string;
        play_date: string;
        gross_score: number | null;
        course_par: number | null;
        tee_marker: string | null;
      }> = [];
      let total = 0;

      for (let from = 0; ; from += pageSize) {
        const query = supabase
          .from('gam_round_stats')
          .select('whs_score_id, play_date, gross_score, course_par, tee_marker', from === 0 ? { count: 'exact' } : undefined)
          .eq('user_id', userId as string)
          .eq('course_id', courseId as string)
          .eq('holes_played', 18)
          .order('play_date', { ascending: false })
          .order('whs_score_id', { ascending: false })
          .range(from, from + pageSize - 1);
        const { data, error, count } = await query;
        if (error) throw error;
        if (from === 0) total = count ?? 0;
        rows.push(...((data ?? []) as typeof rows));
        if ((data?.length ?? 0) < pageSize || rows.length >= total) break;
      }

      return {
        total,
        rounds: rows.map((r) => ({
          whsScoreId: r.whs_score_id,
          playDate: r.play_date,
          grossScore: r.gross_score,
          coursePar: r.course_par,
          teeMarker: r.tee_marker,
        })),
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
