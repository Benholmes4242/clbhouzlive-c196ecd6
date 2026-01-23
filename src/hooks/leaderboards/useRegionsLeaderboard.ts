import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { RegionsLeaderboardEntry, LeaderboardScope } from '@/types/leaderboards';

interface UseRegionsLeaderboardOptions {
  scope?: LeaderboardScope;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useRegionsLeaderboard(options: UseRegionsLeaderboardOptions = {}) {
  const { user } = useSupabaseSession();
  const { 
    scope = 'global', 
    limit = 100, 
    offset = 0, 
    enabled = true 
  } = options;

  return useQuery({
    queryKey: ['regions-leaderboard', scope, limit, offset, user?.id],
    queryFn: async (): Promise<RegionsLeaderboardEntry[]> => {
      const { data, error } = await supabase.rpc('get_regions_leaderboard', {
        p_scope: scope,
        p_limit: limit,
        p_offset: offset,
        p_current_user_id: user?.id ?? null,
      });

      if (error) {
        console.error('Error fetching regions leaderboard:', error);
        throw error;
      }

      return (data ?? []) as RegionsLeaderboardEntry[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
