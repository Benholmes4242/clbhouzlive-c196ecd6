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

type UseCourseLeaderboardArgs = {
  scope?: LeaderboardScope | string;
  timeRange?: LeaderboardTimeRange | 'this_season';
  sort?: CourseSortType;
  pageSize?: number;
  region?: string | null;
  subRegion?: string | null;
  excludeCountries?: string[] | null;
};

type CourseLeaderboardPage = {
  entries: CourseLeaderboardEntry[];
};

/**
 * Hook to fetch ALL courses with reviews (no Top 100 restriction).
 * For Top 100 only courses, use useTop100CourseLeaderboard instead.
 */
export function useCourseLeaderboard(args: UseCourseLeaderboardArgs = {}) {
  const { 
    scope = 'worldwide', 
    timeRange = 'all_time',
    sort = 'most_played',
    pageSize = 20,
    region = null,
    subRegion = null,
    excludeCountries = null,
  } = args;

  return useInfiniteQuery<CourseLeaderboardPage>({
    queryKey: ['course-leaderboard', scope, timeRange, sort, region, subRegion, excludeCountries],
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }): Promise<CourseLeaderboardPage> => {
      // Get current user ID for personalized fields
      const { data: { user } } = await supabase.auth.getUser();

      // Map sort type to RPC sort_by param
      const sortByMap: Record<CourseSortType, string> = {
        'highest_rated': 'rating',
        'most_played': 'most_played',
        'rising': 'trending',
      };

      // Use the new RPC that shows ALL reviewed courses (no Top 100 restriction)
      const { data, error } = await supabase.rpc('get_course_leaderboard', {
        p_sort_by: sortByMap[sort] || 'rating',
        p_sort_order: 'desc',
        p_time_period: timeRange === 'this_season' ? 'year' : timeRange,
        p_current_user_id: user?.id ?? null,
        p_limit: pageSize,
        p_offset: pageParam as number,
        p_country: scope === 'country' ? region : null,
        p_sub_country: scope === 'country' ? subRegion : null,
        p_exclude_countries: excludeCountries ?? undefined,
      });

      if (error) throw error;

      // Map the RPC return data to our entry type
      const rows = (data || []) as Array<{
        course_id: string;
        course_name: string;
        club_name: string | null;
        country: string | null;
        city: string | null;
        region: string | null;
        image_url: string | null;
        avg_rating: number | null;
        rating_count: number;
        total_rounds: number;
        rank: number;
        rank_change: number;
        has_played: boolean;
      }>;

      return {
        entries: rows.map((row, index) => ({
          course_id: row.course_id,
          course_name: row.course_name,
          country: row.country,
          sub_country: row.region,
          thumbnail_url: row.image_url,
          list_slug: scope,
          times_played: row.total_rounds,
          avg_rating: row.avg_rating,
          global_rank: row.rank,
          regional_rank: null,
          usa_rank: null,
          friends_count: 0,
          friends_avg_rating: null,
          shortlisted_count: 0,
          shortlisted_by_me: false,
          unique_players: row.total_rounds,
          rank: row.rank ?? ((pageParam as number) + index + 1),
          previous_rank: null,
          rank_change: row.rank_change ?? 0,
          is_trending: false,
          is_hall_of_fame: false,
          season_wins: 0,
          prestige_tags: [],
          current_user_played: row.has_played ?? false,
          current_user_rating: null,
          current_user_play_count: row.has_played ? 1 : 0,
        })),
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.entries.length < pageSize) return undefined;
      const totalLoaded = allPages.reduce((sum, p) => sum + p.entries.length, 0);
      return totalLoaded;
    },
    staleTime: 60 * 1000,
  });
}
