/**
 * ONE ORDINAL FORMATTER for the standing shelf and consequence headlines.
 * English receives its grammatical suffix. Every other shipped locale,
 * including the en-XA layout stress locale, receives the plain figure rather
 * than an invented ordinal system.
 */
export function standingOrdinal(value: number, locale: string): string {
  if (locale.toLowerCase() !== 'en') return String(value);
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