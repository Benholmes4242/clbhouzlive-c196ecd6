import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFollowMutation } from '@/components/media-system/hooks/useFollowMutation';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseClubhouseFollowsOptions {
  userId: string | undefined;
}

/**
 * Manages follow tap handling for the Clubhouse feed.
 *
 * Post PR 2: Zustand overlay store removed. Follow state propagation now
 * flows through React Query cache via patchFollow (single source of truth).
 * The feed query holds isFollowedByMe per-post; mutations patch the cache
 * which re-renders the feed without a refetch.
 */
export function useClubhouseFollows({ userId }: UseClubhouseFollowsOptions) {
  const followMutation = useFollowMutation();

  // Busy guard to prevent rapid-fire mutations
  const isMutatingRef = useRef(false);

  const handleFollow = useCallback((post: FeedPost | null) => {
    if (!userId || !post) return;
    if (userId === post.userId) return;
    if (isMutatingRef.current) return;

    isMutatingRef.current = true;

    const currentlyFollowed = !!post.isFollowedByMe;

    analyticsEvents.track('feed_follow', {
      target_user_id: post.userId,
      action: currentlyFollowed ? 'unfollow' : 'follow',
    });

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
          toast.error('Could not update follow status. Please try again.');
        },
        onSettled: () => {
          isMutatingRef.current = false;
        },
      },
    );
  }, [userId, followMutation]);

  // Kept for backward-compat with callers that used to push state into the
  // Zustand store. No-op now — the cache patch is the source of truth.
  const handleFollowChange = useCallback((_targetUserId: string, _isFollowed: boolean) => {
    // intentional no-op
  }, []);

  const getFollowState = useCallback((post: FeedPost | null): boolean => {
    if (!post) return false;
    return !!post.isFollowedByMe;
  }, []);

  const resetFollows = useCallback(() => {
    // intentional no-op (no overlay store anymore)
  }, []);

  return { handleFollow, handleFollowChange, getFollowState, resetFollows };
}
