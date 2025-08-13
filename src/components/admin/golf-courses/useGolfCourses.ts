
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { GolfCourse } from './types';

export const useGolfCourses = () => {
  return useOptimizedQuery({
    queryKey: ['admin-golf-courses'],
    queryFn: async () => {
      console.log('Admin: Loading golf courses...');
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .order('name', { ascending: true })
        .limit(10000); // Set high limit to get all courses

      console.log('Admin: Loaded', data?.length, 'courses');
      if (data?.length) {
        console.log('Admin: First course:', data[0].name);
        console.log('Admin: Last course:', data[data.length - 1].name);
      }

      if (error) throw error;
      return data as GolfCourse[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for admin data
    dedupe: true,
  });
};
