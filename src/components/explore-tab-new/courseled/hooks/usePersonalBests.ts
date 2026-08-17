import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { discoverKeys, viewerId } from '@/lib/queryKeys';

/**
 * PERSONAL BESTS (BRIEF_PERSONAL_BESTS_SECTION §5).
 *
 * One live RPC, SECURITY INVOKER, viewer-scoped by RLS. The client NEVER
 * re-sorts, re-ranks, filters by course or friendship, or invents copy:
 * `headline` and `reference_line` render verbatim, and the returned order is
 * the render order.
 *
 * OVER-FETCH BY DESIGN: 30 rows for at most 8 tiles, because the member budget
 * (§4) is applied client-side and eats candidates.
 */

export interface PersonalBestRow {
  whs_score_id: string;
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  is_self: boolean;
  course_id: string;
  course_name: string | null;
  region: string | null;
  feat_kind: string;
  figure: string | null;
  figure_unit: string | null;
  headline: string | null;
  reference_line: string | null;
  play_date: string;
  rarity: number;
  /**
   * THE SECOND FIGURE (BRIEF_FEAT_SECOND_FIGURE §2.6) — a NUMBER, never a
   * sentence. The function supplies what the feat BEAT (shots better than the
   * member's all-time best gross at that course, or strokes/pars/birdies over
   * their previous mark) or what it TOOK (the rounds before a first
   * double-free); the client composes the chip.
   *
   * NEVER PARSE `reference_line` TO GET THIS. A delta read out of
   * "Previous best 9" breaks the moment the copy is edited or a locale renders
   * the sentence differently — this column is the only source.
   *
   * NULL means there is no honest comparison (big_points_here), or the
   * comparison was suppressed server-side (no prior round there, or a delta of
   * zero). Null renders the count alone.
   */
  second_figure: number | null;
}


export const PERSONAL_BESTS_DAYS = 90;
/** Deliberate over-fetch — see above. */
export const PERSONAL_BESTS_FETCH = 30;
export const PERSONAL_BESTS_PER_MEMBER = 2;

/**
 * staleTime 5 minutes rather than the rail cache's 10 (see report): unlike
 * Standout Rounds this computes live, so a member's own new feat should not sit
 * invisible for a full cron cycle.
 */
const STALE_MS = 5 * 60 * 1000;

export function usePersonalBests(userId: string | undefined) {
  return useQuery({
    queryKey: discoverKeys.personalBests(
      viewerId(userId),
      PERSONAL_BESTS_DAYS,
      PERSONAL_BESTS_FETCH,
      PERSONAL_BESTS_PER_MEMBER,
    ),
    queryFn: async (): Promise<PersonalBestRow[]> => {
      const { data, error } = await supabase.rpc('get_personal_bests', {
        p_days: PERSONAL_BESTS_DAYS,
        p_limit: PERSONAL_BESTS_FETCH,
        p_per_member: PERSONAL_BESTS_PER_MEMBER,
      });
      if (error) throw error;
      return (data ?? []) as PersonalBestRow[];
    },
    enabled: !!userId,
    staleTime: STALE_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
