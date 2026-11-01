/**
 * useClimberRankHistory — ONE read of the biggest climber's stored snapshots
 * (rank, ranking_date) over the last 180 days, for the 84×30 line on the
 * climber card. World board only; the card text renders without it.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RankSnapshot } from '../sections/worldRankingsRules';

const HISTORY_WINDOW_DAYS = 180;

function isoMinusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function useClimberRankHistory(playerId: string | null, latestDate: string | null) {
  return useQuery({
    queryKey: ['overview', 'rankings', 'climber-history', playerId, latestDate],
    enabled: !!playerId && !!latestDate,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<RankSnapshot[]> => {
      const cutoff = isoMinusDays(latestDate as string, HISTORY_WINDOW_DAYS);
      const { data, error } = await supabase
        .from('sr_world_rankings')
        .select('rank, ranking_date')
        .eq('player_id', playerId as string)
        .gte('ranking_date', cutoff)
        .order('ranking_date', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as any[])
        .filter((r) => typeof r.rank === 'number' && r.rank >= 1)
        .map((r) => ({ rank: r.rank, ranking_date: r.ranking_date }));
    },
  });
}
