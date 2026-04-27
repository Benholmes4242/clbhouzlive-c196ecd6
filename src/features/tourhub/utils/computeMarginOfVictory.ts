/**
 * computeMarginOfVictory
 *
 * Position-aware margin computation for tournament leaderboards.
 *
 * Returns the absolute stroke difference between the leader (position === 1)
 * and the FIRST entry that is NOT tied for the lead.
 *
 * Why position-aware (not `leaderboard[1].score - leaderboard[0].score`):
 *   - Team events (Zurich Classic) have multiple rows tied at position 1 — the
 *     two players on the same pairing both share the slot. A naive index-based
 *     formula returns 0 in that case.
 *   - Individual events with a tie for the lead also need position-aware logic.
 *
 * Returns null when:
 *   - The leaderboard is empty
 *   - There is no entry beyond the leader(s) (e.g. only the winner has a score)
 *   - Either score is null/undefined
 */

interface MoVEntry {
  position?: number | null;
  score?: number | null;
}

export function computeMarginOfVictory(leaderboard: MoVEntry[] | null | undefined): number | null {
  if (!leaderboard || leaderboard.length === 0) return null;

  const leader = leaderboard.find(e => e.position === 1);
  if (!leader || leader.score == null) return null;

  // First entry that is NOT tied for the lead — handles team events and ties.
  const firstNonLeader = leaderboard.find(e => e.position != null && e.position !== 1);
  if (!firstNonLeader || firstNonLeader.score == null) return null;

  return Math.abs(firstNonLeader.score - leader.score);
}
