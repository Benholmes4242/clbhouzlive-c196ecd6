/**
 * Where a member opened the comment composer from (section C instrumentation).
 *
 * 'footer_glyph' — the comment glyph in the card footer, the only entry point
 *                  on a card with no comments.
 * 'preview_row'  — one of the up-to-two comment lines inside the footer, or the
 *                  see-all beneath them.
 * 'sheet'        — the sheet was opened by anything else (default).
 *
 * Carried on the EXISTING post_comment_open event rather than a second event,
 * so before/after comparison is one series.
 */
export type CommentOpenSource = 'footer_glyph' | 'preview_row' | 'sheet';
