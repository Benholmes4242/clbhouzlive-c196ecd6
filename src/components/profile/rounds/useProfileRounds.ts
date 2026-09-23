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
}

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
      return (data ?? []) as ProfileRound[];
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
