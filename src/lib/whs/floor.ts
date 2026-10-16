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
  key: 'categoryFour' | 'categoryThree' | 'categoryTwo' | 'singleFigures' | 'categoryOne' | 'scratch';
}

/**
 * BRIEF_HANDICAP_TAB_REBUILD_6A: six rungs, descending. The category values
 * are GB&I handicap category boundaries, not cosmetic targets of our choosing.
 * Check the exact edges against England Golf's published bands rather than
 * treating this brief as authoritative verification of those boundaries.
 * Single figures and scratch remain the familiar milestones between/below them.
 * Keep the intermediate bands: the old four-rung ladder left most club golfers
 * with unnecessarily distant targets (17 now targets 11.4; 28 targets 26.4).
 */
export const FLOOR_LADDER: readonly FloorRung[] = [
  { index: 26.4, key: 'categoryFour' },
  { index: 18.4, key: 'categoryThree' },
  { index: 11.4, key: 'categoryTwo' },
  { index: 9.9, key: 'singleFigures' },
  { index: 5.4, key: 'categoryOne' },
  { index: 0.0, key: 'scratch' },
];

/**
 * §6.2: the target is the next milestone DOWN — the highest rung still BELOW
 * the member's current index. A 28 gets category four, a 24 category three,
 * a 17 category two, a 10 single figures, a 7 category one, a 2 scratch.
 * AT OR BELOW SCRATCH there is no rung left:
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
