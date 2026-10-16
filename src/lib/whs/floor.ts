/**
 * THE FLOOR (BRIEF_HANDICAP_TAB_REBUILD phase 6).
 *
 * Pure derivations for FloorSection. §6.6: there is NO time projection of
 * any kind — improvement decelerates sharply near the floor, so the last
 * twelve months say almost nothing about the next twelve. The section states
 * the distance and the requirement, which are true, and stops.
 */

export interface FloorRung {
  index: number;
  key: 'bogeyGolf' | 'singleFigures' | 'categoryOne' | 'scratch';
}

/** §6.2: the four-rung ladder, descending. */
export const FLOOR_LADDER: readonly FloorRung[] = [
  { index: 18.0, key: 'bogeyGolf' },
  { index: 9.9, key: 'singleFigures' },
  { index: 5.4, key: 'categoryOne' },
  { index: 0.0, key: 'scratch' },
];

/**
 * §6.2: the target is the next milestone DOWN — the highest rung still BELOW
 * the member's current index. A 24 gets bogey golf, a 15 single figures, a 7
 * category one, a 2 scratch. AT OR BELOW SCRATCH there is no rung left:
 * null, and the section does not render.
 */
export function floorTarget(currentIndex: number): FloorRung | null {
  if (currentIndex <= 0) return null;
  return FLOOR_LADDER.find((r) => r.index < currentIndex) ?? null;
}

/**
 * §6.3: the proportional position of the current index on the scale from the
 * twelve-month high (0, left) to the target (1, right), clamped to the bar.
 */
export function floorScalePosition(high: number, target: number, current: number): number {
  if (high <= target) return 1;
  return Math.min(1, Math.max(0, (high - current) / (high - target)));
}

/** §6.4: how many of the last twenty differentials already meet the target. */
export function countMeeting(differentials: readonly number[], target: number): number {
  return differentials.filter((d) => d <= target).length;
}
