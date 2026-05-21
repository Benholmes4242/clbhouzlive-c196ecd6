import type { FriendLeaderboardEntry } from '../types';

export const STALE_THRESHOLD_DAYS = 90;
export const ACTIVE_TOP_N = 5;

export interface LeaderboardCohorts {
  /** Active sorted by handicap low→high. NULL handicaps sink. */
  active: FriendLeaderboardEntry[];
  /** Stale rows (no round in last 90 days, never the self row). */
  inactive: FriendLeaderboardEntry[];
  /** The rows we render as TOP 5. The self row replaces the 5th slot if
   *  the user is outside the top 5 — guaranteeing they always see themselves
   *  without ballooning the list to 1→25. */
  topFive: FriendLeaderboardEntry[];
  /** Self row's index in `active`. -1 if self isn't present (defensive). */
  selfActiveIdx: number;
  /** Self row's 1-based rank in the active cohort. null when not present. */
  selfActiveRank: number | null;
  /** Total active count (for the sub-line). */
  totalActive: number;
  /** Total inactive count (for the toggle). */
  totalInactive: number;
  /** The row immediately above the user in the active list, used by the
   *  hero "Catch X" strip. null if the user is rank 1 or absent. */
  rowAbove: FriendLeaderboardEntry | null;
}

const isStale = (lastPlayed: string | null): boolean => {
  if (!lastPlayed) return true;
  const days = (Date.now() - new Date(lastPlayed).getTime()) / (1000 * 60 * 60 * 24);
  return days > STALE_THRESHOLD_DAYS;
};

export function buildLeaderboardCohorts(
  rows: FriendLeaderboardEntry[] | undefined | null,
): LeaderboardCohorts {
  const sorted = (rows ?? [])
    .slice()
    .sort((a, b) => (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99));

  const active: FriendLeaderboardEntry[] = [];
  const inactive: FriendLeaderboardEntry[] = [];
  for (const e of sorted) {
    if (e.is_self || !isStale(e.last_round_played_at)) {
      active.push(e);
    } else {
      inactive.push(e);
    }
  }

  const selfActiveIdx = active.findIndex((e) => e.is_self);
  const selfActiveRank = selfActiveIdx >= 0 ? selfActiveIdx + 1 : null;

  // Top 5 rule:
  //   - If user is in top 5 (or absent): show rows 0..4 as-is.
  //   - If user is outside top 5: show rows 0..3 + self row (4 leaders + you).
  let topFive: FriendLeaderboardEntry[];
  if (selfActiveRank == null || selfActiveRank <= ACTIVE_TOP_N) {
    topFive = active.slice(0, ACTIVE_TOP_N);
  } else {
    topFive = [...active.slice(0, ACTIVE_TOP_N - 1), active[selfActiveIdx]];
  }

  const rowAbove = selfActiveIdx > 0 ? active[selfActiveIdx - 1] : null;

  return {
    active,
    inactive,
    topFive,
    selfActiveIdx,
    selfActiveRank,
    totalActive: active.length,
    totalInactive: inactive.length,
    rowAbove,
  };
}
