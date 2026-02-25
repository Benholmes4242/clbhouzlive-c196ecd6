/**
 * CommentDeepLink — Utility for generating and parsing comment deep links.
 * URL format: /post/{postId}/comment/{commentId}
 */

export function generateCommentLink(postId: string, commentId: string): string {
  return `${window.location.origin}/post/${postId}/comment/${commentId}`;
}

export function parseCommentLink(url: string): { postId: string; commentId: string } | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/post\/([^/]+)\/comment\/([^/]+)/);
    if (match) return { postId: match[1], commentId: match[2] };
  } catch {}
  return null;
}

/**
 * Generates smart notification copy based on context.
 */
export function getSmartNotificationCopy(params: {
  actorName: string;
  type: 'comment' | 'reply' | 'reaction' | 'voice' | 'mention';
  reactionEmoji?: string;
  courseName?: string;
  commentPreview?: string;
}): string {
  const { actorName, type, reactionEmoji, courseName, commentPreview } = params;

  switch (type) {
    case 'voice':
      return courseName
        ? `${actorName} dropped a voice note on your shot at ${courseName}`
        : `${actorName} left a voice note on your post`;
    case 'reaction':
      return reactionEmoji
        ? `Your comment got a ${reactionEmoji} reaction`
        : `${actorName} reacted to your comment`;
    case 'reply':
      return commentPreview
        ? `${actorName} replied: "${commentPreview.slice(0, 50)}${commentPreview.length > 50 ? '…' : ''}"`
        : `${actorName} replied to your comment`;
    case 'mention':
      return courseName
        ? `${actorName} tagged ${courseName} in the comments`
        : `${actorName} mentioned you in a comment`;
    case 'comment':
    default:
      return `${actorName} commented on your post`;
  }
}
