/**
 * useTourSeasonRankings — Fetches Race to Dubai (or other tour) season rankings
 * from the tour_season_rankings table.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TourSeasonRanking {
  id: string;
  player_id: string | null;
  player_name: string;
  tour_code: string;
  season_year: number;
  position: number;
  position_change: string | null;
  points: number | null;
  tournaments_played: number | null;
  wins: number | null;
  country: string | null;
  manual_player_id: string | null;
  scraped_at: string;
}

export function useTourSeasonRankings(tourCode: string, seasonYear: number) {
  return useQuery({
    queryKey: ['tour-season-rankings', tourCode, seasonYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tour_season_rankings' as any)
        .select('*')
        .eq('tour_code', tourCode)
        .eq('season_year', seasonYear)
        .order('position', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TourSeasonRanking[];
    },
    enabled: !!tourCode && tourCode !== 'all' && tourCode !== 'pga' && tourCode !== '',
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
