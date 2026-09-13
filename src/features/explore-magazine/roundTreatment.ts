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
 * third colour by design.
 */
export type RoundTreatment = 'line' | 'none';

/** The cumulative series must TRAVEL this far (min to max, in strokes) for a
 *  round with nothing to mark to still earn a line. Derived from real rounds:
 *  the newest-100 eligible 18-hole span distribution ran 2 / 6 / 10 / 14 / 28
 *  across p10 / p25 / p50 / p75 / max, so 3 keeps the flat streaks off the
 *  page without discarding ordinary rounds that actually moved. */
export const MIN_SHAPE_SPAN = 3;

export interface RoundDot {
  /** Index into HoleShape.series — the cumulative value AFTER the hole, so the
   *  dot sits on the trace rather than beside it. */
  i: number;
  tone: string;
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

/** True when the round carries an achievement worth marking on the line. */
export function hasMarkableAchievement(item: StreamItem): boolean {
  const { facts } = item;
  return (
    (facts.holes_in_one ?? 0) > 0 ||
    (facts.albatrosses ?? 0) > 0 ||
    (facts.eagles ?? 0) > 0 ||
    (facts.birdies ?? 0) >= 4 ||
    (facts.to_par ?? 0) < 0 ||
    facts.is_course_record === true
  );
}

/**
 * First match wins:
 *  - an achievement worth marking  -> line (with dots)
 *  - otherwise a series that travels -> line (no dots)
 *  - otherwise nothing. The photograph and the headline carry the card.
 */
export function treatmentFor(
  item: StreamItem,
  shape: HoleShape | null | undefined,
): RoundTreatment {
  if (!shape) return 'none';
  if (hasMarkableAchievement(item)) return 'line';
  if ((cumulativeSpan(shape) ?? -1) >= MIN_SHAPE_SPAN) return 'line';
  return 'none';
}

/**
 * The dots, in series order. ONLY good holes: ace / albatross / eagle in
 * broadcast gold, birdie in the under-par red. Pars, bogeys, doubles and
 * triples get NOTHING — see the note at the top of this file.
 *
 * Empty when the round earned its line on movement alone, so a round with no
 * achievement never gains marks by the back door.
 */
export function dotsFor(item: StreamItem, shape: HoleShape | null | undefined): RoundDot[] {
  if (!shape || !hasMarkableAchievement(item)) return [];
  const out: RoundDot[] = [];
  holeDeltas(shape).forEach(({ delta, strokes }, index) => {
    if (strokes === 1 || delta <= -2) out.push({ i: index + 1, tone: SC_FILL_GOLD });
    else if (delta === -1) out.push({ i: index + 1, tone: TOPAR_UNDER_DARK });
  });
  return out;
}
