import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { CountriesLeaderboardEntry, LeaderboardScope } from '@/types/leaderboards';

interface UseCountriesLeaderboardOptions {
  scope?: LeaderboardScope;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useCountriesLeaderboard(options: UseCountriesLeaderboardOptions = {}) {
  const { user } = useSupabaseSession();
  const { scope = 'global', limit = 100, offset = 0, enabled = true } = options;

  return useQuery({
    queryKey: ['countries-leaderboard', scope, limit, offset, user?.id],
    queryFn: async (): Promise<CountriesLeaderboardEntry[]> => {
      const { data, error } = await supabase.rpc('get_countries_leaderboard', {
        p_scope: scope,
        p_limit: limit,
        p_offset: offset,
        p_current_user_id: user?.id ?? null,
      });

      if (error) {
        console.error('Error fetching countries leaderboard:', error);
        throw error;
      }

      return (data ?? []) as unknown as CountriesLeaderboardEntry[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
