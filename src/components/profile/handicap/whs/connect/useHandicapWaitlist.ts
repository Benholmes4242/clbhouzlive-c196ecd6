import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsCountry } from '@/lib/whs/whsCountries';

/**
 * Waitlist for federations that are not open yet. Writes to
 * public.handicap_authority_waitlist. Counts come from
 * get_handicap_waitlist_counts(), which applies its own floor server-side and
 * omits countries below it: an absent key means "not enough to say", never
 * zero. The client applies no threshold of its own.
 *
 * Mutations never block: a failure rolls the optimistic change back silently.
 */
export function useHandicapWaitlist(userId: string | undefined) {
  const qc = useQueryClient();
  const joinedKey = ['handicap-waitlist', userId] as const;
  const countsKey = ['handicap-waitlist-counts'] as const;

  const joinedQ = useQuery({
    queryKey: joinedKey,
    enabled: Boolean(userId),
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('handicap_authority_waitlist')
        .select('country_id')
        .eq('user_id', userId as string);
      if (error) throw error;
      return new Set((data ?? []).map((r: { country_id: string }) => r.country_id));
    },
  });

  const countsQ = useQuery({
    queryKey: countsKey,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.rpc('get_handicap_waitlist_counts');
      if (error) throw error;
      return (data ?? {}) as Record<string, number>;
    },
  });

  const optimistic = async (id: string, add: boolean) => {
    await qc.cancelQueries({ queryKey: joinedKey });
    const prev = qc.getQueryData<Set<string>>(joinedKey);
    const next = new Set(prev ?? []);
    if (add) next.add(id);
    else next.delete(id);
    qc.setQueryData(joinedKey, next);
    return { prev };
  };
  const rollback = (_e: unknown, _c: WhsCountry, ctx?: { prev?: Set<string> }) => {
    qc.setQueryData(joinedKey, ctx?.prev ?? new Set<string>());
  };
  const settle = () => {
    qc.invalidateQueries({ queryKey: joinedKey });
    qc.invalidateQueries({ queryKey: countsKey });
  };

  const joinM = useMutation({
    mutationFn: async (country: WhsCountry) => {
      if (!userId) return;
      const { error } = await supabase
        .from('handicap_authority_waitlist')
        .upsert(
          { user_id: userId, country_id: country.id, body_name: country.body },
          { onConflict: 'user_id,country_id', ignoreDuplicates: true },
        );
      if (error && error.code !== '23505') throw error;
    },
    onMutate: (c) => optimistic(c.id, true),
    onError: rollback,
    onSettled: settle,
  });

  const leaveM = useMutation({
    mutationFn: async (country: WhsCountry) => {
      if (!userId) return;
      const { error } = await supabase
        .from('handicap_authority_waitlist')
        .delete()
        .eq('user_id', userId)
        .eq('country_id', country.id);
      if (error) throw error;
    },
    onMutate: (c) => optimistic(c.id, false),
    onError: rollback,
    onSettled: settle,
  });

  const join = (country: WhsCountry) => {
    if (!userId) return;
    analyticsEvents.track('whs_waitlist_join', { country: country.id });
    joinM.mutate(country);
  };
  const leave = (country: WhsCountry) => {
    if (!userId) return;
    analyticsEvents.track('whs_waitlist_leave', { country: country.id });
    leaveM.mutate(country);
  };

  return {
    joined: joinedQ.data ?? new Set<string>(),
    counts: countsQ.data ?? {},
    join,
    leave,
    isJoining: joinM.isPending,
  };
}
