/**
 * HOME'S RAIL INSERTION RULE (Phase 3, option A).
 * Deliberately NOT shared with Explore's shelfCadence: Phase 4 retires Explore's Community composition, so a shared abstraction would be deleted work.
 *
 * Slots are keyed on a post card's postIndex (real cards only), so a rail that
 * lands after card 6 stays after card 6 when page two arrives.
 */
export const HOME_RAIL_CADENCE = { first: 6, every: 6 } as const;

export type HomeRailKind = 'featuredRound' | 'clubWeek' | 'standing';

/** Rail rendered AFTER the card at `postIndex` (0-based), or null. */
export function homeRailAfter(postIndex: number): HomeRailKind | null {
  const n = postIndex + 1 - HOME_RAIL_CADENCE.first;
  if (n < 0 || n % HOME_RAIL_CADENCE.every !== 0) return null;
  const ordinal = n / HOME_RAIL_CADENCE.every;
  if (ordinal === 0) return 'featuredRound'; // once per feed session
  return ordinal % 2 === 1 ? 'clubWeek' : 'standing';
}
