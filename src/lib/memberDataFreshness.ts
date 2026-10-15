import type { QueryClient } from '@tanstack/react-query';
import { whsKeys } from '@/lib/whs/hooks';

/**
 * MEMBER GOLF QUERY KEYS — the one named set of queries that carry a
 * MEMBER'S OWN GOLF (BRIEF_MEMBER_DATA_FRESHNESS). Lives beside the persister
 * config; every freshness rule reads this set and nothing else:
 *   - never written to disk, even when its prefix is on the allowlist
 *     (`shouldPersistQuery`);
 *   - always re-asks on mount, focus and reconnect (`applyMemberGolfQueryDefaults`);
 *   - included in the background-resume light refresh (RehydrationContext);
 *   - gates read `isFetchedAfterMount`, not `!isLoading`.
 *
 * Entries are key PREFIXES, matched element-by-element against a query key.
 */
export const MEMBER_GOLF_QUERY_KEYS: readonly (readonly unknown[])[] = [
  ['profile-rounds'],
  whsKeys.allScores('').slice(0, 1),
  ['user-courses-played-count'],
  ['user-countries-played-summary'],
  ['top100-progress-user'],
  ['user-avg-rating'],
  // gam_user_courses()
  ['gam', 'user-analytics-courses'],
  // Added while working: same kind — a member's own round/feat figures.
  ['profile', 'round-total'],
  ['gam', 'profile-achievement-figures'],
];

export function isMemberGolfQueryKey(queryKey: readonly unknown[] | undefined): boolean {
  if (!Array.isArray(queryKey)) return false;
  return MEMBER_GOLF_QUERY_KEYS.some(
    (prefix) => prefix.length <= queryKey.length && prefix.every((p, i) => queryKey[i] === p),
  );
}

/** Scoped override — app-wide defaults stay exactly as they are. */
export const MEMBER_GOLF_QUERY_OPTIONS = {
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;

export function applyMemberGolfQueryDefaults(client: QueryClient): void {
  for (const key of MEMBER_GOLF_QUERY_KEYS) {
    client.setQueryDefaults(key as unknown[], MEMBER_GOLF_QUERY_OPTIONS);
  }
}
