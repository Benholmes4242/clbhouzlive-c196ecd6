/**
 * Single source of truth for feed-loading query keys app-wide.
 *
 * Both engagementCache.patchEngagement and followCache.patchFollow walk
 * these registries on every mutation. Failing to register a feed query
 * here means that surface will display stale state (likes, comments,
 * follows) until the user manually refetches.
 *
 * RULE: When adding a new useQuery / useInfiniteQuery that loads feed
 * data with isLikedByMe / likeCount / commentCount / isFollowedByMe,
 * register the top-level key prefix here.
 *
 * AUDIT: To verify coverage, run:
 *   grep -rn "queryKey:" src/components/ src/hooks/ \
 *     | grep -iE "feed|posts|videos|shorts|tournament" \
 *     | sed -E "s/.*queryKey:\s*\[/[/" \
 *     | sed -E "s/,.*\$//" | sort -u
 *
 * Each unique top-level key that loads post data should appear in one
 * of FEED_QUERY_KEYS, PROFILE_QUERY_KEYS, or DISCOVERY_QUERY_KEYS below.
 *
 * INTENTIONALLY EXCLUDED (do not add):
 * - 'global-search' — entity search, not engagement-state-bearing
 * - 'mutualCountsAndFriends' — friend graph metadata, not engagement state
 * - 'viewerProfileForReasons' — viewer's own profile metadata
 * - 'scheduled-posts', 'scheduled-posts-count' — user's own drafts
 * - 'pga-card-post-id' — tournament→post lookup metadata, not engagement
 * - 'player-scorecard' — tournament leaderboard data, not engagement
 * - 'tournaments-cache' — tournament metadata, not engagement
 * - 'pga-card-scorecards-live' — tournament golf scoring data (eagles/birdies/pars), not engagement
 * - 'pga-card-scorecards-result' — same, for completed tournaments
 *
 * If you find a query key matching the audit pattern that ISN'T in the
 * registries, verify it actually loads post engagement state before adding.
 * Some keys match the naming pattern but return entity-only data.
 */

/** Feeds that load posts from multiple actors (not scoped to one profile). */
export const FEED_QUERY_KEYS: readonly (readonly unknown[])[] = [
  // Clubhouse
  ['media-feed', 'suggested'],
  ['media-feed', 'friends'],
  ['friends-feed'],

  // Explore + activity
  ['explore-feed'],
  ['explore-posts'],
  ['real-posts'],
  ['trending-posts'],
  ['activity-feed'],
  ['activity-posts'],
  ['channels-feed'],

  // Watch tab
  ['watch-feed'],
  ['watch-feed-posts-by-ids'],
  ['videos-feed'],
  ['videos-category-rail'],
  ['videos-continue-watching'],
  ['videos-course-anchored'],
  ['videos-following-rail'],
  ['long-form-videos'],
  ['related-long-form-videos'],

  // Tournament live (Clubhouse + Watch surfaces)
  ['live-tournament-counts'],
  ['live-tournament-post-ids'],
  ['video-of-the-week'],

  // Shorts
  ['shorts-infinite-v2'],
  ['clubhouse-shorts'],
  ['friends-shorts'],

  // Following / pinned
  ['followedUsersPosts'],
  ['infinite-followed-posts'],
  ['pinned-posts'],
] as const;

/** Posts scoped to a specific profile (personal or business). */
export const PROFILE_QUERY_KEYS: readonly (readonly unknown[])[] = [
  ['profile-posts'],
  ['actor-posts'],
  ['userPosts'],
  ['user-posts-preview'],

  // Business surfaces
  ['business-posts-infinite'],
  ['business-tagged-posts'],
  ['business-tagged-posts-infinite'],

  // Course-scoped feeds
  ['course-media-feed'],
  ['course-videos'],
] as const;

/** Discovery rails that show profile/golfer cards with isFollowedByMe state. */
export const DISCOVERY_QUERY_KEYS: readonly (readonly unknown[])[] = [
  ['suggested-creators'],
  ['suggested-users-discover'],
  ['golfers-discovery'],
  ['nearby-golfers'],
] as const;

/** Single-record engagement queries (post-engagement, post-likes, etc). */
export const ENGAGEMENT_RECORD_KEYS: readonly (readonly unknown[])[] = [
  ['post-engagement'],
  ['pga-card-counts'],
] as const;

/** Single-record relationship queries. */
export const RELATIONSHIP_RECORD_KEYS: readonly (readonly unknown[])[] = [
  // Canonical 5-element key
  ['follow-status'],
  // Legacy keys (deprecate after PR 3 callsite migration)
  ['user-follow-status'],
  ['business-follow-status'],
  ['relationship-status'],
  ['relationship-statuses'],
  ['user-follows'],
  ['actor-following'],
] as const;

/** Counts + lists. */
export const SOCIAL_COUNT_KEYS: readonly (readonly unknown[])[] = [
  ['social-counts'],
  ['followers-list'],
  ['following-list'],
  ['followers-paginated'],
  ['following-paginated'],
] as const;

/** Engagement-only keys (likes/comments not relevant for follow propagation). */
export const ENGAGEMENT_ONLY_KEYS: readonly (readonly unknown[])[] = [
  ['course-reviews-full'],
  ['user-course-reviews'],
  ['friend-course-activity'],
] as const;

/** Follow-only keys. */
export const FOLLOW_ONLY_KEYS: readonly (readonly unknown[])[] = [
  ['discovery-exclusions'],
] as const;
