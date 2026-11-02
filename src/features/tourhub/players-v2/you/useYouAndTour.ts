/** Reads for the "You and the tour" card: tour hole averages (6h) and the member's own hole scoring (30m, keyed by user). */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlayersTourId } from '../data/usePlayersRanking';
import type { MyScoring, TourAverages } from './youAndTourRules';

export function useTourHoleAverages(tour: PlayersTourId, season: number | null | undefined) {
  return useQuery<TourAverages | null>({
    queryKey: ['players-v2', 'tour-hole-averages', tour, season],
    enabled: typeof season === 'number',
    staleTime: 6 * 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tour_hole_averages', { p_tour: tour, p_year: season as number });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export function useMyHoleScoring(userId: string | null | undefined) {
  return useQuery<MyScoring | null>({
    queryKey: ['players-v2', 'my-hole-scoring', userId],
    enabled: !!userId,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_hole_scoring', {});
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}
