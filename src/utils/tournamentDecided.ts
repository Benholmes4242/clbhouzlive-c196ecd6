/**
 * Format-aware "decided" resolver.
 *
 * Determines whether a tournament has a confirmed champion. Used to gate
 * winner-crowning everywhere (hero, carousel, ticker) so a tied regulation
 * leader is never crowned while a playoff is pending.
 *
 * Coverage:
 *  - Stroke play: decided = single player at position 1 with margin >= 1,
 *    OR event_winners row exists, OR Sportradar status is a true closed-with-winner.
 *  - Team events (sr_teams present): decided = winning TEAM confirmed.
 *  - Match play: decided = match result.
 *  - Any playoff pending: NOT decided.
 *  - Ambiguous/unknown format: NOT decided (prefer unresolved over wrong crown).
 */

import { UNRESOLVED_STATUSES, LIVE_STATUSES } from './tournamentState';

export interface DecidedInput {
  status: string;
  /** Authoritative — an event_winners row exists. */
  winnerConfirmed?: boolean;
  /** Number of rows currently at position 1 on the leaderboard. */
  topRowCount?: number;
  /** True when SR flagged the top row as tied. */
  topTie?: boolean;
  /** Stroke margin between position 1 and position 2. null if unknown. */
  margin?: number | null;
  /** True if this is a team event (sr_teams populated). */
  isTeamEvent?: boolean;
  /** True if the WINNING TEAM has been resolved (team standings settled). */
  teamWinnerConfirmed?: boolean;
  /** True if match play; matchResultConfirmed is required to be decided. */
  isMatchPlay?: boolean;
  matchResultConfirmed?: boolean;
}

export interface DecidedResult {
  decided: boolean;
  /** Why we didn't decide — helpful for hero meta. */
  reason?: 'playoff-pending' | 'tied-top' | 'in-progress' | 'no-winner' | 'unknown-format';
}

export function isTournamentDecided(input: DecidedInput): DecidedResult {
  const s = (input.status || '').toLowerCase().trim();

  // Authoritative — explicit winner row trumps everything else.
  if (input.winnerConfirmed) return { decided: true };

  // Still playing or in playoff → not decided.
  if (LIVE_STATUSES.includes(s)) return { decided: false, reason: 'in-progress' };
  if (UNRESOLVED_STATUSES.includes(s)) return { decided: false, reason: 'playoff-pending' };

  // Team event branch.
  if (input.isTeamEvent) {
    return input.teamWinnerConfirmed
      ? { decided: true }
      : { decided: false, reason: 'no-winner' };
  }

  // Match play branch.
  if (input.isMatchPlay) {
    return input.matchResultConfirmed
      ? { decided: true }
      : { decided: false, reason: 'no-winner' };
  }

  // Stroke play (default).
  if (s === 'closed' || s === 'complete' || s === 'completed') {
    // Tied top with no confirmed winner → undecided (playoff pending).
    if (input.topTie) return { decided: false, reason: 'tied-top' };
    if ((input.topRowCount ?? 1) > 1) return { decided: false, reason: 'tied-top' };
    if (input.margin != null && input.margin < 1) {
      return { decided: false, reason: 'tied-top' };
    }
    return { decided: true };
  }

  if (s === 'cancelled' || s === 'canceled') {
    // Cancelled isn't "decided" in the champion sense; the cancelled variant
    // handles the UI separately.
    return { decided: false, reason: 'no-winner' };
  }

  return { decided: false, reason: 'unknown-format' };
}
