/**
 * useFollowState — pure cache reader for follow state.
 *
 * NO queryFn. NO network call. Subscribes to the canonical 5-element key:
 *   ['follow-status', viewerActorType, viewerActorId, targetActorType, targetActorId]
 *
 * The cache is seeded by:
 *   1. Mutations via patchFollow (every toggle writes the canonical key)
 *   2. Direct-fetch surfaces that own a useQuery against the canonical key
 *      (BusinessProfilePage, BusinessFollowButton, MiniProfileSheet,
 *      suggested-user cards) — they call get_business_relationship_status
 *      or the personal equivalent and the result lands here automatically.
 *   3. Feed RPC results — components fall back to `?? post.isFollowedByMe`
 *      when the cache hasn't been seeded yet (which is reliable post Doc 1).
 *
 * Returns `{ isFollowing: boolean | undefined }`. `undefined` means
 * "cache unseeded — caller should fall back to its own prop".
 */

import { useQueryClient, useQuery } from '@tanstack/react-query';

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

  const queryKey = [
    'follow-status',
    viewerActorType,
    viewerActorId ?? null,
    targetActorType,
    targetActorId ?? null,
  ] as const;

  // useQuery WITHOUT a queryFn subscribes to the cache entry and re-renders
  // on changes (which is what patchFollow triggers), but never fetches.
  // We gate enabled on having both ids so we don't subscribe to noise.
  const { data } = useQuery<{ isFollowing: boolean } | boolean | undefined>({
    queryKey,
    enabled: !!targetActorId && !!viewerActorId,
    // No queryFn — pure cache subscriber.
    staleTime: Infinity,
    // Initial value comes from existing cache entry if any (seeded by mutations
    // or surface-level direct-fetch queries).
    initialData: () => queryClient.getQueryData(queryKey),
  });

  const isFollowing =
    typeof data === 'boolean'
      ? data
      : data && typeof data === 'object'
        ? (data as { isFollowing: boolean }).isFollowing
        : undefined;

  return { isFollowing };
}
