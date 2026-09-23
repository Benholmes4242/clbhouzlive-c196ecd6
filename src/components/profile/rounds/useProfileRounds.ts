/**
 * BRIEF_PROFILE_ROUNDS_TAB — data for the profile Rounds tab.
 *
 * VISIBILITY IS THE DATABASE'S. Both queries run on the signed-in client as
 * the viewer via get_profile_rounds (SECURITY DEFINER, one can_view_handicap
 * gate). There is NO client copy of the handicap_visibility rule here.
 *
 * BRIEF_ROUNDS_TAB_FORM_STRIP_DIFFERENTIAL — the strip is built on the stored
 * differential and the index the member held AT THE TIME of the round:
 *   form value = handicap_differential - handicap_index_at_time
 * handicap_differential and slope/course ratings are complete on whs_scores;
 * handicap_index_at_time is null on 19 rounds — those have NO form value and
 * the member's CURRENT index is never substituted for the one they held.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileRound {
  whs_score_id: string;
  play_date: string;
  course_id: string | null;
  course_name: string | null;
  course_par: number | null;
  gross_score: number | null;
  hcp_at_time: number | null;
  eagles: number | null;
  albatrosses: number | null;
  holes_in_one: number | null;
  clean_card: boolean | null;
  /** From whs_scores (joined in get_profile_rounds). null = the row did not come back. */
  is_nine_hole: boolean | null;
  total_holes: number | null;
  course_handicap: number | null;
  handicap_differential: number | null;
  handicap_index_at_time: number | null;
  slope_rating: number | null;
  course_rating: number | null;
  /** false when the viewer could not read the whs_scores row — treat as unknown, never as 18. */
  whs_joined: boolean;
}

/** The canonical round-unit test (PersonalBestsSection). Unknown rows fail it. */
export const isFullEighteen = (s: ProfileRound) =>
  s.whs_joined && !s.is_nine_hole && s.total_holes === 18;

const fetchProfileRounds = async (userId: string): Promise<ProfileRound[]> => {
  // One gate, in the database: get_profile_rounds checks can_view_handicap
  // and joins whs_scores itself. No direct table reads from the client.
  const { data, error } = await (supabase.rpc as any)('get_profile_rounds', { p_user_id: userId });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    whs_joined: r.is_nine_hole != null || r.total_holes != null,
  })) as ProfileRound[];
};

/** How many of this member's rounds the VIEWER may see. 0 = no tab. */
export function useProfileRoundsCount(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['profile-rounds', userId],
    enabled: !!userId && enabled,
    staleTime: 60_000,
    queryFn: () => fetchProfileRounds(userId!),
    select: (rows: ProfileRound[]) => rows.length,
  });
}

export function useProfileRounds(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-rounds', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: () => fetchProfileRounds(userId!),
  });
}

/**
 * Own profile only: the member's own setting, read to LABEL the tab
 * ("only you can see this"), never to gate it.
 */
export function useOwnHandicapVisibility(userId: string | undefined, isSelf: boolean) {
  return useQuery({
    queryKey: ['own-handicap-visibility', userId],
    enabled: !!userId && isSelf,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('handicap_visibility')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return ((data as { handicap_visibility?: string | null } | null)?.handicap_visibility ?? 'public') as string;
    },
  });
}
