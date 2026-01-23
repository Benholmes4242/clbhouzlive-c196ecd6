import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { HandicapImprovementEntry, LeaderboardScope } from '@/types/leaderboards';

interface UseHandicapImprovementLeaderboardOptions {
  days?: number;
  scope?: LeaderboardScope;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useHandicapImprovementLeaderboard(options: UseHandicapImprovementLeaderboardOptions = {}) {
  const { user } = useSupabaseSession();
  const { 
    days = 30,
    scope = 'global', 
    limit = 100, 
    offset = 0, 
    enabled = true 
  } = options;

  return useQuery({
    queryKey: ['handicap-improvement-leaderboard', days, scope, limit, offset, user?.id],
    queryFn: async (): Promise<HandicapImprovementEntry[]> => {
      const { data, error } = await supabase.rpc('get_handicap_improvement_leaderboard', {
        p_days: days,
        p_scope: scope,
        p_limit: limit,
        p_offset: offset,
        p_current_user_id: user?.id ?? null,
      });

      if (error) {
        console.error('Error fetching handicap improvement leaderboard:', error);
        throw error;
      }

      return (data ?? []) as HandicapImprovementEntry[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
