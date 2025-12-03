import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseMover {
  course_id: string;
  course_name: string;
  country: string;
  sub_country: string | null;
  thumbnail_url: string | null;
  list_slug: string;
  rating_delta: number;
  plays_delta: number;
}

export function useTop100CourseMovers(scope: string, timeRange: string) {
  return useQuery({
    queryKey: ['top100-course-movers', scope, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top100_course_movers', {
        scope_param: scope,
        time_range_param: timeRange,
        limit_param: 10,
      });

      if (error) throw error;
      return (data ?? []) as CourseMover[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
