/**
 * THE ONE status vocabulary for sr_leaderboards.status.
 *
 * MEASURED against the live table on 2026-09-20 — every distinct value, with
 * its row count and its best position:
 *
 *   active  20845   best 1
 *   CUT     14433   best 35
 *   (null)    736   best 1
 *   WD        481   best 30
 *   MDF        41   best 52
 *   DQ         20   best 78
 *   DNS         5   best 55
 *
 * The column IS case-consistent: every stored value is UPPER CASE, and no
 * lower-case status exists in the table. The bug this module exists to prevent
 * is one-sided — code that compares against 'cut' / 'wd' / 'dsq' matches
 * NOTHING and silently falls through to rendering the raw numeric position.
 * ('dsq' is not a value the table has ever held; the real one is DQ.)
 * Therefore: always upper-case the input before comparing, and always compare
 * through the helpers below rather than re-deriving the set.
 *
 * MDF — "made cut, did not finish". The player DID make the 36-hole cut, was
 * eliminated at a secondary cut, and holds a real finishing position. Two
 * different, both-correct uses:
 *   - player page: MDF counts as a MADE CUT and as a FINISH, and plots as a
 *     normal position on the season shape.
 *   - leaderboard: MDF is demoted below live/finished players for ORDERING and
 *     rendered as its own token. That is a board-ordering concern, not a
 *     statement about whether the player made the cut.
 * Do not "fix" either one to match the other.
 */

export type ResultStatus = 'CUT' | 'MC' | 'MDF' | 'WD' | 'DQ' | 'DNS';

const KNOWN = new Set<ResultStatus>(['CUT', 'MC', 'MDF', 'WD', 'DQ', 'DNS']);

/**
 * Upper-cases and trims. Returns null for null/empty and for 'ACTIVE' — an
 * active player has no non-scoring status. Unknown values are returned
 * upper-cased so a new feed value is visible rather than swallowed.
 */
export function normalizeStatus(raw: string | null | undefined): ResultStatus | null {
  const s = (raw ?? '').trim().toUpperCase();
  if (!s || s === 'ACTIVE') return null;
  return s as ResultStatus;
}

/** Did not make the cut. No finishing position. */
export function isMissedCut(raw: string | null | undefined): boolean {
  const s = normalizeStatus(raw);
  return s === 'CUT' || s === 'MC';
}

/** Never teed off — has no result of any kind. */
export function isNonStarter(raw: string | null | undefined): boolean {
  return normalizeStatus(raw) === 'DNS';
}

/** Started, no valid finish. */
export function isWithdrawn(raw: string | null | undefined): boolean {
  const s = normalizeStatus(raw);
  return s === 'WD' || s === 'DQ';
}

/** A real finishing position. Includes MDF (see above) and null/active. */
export function isFinish(raw: string | null | undefined): boolean {
  return !isMissedCut(raw) && !isNonStarter(raw) && !isWithdrawn(raw);
}

/** The board's ordering demotion set — every non-active status. */
export function isDemotedStatus(raw: string | null | undefined): boolean {
  const s = normalizeStatus(raw);
  return s != null && KNOWN.has(s);
}
