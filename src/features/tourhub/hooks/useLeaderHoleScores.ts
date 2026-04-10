import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderHoleScore {
  holeNumber: number;
  scoreToPar: number;
  strokes: number;
}

export function useLeaderHoleScores(
  tournamentId: string | null | undefined,
  playerId: string | null | undefined,
  currentRound: number | null | undefined,
) {
  return useQuery({
    queryKey: ['leader-hole-scores', tournamentId, playerId, currentRound],
    queryFn: async (): Promise<LeaderHoleScore[]> => {
      if (!tournamentId || !playerId || !currentRound) return [];

      const { data, error } = await supabase
        .from('sr_scorecards')
        .select('hole_number, score_to_par, strokes')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
        .eq('round_number', currentRound)
        .gt('strokes', 0)
        .gte('hole_number', 1)
        .order('hole_number', { ascending: true });

      if (error || !data) return [];

      return data
        .filter(r => r.hole_number >= 1 && r.hole_number <= 18)
        .map(r => ({
          holeNumber: r.hole_number,
          scoreToPar: r.score_to_par ?? 0,
          strokes: r.strokes ?? 0,
        }));
    },
    enabled: !!tournamentId && !!playerId && !!currentRound,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
