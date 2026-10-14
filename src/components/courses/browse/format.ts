import type React from "react";
/** Shared figure formatting for the Courses page sections. */
export const fmtCount = (n: number) => n.toLocaleString('en-GB');

/** THE to-par display value for every Courses page section: "+12.1", "−0.4"
 * (true minus), "level" at exactly par. The hero keeps its own sentence. */
export function fmtToPar(v: number | null | undefined): string | null {
  if (v == null || !Number.isFinite(v)) return null;
  const r = Math.round(v * 10) / 10;
  if (r === 0) return 'level';
  return r > 0 ? `+${r.toFixed(1)}` : `\u2212${Math.abs(r).toFixed(1)}`;
}

/** A to-par value as a fact-list item: "plays to +12.1" / "plays level". */
export function playsToPar(v: number | null | undefined): string | null {
  const p = fmtToPar(v);
  if (p == null) return null;
  return p === 'level' ? 'plays level' : `plays to ${p}`;
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
