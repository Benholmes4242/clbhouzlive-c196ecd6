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
      if (!tournamentId || !playerId) return null;

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select('raw_data')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
        .maybeSingle();

      if (error || !data?.raw_data) return null;

      const rawData = data.raw_data as any;
      const rounds: any[] = rawData?.rounds ?? [];

      if (rounds.length === 0) return null;

      return {
        birdies:      rounds.reduce((sum, r) => sum + (r.birdies       ?? 0), 0),
        eagles:       rounds.reduce((sum, r) => sum + (r.eagles        ?? 0), 0),
        pars:         rounds.reduce((sum, r) => sum + (r.pars          ?? 0), 0),
        bogeys:       rounds.reduce((sum, r) => sum + (r.bogeys        ?? 0), 0),
        doubleBogeys: rounds.reduce((sum, r) => sum + (r.double_bogeys ?? 0), 0),
        holesInOne:   rounds.reduce((sum, r) => sum + (r.holes_in_one  ?? 0), 0),
        rounds:       rounds.length,
      };
    },
    enabled: !!tournamentId && !!playerId,
    staleTime: 60_000,
  });
}
