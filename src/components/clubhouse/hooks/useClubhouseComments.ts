import { useState, useCallback, useEffect } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * Manages comments sheet state and optimistic comment counts.
 * Re-wired for Brief 3: pauses/resumes video via ClubhouseStore.
 */
export function useClubhouseComments() {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCountOverrides, setCommentCountOverrides] = useState<Map<string, number>>(new Map());

  // Pause/resume video when comments open/close
  useEffect(() => {
    const { activeVideoElement, userPaused } = useClubhouseStore.getState();
    if (!activeVideoElement) return;
    if (commentsOpen) {
      if (!activeVideoElement.paused) activeVideoElement.pause();
    } else {
      if (!userPaused) activeVideoElement.play().catch(() => {});
    }
  }, [commentsOpen]);

  const openComments = useCallback(() => {
    setCommentsOpen(true);
    analyticsEvents.track('post_comment_open', {});
  }, []);
  const closeComments = useCallback(() => setCommentsOpen(false), []);

  const handleCommentPosted = useCallback((post: FeedPost | null) => {
    if (!post) return;
    setCommentCountOverrides(prev => {
      const next = new Map(prev);
      const current = next.get(post.id) ?? post.commentCount;
      next.set(post.id, current + 1);
      return next;
    });
  }, []);

  const handleCommentDeleted = useCallback((postId: string, currentCount: number) => {
    setCommentCountOverrides(prev => {
      const next = new Map(prev);
      const current = next.get(postId) ?? currentCount;
      next.set(postId, Math.max(0, current - 1));
      return next;
    });
  }, []);

  const getCommentCount = useCallback((post: FeedPost | null): number => {
    if (!post) return 0;
    return commentCountOverrides.get(post.id) ?? post.commentCount;
  }, [commentCountOverrides]);

  const resetComments = useCallback(() => {
    setCommentsOpen(false);
    setCommentCountOverrides(new Map());
  }, []);

  const overlayVisible = !commentsOpen;

  return { commentsOpen, overlayVisible, openComments, closeComments, handleCommentPosted, handleCommentDeleted, getCommentCount, resetComments };
}
