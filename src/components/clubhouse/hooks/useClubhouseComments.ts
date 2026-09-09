import { useState, useCallback } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import type { CommentOpenSource } from '@/types/commentOpenSource';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * Manages comments sheet open/close state and exposes a comment-count
 * accessor. Optimistic bumps are owned by comments-v2 (useCommentsV2 +
 * DB triggers) — the old handleCommentPosted / handleCommentDeleted
 * bumpers are gone.
 *
 * SECTION C: the EXISTING post_comment_open event now carries where the open
 * came from and the post's stored comment count at that moment, so removing the
 * always-visible prompt can be measured rather than argued about.
 */
export function useClubhouseComments(_activeActor?: { type: string; id: string } | null) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  const openComments = useCallback((post?: FeedPost | null, source: CommentOpenSource = 'sheet') => {
    setCommentsOpen(true);
    analyticsEvents.track('post_comment_open', {
      post_id: post?.id ?? null,
      source,
      comment_count: post?.commentCount ?? 0,
    });
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
