/**
 * useTournamentHoleAverages — field scoring average PER HOLE for one round.
 *
 * Delegates to get_tournament_hole_averages(tournament_id, round_number,
 * min_players) — built for the tour scorecard sheet, granted to authenticated
 * and anon. The RPC gates on p_min_players (default 10) and OMITS holes below
 * the threshold, so mid-round the tail of the card is simply absent. Callers
 * must render only the holes returned: no interpolation, no flat extension.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HoleAverageRow {
  hole_number: number;
  par: number;
  field_avg: number;
  players: number;
}

export function useTournamentHoleAverages(
  tournamentId: string | undefined,
  round: number | null | undefined,
  opts?: { live?: boolean },
) {
  return useQuery({
    queryKey: ['tournament-hole-averages', tournamentId, round],
    enabled: !!tournamentId && round != null,
    staleTime: 60_000,
    refetchInterval: opts?.live ? 120_000 : false,
    queryFn: async (): Promise<HoleAverageRow[]> => {
      if (!tournamentId || round == null) return [];
      const { data, error } = await supabase.rpc('get_tournament_hole_averages', {
        p_tournament_id: tournamentId,
        p_round_number: round,
      });
      if (error) return [];
      return ((data ?? []) as HoleAverageRow[])
        .filter((r) => r?.hole_number != null && r.field_avg != null)
        .sort((a, b) => a.hole_number - b.hole_number);
    },
  });
}
