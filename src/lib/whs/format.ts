/**
 * Format a differential value with proper Unicode minus sign (U+2212),
 * not hyphen (U+002D). The Unicode minus is wider and aligns with the plus
 * sign baseline.
 */
export function fmtDiff(v: number, opts: { plus?: boolean } = {}): string {
  if (v < 0) return `\u2212${Math.abs(v).toFixed(1)}`;
  if (opts.plus) return `+${v.toFixed(1)}`;
  return v.toFixed(1);
}

/** Same idea but for axis labels — no '+' prefix on positive values. */
export function fmtAxis(v: number): string {
  if (v < 0) return `\u2212${Math.abs(v).toFixed(1)}`;
  return v.toFixed(1);
}

/** WHS displayed handicap (rounding convention: 1.4 → 1, 1.5 → 2). */
export function whsDisplayedHcp(h: number): number {
  return Math.floor(h + 0.5);
}

/** Format displayed handicap with plus prefix for negative values (WHS convention). */
export function formatDisplayedHcp(displayed: number): string {
  if (displayed < 0) return `+${Math.abs(displayed)}`;
  return `${displayed}`;
}

/**
 * Format a handicap index using WHS convention.
 *
 * Plus players (h<0): display with `+` prefix (e.g. `+2.4`)
 * Scratch (h=0): display as `0.0`
 * Bogey players (h>0): display as the number, no prefix (e.g. `5.2`)
 *
 * NOTE: Plus players' handicaps are conventionally written with `+` because they
 * GIVE strokes to the course (better than scratch). Never use a minus sign for
 * plus-player handicaps. This is different from differential formatting (fmtDiff)
 * which uses Unicode minus for negative values.
 */
export function fmtHcp(h: number): string {
  if (h < 0) return `+${Math.abs(h).toFixed(1)}`;
  if (h === 0) return '0.0';
  return h.toFixed(1);
}
