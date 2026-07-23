import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScoringBreakdownHole {
  hole_no: number;
  par: number;
  rounds_played: number;
  avg_score: number;
  shots_over_par: number;
  par_or_better: number;
  bogeys: number;
  doubles_plus: number;
}

export interface ScoringBreakdown {
  rounds: number;
  complete_rounds: number;
  total_over_par: number;
  avg_gross: number | null;
  holes: ScoringBreakdownHole[];
}


export function useCourseScoringBreakdown(golfCourseId: string | undefined) {
  return useQuery<ScoringBreakdown | null>({
    queryKey: ['course-scoring-breakdown', golfCourseId],
    enabled: !!golfCourseId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // NOTE: .rpc must be called on the client object — do not destructure.
      const { data, error } = await supabase.rpc(
        'get_my_course_scoring_breakdown' as never,
        { p_golf_course_id: golfCourseId } as never,
      );
      if (error) {
        // Missing function / not signed in / no WHS bridge → render nothing.
        return null;
      }
      if (!data) return null;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as ScoringBreakdown | null) ?? null;
    },
    retry: false,
  });
}
