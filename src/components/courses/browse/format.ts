import type React from "react";
/** Shared figure formatting for the Courses page sections. */
export const fmtCount = (n: number) => n.toLocaleString('en-GB');

/** THE to-par display value for every Courses page section: "+12.1", "−0.4"
 * (true minus), "level" at exactly par. A FACT LIST takes this value ("plays level").
 * Exactly two SENTENCE sites legitimately differ, taking the phrase instead:
 * CoursesPageHero's fact line and BrowseCourseCard's "Plays to … on average"
 * ("level par"). One spelling of the word, two grammars. Nothing else in the
 * app may spell level par a third way. */
export function fmtToPar(v: number | null | undefined): string | null {
  if (v == null || !Number.isFinite(v)) return null;
  const r = Math.round(v * 10) / 10;
  if (r === 0) return 'level';
  return r > 0 ? `+${r.toFixed(1)}` : `\u2212${Math.abs(r).toFixed(1)}`;
}

/** A to-par value as a fact-list item: "Plays to +12.1" / "Plays level".
 * The capital is there because the value LEADS a middot-separated item — every
 * item in that list is its own unit, and one beginning with a letter takes a
 * capital while items beginning with a numeral raise no question. Anyone using
 * this mid-sentence in future needs fmtToPar instead. */
export function playsToPar(v: number | null | undefined): string | null {
  const p = fmtToPar(v);
  if (p == null) return null;
  return p === 'level' ? 'Plays level' : `Plays to ${p}`;
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

/**
 * joinNames — "Thomas", "Thomas and Amy", "Thomas, Amy and 3 more".
 * DELIBERATELY NOT LikedByRow's grammar: that sentence lists people who did
 * something to one object ("Liked by Thomas, Amy and 10 others"); this one is a
 * list of people beside a count of a different thing ("Thomas and Amy · 2
 * rounds"). One vocabulary, two grammars — neither is to be unified into the other.
 */
export function joinNames(names: string[], max = 2): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length <= max) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${names.slice(0, max).join(', ')} and ${fmtCount(names.length - max)} more`;
}
