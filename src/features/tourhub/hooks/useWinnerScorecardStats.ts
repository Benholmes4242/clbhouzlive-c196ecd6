import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WinnerStats {
  birdies: number;
  eagles: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  holesInOne: number;
  rounds: number;
}

export function useWinnerScorecardStats(
  tournamentId: string | undefined,
  playerId: string | undefined
) {
  return useQuery({
    queryKey: ['winner-scorecard-stats', tournamentId, playerId],
    queryFn: async (): Promise<WinnerStats | null> => {
      console.log('[WINNER-STATS] Fetching for tournament:', tournamentId, 'player:', playerId);
      if (!tournamentId || !playerId) return null;

      const { data, error } = await supabase
        .from('sr_scorecards')
        .select('birdies, eagles, pars, bogeys, double_bogeys, holes_in_one, round_score')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId);

      console.log('[WINNER-STATS] Result:', { rows: data?.length, error: error?.message });
      if (error || !data || data.length === 0) return null;

      return {
        birdies:     data.reduce((sum, r) => sum + (r.birdies      ?? 0), 0),
        eagles:      data.reduce((sum, r) => sum + (r.eagles       ?? 0), 0),
        pars:        data.reduce((sum, r) => sum + (r.pars         ?? 0), 0),
        bogeys:      data.reduce((sum, r) => sum + (r.bogeys       ?? 0), 0),
        doubleBogeys:data.reduce((sum, r) => sum + (r.double_bogeys ?? 0), 0),
        holesInOne:  data.reduce((sum, r) => sum + (r.holes_in_one  ?? 0), 0),
        rounds:      data.length,
      };
    },
    enabled: !!tournamentId && !!playerId,
    staleTime: 60_000,
  });
}
