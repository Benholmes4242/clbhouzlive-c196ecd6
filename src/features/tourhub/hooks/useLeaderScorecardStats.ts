import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderStats {
  birdies: number;
  eagles: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
}

/**
 * Reads leaderboard raw_data → rounds aggregate stats.
 *
 * Accepts either a player id (sr_players.id) for stroke-play tournaments
 * OR a team id (sr_teams.id) for team-format events. Pass `entityKind` to
 * disambiguate. Defaults to 'player' for backward compatibility.
 */
export function useLeaderScorecardStats(
  tournamentId: string | null | undefined,
  entityId: string | null | undefined,
  entityKind: 'player' | 'team' = 'player',
) {
  return useQuery({
    queryKey: ['leader-scorecard-stats-hero', tournamentId, entityId, entityKind],
    queryFn: async (): Promise<LeaderStats | null> => {
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
    enabled: !!tournamentId && !!entityId,
    staleTime: 30_000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });
}
