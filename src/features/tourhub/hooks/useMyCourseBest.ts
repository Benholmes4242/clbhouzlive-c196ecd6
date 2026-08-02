/**
 * useMyCourseBest — the signed-in member's best 18-hole gross at a course.
 *
 * Backed by get_my_course_best(p_course_id uuid), which returns NO ROW when
 * the member has never played there (HAVING COUNT(*) > 0), so consumers can
 * self-hide on a null result without extra guards.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MyCourseBest {
  best_gross: number | null;
  best_to_par: number | null;
  rounds_here: number | null;
  last_played: string | null;
}

export function useMyCourseBest(courseId: string | null | undefined) {
  return useQuery<MyCourseBest | null>({
    queryKey: ['my-course-best', courseId],
    enabled: !!courseId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_course_best' as never, {
        p_course_id: courseId as string,
      } as never);
      // Signed out / no row / RPC failure all resolve to "no cell".
      if (error) return null;
      const payload = (data ?? null) as unknown;
      const row = Array.isArray(payload) ? payload[0] : payload;
      return (row as MyCourseBest | undefined) ?? null;
    },
  });
}
