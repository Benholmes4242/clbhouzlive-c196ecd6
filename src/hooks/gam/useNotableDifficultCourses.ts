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

/**
 * Editorial / global shelf: courses ranked by how far over par they actually play,
 * gated on a credible round sample. No personalisation.
 * Reads from the precomputed discover_rail_cache table.
 */
export function useNotableDifficultCourses() {
  return useQuery<DifficultCourse[]>({
    queryKey: ['gam', 'toughest-courses-cache'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', 'toughest_courses')
        .maybeSingle();
      if (error) throw error;
      return (data?.payload ?? []) as DifficultCourse[];
    },
  });
}
