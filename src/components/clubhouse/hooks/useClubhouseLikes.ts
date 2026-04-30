import { useState, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useLikeMutation } from '@/components/media-system/hooks/useLikeMutation';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseClubhouseLikesOptions {
  userId: string | undefined;
  activeActor: { id: string; type: string } | null;
}

/**
 * Manages PENDING optimistic like state for the Clubhouse feed.
 *
 * Post-engagementCache refactor: the Map only holds in-flight optimistic
 * overrides. Once the mutation settles, `patchEngagement` updates the post
 * prop directly via the cache, and we clear the override. Display falls back
 * to the (now-fresh) post prop.
 */
export function useClubhouseLikes({ userId, activeActor }: UseClubhouseLikesOptions) {
  const likeMutation = useLikeMutation();
  const [localLikeState, setLocalLikeState] = useState<Map<string, { isLiked: boolean; count: number }>>(new Map());

  const clearOverride = useCallback((postId: string) => {
    setLocalLikeState(prev => {
      if (!prev.has(postId)) return prev;
      const next = new Map(prev);
      next.delete(postId);
      return next;
    });
  }, []);

  const handleLike = useCallback((post: FeedPost | null) => {
    if (!userId || !post || !activeActor) return;

    const wasLiked = post.isLikedByMe;

    // Optimistic override for instant feedback before mutation settles.
    setLocalLikeState(prev => new Map(prev).set(post.id, {
      isLiked: !wasLiked,
      count: Math.max(0, post.likeCount + (wasLiked ? -1 : 1)),
    }));

    analyticsEvents.track('video_like', { post_id: post.id, action: wasLiked ? 'unlike' : 'like' });
    analyticsEvents.track('post_like', { post_id: post.id, action: wasLiked ? 'unlike' : 'like' });

    likeMutation.mutate(
      {
        postId: post.id,
        userId,
        actorId: activeActor.id ?? userId,
        actorType: activeActor.type === 'business' ? 'business' : 'personal',
        isLiked: wasLiked,
      },
      {
        // Clear override on success or error — cache patch (or rollback) now
        // drives the display via the post prop.
        onSuccess: () => clearOverride(post.id),
        onError: () => clearOverride(post.id),
      }
    );
  }, [userId, activeActor, likeMutation, clearOverride]);

  const getActiveLikeState = useCallback((post: FeedPost | null) => {
    if (!post) return { isLiked: false, count: 0 };
    const pending = localLikeState.get(post.id);
    if (pending) return pending;
    return { isLiked: post.isLikedByMe, count: post.likeCount };
  }, [localLikeState]);

  const resetLikes = useCallback(() => {
    setLocalLikeState(new Map());
  }, []);

  return { handleLike, getActiveLikeState, resetLikes };
}
