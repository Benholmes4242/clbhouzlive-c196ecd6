import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { ExplorationLeaderboardEntry, LeaderboardScope, ExplorationMetric } from '@/types/leaderboards';

const PAGE_SIZE = 50;

interface UseExplorationLeaderboardOptions {
  scope?: LeaderboardScope;
  metric?: ExplorationMetric;
  clubId?: string | null;
  country?: string | null;
  enabled?: boolean;
}

export function useExplorationLeaderboard(options: UseExplorationLeaderboardOptions = {}) {
  const { user } = useSupabaseSession();
  const { 
    scope = 'global', 
    metric = 'countries',
    clubId = null,
    country = null,
    enabled = true 
  } = options;

  return useInfiniteQuery({
    queryKey: ['exploration-leaderboard', scope, metric, clubId, country, user?.id],
    queryFn: async ({ pageParam = 0 }): Promise<{ entries: ExplorationLeaderboardEntry[] }> => {
      const { data, error } = await (supabase.rpc as any)('get_exploration_leaderboard', {
        p_scope: scope,
        p_metric: metric,
        p_current_user_id: user?.id ?? null,
        p_club_id: clubId ?? null,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
        p_country: scope === 'country' ? country : null,
      });

      if (error) {
        console.error('Error fetching exploration leaderboard:', error);
        throw error;
      }

      const entries = ((data ?? []) as unknown as ExplorationLeaderboardEntry[]).map(entry => ({
        ...entry,
        is_current_user: entry.user_id === user?.id,
      }));

      return { entries };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.entries.length < PAGE_SIZE) return undefined;
      const totalLoaded = allPages.reduce((sum, p) => sum + p.entries.length, 0);
      return totalLoaded;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });
}
