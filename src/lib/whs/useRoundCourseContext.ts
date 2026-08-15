import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * get_round_course_context — the member's own history at the course this round
 * was played at: their average to par, how many rounds they have there, their
 * rank for this round and their best. Nine-hole rounds are excluded by the
 * function; another member's rounds never affect the rank.
 */
export interface RoundCourseContext {
  course_id: string;
  /** Every 18-hole round here, INCLUDING this one. Hero cell figure. */
  your_avg_to_par: number | null;
  /** Average EXCLUDING this round. NULL when this is the only round here. */
  avg_to_par_others: number | null;
  rounds_here: number | null;
  rank_here: number | null;
  best_here: number | null;
}

export function useRoundCourseContext(scoreId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['round-course-context', scoreId],
    enabled: !!scoreId && enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<RoundCourseContext | null> => {
      if (!scoreId) return null;
      const { data, error } = await supabase.rpc('get_round_course_context', {
        p_whs_score_id: scoreId,
      });
      if (error) {
        console.error('[round-course-context] failed', { scoreId, error });
        return null;
      }
      const row = (data ?? [])[0] as RoundCourseContext | undefined;
      return row ?? null;
    },
  });
}
