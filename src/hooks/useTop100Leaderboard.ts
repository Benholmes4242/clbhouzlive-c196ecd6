import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LeaderboardScope = 'worldwide' | 'global-top-100' | 'gb-i-top-100' | 'usa-top-100' | 'europe-top-100';
export type LeaderboardTimeRange = 'all_time' | 'this_year' | 'this_month';

export type UseTop100LeaderboardArgs = {
  scope: LeaderboardScope;
  timeRange: LeaderboardTimeRange;
  page?: number;
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
  page: number;
  page_size: number;
  current_user_entry: Top100LeaderboardEntry | null;
};

function getMilestoneLabel(count: number): string | null {
  if (count >= 100) return '100 Century Club';
  if (count >= 50) return '50 Club';
  if (count >= 20) return '20 Club';
  return null;
}

export function useTop100Leaderboard(args: UseTop100LeaderboardArgs) {
  const { scope, timeRange, page = 0, pageSize = 20 } = args;

  return useQuery({
    queryKey: ['top100-leaderboard', scope, timeRange, page, pageSize],
    queryFn: async (): Promise<Top100LeaderboardResponse> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;

      // Call server-side RPC for leaderboard aggregation
      const { data, error } = await supabase.rpc('get_top100_leaderboard', {
        scope_param: scope,
        time_range_param: timeRange,
        limit_param: pageSize,
        offset_param: page * pageSize,
        current_user_id: currentUserId,
      });

      if (error) throw error;

      // Parse the JSONB response
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
          lists_completed: [], // Can be extended later
          milestone_label: e.milestone_label || null,
        })),
        total_count: parsed.total_count || 0,
        page,
        page_size: pageSize,
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
    staleTime: 2 * 60 * 1000, // 2 minutes for feed-style data
  });
}
