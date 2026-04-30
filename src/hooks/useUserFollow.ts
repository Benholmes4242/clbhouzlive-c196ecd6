/**
 * @deprecated Use `useToggleFollow` + `useFollowState` from
 *   '@/hooks/useToggleFollow' / '@/hooks/useFollowState' directly.
 *
 * This wrapper preserves the legacy call shape while the PR 3 migration
 * incrementally replaces callsites. Will be deleted in a follow-up cleanup
 * PR once the dev console.warn confirms zero usage.
 */
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useFollowState } from '@/hooks/useFollowState';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

export function useUserFollow(targetUserId: string | null) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] useUserFollow → migrate to useToggleFollow + useFollowState');
  }

  const { user } = useSupabaseSession();
  const toggle = useToggleFollow();
  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: targetUserId ?? undefined,
    viewerActorType: 'personal',
    viewerActorId: user?.id,
  });

  const isFollowing = cached ?? false;

  const toggleFollow = (overrideTargetId?: string) => {
    const targetId = overrideTargetId || targetUserId;
    if (!user?.id) {
      toast.error('Please log in to follow users');
      return;
    }
    if (!targetId) return;
    if (user.id === targetId) {
      toast.error("You can't follow yourself");
      return;
    }
    toggle.mutate({
      targetActorType: 'personal',
      targetActorId: targetId,
      targetUserId: targetId,
      viewerActorType: 'personal',
      viewerActorId: user.id,
      viewerUserId: user.id,
      isFollowing,
    }, {
      onSuccess: () => {
        toast.success(!isFollowing ? 'Following' : 'Unfollowed');
      },
      onError: () => {
        toast.error('Failed to update follow status');
      },
    });
  };

  return {
    isFollowing,
    isLoading: false,
    toggleFollow,
    isFollowingPending: toggle.isPending,
  };
}
