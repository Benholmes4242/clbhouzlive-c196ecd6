import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentScoring {
  eagles: number;
  birdies: number;
  pars: number;
  bogeysPlus: number;
}

/**
 * Aggregates hole-by-hole scoring totals for a tournament into four buckets:
 * - eagles: score_to_par ≤ -2 (includes albatross)
 * - birdies: score_to_par = -1
 * - pars: score_to_par = 0
 * - bogeysPlus: score_to_par ≥ +1 (bogeys + doubles + worse, combined)
 *
 * Returns null until scorecards have been populated for the tournament.
 */
export function useTournamentScoring(
  tournamentId: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['tournament-scoring', tournamentId],
    enabled: !!tournamentId && enabled,
    staleTime: 1000 * 60 * 60, // completed-tournament data doesn't change
    queryFn: async (): Promise<TournamentScoring | null> => {
      if (!tournamentId) return null;
      const { data, error } = await (supabase as any).rpc('tournament_scoring_totals', {
        t_id: tournamentId,
      });
      if (error || !data) return null;
      const r = Array.isArray(data) ? data[0] : data;
      if (!r || Number(r.holes_played ?? 0) === 0) return null;
      return {
        eagles: Number(r.eagles_or_better ?? 0),
        birdies: Number(r.birdies ?? 0),
        pars: Number(r.pars ?? 0),
        bogeysPlus: Number(r.bogeys_plus ?? 0),
      };
    },
  });
}
