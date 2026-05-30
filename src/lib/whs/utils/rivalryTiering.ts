import type { FriendRivalryHydrated } from '../types';

/**
 * Relevance score for a rival.
 *   score = shared_rounds_count + (shared_rounds_last_90d × 2)
 * Depth wins, but recency closes the gap.
 *
 * NOTE: Tier badges (ARCHRIVAL / RIVAL / RECENT) were removed with the
 * Fight Card redesign. Every rival is now simply "RIVAL". This score
 * function survives because it still drives ordering — most-played
 * rivalries appear first.
 */
export function rivalryScore(r: FriendRivalryHydrated): number {
  return (r.shared_rounds_count ?? 0) + (r.shared_rounds_last_90d ?? 0) * 2;
}

/** Stable key for a rivalry — user_id when Clbhouz, else friend_row_id. */
export function rivalKey(r: FriendRivalryHydrated): string | null {
  return r.rival_user_id ?? r.rival_friend_row_id ?? null;
}
