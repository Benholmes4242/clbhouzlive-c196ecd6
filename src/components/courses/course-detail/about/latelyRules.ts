/** CS1 — pure rules for the Course tab's "Lately here" section. */

/** The three figures need at least this many rounds in the window. */
export const LATELY_TILES_MIN = 4;

/** "+10.8" / "E" / "−1.2" (U+2212), one decimal. */
export function signedAvg(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '–';
  const r = Math.round(v * 10) / 10;
  if (r === 0) return 'E';
  return r < 0 ? `−${Math.abs(r).toFixed(1)}` : `+${r.toFixed(1)}`;
}

/** "Oct 29"; the year joins only when it is not this year. Rendered uppercase. */
export function latelyShortDate(iso: string | null, locale = 'en', now = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  });
}
