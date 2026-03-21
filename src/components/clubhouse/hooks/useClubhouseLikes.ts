import { useState, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
// TODO: re-import useLikeMutation from new feed system in Brief 3
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseClubhouseLikesOptions {
  userId: string | undefined;
  activeActor: { id: string; type: string } | null;
}

/**
 * Manages optimistic like state for the Clubhouse feed.
 */
export function useClubhouseLikes({ userId, activeActor }: UseClubhouseLikesOptions) {
  // TODO Brief 3: const likeMutation = useLikeMutation();
  const [localLikeState, setLocalLikeState] = useState<Map<string, { isLiked: boolean; count: number }>>(new Map());

  const handleLike = useCallback((post: FeedPost | null) => {
    if (!userId || !post || !activeActor) return;

    const current = localLikeState.get(post.id) ?? { isLiked: post.isLikedByMe, count: post.likeCount };
    const newState = {
      isLiked: !current.isLiked,
      count: current.isLiked ? Math.max(0, current.count - 1) : current.count + 1,
    };

    setLocalLikeState(prev => new Map(prev).set(post.id, newState));

    analyticsEvents.track('video_like', { post_id: post.id, action: current.isLiked ? 'unlike' : 'like' });
    analyticsEvents.track('post_like', { post_id: post.id, action: current.isLiked ? 'unlike' : 'like' });
    // TODO Brief 3: likeMutation.mutate(...)
  }, [userId, activeActor, localLikeState]);

  const getActiveLikeState = useCallback((post: FeedPost | null) => {
    if (!post) return { isLiked: false, count: 0 };
    return localLikeState.get(post.id) ?? { isLiked: post.isLikedByMe, count: post.likeCount };
  }, [localLikeState]);

  const resetLikes = useCallback(() => {
    setLocalLikeState(new Map());
  }, []);

  return { handleLike, getActiveLikeState, resetLikes };
}
