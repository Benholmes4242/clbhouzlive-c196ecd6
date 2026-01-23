import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { RegionsLeaderboardEntry, LeaderboardScope } from '@/types/leaderboards';

interface UseRegionsLeaderboardOptions {
  scope?: LeaderboardScope;
  regionType?: 'all' | 'continent' | 'country' | 'state';
  parentRegion?: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useRegionsLeaderboard(options: UseRegionsLeaderboardOptions = {}) {
  const { user } = useSupabaseSession();
  const { 
    scope = 'global', 
    regionType = 'all',
    parentRegion = null,
    limit = 100, 
    offset = 0, 
    enabled = true 
  } = options;

  return useQuery({
    queryKey: ['regions-leaderboard', scope, regionType, parentRegion, limit, offset, user?.id],
    queryFn: async (): Promise<RegionsLeaderboardEntry[]> => {
      const { data, error } = await supabase.rpc('get_regions_leaderboard', {
        p_scope: scope,
        p_region_type: regionType,
        p_parent_region: parentRegion,
        p_current_user_id: user?.id ?? null,
        p_limit: limit,
        p_offset: offset,
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
