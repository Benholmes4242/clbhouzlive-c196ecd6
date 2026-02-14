/**
 * Format thru/status display with timezone-aware "F" logic.
 *
 * Handles:
 * - Standard tours (thru=18 → F)
 * - LIV shotgun format (round_N exists even when thru < 18)
 * - Stale F detection (yesterday's F should show blank, not "F")
 * - Status overrides (MC, WD, DQ, MDF, DNS)
 */

/**
 * Determine which round a player has completed and what's next.
 * Returns lastCompletedRound (null if none) and currentRound (next to play).
 */
export function getCurrentRound(
  r1: number | null | undefined,
  r2: number | null | undefined,
  r3: number | null | undefined,
  r4: number | null | undefined
): { number: number; isComplete: boolean; currentRound: number; lastCompletedRound: number | null } {
  if (r4 != null) return { number: 4, isComplete: true, currentRound: 4, lastCompletedRound: 4 };
  if (r3 != null) return { number: 3, isComplete: true, currentRound: 4, lastCompletedRound: 3 };
  if (r2 != null) return { number: 2, isComplete: true, currentRound: 3, lastCompletedRound: 2 };
  if (r1 != null) return { number: 1, isComplete: true, currentRound: 2, lastCompletedRound: 1 };
  return { number: 0, isComplete: false, currentRound: 1, lastCompletedRound: null };
}

/**
 * Check if a timestamp is from today in the given timezone.
 */
function checkIsToday(
  timestamp: string | null | undefined,
  timezone: string
): boolean {
  if (!timestamp) return false;
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const today = fmt.format(new Date());
    const tsDate = fmt.format(new Date(timestamp));
    return today === tsDate;
  } catch {
    // Fallback: compare UTC dates
    const today = new Date().toISOString().substring(0, 10);
    const tsDate = new Date(timestamp).toISOString().substring(0, 10);
    return today === tsDate;
  }
}

export function formatThruDisplay(
  thru: number | string | null | undefined,
  round1: number | null | undefined,
  round2: number | null | undefined,
  round3: number | null | undefined,
  round4: number | null | undefined,
  status: string | null | undefined,
  thruUpdatedAt?: string | null | undefined,
  tournamentTimezone?: string | null | undefined,
): string {
  // 1. Status overrides (unchanged)
  if (status) {
    const s = status.toLowerCase();
    if (s === 'cut') return 'MC';
    if (s === 'wd') return 'WD';
    if (s === 'dq') return 'DQ';
    if (s === 'mdf') return 'MDF';
    if (s === 'dns') return 'DNS';
  }

  const tz = tournamentTimezone || 'America/New_York';
  const isThruFromToday = checkIsToday(thruUpdatedAt, tz);

  // 2. Determine round state from round_N scores
  const roundInfo = getCurrentRound(round1, round2, round3, round4);
  const { lastCompletedRound } = roundInfo;

  // 3. Parse thru value
  const thruStr = String(thru || '').toLowerCase().trim();
  const thruNum = thru != null ? parseInt(String(thru), 10) : null;

  // 4. Already marked as F by Sportradar
  if (thruStr === 'f' || thruStr === 'f*') {
    return isThruFromToday ? 'F' : '';
  }

  // 5. Check round_N completion (handles LIV shotgun: round_3=55 even though thru=16)
  if (lastCompletedRound != null) {
    // Check if the NEXT round after the last completed one has started
    const nextRoundScores = [null, round1, round2, round3, round4];
    const nextRoundIdx = lastCompletedRound + 1;
    const nextRoundScore = nextRoundIdx <= 4 ? (nextRoundScores[nextRoundIdx] ?? null) : null;

    if (nextRoundScore == null) {
      // Next round hasn't started yet (or tournament is over)
      // Was the last round completed today?
      return isThruFromToday ? 'F' : '';
    }
    // Next round has a score — we're into or past it, fall through to show thru
  }

  // 6. Standard thru display (hole number)
  if (thruNum != null && !isNaN(thruNum) && thruNum > 0 && thruNum <= 18) {
    if (thruNum >= 18) {
      return isThruFromToday ? 'F' : '';
    }
    return String(thruNum);
  }

  // 7. No data
  return '';
}
