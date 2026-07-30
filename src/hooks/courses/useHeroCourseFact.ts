import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useHeroCourseFact
 * -----------------
 * One line of true, course-specific data for the Courses hero.
 *
 * get_hero_course_fact returns AT MOST ONE ROW and enforces every gate
 * server-side: 3+ distinct players for any fact, a display name for the
 * best-round line, and a +0.5 floor on hardest hole. None of that is
 * re-implemented or relaxed here.
 *
 * Fires only once the hero has resolved a course_id, so it never blocks
 * first paint. Cache matches the hero exactly (6h, no refetch) so the
 * line does not swap out from under the reader.
 */

export type HeroFactKind = 'course_record' | 'hardest_hole' | 'over_par';

export interface HeroCourseFactRow {
  fact_kind: HeroFactKind;
  rounds_tracked: number;
  player_count: number;
  record_gross: number | null;
  record_holder: string | null;
  hole_no: number | null;
  hole_par: number | null;
  hole_over: number | null;
  hole_plays: number | null;
  avg_over_par: number | null;
}

export function useHeroCourseFact(courseId: string | undefined) {
  return useQuery({
    queryKey: ['hero-course-fact', courseId],
    enabled: !!courseId,
    staleTime: 6 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    gcTime: 15 * 60 * 1000,
    queryFn: async (): Promise<HeroCourseFactRow | null> => {
      const { data, error } = await supabase.rpc('get_hero_course_fact', {
        p_course_id: courseId!,
      });
      if (error) {
        console.error('[useHeroCourseFact] RPC error:', error);
        if (import.meta.env.DEV) throw error;
        return null;
      }
      const row = Array.isArray(data) ? data[0] : null;
      return (row as HeroCourseFactRow | undefined) ?? null;
    },
  });
}
