/** MEDIA_ENGINE_1_R: a known course count is a required input; no default or
 * fallback. The monotonic floor is exclusive: only holes below it are disabled.
 */
export function selectableHole(hole: number, holeCount: number, floor: number): boolean {
  return Number.isInteger(hole) && hole >= 1 && hole <= holeCount && hole >= floor;
}

export function holeNumbers(holeCount: number): number[] {
  if (!Number.isInteger(holeCount) || holeCount <= 0) return [];
  return Array.from({ length: holeCount }, (_, index) => index + 1);
}