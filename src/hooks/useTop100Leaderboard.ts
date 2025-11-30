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
  country_code?: string | null;
  prestige_ring?: string | null;
  total_top100_played: number;
  lists_completed: string[];
  milestone_label: string | null;
  is_current_user?: boolean;
};

export type Top100LeaderboardResponse = {
  entries: Top100LeaderboardEntry[];
  total_count: number;
  current_user_entry: Top100LeaderboardEntry | null;
};

// Internal RPC types
type LeaderboardRpcEntry = {
  user_id: string;
  rank: number;
  display_name: string | null;
  avatar_url: string | null;
  home_club: string | null;
  total_top100_played: number;
  milestone_label: string | null;
};

type LeaderboardRpcPayload = {
  // IMPORTANT:
  // - total_count and current_user_entry are for the FULL dataset
  //   (not just this page of entries).
  // - entries is the paginated slice.
  entries: LeaderboardRpcEntry[];
  total_count: number;
  current_user_entry: LeaderboardRpcEntry | null;
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

      const parsed = data as LeaderboardRpcPayload;

      const mapEntry = (e: LeaderboardRpcEntry): Top100LeaderboardEntry => ({
        user_id: e.user_id,
        rank: e.rank,
        display_name: e.display_name || 'Anonymous',
        avatar_url: e.avatar_url || null,
        home_club: e.home_club || null,
        country: null,
        total_top100_played: e.total_top100_played,
        lists_completed: [],
        milestone_label: e.milestone_label || null,
      });

      return {
        entries: (parsed.entries || []).map(mapEntry),
        total_count: parsed.total_count || 0,
        current_user_entry: parsed.current_user_entry
          ? mapEntry(parsed.current_user_entry)
          : null,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.entries.length, 0);
      return loadedCount < lastPage.total_count ? allPages.length : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
}
