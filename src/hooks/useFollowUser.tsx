/**
 * @deprecated Use `useToggleFollow` from '@/hooks/useToggleFollow' directly.
 * Wrapper preserved for PR 3 incremental migration.
 */
import { useState } from 'react';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';
import { AppLog } from '@/lib/logger';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';

export const useFollowUser = () => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] useFollowUser → migrate to useToggleFollow');
  }

  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const viewerActorType: 'personal' | 'business' = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? user?.id;
  const [loading, setLoading] = useState(false);
  const toggle = useToggleFollow();

  const followUser = async (targetUserId: string) => {
    if (!user || !viewerActorId) {
      toast.error('Please sign in to follow users');
      return false;
    }
    if (viewerActorType === 'personal' && targetUserId === user.id) {
      AppLog.warn('[useFollowUser]', 'Attempted self-follow — blocked at client');
      return false;
    }
    setLoading(true);
    try {
      await toggle.mutateAsync({
        targetActorType: 'personal',
        targetActorId: targetUserId,
        targetUserId,
        viewerActorType,
        viewerActorId,
        viewerUserId: user.id,
        isFollowing: false,
      });
      toast.success('Following user');
      return true;
    } catch (error) {
      AppLog.error('[useFollowUser]', 'Error following user:', error);
      toast.error('Failed to follow user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user || !viewerActorId) {
      toast.error('Please sign in to unfollow users');
      return false;
    }
    if (viewerActorType === 'personal' && targetUserId === user.id) return false;
    setLoading(true);
    try {
      await toggle.mutateAsync({
        targetActorType: 'personal',
        targetActorId: targetUserId,
        targetUserId,
        viewerActorType,
        viewerActorId,
        viewerUserId: user.id,
        isFollowing: true,
      });
      toast.success('Unfollowed user');
      return true;
    } catch (error) {
      AppLog.error('[useFollowUser]', 'Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { followUser, unfollowUser, loading };
};
