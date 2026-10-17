/** CHAMPIONS_STATE_4: exact-course, viewer-only cards, paged to completion.
 * Gross/points/differential are posted gam_round_stats fields. Net is read
 * from the existing visibility-enforcing gam_round_net view, never derived.
 * This read is enabled only for the signed-in personal actor's played state.
 * Existing leaderboard rows remain the authority for cumulative board values.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PostedCard } from '@/components/profile/handicap/whs/sections/course-legends/flat/championsPosted';

interface CardRow {
  whs_score_id: string; play_date: string; holes_played: number | null; gross_score: number | null;
  score_diff: number | null; stableford_points: number | null; birdies: number; eagles: number; holes_in_one: number; albatrosses: number;
}
export function useChampionsPostedCards(courseId: string | undefined, viewerId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['champions-posted-cards', courseId, viewerId], enabled: Boolean(enabled && courseId && viewerId), staleTime: 60_000,
    queryFn: async (): Promise<PostedCard[]> => {
      if (!courseId || !viewerId) return [];
      const rows: CardRow[] = [];
      for (let from = 0; ; from += 500) {
        const { data, error } = await supabase.from('gam_round_stats')
          .select('whs_score_id, play_date, holes_played, gross_score, score_diff, stableford_points, birdies, eagles, holes_in_one, albatrosses')
          .eq('course_id', courseId).eq('user_id', viewerId).order('play_date', { ascending: false }).order('whs_score_id', { ascending: false }).range(from, from + 499);
        if (error) throw error;
        rows.push(...(data ?? []));
        if ((data?.length ?? 0) < 500) break;
      }
      const nets = new Map<string, number>();
      for (let from = 0; from < rows.length; from += 100) {
        const { data, error } = await supabase.from('gam_round_net' as never).select('whs_score_id, net_score').in('whs_score_id', rows.slice(from, from + 100).map(row => row.whs_score_id));
        // Net absence never becomes zero and does not hide legitimate cards.
        if (error) continue;
        for (const row of (data ?? []) as unknown as { whs_score_id: string; net_score: number | null }[]) if (row.net_score != null) nets.set(row.whs_score_id, Number(row.net_score));
      }
      return rows.map(row => ({ id: row.whs_score_id, date: row.play_date, holes: row.holes_played, gross: row.gross_score, net: nets.get(row.whs_score_id) ?? null, differential: row.score_diff, stableford: row.stableford_points, birdies: row.birdies, eagles: row.eagles, aces: row.holes_in_one, albatrosses: row.albatrosses }));
    },
  });
}