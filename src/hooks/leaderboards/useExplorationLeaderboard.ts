import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { ExplorationLeaderboardEntry, LeaderboardScope, ExplorationMetric } from '@/types/leaderboards';

interface UseExplorationLeaderboardOptions {
  scope?: LeaderboardScope;
  metric?: ExplorationMetric;
  clubId?: string | null;
  country?: string | null;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useExplorationLeaderboard(options: UseExplorationLeaderboardOptions = {}) {
  const { user } = useSupabaseSession();
  const { 
    scope = 'global', 
    metric = 'countries',
    clubId = null,
    country = null,
    limit = 100, 
    offset = 0, 
    enabled = true 
  } = options;

  return useQuery({
    queryKey: ['exploration-leaderboard', scope, metric, clubId, country, limit, offset, user?.id],
    queryFn: async (): Promise<ExplorationLeaderboardEntry[]> => {
      // Use type assertion as the RPC types haven't synced yet
      const { data, error } = await (supabase.rpc as any)('get_exploration_leaderboard', {
        p_scope: scope,
        p_current_user_id: user?.id ?? null,
        p_club_id: clubId ?? null,
        p_limit: limit,
        p_offset: offset,
        p_country: scope === 'country' ? country : null,
      });

      if (error) {
        console.error('Error fetching exploration leaderboard:', error);
        throw error;
      }

      // Transform the data to include is_current_user
      return ((data ?? []) as unknown as ExplorationLeaderboardEntry[]).map(entry => ({
        ...entry,
        is_current_user: entry.user_id === user?.id,
      }));
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData, // Smooth transitions when filters change
  });
}
