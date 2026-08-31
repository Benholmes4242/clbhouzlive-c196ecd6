import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HomeClubState = 'set' | 'pending' | 'none';

export interface HomeClubStatus {
  state: HomeClubState;
  clubId: string | null;
  clubName: string | null;
  /** Typed name of a club not yet in the catalogue — a placeholder, not a club. */
  pendingName: string | null;
  /** True while a home-club request of theirs is still awaiting triage. */
  hasOpenRequest: boolean;
}

const EMPTY: HomeClubStatus = {
  state: 'none', clubId: null, clubName: null, pendingName: null, hasOpenRequest: false,
};

/**
 * Own-account home club state. Drives the prompt (§2.2/§2.4) and the pending
 * treatment (§3.5). A member with a club OR an outstanding request has already
 * answered and is never prompted.
 */
export function useHomeClubStatus(userId: string | undefined) {
  const { data = EMPTY, isLoading } = useQuery({
    queryKey: ['home-club-status', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<HomeClubStatus> => {
      if (!userId) return EMPTY;

      const [{ data: profile }, { data: requests }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('primary_club_id, home_club, home_club_pending_name')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('course_requests')
          .select('id, status')
          .eq('home_club_for_user_id', userId)
          .eq('status', 'pending')
          .limit(1),
      ]);

      const hasOpenRequest = (requests ?? []).length > 0;
      const pendingName = profile?.home_club_pending_name ?? null;

      if (profile?.primary_club_id) {
        return {
          state: 'set',
          clubId: profile.primary_club_id,
          clubName: profile.home_club ?? null,
          pendingName: null,
          hasOpenRequest: false,
        };
      }
      if (pendingName) {
        return { state: 'pending', clubId: null, clubName: null, pendingName, hasOpenRequest };
      }
      return { ...EMPTY, hasOpenRequest };
    },
  });

  return { ...data, isLoading };
}
