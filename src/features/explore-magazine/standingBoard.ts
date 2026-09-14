/**
 * THE STANDING BOARD SELECTOR (Ben's rulings on the board measurement).
 *
 * FIVE BOARDS, NET BY DEFAULT FOR EVERYONE, NO HANDICAP THRESHOLD:
 *   net (default) - lowest net round
 *   topar         - lowest gross round, ranked to par
 *   stableford    - best stableford round
 *   birdies       - most birdies in a single round
 *   improved      - biggest handicap cut from one round
 *
 * WHY THESE FIVE, MEASURED ON PRODUCTION BEFORE ANYTHING WAS BUILT:
 *   - net carries a score on 99.3% of qualifying rows and covers the identical
 *     courses gross covers, and it is a real second ranking, not gross renamed;
 *   - a member off 18 will never lead a gross board but may genuinely hold the
 *     most birdies in a round at their club, which is the whole point of the
 *     set;
 *   - ace, albatross and clean_card are OMITTED: 5 aces, 1 albatross and 15
 *     bogey-free rounds in 3,557 rounds is a coincidence, not a standing;
 *   - recent is OMITTED: "1st most recent" is a coordinate wearing a rank's
 *     clothes - a date order in which everybody leads the day they play;
 *   - a handicap threshold is indefensible: a third of indexed members sit
 *     within +/-3 of an index of 5, so a threshold read off them would bake in
 *     a bias that gets more wrong as the base grows.
 *
 * THE FLOOR IS A QUALIFIED FIELD OF 2, matching CROWN_MIN_OTHERS: one other
 * member is a contest, a field of one is not. It is applied in SQL, and the
 * DROPDOWN OFFERS ONLY BOARDS THE MEMBER ACTUALLY HAS - see
 * useStandingBoards.ts. There are no greyed rows: a disabled option is a
 * promise the app cannot keep.
 *
 * THESE BOARDS RANK ROUNDS. THE CHAMPIONS TAB RANKS CAREERS. That is why the
 * labels all name a ROUND ("Most birdies in a round", never "Most birdies").
 * gam_course_legends' "most birdies" is a career total at the course and a
 * different number; the shelf must never be readable as the same claim. No
 * cumulative sort value was added to get_viewer_standing to mirror Champions -
 * that would be a second implementation of Champions' logic living in another
 * function, and the two would drift.
 *
 * THE CONSEQUENCE CARDS DO NOT READ THIS. A card is a dated statement about a
 * round that happened. A headline that flips because a dropdown moved stops
 * being a record of anything, so rank cards stay on gross and never consult
 * the selection here.
 *
 * SELECTION HOLDS FOR THE SESSION, PER MEMBER, AND RESETS NEXT VISIT.
 */

export type StandingBoard = 'net' | 'topar' | 'stableford' | 'birdies' | 'improved';

export const STANDING_BOARDS: readonly StandingBoard[] = [
  'net',
  'topar',
  'stableford',
  'birdies',
  'improved',
] as const;

/** NET FOR EVERYONE. No threshold, no per-member rule. */
export const DEFAULT_STANDING_BOARD: StandingBoard = 'net';

/** The minimum QUALIFIED field for a course to appear on any board. Mirrors
 *  CROWN_MIN_OTHERS: one other member is a contest. Enforced in SQL; declared
 *  here so the client can explain the same rule. */
export const STANDING_MIN_FIELD = 2;

export function isStandingBoard(value: unknown): value is StandingBoard {
  return typeof value === 'string' && (STANDING_BOARDS as readonly string[]).includes(value);
}

function keyFor(viewerId: string | undefined): string {
  return `explore.standing.board:${viewerId ?? 'anon'}`;
}

export function readStandingBoard(viewerId: string | undefined): StandingBoard {
  try {
    const raw = sessionStorage.getItem(keyFor(viewerId));
    if (isStandingBoard(raw)) return raw;
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
