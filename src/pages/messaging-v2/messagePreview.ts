/**
 * BRIEF_MESSAGES_ECHO_PALETTE §2.1 — EVERY ROW HAS A PREVIEW.
 *
 * WHAT THE AUDIT FOUND (reported because the brief asks whether the data exists
 * or whether nothing is stored):
 *
 *   THE DATA EXISTS. `msg_send` writes `conversations.last_message_preview` on
 *   every single send, and for a message with no text it writes a LABEL:
 *   'Photo' | 'Video' | 'Voice message' | 'Attachment'. So a media-only message
 *   already has a preview server-side.
 *
 *   THE BLANK ROWS ARE EMPTY THREADS. Every conversation in Ben's inbox with a
 *   NULL preview has ZERO messages — they are threads that were started and
 *   never spoken in. A row for a conversation with no messages is not a missing
 *   preview, it is a row that should not be in the list. `isSpeakableThread`
 *   below is what keeps them out.
 *
 *   WHAT IS GENUINELY MISSING: `get_inbox` returns no sender for the last
 *   message, so the list cannot prefix "You: " or "Dave: " on a group thread.
 *   That needs one extra column from the RPC; until then rows show the preview
 *   without a speaker, which is honest rather than wrong.
 */

import type { InboxConversation } from '@/types/messaging';

/** Server-written labels, mapped through i18n so they are not English-only. */
const SERVER_LABELS: Record<string, string> = {
  Photo: 'preview.photo',
  Video: 'preview.video',
  'Voice message': 'preview.voice',
  Attachment: 'preview.attachment',
};

/**
 * A thread has something to say. Threads with no messages are excluded from the
 * list entirely (§2.1) — the fix for a blank row is not inventing copy for it.
 */
export function isSpeakableThread(c: InboxConversation): boolean {
  return !!(c.last_message_preview && c.last_message_preview.trim().length > 0);
}

/**
 * The line a row exists to show. `translate` is i18next's `t` scoped to the
 * messaging namespace.
 */
export function resolvePreview(
  c: InboxConversation,
  translate: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const raw = (c.last_message_preview ?? '').trim();
  if (!raw) return translate('preview.empty', { defaultValue: 'No messages yet' });
  const key = SERVER_LABELS[raw];
  if (key) return translate(key, { defaultValue: raw });
  return raw;
}
