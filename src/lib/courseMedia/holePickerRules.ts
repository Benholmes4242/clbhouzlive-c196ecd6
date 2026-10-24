/** MEDIA_ENGINE_1_R: a known course count is a required input; no default or
 * fallback. The batch walk-forward floor is retired: every known hole is
 * always selectable.
 */
export function selectableHole(hole: number, holeCount: number): boolean {
  return Number.isInteger(hole) && hole >= 1 && hole <= holeCount;
}

export function holeNumbers(holeCount: number): number[] {
  if (!Number.isInteger(holeCount) || holeCount <= 0) return [];
  return Array.from({ length: holeCount }, (_, index) => index + 1);
}
