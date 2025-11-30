import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardScope, LeaderboardTimeRange } from './useTop100Leaderboard';

export type CourseLeaderboardEntry = {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_url: string | null;
  list_slug: LeaderboardScope | string;
  times_played: number;
  avg_rating: number | null;
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
};

type UseTop100CourseLeaderboardArgs = {
  scope: LeaderboardScope;
  timeRange: LeaderboardTimeRange;
  pageSize?: number;
};

type CourseLeaderboardPage = {
  entries: CourseLeaderboardEntry[];
};

export function useTop100CourseLeaderboard(args: UseTop100CourseLeaderboardArgs) {
  const { scope, timeRange, pageSize = 20 } = args;

  return useInfiniteQuery<CourseLeaderboardPage>({
    queryKey: ['top100-course-leaderboard', scope, timeRange],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<CourseLeaderboardPage> => {
      const { data, error } = await supabase.rpc('get_top100_course_leaderboard', {
        scope_param: scope,
        time_range_param: timeRange,
        limit_param: pageSize,
        offset_param: (pageParam as number) * pageSize,
      });

      if (error) throw error;

      const rows = (data || []) as CourseLeaderboardRpcRow[];

      return {
        entries: rows.map((row) => ({
          course_id: row.course_id,
          course_name: row.course_name,
          country: row.country,
          sub_country: row.sub_country,
          thumbnail_url: row.thumbnail_url,
          list_slug: row.list_slug,
          times_played: row.times_played,
          avg_rating: row.avg_rating,
        })),
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer than pageSize on the last fetch, assume we've hit the end
      return lastPage.entries.length < pageSize ? undefined : allPages.length;
    },
    staleTime: 2 * 60 * 1000,
  });
}
