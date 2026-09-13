/**
 * THE STANDING BOARD SELECTOR (Ben's ruling on "Where you stand").
 *
 * TWO BOARDS ONLY, NET BY DEFAULT FOR EVERYONE, NO HANDICAP THRESHOLD.
 * Measured on production before this was built:
 *   - net carries a score on 99.3% of qualifying rows and covers the identical
 *     217 courses gross covers, so net costs nothing in coverage;
 *   - net is a real second ranking, not gross renamed: only 32 of 129
 *     member/course pairs hold the same rank on both, mean shift 2.81 places;
 *   - stableford reaches 46% of gross's coverage with a typical field of 2,
 *     which is not a standing, so it is not offered;
 *   - a handicap threshold is indefensible: a third of indexed members sit
 *     within +/-3 of an index of 5, and the 36 indexed members skew plus/low,
 *     so a threshold read off them would bake in a bias that gets more wrong
 *     as the base grows.
 *
 * THE CONSEQUENCE CARDS DO NOT READ THIS. A card is a dated statement about a
 * round that happened. A headline that flips because a dropdown moved stops
 * being a record of anything, so rank cards stay on gross and never consult
 * the selection here. Do not "fix" that later for consistency with the shelf:
 * the shelf is a live view, the card is a record.
 *
 * SELECTION HOLDS FOR THE SESSION, PER MEMBER, AND RESETS NEXT VISIT.
 * sessionStorage, keyed by viewer, so two members on one device never inherit
 * each other's choice and nothing is remembered a week later.
 */

export type StandingBoard = 'net' | 'topar';

export const STANDING_BOARDS: readonly StandingBoard[] = ['net', 'topar'] as const;

/** NET FOR EVERYONE. No threshold, no per-member rule. */
export const DEFAULT_STANDING_BOARD: StandingBoard = 'net';

function keyFor(viewerId: string | undefined): string {
  return `explore.standing.board:${viewerId ?? 'anon'}`;
}

export function readStandingBoard(viewerId: string | undefined): StandingBoard {
  try {
    const raw = sessionStorage.getItem(keyFor(viewerId));
    if (raw === 'net' || raw === 'topar') return raw;
  } catch {
    /* Private mode or a blocked store is not a reason to render nothing. */
  }
  return DEFAULT_STANDING_BOARD;
}

export function writeStandingBoard(viewerId: string | undefined, board: StandingBoard): void {
  try {
    sessionStorage.setItem(keyFor(viewerId), board);
  } catch {
    /* The selection then lives only in component state for this mount. */
  }
}
