import { useState, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFollowMutation } from '@/components/media-system/hooks/useFollowMutation';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseClubhouseFollowsOptions {
  userId: string | undefined;
}

/**
 * Manages optimistic follow state for the Clubhouse feed.
 */
export function useClubhouseFollows({ userId }: UseClubhouseFollowsOptions) {
  const followMutation = useFollowMutation();
  const [followOverrides, setFollowOverrides] = useState<Map<string, boolean>>(new Map());

  const handleFollow = useCallback((post: FeedPost | null) => {
    if (!userId || !post) return;
    // Prevent self-follow
    if (userId === post.userId) return;

    const currentlyFollowed = followOverrides.has(post.userId)
      ? followOverrides.get(post.userId)!
      : post.isFollowedByMe;

    setFollowOverrides(prev => {
      const next = new Map(prev);
      next.set(post.userId, !currentlyFollowed);
      return next;
    });

    analyticsEvents.track('video_follow', { target_id: post.userId, action: currentlyFollowed ? 'unfollow' : 'follow' });

    followMutation.mutate(
      {
        targetUserId: post.userId,
        targetActorType: post.actorType as 'personal' | 'business',
        targetActorId: post.actorId,
        currentUserId: userId,
        isFollowed: currentlyFollowed,
      },
      {
        onError: () => {
          setFollowOverrides(prev => {
            const next = new Map(prev);
            next.set(post.userId, currentlyFollowed);
            return next;
          });
        },
      },
    );
  }, [userId, followOverrides, followMutation]);

  const handleFollowChange = useCallback((targetUserId: string, isFollowed: boolean) => {
    setFollowOverrides(prev => {
      const next = new Map(prev);
      next.set(targetUserId, isFollowed);
      return next;
    });
  }, []);

  const getFollowState = useCallback((post: FeedPost | null): boolean => {
    if (!post) return false;
    return followOverrides.has(post.userId)
      ? followOverrides.get(post.userId)!
      : post.isFollowedByMe;
  }, [followOverrides]);

  const resetFollows = useCallback(() => setFollowOverrides(new Map()), []);

  return { followOverrides, handleFollow, handleFollowChange, getFollowState, resetFollows };
}
