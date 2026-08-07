/**
 * useCompareIdentities - THE ONE identity resolver for the compare sheet.
 *
 * A displayed name or photo for a clbhouz member comes from user_profiles and
 * NEVER from whs_friends / whs_friend_matches, which carry England Golf
 * personal data in surname-first form ("Holmes, Danny"). There is deliberately
 * no name reformatter here: the source is fixed instead.
 *
 * ONE BATCHED READ serves whichever list is on screen - the six recent rows,
 * up to twelve search results, or a single deep-linked id - keyed by the id
 * set, so returning to the recent list or re-typing a query costs nothing and
 * no row ever queries for itself.
 *
 * An England-Golf-only friend (no resolved clbhouz user id) never reaches this
 * hook: the caller only passes ids, and such a friend has none. Their
 * friend_name is the only name that exists for them and the caller keeps it.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ResolvedIdentity {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export type IdentityMap = Record<string, ResolvedIdentity>;

export function useCompareIdentities(
  userIds: string[],
  enabled = true,
) {
  const ids = Array.from(new Set(userIds.filter(Boolean))).sort();
  return useQuery<IdentityMap>({
    queryKey: ['compare-identities', ids],
    enabled: enabled && ids.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', ids);
      if (error) throw error;
      const map: IdentityMap = {};
      for (const row of (data ?? []) as {
        id: string;
        display_name: string | null;
        username: string | null;
        profile_photo_url: string | null;
      }[]) {
        const name = (row.display_name ?? '').trim() || (row.username ?? '').trim();
        if (!name) continue; // A profile with no name resolves to nothing, never to furniture.
        map[row.id] = {
          userId: row.id,
          name,
          avatarUrl: row.profile_photo_url ?? null,
        };
      }
      return map;
    },
  });
}
