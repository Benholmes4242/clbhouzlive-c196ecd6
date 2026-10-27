/**
 * useCourseBandAverage — the average gross score at one course for golfers
 * off the viewer's handicap, backing the "Before you go" sheet's band
 * sentence. The RPC already exists in the database; this hook is its only
 * reader. Enabled only when BOTH the course and the viewer's index are set,
 * so a member without an index never fires it.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseBandAverage {
  rounds: number;
  golfers: number;
  avg_gross: number;
}

export function useCourseBandAverage(
  courseId: string | undefined,
  index: number | null | undefined,
) {
  return useQuery<CourseBandAverage | null>({
    queryKey: ['course-band-average', courseId, index],
    enabled: Boolean(courseId) && index != null && Number.isFinite(index),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_band_average', {
        p_course_id: courseId as string,
        p_index: index as number,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as CourseBandAverage | null) ?? null;
    },
  });
}
