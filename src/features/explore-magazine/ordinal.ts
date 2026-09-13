/**
 * ONE ORDINAL FORMATTER for the standing shelf and consequence headlines.
 * English receives its grammatical suffix. Every other shipped locale,
 * including the en-XA layout stress locale, receives the plain figure rather
 * than an invented ordinal system.
 */
/** English regional tags ("en-GB", "en-US") ARE English and take the suffix.
 *  The pseudo-locale en-XA does not: it is a layout stress locale and is treated
 *  like the other five shipped locales, which receive the plain figure. This is
 *  why a live card read "9 of the 18" — the runtime locale was "en-GB", so the
 *  strict equality below rejected it and printed the bare number. */
function isEnglish(locale: string): boolean {
  const tag = locale.toLowerCase();
  if (tag === 'en-xa') return false;
  return tag === 'en' || tag.startsWith('en-');
}

export function standingOrdinal(value: number, locale: string): string {
  if (!isEnglish(locale)) return String(value);
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