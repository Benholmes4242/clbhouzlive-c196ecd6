import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardScope, LeaderboardTimeRange } from './useTop100Leaderboard';

export type CourseSortType = 'most_played' | 'highest_rated' | 'rising';

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
  country?: string | null;
};

type CourseLeaderboardPage = {
  entries: CourseLeaderboardEntry[];
};

export function useTop100CourseLeaderboard(args: UseTop100CourseLeaderboardArgs = {}) {
  const { 
    scope = 'worldwide', 
    timeRange = 'all_time',
    sort = 'most_played',
    pageSize = 20,
    country = null
  } = args;

  return useInfiniteQuery<CourseLeaderboardPage>({
    queryKey: ['top100-course-leaderboard', scope, timeRange, sort, country],
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }): Promise<CourseLeaderboardPage> => {
      // Get current user ID for personalized fields
      const { data: { user } } = await supabase.auth.getUser();

      // Use the 7-parameter RPC signature with sort_param, current_user_id, and p_country
      const { data, error } = await supabase.rpc('get_top100_course_leaderboard', {
        scope_param: scope,
        time_range_param: timeRange,
        sort_param: sort,
        limit_param: pageSize,
        offset_param: (pageParam as number) * pageSize,
        current_user_id: user?.id ?? null,
        p_country: scope === 'country' ? country : null,
      });

      if (error) throw error;

      // Map the RPC return data - including user-specific fields from the database
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
        unique_players?: number;
        rank?: number;
        previous_rank?: number | null;
        rank_change?: number;
        is_trending?: boolean;
        is_hall_of_fame?: boolean;
        season_wins?: number;
        prestige_tags?: string[];
        current_user_played?: boolean;
        current_user_rating?: number | null;
        current_user_play_count?: number;
      }>;

      // Filter out courses with no plays AND no rating
      const filteredRows = rows.filter(row => 
        row.times_played > 0 || row.avg_rating !== null
      );

      return {
        entries: filteredRows.map((row, index) => ({
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
          // Map enhanced fields from RPC or provide defaults
          unique_players: row.unique_players ?? row.times_played,
          rank: row.rank ?? ((pageParam as number) * pageSize + index + 1),
          previous_rank: row.previous_rank ?? null,
          rank_change: row.rank_change ?? 0,
          is_trending: row.is_trending ?? false,
          is_hall_of_fame: row.is_hall_of_fame ?? false,
          season_wins: row.season_wins ?? 0,
          prestige_tags: row.prestige_tags ?? [],
          // User-specific fields from the database
          current_user_played: row.current_user_played ?? false,
          current_user_rating: row.current_user_rating ?? null,
          current_user_play_count: row.current_user_play_count ?? 0,
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
