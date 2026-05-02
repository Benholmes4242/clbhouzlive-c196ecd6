import type { WhsFriendWindowRanking } from '../types';

export type LeaderboardScope = 'all' | 'year' | 'month' | 'last8';

/** Minimum rounds required for a friend to appear in a time-scoped ranking. */
export const MIN_ROUNDS_FOR_SCOPE = 3;

/** Pull the avg-diff for a given scope, or null if not enough rounds. */
export function getAvgDiffForScope(
  ranking: WhsFriendWindowRanking | undefined,
  scope: Exclude<LeaderboardScope, 'all'>,
): number | null {
  if (!ranking) return null;
  switch (scope) {
    case 'year':
      return ranking.this_year_rounds >= MIN_ROUNDS_FOR_SCOPE
        ? ranking.this_year_avg_diff
        : null;
    case 'month':
      return ranking.this_month_rounds >= MIN_ROUNDS_FOR_SCOPE
        ? ranking.this_month_avg_diff
        : null;
    case 'last8':
      return ranking.last_8_rounds >= MIN_ROUNDS_FOR_SCOPE
        ? ranking.last_8_avg_diff
        : null;
  }
}

/** Round count for a given scope. Used in subtitle copy. */
export function getRoundCountForScope(
  ranking: WhsFriendWindowRanking | undefined,
  scope: Exclude<LeaderboardScope, 'all'>,
): number {
  if (!ranking) return 0;
  switch (scope) {
    case 'year':
      return ranking.this_year_rounds;
    case 'month':
      return ranking.this_month_rounds;
    case 'last8':
      return ranking.last_8_rounds;
  }
}

/** Human-readable label for a scope. */
export function getScopeLabel(scope: LeaderboardScope): string {
  switch (scope) {
    case 'all':
      return 'All-Time';
    case 'year':
      return 'This Year';
    case 'month':
      return 'This Month';
    case 'last8':
      return 'Last 8 rounds';
  }
}
