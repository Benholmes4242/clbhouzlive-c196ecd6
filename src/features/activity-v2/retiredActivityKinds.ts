/** Badges are retired (REMOVE_BADGES_1). Rows of these kinds are dropped where
 * feed pages are mapped, before grouping, featured picks and unread buckets.
 * Ledger/link handling for them stays in place, unreachable, so old rows can
 * never crash anything. */
import type { ActivityFeedRowV2 } from './hooks/useActivityFeedV2';

export const RETIRED_ACTIVITY_KINDS: ReadonlySet<string> = new Set(['badge_earned']);

export function withoutRetiredActivity(rows: readonly ActivityFeedRowV2[]): ActivityFeedRowV2[] {
  return rows.filter(r => !RETIRED_ACTIVITY_KINDS.has(r.notif_type));
}
