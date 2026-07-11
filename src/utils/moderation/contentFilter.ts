/**
 * Shared content-moderation utility.
 *
 * Server-side enforcement lives in the `tg_reject_banned_terms` trigger on
 * posts / comments_v2 / course_ratings / messages — the client-side check
 * here is a UX shortcut so users see a helpful error before submission.
 *
 * Keep this list in sync with public.moderation_banned_terms (or move both
 * to a shared config table + hook if the list grows).
 */

const BANNED_TERMS: readonly string[] = [
  'faggot',
  'nigger',
  'nigga',
  'retard',
  'kike',
  'spic',
  'chink',
  'tranny',
  'cunt',
  'rapist',
  'pedo',
  'pedophile',
];

const BOUNDARY = /[\p{L}\p{N}]/u;

export function containsBannedTerm(input: string | null | undefined): boolean {
  if (!input) return false;
  const lower = input.toLowerCase();
  for (const term of BANNED_TERMS) {
    let idx = 0;
    while ((idx = lower.indexOf(term, idx)) !== -1) {
      const before = idx === 0 ? '' : lower[idx - 1];
      const after = lower[idx + term.length] ?? '';
      if (!BOUNDARY.test(before) && !BOUNDARY.test(after)) return true;
      idx += term.length;
    }
  }
  return false;
}

export const MODERATION_ERROR_MESSAGE =
  'This content violates our community standards.';

/** Convenience: throw a user-facing error if the text is disallowed. */
export function assertClean(input: string | null | undefined): void {
  if (containsBannedTerm(input)) {
    throw new Error(MODERATION_ERROR_MESSAGE);
  }
}
