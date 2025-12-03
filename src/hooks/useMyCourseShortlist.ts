import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMyCourseShortlist() {
  return useQuery({
    queryKey: ['my-course-shortlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_shortlists')
        .select('course_id');

      if (error) throw error;

      return new Set<string>((data ?? []).map((row) => row.course_id));
    },
    staleTime: 2 * 60 * 1000,
  });
}
