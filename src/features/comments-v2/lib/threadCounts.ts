/**
 * BRIEF_COMMENTS_SHEET G.1 / G.2 — THE SHEET'S COUNT IS WHAT IT RENDERS.
 *
 * The header number used to come from posts.comment_count (everyone's) while
 * the body was this viewer's rows after hidden/blocked filtering — one fact
 * read from two places, so "1 comment" sat above "No comments yet". The count
 * is now derived from the SAME threads array the body maps over. A reply
 * counts, as it always has.
 */
import type { CommentV2 } from '../hooks/useCommentsV2';

export function visibleCommentCount(threads: Pick<CommentV2, 'replies'>[]): number {
  return threads.reduce((n, t) => n + 1 + t.replies.length, 0);
}

/**
 * The difference between the global total and what is on screen. Only stated
 * once every page is in: with earlier pages still unloaded the gap is
 * "not fetched yet", not "hidden", and saying otherwise would be a new lie.
 */
export function hiddenCommentCount(globalTotal: number, visible: number, allLoaded: boolean): number {
  if (!allLoaded) return 0;
  return Math.max(0, globalTotal - visible);
}
