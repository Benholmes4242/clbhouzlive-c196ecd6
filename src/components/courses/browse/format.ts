import type React from "react";
/** Shared figure formatting for the Courses page sections. */
export const fmtCount = (n: number) => n.toLocaleString('en-GB');

/** "+12.1", "−0.4" — one decimal, true minus sign. Level par returns
 * LEVEL_PAR; callers render the shared hero.factLevelPar key for it. */
export const LEVEL_PAR = '__level__';

export function fmtToPar(v: number | null | undefined): string | null {
  if (v == null || !Number.isFinite(v)) return null;
  const r = Math.round(v * 10) / 10;
  if (r === 0) return LEVEL_PAR;
  return r > 0 ? `+${r.toFixed(1)}` : `\u2212${Math.abs(r).toFixed(1)}`;
}

export const plural = (n: number, one: string, many: string) =>
  `${fmtCount(n)} ${n === 1 ? one : many}`;

/** Full-bleed horizontal rail: first card on the gutter, runs off the right edge. */
export const RAIL_BLEED: React.CSSProperties = {
  display: 'flex',
  overflowX: 'auto',
  marginLeft: -16,
  marginRight: -16,
  paddingLeft: 16,
  paddingRight: 16,
};
