/**
 * Typography + colour tokens shared by the stratified My Ratings cards.
 * Inlined here (rather than imported from a global token module) so the
 * editorial card aesthetic — Georgia serif numerals, amber accents,
 * specific ink ramp — is grouped with its consumers and easy to tune.
 */

export const FONT_SERIF = 'Georgia, "Times New Roman", serif';
export const FONT_SANS =
  '"Geist", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
export const FONT_MONO =
  '"Geist Mono", ui-monospace, SFMono-Regular, monospace';

// Ink ramp
export const INK = '#0F172A';
export const INK_SECONDARY = '#475569';
export const INK_TERTIARY = '#94A3B8';
export const INK_QUATERNARY = '#CBD5E1';

// Brand
export const AMBER = '#F7931E';
export const AMBER_DEEP = '#C97211';

// Surfaces / lines
export const PAPER = '#FFFFFF';
export const HAIRLINE = '#E2E8F0';
export const HAIRLINE_SOFT = '#EEF2F6';

/** Format a date as "24 March, 2026" — long-form editorial style. */
export function formatEditorialDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
}

/** Split a numeric rating into integer + decimal parts for serif display. */
export function splitRating(rating: number): { int: number; dec: number } {
  const int = Math.floor(rating);
  const dec = Math.round((rating * 10) % 10);
  return { int, dec };
}
