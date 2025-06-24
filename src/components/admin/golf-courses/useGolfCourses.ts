
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GolfCourse } from './types';

export const useGolfCourses = () => {
  return useQuery({
    queryKey: ['admin-golf-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .order('global_rank', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as GolfCourse[];
    },
  });
};
