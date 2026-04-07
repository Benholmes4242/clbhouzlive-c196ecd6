import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFollowMutation } from '@/components/media-system/hooks/useFollowMutation';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useFollowStore } from '@/store/followStore';

interface UseClubhouseFollowsOptions {
  userId: string | undefined;
}

/**
 * Manages optimistic follow state for the Clubhouse feed.
 * Uses the global Zustand follow store for cross-page sync.
 */
export function useClubhouseFollows({ userId }: UseClubhouseFollowsOptions) {
  const followMutation = useFollowMutation();
  const { setFollowing, getFollowing } = useFollowStore();

  // Busy guard to prevent rapid-fire mutations
  const isMutatingRef = useRef(false);

  const handleFollow = useCallback((post: FeedPost | null) => {
    if (!userId || !post) return;
    if (userId === post.userId) return;
    if (isMutatingRef.current) return;

    isMutatingRef.current = true;

    const currentlyFollowed = getFollowing(post.userId, post.isFollowedByMe);

    // Optimistic update via global store
    setFollowing(post.userId, !currentlyFollowed);

    analyticsEvents.track('feed_follow', { target_user_id: post.userId, action: currentlyFollowed ? 'unfollow' : 'follow' });

    followMutation.mutate(
      {
        targetUserId: post.userId,
        targetActorType: post.actorType as 'personal' | 'business',
        targetActorId: post.actorId,
        currentUserId: userId,
        isFollowed: currentlyFollowed,
      },
      {
        onError: (error) => {
          console.error('[useClubhouseFollows] follow mutation failed:', error);
          // Revert optimistic update in global store
          setFollowing(post.userId, currentlyFollowed);
          toast.error('Could not update follow status. Please try again.');
        },
        onSettled: () => {
          isMutatingRef.current = false;
        },
      }
    );
  }, [userId, followMutation, setFollowing, getFollowing]);

  const handleFollowChange = useCallback((targetUserId: string, isFollowed: boolean) => {
    setFollowing(targetUserId, isFollowed);
  }, [setFollowing]);

  const getFollowState = useCallback((post: FeedPost | null): boolean => {
    if (!post) return false;
    return getFollowing(post.userId, post.isFollowedByMe);
  }, [getFollowing]);

  const resetFollows = useCallback(() => {
    useFollowStore.getState().reset();
  }, []);

  return { followOverrides: useFollowStore.getState().overrides, handleFollow, handleFollowChange, getFollowState, resetFollows };
}
