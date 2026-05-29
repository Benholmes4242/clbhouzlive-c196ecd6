/**
 * fmtScore — format a numeric score relative to par as a signed string.
 * Extracted (inlined) from the nuked HybridHero.utils so leftover hooks still compile.
 * 0 → "E", positive → "+N", negative → "-N".
 */
export function fmtScore(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return 'E';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${n}`;
}
