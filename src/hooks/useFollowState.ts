/**
 * useFollowState — pure cache reader for follow state.
 *
 * NO queryFn. NO network call. Subscribes to the canonical 5-element key:
 *   ['follow-status', viewerActorType, viewerActorId, targetActorType, targetActorId]
 *
 * The cache is seeded by:
 *   1. Mutations via patchFollow (every toggle writes the canonical key)
 *   2. Direct-fetch surfaces that own a useQuery against the canonical key
 *      (BusinessProfilePage, BusinessFollowButton, ReviewBottomSheet,
 *      suggested-user cards) — they call get_business_relationship_status
 *      or the personal equivalent and the result lands here automatically.
 *   3. Feed RPC results — components fall back to `?? post.isFollowedByMe`
 *      when the cache hasn't been seeded yet (which is reliable post Doc 1).
 *
 * Returns `{ isFollowing: boolean | undefined }`. `undefined` means
 * "cache unseeded — caller should fall back to its own prop".
 *
 * Implemented via useSyncExternalStore against React Query's QueryCache so
 * we re-render whenever patchFollow writes to the canonical key — without
 * triggering a fetch (a queryFn-less useQuery throws in v5).
 */

import { useMemo, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FollowStateTarget {
  targetActorType: 'personal' | 'business';
  targetActorId: string | undefined;
  viewerActorType: 'personal' | 'business';
  viewerActorId: string | undefined;
}

interface FollowStateResult {
  isFollowing: boolean | undefined;
}

export function useFollowState({
  targetActorType,
  targetActorId,
  viewerActorType,
  viewerActorId,
}: FollowStateTarget): FollowStateResult {
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => [
      'follow-status',
      viewerActorType,
      viewerActorId ?? null,
      targetActorType,
      targetActorId ?? null,
    ],
    [viewerActorType, viewerActorId, targetActorType, targetActorId],
  );

  // Seed the canonical key from DB truth on mount. Shares cache storage with
  // the useSyncExternalStore subscription below — populates once, all
  // consumers of the same key dedupe to a single network call.
  useQuery({
    queryKey,
    queryFn: async (): Promise<boolean> => {
      if (targetActorType === 'business') {
        const { data, error } = await supabase
          .from('business_follows')
          .select('id')
          .eq('follower_actor_type', viewerActorType)
          .eq('follower_actor_id', viewerActorId!)
          .eq('business_id', targetActorId!)
          .maybeSingle();
        if (error) throw error;
        return !!data;
      } else {
        const { data, error } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_actor_type', viewerActorType)
          .eq('follower_actor_id', viewerActorId!)
          .eq('following_id', targetActorId!)
          .maybeSingle();
        if (error) throw error;
        return !!data;
      }
    },
    enabled: !!viewerActorId && !!targetActorId,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });

  const cache = queryClient.getQueryCache();

  // useSyncExternalStore needs a stable subscribe + snapshot. Snapshot returns
  // the cached value (or undefined). Subscribe registers a cache listener
  // that fires our notify callback whenever ANY query changes, but we only
  // re-snapshot for our exact key (cheap shallow read).
  const { subscribe, getSnapshot } = useMemo(() => {
    const keyHash = JSON.stringify(queryKey);
    return {
      subscribe(notify: () => void) {
        const unsub = cache.subscribe((event) => {
          if (event?.query?.queryHash === keyHash) notify();
        });
        return unsub;
      },
      getSnapshot(): boolean | { isFollowing: boolean } | undefined {
        return queryClient.getQueryData(queryKey) as
          | boolean
          | { isFollowing: boolean }
          | undefined;
      },
    };
  }, [cache, queryClient, queryKey]);

  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isFollowing =
    typeof data === 'boolean'
      ? data
      : data && typeof data === 'object'
        ? (data as { isFollowing: boolean }).isFollowing
        : undefined;

  return { isFollowing };
}
