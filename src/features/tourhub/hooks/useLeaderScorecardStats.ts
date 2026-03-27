import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderStats {
  birdies: number;
  eagles: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
}

export function useLeaderScorecardStats(
  tournamentId: string | null | undefined,
  playerId: string | null | undefined
) {
  return useQuery({
    queryKey: ['leader-scorecard-stats-hero', tournamentId, playerId],
    queryFn: async (): Promise<LeaderStats | null> => {
      if (!tournamentId || !playerId) return null;

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select('raw_data')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
        .maybeSingle();

      if (error || !data?.raw_data) return null;

      const rounds: any[] = (data.raw_data as any)?.rounds ?? [];
      if (rounds.length === 0) return null;

      return {
        eagles:       rounds.reduce((s, r) => s + (r.eagles        ?? 0), 0),
        birdies:      rounds.reduce((s, r) => s + (r.birdies       ?? 0), 0),
        pars:         rounds.reduce((s, r) => s + (r.pars          ?? 0), 0),
        bogeys:       rounds.reduce((s, r) => s + (r.bogeys        ?? 0), 0),
        doubleBogeys: rounds.reduce((s, r) => s + (r.double_bogeys ?? 0), 0),
      };
    },
    enabled: !!tournamentId && !!playerId,
    staleTime: 30_000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });
}
