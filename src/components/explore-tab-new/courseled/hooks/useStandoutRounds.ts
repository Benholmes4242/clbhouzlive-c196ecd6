import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BoardFilters } from '../boardFilters';

/** SR1: the deployed RPC owns ordering and selection. Pass every board axis,
 * but omit tuning arguments so the deployed defaults remain authoritative.
 * Previous-query rows are opt-in for SAR1's shelf only; default consumers retain
 * their own pending/held-frame lifecycle rather than receiving placeholder rows. */
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

export function standoutRpcArgs(viewerId: string | undefined, f: BoardFilters, limit = 4) {
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
    p_limit: limit,
  };
}

export function useStandoutRounds(viewerId: string | undefined, filters: BoardFilters, enabled = true, limit = 4, options: { keepPrevious?: boolean } = {}) {
  const args = standoutRpcArgs(viewerId, filters, limit);
  return useQuery<StandoutRound[]>({
    queryKey: ['discover', 'standout-rounds', args],
    enabled,
    staleTime: 60_000,
    ...(options.keepPrevious ? { placeholderData: (previous: StandoutRound[] | undefined) => previous } : {}),
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_standout_rounds', args);
      if (error) throw error;
      return ((data ?? []) as StandoutRound[]).map((row) => ({
        ...row, pos: Number(row.pos), prior_n: Number(row.prior_n),
        gross_score: row.gross_score == null ? null : Number(row.gross_score),
        course_par: row.course_par == null ? null : Number(row.course_par),
        net_score: row.net_score == null ? null : Number(row.net_score),
        course_handicap: row.course_handicap == null ? null : Number(row.course_handicap),
        avg_topar: row.avg_topar == null ? null : Number(row.avg_topar),
        best_topar: row.best_topar == null ? null : Number(row.best_topar),
        delta: row.delta == null ? null : Number(row.delta),
      }));
    },
  });
}