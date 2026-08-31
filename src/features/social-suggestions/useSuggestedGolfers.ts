/**
 * BRIEF_SUGGESTED_GOLFERS - the one data source for reason-led suggestions.
 *
 * Reads public.get_suggested_golfers, a DEDICATED rpc. It is NOT
 * search_empty_state_v2: that one serves the search overlay's no-query state
 * and re-shaping it to serve this job is how one surface breaks another.
 *
 * Every row carries a reason. A person with no reason is never returned, so
 * this hook never has to invent copy.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

/** S4.1/4.2 - suggestions are for members who follow almost nobody. Tunable. */
export const SUGGESTION_FOLLOW_THRESHOLD = 5;

export type SuggestionReason = 'club' | 'course' | 'mutual' | 'active';

export interface SuggestedGolfer {
  user_id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  reason_type: SuggestionReason;
  reason_club_name: string | null;
  reason_course_name: string | null;
  mutual_count: number | null;
  recent_rounds: number | null;
  rounds_total: number | null;
  handicap_index: number | null;
}

type RpcResult<T> = { data: T | null; error: { message: string } | null };
const rpc = supabase.rpc.bind(supabase) as unknown as (
  name: string,
  args?: Record<string, unknown>,
) => Promise<RpcResult<SuggestedGolfer[]>>;

/** How many personal accounts the viewer follows. Gates every surface. */
export function useViewerFollowCount() {
  const { user } = useSupabaseSession();
  return useQuery({
    queryKey: ['viewer-personal-follow-count', user?.id ?? null],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_actor_type', 'personal')
        .eq('follower_actor_id', user!.id)
        .eq('following_actor_type', 'personal');
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useSuggestedGolfers(limit = 24, enabled = true) {
  const { user } = useSupabaseSession();
  return useQuery({
    queryKey: ['suggested-golfers', user?.id ?? null, limit],
    enabled: !!user?.id && enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await rpc('get_suggested_golfers', { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as SuggestedGolfer[];
    },
  });
}

/**
 * The gate: suggestions only render for a member following fewer than
 * SUGGESTION_FOLLOW_THRESHOLD people. `ready` is false while we do not know.
 */
export function useSuggestionGate() {
  const q = useViewerFollowCount();
  const count = q.data ?? null;
  return {
    ready: count !== null,
    eligible: count !== null && count < SUGGESTION_FOLLOW_THRESHOLD,
    followCount: count,
  };
}
