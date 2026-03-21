import { useState, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
// TODO: re-import useFollowMutation from new feed system in Brief 3
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseClubhouseFollowsOptions {
  userId: string | undefined;
}

/**
 * Manages optimistic follow state for the Clubhouse feed.
 */
export function useClubhouseFollows({ userId }: UseClubhouseFollowsOptions) {
  // TODO Brief 3: const followMutation = useFollowMutation();
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

    analyticsEvents.track('feed_follow', { target_user_id: post.userId, action: currentlyFollowed ? 'unfollow' : 'follow' });
    // TODO Brief 3: followMutation.mutate(...)
  }, [userId, followOverrides]);

  const handleFollowChange = useCallback((targetUserId: string, isFollowed: boolean) => {
    setFollowOverrides(prev => {
      const next = new Map(prev);
      next.set(targetUserId, isFollowed);
      return next;
    });
  }, []);

  const getFollowState = useCallback((post: FeedPost | null): boolean => {
    if (!post) return false;
    return followOverrides.has(post.userId) ? followOverrides.get(post.userId)! : post.isFollowedByMe;
  }, [followOverrides]);

  const resetFollows = useCallback(() => {
    setFollowOverrides(new Map());
  }, []);

  return { followOverrides, handleFollow, handleFollowChange, getFollowState, resetFollows };
}
