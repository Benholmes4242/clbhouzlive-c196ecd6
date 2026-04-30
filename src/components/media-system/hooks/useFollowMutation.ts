/**
 * useFollowMutation — legacy wrapper over the canonical useToggleFollow.
 *
 * Preserves the existing call signature so PR 2 callsites keep compiling
 * unchanged. PR 3 will migrate them to call useToggleFollow directly.
 */

import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';

interface FollowParams {
  targetUserId: string;
  targetActorType: 'personal' | 'business';
  targetActorId: string;
  currentUserId: string;
  isFollowed: boolean; // current state BEFORE toggle
}

export function useFollowMutation() {
  const toggle = useToggleFollow();
  const { activeActor } = useActiveActor();

  return {
    ...toggle,
    mutate: (
      params: FollowParams,
      options?: Parameters<typeof toggle.mutate>[1],
    ) =>
      toggle.mutate(
        {
          targetActorType: params.targetActorType,
          targetActorId: params.targetActorId,
          targetUserId: params.targetUserId,
          viewerActorType: activeActor?.type ?? 'personal',
          viewerActorId: activeActor?.id ?? params.currentUserId,
          viewerUserId: params.currentUserId,
          isFollowing: params.isFollowed,
        },
        options,
      ),
    mutateAsync: (
      params: FollowParams,
      options?: Parameters<typeof toggle.mutateAsync>[1],
    ) =>
      toggle.mutateAsync(
        {
          targetActorType: params.targetActorType,
          targetActorId: params.targetActorId,
          targetUserId: params.targetUserId,
          viewerActorType: activeActor?.type ?? 'personal',
          viewerActorId: activeActor?.id ?? params.currentUserId,
          viewerUserId: params.currentUserId,
          isFollowing: params.isFollowed,
        },
        options,
      ),
  };
}
