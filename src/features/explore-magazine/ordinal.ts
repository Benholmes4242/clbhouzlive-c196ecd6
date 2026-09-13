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