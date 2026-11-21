/** These are what was scored, not what counts for handicap.
 * Handicap code keeps using adjusted figures; this module has no runtime dependencies.
 */
interface GrossFigures {
  actual_gross?: number | null;
  adjusted_gross?: number | null;
}

interface ScoredHole extends GrossFigures {
  hole_no: number;
  played?: boolean | null;
}

export function holeStrokes(h: GrossFigures): number | null {
  return h.actual_gross ?? h.adjusted_gross ?? null;
}

export function actualRoundGross(
  score: GrossFigures & { total_holes?: number | null },
  holes: readonly ScoredHole[],
): number | null {
  const declared = score.total_holes;
  if (
    typeof declared === 'number' && declared > 0 &&
    holes.length === declared &&
    new Set(holes.map((h) => h.hole_no)).size === declared &&
    holes.every((h) => h.played === true && h.actual_gross != null)
  ) {
    return holes.reduce((sum, h) => sum + (h.actual_gross ?? 0), 0);
  }
  return score.actual_gross ?? score.adjusted_gross ?? null;
}