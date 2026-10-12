import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import type { StreamItem } from './streamItem';

/**
 * THE EXPLORE ROUND VISUAL — ONE TREATMENT, GOOD THINGS ONLY.
 *
 * WHY THE OLD FOUR-TREATMENT RULE WAS REMOVED, so nobody rebuilds it: the
 * ticks treatment outlined whichever hole was most DRAMATIC and captioned it
 * — "TRIPLE ON 8", "DOUBLE ON 7". That put a member's WORST HOLE in a white
 * outline with a label on a public page. Nobody wants their triple bogey
 * captioned and posted. It was a design error, not a rendering fault.
 *
 * This page marks ACHIEVEMENT. A bad hole is part of the round and shows in
 * the LINE'S SHAPE — it is never called out, never labelled, never outlined.
 * So: do NOT "complete the palette" by adding a dot for bogeys, doubles or
 * triples. Gold is ace / albatross / eagle, red is a birdie, and there is no
 * third colour by design. Rarity within gold is carried by the HALO (and,
 * once per round, an ACE / ALBATROSS label), not by a third colour.
 */
export type RoundTreatment = 'line' | 'none';

/** The shared plot band for every Explore score trace. This is the All-tab
 *  featured-round hero's established 72px total band minus its 13px end-label
 *  footer, so ordinary score tiles draw with exactly the same vertical range. */
/* ARCHITECTURE RULE (moved from AGENTS.md): Explore score tiles stay full-width and use SCORE_TRACE_PLOT_HEIGHT; every tile with settled hole detail renders its trace, matching the All-tab hero. */
export const SCORE_TRACE_PLOT_HEIGHT = 72 - 13;

export interface RoundDot {
  /** Index into HoleShape.series — the cumulative value AFTER the hole, so the
   *  dot sits on the trace rather than beside it. */
  i: number;
  tone: string;
  /** Mock-measured. Rarity is carried by diameter and ring weight, NOT by hue:
   *  every mark in the set drops below 1.3:1 against some real ground, while
   *  none scores under 5.10:1 against the canvas ring. The ring is the
   *  legibility mechanism, so it gets heavier as the mark gets rarer. */
  r: number;
  ring: number;
  /** Rare marks only: the halo radius. */
  halo?: number;
  /** At most ONE per round. Rare marks only. Never a bad hole. */
  label?: string | null;
}

function holeDeltas(shape: HoleShape | null | undefined) {
  if (!shape) return [] as { delta: number; strokes: number }[];
  return shape.holes.flatMap((hole) =>
    hole.par != null && hole.strokes != null
      ? [{ delta: hole.strokes - hole.par, strokes: hole.strokes }]
      : [],
  );
}

export function cumulativeSpan(shape: HoleShape | null | undefined): number | null {
  if (!shape || shape.series.length < 2) return null;
  return Math.max(...shape.series) - Math.min(...shape.series);
}

/** Every score tile with settled hole detail carries its round trace. */
export function treatmentFor(
  _item: StreamItem,
  shape: HoleShape | null | undefined,
): RoundTreatment {
  if (!shape) return 'none';
  return 'line';
}

/**
 * The dots, in series order — the ONE rule every round trace shares. ONLY good
 * holes (BRIEF_ROUND_LINE_MARKS E.2), tested ace first because an ace on a par
 * 5 is also an albatross by delta. Pars, bogeys, doubles and triples get
 * NOTHING — see the note at the top of this file. A round-level verdict never
 * suppresses a hole-level fact. At most one label: the earliest ace, else the
 * earliest albatross.
 */
export function goodHoleDots(shape: HoleShape | null | undefined): RoundDot[] {
  if (!shape) return [];
  const out: RoundDot[] = [];
  const rare = { r: 4.2, ring: 1.2, halo: 7.4 } as const;
  holeDeltas(shape).forEach(({ delta, strokes }, index) => {
    const i = index + 1;
    if (strokes === 1) out.push({ i, tone: SC_FILL_GOLD, ...rare, label: 'ACE' });
    else if (delta <= -3) out.push({ i, tone: SC_FILL_GOLD, ...rare, label: 'ALBATROSS' });
    else if (delta === -2) out.push({ i, tone: SC_FILL_GOLD, r: 4.2, ring: 1.2 });
    else if (delta === -1) out.push({ i, tone: TOPAR_UNDER_DARK, r: 2.8, ring: 0.8 });
  });
  const keep = out.find((d) => d.label === 'ACE') ?? out.find((d) => d.label === 'ALBATROSS');
  for (const d of out) if (d.label && d !== keep) d.label = null;
  return out;
}
