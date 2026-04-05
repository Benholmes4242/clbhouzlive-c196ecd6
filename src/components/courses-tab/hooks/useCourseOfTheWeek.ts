import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseOfTheWeek {
  course_id: string;
  course_name: string;
  country: string;
  sub_country: string | null;
  thumbnail_image: string;
  description: string | null;
  global_rank: number | null;
  avg_rating: number | null;
  review_count: number;
  week_label: string;
}

export function useCourseOfTheWeek() {
  return useQuery({
    queryKey: ['course-of-the-week'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_of_the_week' as any);
      if (error || !data || (data as any[]).length === 0) return null;
      return (data as any[])[0] as CourseOfTheWeek;
    },
    staleTime: 60 * 60 * 1000,
  });
}
