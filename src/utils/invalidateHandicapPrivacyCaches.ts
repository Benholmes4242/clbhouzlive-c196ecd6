import type { QueryClient } from '@tanstack/react-query';

/**
 * Partial query keys for cached data that can carry a member's handicap,
 * handicap movement, or snapshot-derived round data.
 *
 * Keep this registry shared so privacy-setting writes have one invalidation
 * boundary, matching the course-rating cache invalidation pattern.
 */
export const HANDICAP_PRIVACY_QUERY_KEYS = [
  ['profile'],
  ['user-profile'],
  ['userProfile'],
  ['public-profile'],
  ['handicap-page-profile'],
  ['liveClubhouseBase'],
  ['circle-latest-rounds'],
  ['handicap-compare-stats'],
  ['courseled', 'viewer-handicap-index'],
  ['whs-connection'],
  ['whs-handicap-trend'],
  ['whs-handicap-history'],
  ['whs-last-round'],
  ['whs-counters'],
  ['whs-all-scores'],
  ['whs-friend-round-detail'],
  ['whs-friend-window-rankings'],
  ['whs-friends-activity'],
  ['whs-friend-course-bests'],
  ['whs-friend-featured-round'],
  ['whs-friend-rivalries'],
  ['whs-friend-leaderboard'],
  ['whs_friend_recent_rounds'],
  ['whs_leaderboard_rank_deltas'],
  ['whs_leaderboard_weekly_banner'],
  ['whs-shared-rounds'],
  ['whs-shared-round-counts'],
  ['whs-friend-view-rivalries'],
  ['trophy-aggregates'],
] as const;

export function invalidateHandicapPrivacyCaches(queryClient: QueryClient) {
  for (const queryKey of HANDICAP_PRIVACY_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey, exact: false });
  }
}