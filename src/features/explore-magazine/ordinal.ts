/**
 * ONE ORDINAL FORMATTER for the standing shelf and consequence headlines.
 * English receives its grammatical suffix. Every other shipped locale,
 * including the en-XA layout stress locale, receives the plain figure rather
 * than an invented ordinal system.
 *
 * THE SUFFIX IS DECIDED BY THE BASE LANGUAGE, NEVER THE FULL TAG. i18next hands
 * callers the DETECTED tag, which on a UK device is "en-GB" and on a US device
 * "en-US". An exact === 'en' test therefore fell through to the plain figure and
 * printed "the 8 best round" on English devices. The stress locale en-XA is not
 * English and keeps the plain figure, so it is excluded explicitly.
 */
export function standingOrdinal(value: number, locale: string): string {
  const tag = locale.toLowerCase();
  const base = tag.split('-')[0];
  if (base !== 'en' || tag.startsWith('en-xa')) return String(value);
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}
/**
 * "A 75" OR "AN 88" (BRIEF_ROUND_HEADLINES §1). The article follows the SPOKEN
 * form of the score, not its spelling: eight, eleven, eighteen and every
 * eighty-something open on a vowel sound and take "an"; everything else takes
 * "a". A hundred-something is spoken "one hundred and eight", so the rule is
 * decided by the LEADING word — 108 is "a", 800 would be "an".
 *
 * English only: the article exists in the English templates alone, and a locale
 * without one simply never interpolates it.
 */
export function indefiniteArticleForScore(value: number): 'a' | 'an' {
  const n = Math.abs(Math.trunc(value));
  if (n >= 100) return Math.floor(n / 100) % 10 === 8 ? 'an' : 'a';
  if (n === 8 || n === 11 || n === 18) return 'an';
  return n >= 80 && n <= 89 ? 'an' : 'a';
}
