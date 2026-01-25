import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardScope, LeaderboardTimeRange } from './useTop100Leaderboard';

export type CourseSortType = 'most_played' | 'highest_rated' | 'rising' | 'friends';

export type CourseLeaderboardEntry = {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_url: string | null;
  list_slug: LeaderboardScope | string;
  times_played: number;
  avg_rating: number | null;
  global_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
  friends_count: number;
  friends_avg_rating: number | null;
  shortlisted_count: number;
  shortlisted_by_me: boolean;
  // New fields from enhanced RPC
  unique_players: number;
  rank: number;
  previous_rank: number | null;
  rank_change: number;
  is_trending: boolean;
  is_hall_of_fame: boolean;
  season_wins: number;
  prestige_tags: string[];
  current_user_played: boolean;
  current_user_rating: number | null;
  current_user_play_count: number;
};

type CourseLeaderboardRpcRow = {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_url: string | null;
  list_slug: string;
  times_played: number;
  avg_rating: number | null;
  global_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
  friends_count: number;
  friends_avg_rating: number | null;
  shortlisted_count: number;
  shortlisted_by_me: boolean;
  unique_players: number;
  rank: number;
  previous_rank: number | null;
  rank_change: number;
  is_trending: boolean;
  is_hall_of_fame: boolean;
  season_wins: number;
  prestige_tags: string[];
  current_user_played: boolean;
  current_user_rating: number | null;
  current_user_play_count: number;
};

type UseTop100CourseLeaderboardArgs = {
  scope?: LeaderboardScope | string;
  timeRange?: LeaderboardTimeRange | 'this_season';
  sort?: CourseSortType;
  pageSize?: number;
};

type CourseLeaderboardPage = {
  entries: CourseLeaderboardEntry[];
};

export function useTop100CourseLeaderboard(args: UseTop100CourseLeaderboardArgs = {}) {
  const { 
    scope = 'worldwide', 
    timeRange = 'all_time',
    sort = 'most_played',
    pageSize = 20 
  } = args;

  return useInfiniteQuery<CourseLeaderboardPage>({
    queryKey: ['top100-course-leaderboard', scope, timeRange, sort],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<CourseLeaderboardPage> => {
      // Use the existing RPC signature (no sort_param, no current_user_id)
      // The enhanced version wasn't deployed, so we use the original 4-param signature
      const { data, error } = await supabase.rpc('get_top100_course_leaderboard', {
        scope_param: scope,
        time_range_param: timeRange,
        limit_param: pageSize,
        offset_param: (pageParam as number) * pageSize,
      });

      if (error) throw error;

      // The original RPC returns fewer fields - we'll provide defaults for the new ones
      const rows = (data || []) as Array<{
        course_id: string;
        course_name: string;
        country: string | null;
        sub_country: string | null;
        thumbnail_url: string | null;
        list_slug: string;
        times_played: number;
        avg_rating: number | null;
        global_rank: number | null;
        regional_rank: number | null;
        usa_rank: number | null;
        friends_count: number;
        friends_avg_rating: number | null;
        shortlisted_count: number;
        shortlisted_by_me: boolean;
      }>;

      return {
        entries: rows.map((row, index) => ({
          course_id: row.course_id,
          course_name: row.course_name,
          country: row.country,
          sub_country: row.sub_country,
          thumbnail_url: row.thumbnail_url,
          list_slug: row.list_slug as LeaderboardScope | string,
          times_played: row.times_played,
          avg_rating: row.avg_rating,
          global_rank: row.global_rank ?? null,
          regional_rank: row.regional_rank ?? null,
          usa_rank: row.usa_rank ?? null,
          friends_count: row.friends_count ?? 0,
          friends_avg_rating: row.friends_avg_rating ?? null,
          shortlisted_count: row.shortlisted_count ?? 0,
          shortlisted_by_me: row.shortlisted_by_me ?? false,
          // Default values for enhanced fields (RPC doesn't return these yet)
          unique_players: row.times_played,
          rank: (pageParam as number) * pageSize + index + 1,
          previous_rank: null,
          rank_change: 0,
          is_trending: false,
          is_hall_of_fame: false,
          season_wins: 0,
          prestige_tags: [],
          current_user_played: false,
          current_user_rating: null,
          current_user_play_count: 0,
        })),
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer than pageSize on the last fetch, assume we've hit the end
      return lastPage.entries.length < pageSize ? undefined : allPages.length;
    },
    staleTime: 60 * 1000, // 1 min for more responsive updates
  });
}
