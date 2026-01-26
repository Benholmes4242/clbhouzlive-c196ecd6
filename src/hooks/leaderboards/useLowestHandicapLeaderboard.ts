import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { LowestHandicapEntry, LeaderboardScope } from '@/types/leaderboards';

interface UseLowestHandicapLeaderboardOptions {
  scope?: LeaderboardScope;
  clubId?: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useLowestHandicapLeaderboard(options: UseLowestHandicapLeaderboardOptions = {}) {
  const { user } = useSupabaseSession();
  const { 
    scope = 'global', 
    clubId = null,
    limit = 100, 
    offset = 0, 
    enabled = true 
  } = options;

  return useQuery({
    queryKey: ['lowest-handicap-leaderboard', scope, clubId, limit, offset, user?.id],
    queryFn: async (): Promise<LowestHandicapEntry[]> => {
      const { data, error } = await supabase.rpc('get_lowest_handicap_leaderboard', {
        p_scope: scope,
        p_club_id: clubId ?? null,
        p_limit: limit,
        p_offset: offset,
        p_current_user_id: user?.id ?? null,
      });

      if (error) {
        console.error('Error fetching lowest handicap leaderboard:', error);
        throw error;
      }

      return (data ?? []) as unknown as LowestHandicapEntry[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
