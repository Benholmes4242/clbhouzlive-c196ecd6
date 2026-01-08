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
  is_friend: boolean;
};

export type Top100LeaderboardResponse = {
  entries: Top100LeaderboardEntry[];
  total_count: number;
  current_user_entry: Top100LeaderboardEntry | null;
};

// Internal RPC types - flat array returned from RPC
type LeaderboardRpcRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  profile_photo_url: string | null;
  home_club: string | null;
  primary_club_id: string | null;
  top100_courses_played: number;
  global_rank: number;
  regional_rank: number;
  is_friend: boolean;
  last_activity: string | null;
};

export function useTop100Leaderboard(args: UseTop100LeaderboardArgs) {
  const { scope, timeRange, pageSize = 20 } = args;

  return useInfiniteQuery({
    queryKey: ['top100-leaderboard', scope, timeRange],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Top100LeaderboardResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;

      // Map frontend scope to RPC scope
      const scopeMap: Record<LeaderboardScope, string> = {
        'worldwide': 'worldwide',
        'global-top-100': 'worldwide',
        'gb-i-top-100': 'gbi',
        'usa-top-100': 'usa',
        'europe-top-100': 'europe',
      };

      const { data, error } = await supabase.rpc('get_top100_leaderboard', {
        scope_param: scopeMap[scope] || 'worldwide',
        time_range_param: timeRange,
        limit_param: pageSize,
        offset_param: (pageParam as number) * pageSize,
        current_user_id: currentUserId,
      });

      if (error) throw error;

      const rows = (data || []) as LeaderboardRpcRow[];

      const entries: Top100LeaderboardEntry[] = rows.map((row, index): Top100LeaderboardEntry => ({
        user_id: row.user_id,
        rank: row.global_rank || ((pageParam as number) * pageSize + index + 1),
        display_name: row.display_name || row.username || 'Anonymous',
        avatar_url: row.profile_photo_url || null,
        home_club: row.home_club || null,
        country: null,
        total_top100_played: row.top100_courses_played,
        lists_completed: [],
        milestone_label: null,
        is_friend: row.is_friend ?? false,
      }));

      // Find current user entry
      const currentUserEntry = currentUserId 
        ? entries.find(e => e.user_id === currentUserId) || null
        : null;

      return {
        entries,
        total_count: entries.length > 0 ? entries.length + (pageParam as number) * pageSize : 0,
        current_user_entry: currentUserEntry,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer than pageSize, we've reached the end
      const loadedCount = allPages.reduce((sum, page) => sum + page.entries.length, 0);
      return lastPage.entries.length < pageSize ? undefined : allPages.length;
    },
    staleTime: 2 * 60 * 1000,
  });
}
