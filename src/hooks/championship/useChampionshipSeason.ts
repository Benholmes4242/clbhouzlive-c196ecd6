import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ChampionshipSeason } from '@/types/championship';

export function useChampionshipSeason() {
  return useQuery({
    queryKey: ['championship-season'],
    queryFn: async (): Promise<ChampionshipSeason | null> => {
      const { data, error } = await supabase.rpc('get_active_season');

      if (error) throw error;
      
      // RPC returns an array, take the first item
      const seasons = data as Array<{
        days_remaining: number;
        end_date: string;
        id: string;
        name: string;
        season_number: number;
        start_date: string;
      }>;
      
      if (!seasons || seasons.length === 0) return null;
      
      const season = seasons[0];

      return {
        id: season.id,
        name: season.name,
        season_number: season.season_number,
        start_date: season.start_date,
        end_date: season.end_date,
        status: 'active', // get_active_season only returns active seasons
        days_remaining: season.days_remaining,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
