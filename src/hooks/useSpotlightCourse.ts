import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSpotlightCourse() {
  return useQuery({
    queryKey: ['course-season-spotlight'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_trending_courses',
        { p_days_back: 30, p_limit: 1 }
      );
      if (error) throw error;
      return (data?.[0] ?? null) as {
        course_id: string;
        course_name: string;
        thumbnail_image: string | null;
        country: string | null;
        sub_country: string | null;
        trending_score: number;
        post_count: number;
        review_count: number;
        global_rank: number | null;
      } | null;
    },
    staleTime: 10 * 60 * 1000,
  });
}
