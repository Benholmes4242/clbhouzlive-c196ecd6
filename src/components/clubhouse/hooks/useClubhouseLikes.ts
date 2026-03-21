import { useState, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useLikeMutation } from '@/components/media-system/hooks/useLikeMutation';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseClubhouseLikesOptions {
  userId: string | undefined;
  activeActor: { id: string; type: string } | null;
}

/**
 * Manages optimistic like state for the Clubhouse feed.
 * Re-wired for Brief 3: calls useLikeMutation.
 */
export function useClubhouseLikes({ userId, activeActor }: UseClubhouseLikesOptions) {
  const likeMutation = useLikeMutation();
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

    likeMutation.mutate(
      {
        postId: post.id,
        userId,
        actorId: activeActor.id ?? userId,
        actorType: activeActor.type === 'business' ? 'business' : 'personal',
        isLiked: current.isLiked,
      },
      {
        onError: () => setLocalLikeState(prev => new Map(prev).set(post.id, current)),
      }
    );
  }, [userId, activeActor, localLikeState, likeMutation]);

  const getActiveLikeState = useCallback((post: FeedPost | null) => {
    if (!post) return { isLiked: false, count: 0 };
    return localLikeState.get(post.id) ?? { isLiked: post.isLikedByMe, count: post.likeCount };
  }, [localLikeState]);

  const resetLikes = useCallback(() => {
    setLocalLikeState(new Map());
  }, []);

  return { handleLike, getActiveLikeState, resetLikes };
}
