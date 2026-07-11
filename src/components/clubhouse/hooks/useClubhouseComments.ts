import { useState, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * Manages comments sheet open/close state and exposes a comment-count
 * accessor. Optimistic bumps are owned by comments-v2 (useCommentsV2 +
 * DB triggers) — the old handleCommentPosted / handleCommentDeleted
 * bumpers are gone.
 */
export function useClubhouseComments(_activeActor?: { type: string; id: string } | null) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  const openComments = useCallback((_post?: FeedPost | null) => {
    setCommentsOpen(true);
    analyticsEvents.track('post_comment_open', {});
  }, []);
  const closeComments = useCallback(() => {
    setCommentsOpen(false);
  }, []);

  const getCommentCount = useCallback((post: FeedPost | null): number => {
    if (!post) return 0;
    return post.commentCount;
  }, []);

  const resetComments = useCallback(() => {
    setCommentsOpen(false);
  }, []);

  const overlayVisible = !commentsOpen;

  return { commentsOpen, overlayVisible, openComments, closeComments, getCommentCount, resetComments };
}
