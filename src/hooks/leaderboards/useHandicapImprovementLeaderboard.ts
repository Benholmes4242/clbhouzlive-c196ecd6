import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { HandicapImprovementEntry, LeaderboardScope } from '@/types/leaderboards';

interface UseHandicapImprovementLeaderboardOptions {
  days?: number; // kept for queryKey but not passed to RPC (RPC uses 30 days internally)
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
      // Only pass the 4 parameters the RPC expects
      const { data, error } = await supabase.rpc('get_handicap_improvement_leaderboard', {
        p_scope: scope,
        p_limit: limit,
        p_offset: offset,
        p_current_user_id: user?.id ?? null,
      });

      if (error) {
        console.error('Error fetching handicap improvement leaderboard:', error);
        throw error;
      }

      return (data ?? []) as unknown as HandicapImprovementEntry[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
