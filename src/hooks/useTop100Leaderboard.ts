import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LeaderboardScope = 'worldwide' | 'global-top-100' | 'gb-i-top-100' | 'usa-top-100' | 'europe-top-100';
export type LeaderboardTimeRange = 'all_time' | 'this_year' | 'this_month';

export type UseTop100LeaderboardArgs = {
  scope: LeaderboardScope;
  timeRange: LeaderboardTimeRange;
  pageSize?: number;
};

export type Top100LeaderboardEntry = {
  user_id: string;
  rank: number;
  display_name: string;
  avatar_url: string | null;
  home_club: string | null;
  country: string | null;
  total_top100_played: number;
  lists_completed: string[];
  milestone_label: string | null;
};

export type Top100LeaderboardResponse = {
  entries: Top100LeaderboardEntry[];
  total_count: number;
  current_user_entry: Top100LeaderboardEntry | null;
};

export function useTop100Leaderboard(args: UseTop100LeaderboardArgs) {
  const { scope, timeRange, pageSize = 20 } = args;

  return useInfiniteQuery({
    queryKey: ['top100-leaderboard', scope, timeRange],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Top100LeaderboardResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;

      const { data, error } = await supabase.rpc('get_top100_leaderboard', {
        scope_param: scope,
        time_range_param: timeRange,
        limit_param: pageSize,
        offset_param: pageParam * pageSize,
        current_user_id: currentUserId,
      });

      if (error) throw error;

      const parsed = data as {
        entries: any[];
        total_count: number;
        current_user_entry: any | null;
      };

      return {
        entries: (parsed.entries || []).map(e => ({
          user_id: e.user_id,
          rank: e.rank,
          display_name: e.display_name || 'Anonymous',
          avatar_url: e.avatar_url || null,
          home_club: e.home_club || null,
          country: null,
          total_top100_played: e.total_top100_played,
          lists_completed: [],
          milestone_label: e.milestone_label || null,
        })),
        total_count: parsed.total_count || 0,
        current_user_entry: parsed.current_user_entry ? {
          user_id: parsed.current_user_entry.user_id,
          rank: parsed.current_user_entry.rank,
          display_name: parsed.current_user_entry.display_name || 'Anonymous',
          avatar_url: parsed.current_user_entry.avatar_url || null,
          home_club: parsed.current_user_entry.home_club || null,
          country: null,
          total_top100_played: parsed.current_user_entry.total_top100_played,
          lists_completed: [],
          milestone_label: parsed.current_user_entry.milestone_label || null,
        } : null,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.entries.length, 0);
      return loadedCount < lastPage.total_count ? allPages.length : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
}
