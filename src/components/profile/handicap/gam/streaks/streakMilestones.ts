import type { StreakType } from '@/lib/gam/types';

/**
 * Per-streak milestone ladders. Numbers are tuned to actual golf difficulty,
 * not arbitrary round numbers. The ladder is used by the progress bar on the
 * featured streak card to give the user a concrete "next target" beyond their
 * personal best.
 *
 * Picking rule (see milestoneFor below):
 *   - Find the lowest milestone strictly greater than current
 *   - If no such milestone exists (user has exceeded the whole ladder), return null
 *     and the UI shows "Legendary streak" instead of a numeric target
 */
export const STREAK_MILESTONES: Record<StreakType, readonly number[]> = {
  counter: [3, 5, 10, 20, 50],
  cutting: [2, 3, 5, 10],
  sub_80: [2, 3, 5, 10],
  no_up: [5, 10, 20, 50],
  sub_par: [2, 3],
  birdie_round: [3, 5, 10, 20],
  round_played: [4, 8, 13, 26, 52],
};

/**
 * Find the next milestone for a streak.
 * Returns null when the user has exceeded the entire ladder.
 */
export function milestoneFor(streakType: StreakType, current: number): number | null {
  const ladder = STREAK_MILESTONES[streakType];
  return ladder.find((m) => m > current) ?? null;
}
