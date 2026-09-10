/**
 * useCircleClubs — THE ONE club resolution for the circle leaderboard.
 *
 * get_friend_leaderboard returns the England Golf club for friends and the
 * clbhouz club for the self row, so the viewer used to read "Sundridge Park
 * Golf Club" beside other members' "Sundridge Park". No normaliser (rejected
 * July 2026): the clbhouz value is batch-resolved for every row that HAS a
 * clbhouz account, in ONE read, so every member row uses the same field.
 * WHS-only friends have no clbhouz profile, so they keep the England Golf
 * value — the only value they have.
 *
 * It lives here rather than in either surface because the page and the see-all
 * sheet both need it, and a third consumer must not be able to get it wrong.
 * Both surfaces call it with the same id set, so the react-query key is
 * identical and the sheet issues NO extra read — never one per row.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

export type ClubResolver = (entry: FriendLeaderboardEntry) => string | null;

/** One read for every clbhouz account in the circle. No per-row fetch. */
export function useCircleClubs(entries: FriendLeaderboardEntry[]): ClubResolver {
  const key = useMemo(
    () =>
      Array.from(
        new Set(entries.map((e) => e.friend_user_id).filter((v): v is string => !!v)),
      ).sort(),
    [entries],
  );

  const { data: clubs } = useQuery({
    queryKey: ['circle-home-clubs', key],
    enabled: key.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, home_club')
        .in('id', key);
      if (error) throw error;
      const map = new Map<string, string | null>();
      for (const row of (data as { id: string; home_club: string | null }[]) ?? []) {
        map.set(row.id, row.home_club ?? null);
      }
      return map;
    },
  });

  return (entry) => {
    const viaClbhouz = entry.friend_user_id ? clubs?.get(entry.friend_user_id) ?? null : null;
    return viaClbhouz ?? entry.friend_home_club ?? null;
  };
}
