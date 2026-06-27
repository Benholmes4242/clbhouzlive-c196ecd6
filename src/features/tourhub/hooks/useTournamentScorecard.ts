import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScorecardHole {
  hole: number;
  par: number | null;
  strokes: number | null;
  scoreToPar: number | null;
}
export interface RoundScorecard {
  round: number;
  holes: ScorecardHole[];
  thru: number;
  played: boolean;
}

/**
 * Returns hole-by-hole scorecard for a single player across all rounds available
 * in `sr_scorecards`. Polls every 45s when `opts.live` is true (selected round
 * is the in-progress round); otherwise treats data as static (1h staleTime).
 */
export function useTournamentScorecard(
  tournamentId: string | null | undefined,
  playerId: string | null | undefined,
  opts?: { live?: boolean },
) {
  return useQuery({
    queryKey: ['tournament-scorecard', tournamentId, playerId],
    enabled: !!tournamentId && !!playerId,
    refetchInterval: opts?.live ? 45_000 : false,
    staleTime: opts?.live ? 0 : 1000 * 60 * 60,
    queryFn: async (): Promise<RoundScorecard[]> => {
      if (!tournamentId || !playerId) return [];
      const { data, error } = await (supabase as any)
        .from('sr_scorecards')
        .select('round_number, hole_number, strokes, par, score_to_par')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
        .order('round_number', { ascending: true })
        .order('hole_number', { ascending: true });
      if (error || !data) return [];

      const byRound = new Map<number, ScorecardHole[]>();
      for (const r of data as any[]) {
        if (!byRound.has(r.round_number)) byRound.set(r.round_number, []);
        byRound.get(r.round_number)!.push({
          hole: r.hole_number,
          par: r.par,
          strokes: r.strokes,
          scoreToPar: r.score_to_par,
        });
      }

      const rounds: RoundScorecard[] = [];
      for (const [round, holes] of [...byRound.entries()].sort((a, b) => a[0] - b[0])) {
        holes.sort((a, b) => a.hole - b.hole);
        const thru = holes.filter((h) => h.strokes != null).length;
        rounds.push({ round, holes, thru, played: thru > 0 });
      }
      return rounds;
    },
  });
}
