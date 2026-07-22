/**
 * Normalise a string for type-to-confirm comparison so iOS smart punctuation
 * (curly quotes/apostrophes injected by autocorrect) doesn't defeat the match.
 *
 * Steps:
 *  1. NFKC normalize
 *  2. Map U+2018/U+2019 (curly single) → U+0027 (straight apostrophe)
 *     Map U+201C/U+201D (curly double) → U+0022 (straight quote)
 *  3. Trim whitespace
 *  4. Lowercase (case-insensitive compare)
 */
export function normalizeConfirmValue(v: string | null | undefined): string {
  if (v == null) return '';
  return v
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim()
    .toLowerCase();
}

/** Case-insensitive, punctuation-normalised equality check. */
export function confirmMatches(
  typed: string | null | undefined,
  target: string | null | undefined,
): boolean {
  return normalizeConfirmValue(typed) === normalizeConfirmValue(target);
}
