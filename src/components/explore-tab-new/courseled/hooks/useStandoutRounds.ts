import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BoardFilters } from '../boardFilters';

/** SR1: the deployed RPC owns ordering and selection. Pass every board axis,
 * but omit tuning arguments so the deployed defaults remain authoritative. */
export interface StandoutRound {
  pos: number;
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  whs_score_id: string | null;
  play_date: string;
  course_id: string | null;
  course_name: string | null;
  gross_score: number | null;
  course_par: number | null;
  net_score: number | null;
  course_handicap: number | null;
  is_competition: boolean | null;
  prior_n: number;
  avg_topar: number | null;
  best_topar: number | null;
  last_better: string | null;
  delta: number | null;
}

export function standoutRpcArgs(viewerId: string | undefined, f: BoardFilters) {
  return {
    p_viewer: viewerId ?? null,
    p_scope: f.scope,
    p_window: f.window,
    p_region_kind: f.regionKind,
    p_region_value: f.regionValue,
    p_courses: f.courses,
    p_course_id: f.courseId,
    p_band: f.band,
    p_competition: f.competition,
    p_limit: 4,
  };
}

export function useStandoutRounds(viewerId: string | undefined, filters: BoardFilters, enabled = true) {
  const args = standoutRpcArgs(viewerId, filters);
  return useQuery<StandoutRound[]>({
    queryKey: ['discover', 'standout-rounds', args],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_standout_rounds' as never, args as never);
      if (error) throw error;
      return (data ?? []) as unknown as StandoutRound[];
    },
  });
}