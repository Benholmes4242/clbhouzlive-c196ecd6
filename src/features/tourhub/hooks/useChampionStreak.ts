/**
 * useChampionStreak — counts consecutive weekly snapshots in which the given
 * player held world rank #1. Returns 0 when player is not currently #1 or has
 * fewer than the required snapshots. Pill consumer should only render when ≥ 2.
 *
 * Data source: sr_world_rankings weekly snapshots (10+ weeks of history
 * confirmed in audit).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useChampionStreak(championPlayerId: string | null | undefined) {
  return useQuery({
    queryKey: ['tourhub', 'champion-streak', championPlayerId],
    enabled: !!championPlayerId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<number> => {
      if (!championPlayerId) return 0;

      // Pull all distinct snapshot dates for this player, newest first.
      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select('rank, ranking_date')
        .eq('player_id', championPlayerId)
        .order('ranking_date', { ascending: false })
        .limit(52);

      if (error || !data || data.length === 0) return 0;

      // Count consecutive weeks at rank 1 starting from the most recent snapshot.
      let streak = 0;
      for (const row of data) {
        if (row.rank === 1) {
          streak += 1;
        } else {
          break;
        }
      }
      return streak;
    },
  });
}
