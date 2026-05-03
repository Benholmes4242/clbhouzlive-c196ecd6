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
