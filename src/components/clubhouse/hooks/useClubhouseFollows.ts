import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFollowMutation } from '@/components/media-system/hooks/useFollowMutation';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseClubhouseFollowsOptions {
  userId: string | undefined;
}

/**
 * Manages optimistic follow state for the Clubhouse feed.
 * Uses refs for stable callbacks to prevent re-render cascades.
 */
export function useClubhouseFollows({ userId }: UseClubhouseFollowsOptions) {
  const followMutation = useFollowMutation();
  const [followOverrides, setFollowOverrides] = useState<Map<string, boolean>>(new Map());

  // Stable ref for followOverrides to avoid stale closures
  const followOverridesRef = useRef(followOverrides);
  useEffect(() => {
    followOverridesRef.current = followOverrides;
  }, [followOverrides]);

  // Busy guard to prevent rapid-fire mutations
  const isMutatingRef = useRef(false);

  const handleFollow = useCallback((post: FeedPost | null) => {
    if (!userId || !post) return;
    if (userId === post.userId) return;
    if (isMutatingRef.current) return;

    isMutatingRef.current = true;

    const currentOverrides = followOverridesRef.current;
    const currentlyFollowed = currentOverrides.has(post.userId)
      ? currentOverrides.get(post.userId)!
      : post.isFollowedByMe;

    // Optimistic update
    setFollowOverrides(prev => {
      const next = new Map(prev);
      next.set(post.userId, !currentlyFollowed);
      return next;
    });

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
          // Revert optimistic update
          setFollowOverrides(prev => {
            const next = new Map(prev);
            next.set(post.userId, currentlyFollowed);
            return next;
          });
          toast.error('Could not update follow status. Please try again.');
        },
        onSettled: () => {
          isMutatingRef.current = false;
        },
      }
    );
  }, [userId, followMutation]);

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
