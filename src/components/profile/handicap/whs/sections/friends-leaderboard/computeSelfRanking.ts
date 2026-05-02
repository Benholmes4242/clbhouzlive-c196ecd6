import { startOfYear, startOfMonth } from 'date-fns';
import type { WhsScore } from '@/lib/whs/types';
import {
  MIN_ROUNDS_FOR_SCOPE,
  type LeaderboardScope,
} from '@/lib/whs/utils/leaderboardScopes';

interface SelfWindowResult {
  /** Average differential in the window. null if below MIN_ROUNDS_FOR_SCOPE. */
  avgDiff: number | null;
  /** Number of rounds with non-null differential in the window. */
  rounds: number;
}

/**
 * Compute the user's own avg-differential for a time-scoped leaderboard window.
 * Pure function — mirrors the SQL view's logic so the user's row sits at the
 * correct rank alongside friend rows from whs_friend_window_rankings.
 */
export function computeSelfRanking(
  scope: Exclude<LeaderboardScope, 'all'>,
  scores: WhsScore[] | undefined,
): SelfWindowResult {
  if (!scores || scores.length === 0) {
    return { avgDiff: null, rounds: 0 };
  }

  const withDiff = scores.filter(
    (s) => s.handicap_differential !== null && s.handicap_differential !== undefined,
  );

  let windowScores: WhsScore[];

  switch (scope) {
    case 'year': {
      const yearStart = startOfYear(new Date());
      windowScores = withDiff.filter((s) => new Date(s.play_date) >= yearStart);
      break;
    }
    case 'month': {
      const monthStart = startOfMonth(new Date());
      windowScores = withDiff.filter((s) => new Date(s.play_date) >= monthStart);
      break;
    }
    case 'last8': {
      const sorted = [...withDiff].sort((a, b) => {
        const dateCmp = b.play_date.localeCompare(a.play_date);
        if (dateCmp !== 0) return dateCmp;
        return b.id.localeCompare(a.id);
      });
      windowScores = sorted.slice(0, 8);
      break;
    }
  }

  const rounds = windowScores.length;
  if (rounds < MIN_ROUNDS_FOR_SCOPE) {
    return { avgDiff: null, rounds };
  }

  const sum = windowScores.reduce(
    (acc, s) => acc + (s.handicap_differential ?? 0),
    0,
  );
  return { avgDiff: sum / rounds, rounds };
}
