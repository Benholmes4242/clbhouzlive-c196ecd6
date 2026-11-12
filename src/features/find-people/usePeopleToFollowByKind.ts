/**
 * Pros to follow / Creators to follow — reads public.get_people_to_follow_by_kind
 * (run by Ben). The server owns the audience: self, test, deleted, followed,
 * dismissed and blocked people are already excluded, and a pro-creator comes
 * back as 'pro' only. Signed-in non-guest members only.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { isGuestUser } from '@/features/guest/useIsGuest';
import type { FollowKind, KindPerson } from './railRules';

export function usePeopleToFollowByKind(kind: FollowKind, limit = 12, enabled = true) {
  const { user } = useSupabaseSession();
  const viewerId = user?.id ?? null;
  return useQuery({
    queryKey: limit === 12 ? ['people-to-follow', kind, viewerId] : ['people-to-follow', kind, viewerId, limit],
    enabled: !!viewerId && !isGuestUser(user as never) && enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // Not yet in the generated types; the call keeps supabase as `this`.
      const client = supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
      };
      const { data, error } = await client.rpc('get_people_to_follow_by_kind', { p_kind: kind, p_limit: limit });
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as KindPerson[];
    },
  });
}
