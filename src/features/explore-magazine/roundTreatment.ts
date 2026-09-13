import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { StreamItem } from './streamItem';

export type RoundTreatment = 'shape' | 'ticks' | 'bar' | 'none';
export const MIN_SHAPE_SPAN = 3;
export const MIN_TICK_OFF_PAR = 3;

function holeDeltas(shape: HoleShape | null | undefined): number[] {
  if (!shape) return [];
  return shape.holes.flatMap((hole) =>
    hole.par != null && hole.strokes != null ? [hole.strokes - hole.par] : [],
  );
}

export function cumulativeSpan(shape: HoleShape | null | undefined): number | null {
  if (!shape || shape.series.length < 2) return null;
  return Math.max(...shape.series) - Math.min(...shape.series);
}

export function offParHoleCount(shape: HoleShape | null | undefined): number {
  return holeDeltas(shape).filter((delta) => delta !== 0).length;
}

/** First-match rule for the Explore round visual. No reads happen here. */
export function treatmentFor(
  item: StreamItem,
  shape: HoleShape | null | undefined,
): RoundTreatment {
  const { facts } = item;
  const deltas = holeDeltas(shape);

  // A quiet ace remains a single, earned gold mark. Other notable holes must
  // form a readable row and otherwise fall through to the next treatment.
  if ((facts.holes_in_one ?? 0) > 0) return 'ticks';
  const shapeQualifies = (cumulativeSpan(shape) ?? -1) >= MIN_SHAPE_SPAN;
  if (((facts.to_par ?? 0) < 0 || facts.is_course_record === true) && shapeQualifies) return 'shape';
  const ticksQualify = offParHoleCount(shape) >= MIN_TICK_OFF_PAR;
  if (((facts.albatrosses ?? 0) > 0 || deltas.some((delta) => delta <= -2 || delta >= 2)) && ticksQualify) {
    return 'ticks';
  }

  const derivedClean =
    facts.clean_card == null && deltas.length > 0
      ? deltas.every((delta) => delta <= 0)
      : false;
  if ((facts.birdies ?? 0) >= 4 || facts.clean_card === true || derivedClean) return 'bar';
  return 'none';
}
