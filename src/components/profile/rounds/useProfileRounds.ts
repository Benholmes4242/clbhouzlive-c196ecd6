/**
 * BRIEF_PROFILE_ROUNDS_TAB — data for the profile Rounds tab.
 *
 * VISIBILITY IS THE DATABASE'S. Both queries run on the signed-in client as
 * the viewer; gam_round_stats RLS decides what comes back. There is NO client
 * copy of the handicap_visibility rule here, by design.
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
  /** From whs_scores (joined on whs_score_id). null = the row did not come back. */
  is_nine_hole: boolean | null;
  total_holes: number | null;
  course_handicap: number | null;
  /** false when the viewer could not read the whs_scores row — treat as unknown, never as 18. */
  whs_joined: boolean;
}

/** The canonical round-unit test (PersonalBestsSection). Unknown rows fail it. */
export const isFullEighteen = (s: ProfileRound) =>
  s.whs_joined && !s.is_nine_hole && s.total_holes === 18;

/** How many of this member's rounds the VIEWER may see. 0 = no tab. */
export function useProfileRoundsCount(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['profile-rounds-count', userId],
    enabled: !!userId && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('gam_round_stats')
        .select('whs_score_id', { count: 'exact', head: true })
        .eq('user_id', userId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useProfileRounds(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-rounds', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gam_round_stats')
        .select(
          'whs_score_id, play_date, course_id, course_name, course_par, gross_score, hcp_at_time, eagles, albatrosses, holes_in_one, clean_card',
        )
        .eq('user_id', userId!)
        .order('play_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      const base = (data ?? []) as Omit<ProfileRound, 'is_nine_hole' | 'total_holes' | 'course_handicap' | 'whs_joined'>[];
      // Join whs_scores as the viewer (RLS: own / friend / whs_connection_publicly_visible).
      const ids = base.map((r) => r.whs_score_id);
      const whs = new Map<string, { is_nine_hole: boolean | null; total_holes: number | null; course_handicap: number | null }>();
      for (let i = 0; i < ids.length; i += 200) {
        const { data: w, error: we } = await supabase
          .from('whs_scores')
          .select('id, is_nine_hole, total_holes, course_handicap')
          .in('id', ids.slice(i, i + 200));
        if (we) throw we;
        for (const row of (w ?? []) as any[]) whs.set(row.id, row);
      }
      return base.map((r) => {
        const w = whs.get(r.whs_score_id);
        return {
          ...r,
          is_nine_hole: w?.is_nine_hole ?? null,
          total_holes: w?.total_holes ?? null,
          course_handicap: w?.course_handicap ?? null,
          whs_joined: !!w,
        } as ProfileRound;
      });
    },
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
