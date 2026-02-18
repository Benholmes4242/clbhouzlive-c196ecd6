import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WinnerSeasonStats {
  drivingDistance: number | null;
  drivingAccuracy: number | null;
  greensInReg: number | null;
  puttingAverage: number | null;
}

export function useWinnerSeasonStats(playerId: string | undefined) {
  return useQuery({
    queryKey: ['winner-season-stats', playerId],
    queryFn: async (): Promise<WinnerSeasonStats | null> => {
      if (!playerId) return null;

      const { data, error } = await supabase
        .from('sr_player_statistics')
        .select('driving_distance, driving_accuracy, greens_in_reg, putting_average, season_id')
        .eq('player_id', playerId)
        .order('season_id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        drivingDistance: data.driving_distance,
        drivingAccuracy: data.driving_accuracy,
        greensInReg: data.greens_in_reg,
        puttingAverage: data.putting_average,
      };
    },
    enabled: !!playerId,
    staleTime: 60_000,
  });
}
