/**
 * Applies an EngagementDelta to a single post-shaped object.
 *
 * Keeps every legacy field name in sync (camelCase + snake_case) so consumers
 * can read whichever variant is convenient. Returns a NEW object — does not
 * mutate the input.
 *
 * Returns the input unchanged if `post` doesn't match `postId` (handy when
 * mapping over arrays). Pass `null` postId to apply unconditionally — used
 * by the engagement-record code path inside engagementCache.
 */

export interface EngagementDelta {
  /** New value for `isLikedByMe`. Omit to leave unchanged. */
  isLikedByMe?: boolean;
  /** Apply +1 / -1 to like count. Omit to leave unchanged. */
  likeCountDelta?: number;
  /** Apply +1 / -1 to comment count. Omit to leave unchanged. */
  commentCountDelta?: number;
}

export function applyEngagementDelta<T extends Record<string, any>>(
  post: T,
  postId: string | null,
  delta: EngagementDelta,
): T {
  if (!post) return post;
  if (postId !== null && post.id !== postId) return post;

  const patched: any = { ...post };

  if (delta.isLikedByMe !== undefined) {
    patched.isLikedByMe = delta.isLikedByMe;
    patched.is_liked_by_me = delta.isLikedByMe;
    patched.hasLiked = delta.isLikedByMe;
    patched.has_liked = delta.isLikedByMe;
  }

  if (delta.likeCountDelta !== undefined) {
    const current =
      patched.likeCount ??
      patched.like_count ??
      patched.likesCount ??
      patched.likes_count ??
      0;
    const next = Math.max(0, current + delta.likeCountDelta);
    patched.likeCount = next;
    patched.like_count = next;
    patched.likesCount = next;
    patched.likes_count = next;
  }

  if (delta.commentCountDelta !== undefined) {
    const current =
      patched.commentCount ??
      patched.comment_count ??
      patched.commentsCount ??
      patched.comments_count ??
      0;
    const next = Math.max(0, current + delta.commentCountDelta);
    patched.commentCount = next;
    patched.comment_count = next;
    patched.commentsCount = next;
    patched.comments_count = next;
  }

  return patched as T;
}
