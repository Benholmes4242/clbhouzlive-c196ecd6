/**
 * commentDraft - sessionStorage persistence for the comment composer.
 *
 * BRIEF_SHEET_BACK_BEHAVIOUR_05 §2. `CommentsSheetV2` is a draft-holding sheet
 * whose work nothing persisted: back -> keep editing -> back still destroyed a
 * typed comment. The mechanism is deliberately the SAME as the review draft
 * (sessionStorage, a 24h window, a 400ms debounce) rather than a second one, so
 * there is one story about where in-progress words live.
 *
 * WHAT IS DIFFERENT FROM THE REVIEW DRAFT, AND WHY:
 * restoration is SILENT. A comment is one pass of one sentence, not a document;
 * a restoration notice would be heavier than the thing it protects, and would
 * teach members to dismiss notices that matter.
 *
 * TWO NAMESPACES, NEVER ONE (as for reviews):
 *   new comment on a thread  comment-draft:<targetType>:<targetId>
 *   edit of an existing one  comment-draft:edit:<commentId>
 * A draft on one post therefore cannot surface on another, and an unfinished
 * edit cannot leak into the new-comment box.
 *
 * NOT PERSISTED: the reply target. `replyingTo` is cleared when the sheet
 * closes, so restored words return as a top-level draft rather than silently
 * re-addressed to somebody the member may not have meant. Words are recovered;
 * the aim is restored, not guessed.
 */

const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Debounce for composer writes, matching the review composer exactly. */
export const COMMENT_DRAFT_DEBOUNCE_MS = 400;

interface CommentDraftShape {
  text: string;
  savedAt: number;
}

export function commentDraftKey(targetType: string, targetId: string) {
  return `comment-draft:${targetType}:${targetId}`;
}

export function commentEditDraftKey(commentId: string) {
  return `comment-draft:edit:${commentId}`;
}

export function readCommentDraft(key: string): string {
  try {
    if (typeof window === 'undefined') return '';
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as CommentDraftShape;
    if (!parsed || typeof parsed.savedAt !== 'number') return '';
    if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) return '';
    return typeof parsed.text === 'string' ? parsed.text : '';
  } catch {
    return '';
  }
}

export function writeCommentDraft(key: string, text: string) {
  try {
    if (typeof window === 'undefined') return;
    /* An empty box is not a draft: storing it would resurrect nothing and keep
       a stale key alive for 24h. */
    if (!text.trim()) {
      window.sessionStorage.removeItem(key);
      return;
    }
    const draft: CommentDraftShape = { text, savedAt: Date.now() };
    window.sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    /* private browsing throws */
  }
}

export function clearCommentDraft(key: string) {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(key);
  } catch {
    /* private browsing throws */
  }
}
