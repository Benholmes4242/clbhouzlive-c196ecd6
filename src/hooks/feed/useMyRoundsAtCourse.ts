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

export function useMyRoundsAtCourse(courseId?: string | null) {
  const { profile } = useProfileData();
  const userId = profile?.id ?? null;

  return useQuery({
    queryKey: ['my-rounds-at-course', userId, courseId],
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
        .limit(20);
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
