/** useScorecardStats — per-player scorecard stats (non-PGA Stats lens, hero scoring fallback) from get_tour_scorecard_stats. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { currentSeasonYear } from '../../_shared/stats/useLeaderCategories';
import type { PlayersTourId } from './usePlayersRanking';

export type ScorecardStat = Database['public']['Functions']['get_tour_scorecard_stats']['Returns'][number];

export function useScorecardStats(tour: PlayersTourId, seasonYear?: number) {
  const year = seasonYear ?? currentSeasonYear();
  return useQuery<Map<string, ScorecardStat>>({
    queryKey: ['players-v2', 'scorecard-stats', tour, year],
    enabled: seasonYear !== undefined,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tour_scorecard_stats', { p_tour: tour, p_year: year });
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.player_id, r]));
    },
  });
}
