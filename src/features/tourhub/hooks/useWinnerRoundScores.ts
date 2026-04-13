import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WinnerRoundScores {
  round_1: number | null;
  round_2: number | null;
  round_3: number | null;
  round_4: number | null;
}

export function useWinnerRoundScores(
  tournamentId: string | undefined,
  playerId: string | undefined
) {
  return useQuery({
    queryKey: ['winner-round-scores', tournamentId, playerId],
    queryFn: async (): Promise<WinnerRoundScores | null> => {
      if (!tournamentId || !playerId) return null;

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select('round_1, round_2, round_3, round_4')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        round_1: data.round_1,
        round_2: data.round_2,
        round_3: data.round_3,
        round_4: data.round_4,
      };
    },
    enabled: !!tournamentId && !!playerId,
    staleTime: 60_000,
  });
}
