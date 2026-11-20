import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';

/**
 * COURSES_PAGE_STANDOUT_ROUNDS — get_courses_standout_rounds(30 days, 8 cards,
 * 2 per member). The function owns selection, visibility and order (rarest
 * feat first, then newest); never filter or re-sort here. Signed-out viewers
 * get nothing, so the hook is disabled without a user. The RPC is newer than
 * the generated types: (supabase.rpc as any) plus a typed mapper, as
 * useCourseLately does. Fields this read has no use for are filled neutral.
 */
export type StandoutFeatKind = 'ace' | 'albatross' | 'under_par' | 'eagle' | 'points' | 'birdies';

export interface CoursesStandoutRound extends StandoutRound {
  course_region: string | null;
  course_sub_country: string | null;
  course_image: string | null;
  stableford_points: number | null;
  holes_in_one: number;
  albatrosses: number;
  eagles: number;
  birdies: number;
  longest_birdie_run: number;
  feat_kind: StandoutFeatKind;
  feat_holes: number[] | null;
  feat_par: number | null;
  feat_yards: number | null;
}

const num = (v: unknown): number | null => (v == null ? null : Number(v));
const count = (v: unknown): number => Number(v ?? 0) || 0;
const str = (v: unknown): string | null => (v == null ? null : String(v));

export function mapCoursesStandoutRow(row: Record<string, unknown>): CoursesStandoutRound {
  return {
    pos: Number(row.pos ?? 0),
    whs_score_id: str(row.whs_score_id),
    user_id: String(row.user_id ?? ''),
    display_name: str(row.display_name),
    profile_photo_url: str(row.profile_photo_url),
    play_date: String(row.play_date ?? ''),
    course_id: str(row.course_id),
    course_name: str(row.course_name),
    course_region: str(row.course_region),
    course_sub_country: str(row.course_sub_country),
    course_image: str(row.course_image),
    gross_score: num(row.gross_score),
    course_par: num(row.course_par),
    net_score: num(row.net_score),
    course_handicap: num(row.course_handicap),
    is_competition: row.is_competition == null ? null : row.is_competition === true,
    stableford_points: num(row.stableford_points),
    holes_in_one: count(row.holes_in_one),
    albatrosses: count(row.albatrosses),
    eagles: count(row.eagles),
    birdies: count(row.birdies),
    longest_birdie_run: count(row.longest_birdie_run),
    feat_kind: row.feat_kind as StandoutFeatKind,
    feat_holes: Array.isArray(row.feat_holes) ? (row.feat_holes as unknown[]).map(Number) : null,
    feat_par: num(row.feat_par),
    feat_yards: num(row.feat_yards),
    prior_n: 0,
    avg_topar: null,
    best_topar: null,
    last_better: null,
    delta: null,
  };
}

export function useCoursesStandoutRounds(userId: string | undefined) {
  return useQuery({
    queryKey: ['courses', 'standout-rounds', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_courses_standout_rounds', {
        p_days: 30,
        p_limit: 8,
        p_per_member: 2,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapCoursesStandoutRow);
    },
  });
}
