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

/**
 * Aggregates per-round scoring stats from the winning leaderboard row.
 *
 * Accepts either a player id or a team id (team-format events). Pass
 * `entityKind` to disambiguate. Defaults to 'player' for backward compat.
 */
export function useWinnerScorecardStats(
  tournamentId: string | undefined,
  entityId: string | undefined,
  entityKind: 'player' | 'team' = 'player',
) {
  return useQuery({
    queryKey: ['winner-scorecard-stats', tournamentId, entityId, entityKind],
    queryFn: async (): Promise<WinnerStats | null> => {
      if (!tournamentId || !entityId) return null;

      const query = supabase
        .from('sr_leaderboards')
        .select('raw_data')
        .eq('tournament_id', tournamentId);

      const { data, error } = await (entityKind === 'team'
        ? query.eq('team_id', entityId)
        : query.eq('player_id', entityId)
      ).maybeSingle();

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
    enabled: !!tournamentId && !!entityId,
    staleTime: 60_000,
  });
}
