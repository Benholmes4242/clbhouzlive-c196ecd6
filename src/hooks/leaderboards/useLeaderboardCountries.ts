import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CountryOption {
  country_code: string;
  country_name: string;
  user_count: number;
}

export function useLeaderboardCountries(enabled: boolean = true) {
  return useQuery({
    queryKey: ['leaderboard-countries'],
    queryFn: async (): Promise<CountryOption[]> => {
      const { data, error } = await supabase.rpc('get_leaderboard_countries');
      
      if (error) {
        console.error('Error fetching leaderboard countries:', error);
        throw error;
      }
      
      return (data ?? []) as CountryOption[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
