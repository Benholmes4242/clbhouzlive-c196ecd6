import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseTopTenStanding } from './courseTopTenRules';

/** Server-resolved public tens only; private and restricted tens never enter this read. */
export function useCourseTopTenStanding(courseId: string) {
  return useQuery({
    queryKey: ['course-top-ten-standing', courseId],
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(courseId),
    queryFn: async (): Promise<CourseTopTenStanding | null> => {
      const { data, error } = await supabase.rpc('get_course_top_ten_standing', { p_course: courseId });
      if (error) throw error;
      return data as unknown as CourseTopTenStanding | null;
    },
  });
}
