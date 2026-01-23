import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { SeasonImprovementEntry, LeaderboardScope } from '@/types/leaderboards';

interface UseSeasonImprovementLeaderboardOptions {
  seasonId?: string | null;
  scope?: LeaderboardScope;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useSeasonImprovementLeaderboard(options: UseSeasonImprovementLeaderboardOptions = {}) {
  const { user } = useSupabaseSession();
  const { 
    seasonId = null,
    scope = 'global', 
    limit = 100, 
    offset = 0, 
    enabled = true 
  } = options;

  return useQuery({
    queryKey: ['season-improvement-leaderboard', seasonId, scope, limit, offset, user?.id],
    queryFn: async (): Promise<SeasonImprovementEntry[]> => {
      const { data, error } = await supabase.rpc('get_season_improvement_leaderboard', {
        p_season_id: seasonId,
        p_scope: scope,
        p_limit: limit,
        p_offset: offset,
        p_current_user_id: user?.id ?? null,
      });

      if (error) {
        console.error('Error fetching season improvement leaderboard:', error);
        throw error;
      }

      return (data ?? []) as SeasonImprovementEntry[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
