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
 */
export function useNotableDifficultCourses() {
  return useQuery<DifficultCourse[]>({
    queryKey: ['gam_rpc', 'get_notable_difficult_courses', { p_min_rounds: 30, p_limit: 50 }],
    staleTime: 0,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        'get_notable_difficult_courses',
        { p_min_rounds: 30, p_limit: 50 },
      );
      if (error) throw error;
      const rows = (data ?? []) as Omit<DifficultCourse, 'thumbnail_image'>[];
      if (rows.length === 0) return [];

      // Batch-fetch thumbnails for the returned course ids.
      const ids = rows.map(r => r.course_id);
      const { data: imgs } = await supabase
        .from('golf_courses')
        .select('id, thumbnail_image')
        .in('id', ids);
      const thumbMap = new Map<string, string | null>(
        (imgs ?? []).map((r: { id: string; thumbnail_image: string | null }) => [
          r.id,
          r.thumbnail_image,
        ]),
      );
      return rows.map(r => ({ ...r, thumbnail_image: thumbMap.get(r.course_id) ?? null }));
    },
  });
}
