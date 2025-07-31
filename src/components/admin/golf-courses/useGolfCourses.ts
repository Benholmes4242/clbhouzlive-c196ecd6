
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { GolfCourse } from './types';

export const useGolfCourses = () => {
  return useOptimizedQuery({
    queryKey: ['admin-golf-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as GolfCourse[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for admin data
    dedupe: true,
  });
};
