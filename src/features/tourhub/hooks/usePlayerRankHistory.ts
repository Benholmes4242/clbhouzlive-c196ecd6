/**
 * usePlayerRankHistory — fetches a player's recent OWGR weekly snapshots
 * for the WorldRankingsHero sparkline.
 *
 * Returns up to `weeks` recent (rank, date) pairs sorted ascending by date
 * (oldest left → newest right) so the consumer can map directly to a polyline.
 *
 * Per Phase E Decision 1 — real data, no placeholder. Component should
 * gracefully degrade to a single dot / status text only when <3 points
 * exist (no broken/fake line).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RankHistoryPoint {
  rank: number;
  date: string; // ISO date (yyyy-mm-dd)
}

export function usePlayerRankHistory(
  playerId: string | null | undefined,
  weeks: number = 12,
) {
  return useQuery({
    queryKey: ['player-rank-history', playerId, weeks],
    enabled: !!playerId,
    staleTime: 30 * 60 * 1000, // 30 min — weekly data
    queryFn: async (): Promise<RankHistoryPoint[]> => {
      if (!playerId) return [];

      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select('rank, ranking_date')
        .eq('player_id', playerId)
        .order('ranking_date', { ascending: false })
        .limit(weeks);

      if (error) {
        console.error('[usePlayerRankHistory] fetch error', error);
        return [];
      }

      // Sort ascending by date for direct polyline mapping
      return (data ?? [])
        .filter((r): r is { rank: number; ranking_date: string } =>
          typeof r.rank === 'number' && typeof r.ranking_date === 'string',
        )
        .map((r) => ({ rank: r.rank, date: r.ranking_date }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));
    },
  });
}
