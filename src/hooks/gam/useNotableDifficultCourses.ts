import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DifficultCourse {
  course_id: string;
  course_name: string;
  course_region: string | null;
  course_country: string | null;
  avg_over_par: number;
  hardest_hole_no: number | null;
  hardest_hole_par: number | null;
  hardest_hole_si: number | null;
  hardest_avg_to_par: number | null;
  total_rounds: number;
  thumbnail_image: string | null;
}

export type CourseIndexMode = 'toughest' | 'friendliest';

/**
 * Reads the precomputed 'toughest_courses' / 'friendliest_courses' rail from
 * discover_rail_cache. Refreshed daily by cron. In the 'friendliest' payload
 * the hardest_hole_* fields carry the most scoreable hole (signature flips).
 */
export function useNotableDifficultCourses(mode: CourseIndexMode = 'toughest') {
  const railKey = mode === 'friendliest' ? 'friendliest_courses' : 'toughest_courses';
  return useQuery<DifficultCourse[]>({
    queryKey: ['gam', 'course-index-cache', railKey],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', railKey)
        .maybeSingle();
      if (error) throw error;
      return (data?.payload ?? []) as unknown as DifficultCourse[];
    },
  });
}
