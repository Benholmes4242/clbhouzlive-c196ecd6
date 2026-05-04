/**
 * Feature flags for gradual rollout and quick rollback
 */

// Clubhouse vertical-only filtering (TikTok-style)
// ON by default - set to false to revert to previous behavior
export const CLUBHOUSE_VERTICAL_ONLY = false; // TEMPORARILY DISABLED FOR DEBUGGING - was: true

// Existing feature flags
export const USE_SAFE_AUTOPLAY_V2 = true;
export const USE_VIDEO_PROGRESS_SYNC_V1 = true;


/**
 * Top 100 Mock Players Flag
 * 
 * When enabled, adds 30 mock players to the leaderboard for design/testing
 * Set via VITE_ENABLE_TOP100_MOCK_PLAYERS env variable
 * 
 * AUDIT COMPLETED 2025-12-03: Mock players disabled for production use.
 * All leaderboard data now comes from real Supabase tables/RPCs only.
 */
export const ENABLE_TOP100_MOCK_PLAYERS = 
  import.meta.env.VITE_ENABLE_TOP100_MOCK_PLAYERS === 'true'; // Production: disabled

export const FEATURE_FLAGS = {
  CLUBHOUSE_VERTICAL_ONLY,
  SAFE_AUTOPLAY_V2: USE_SAFE_AUTOPLAY_V2,
  VIDEO_PROGRESS_SYNC_V1: USE_VIDEO_PROGRESS_SYNC_V1,
  ENABLE_TOP100_MOCK_PLAYERS,
} as const;

/**
 * Handicap promoted from a profile sub-tab to a top-level page.
 *
 * When ON for a user:
 *  - ProfileHubSheet renders the new 2×2 grid (Handicap/Echo/Messages/Notifications)
 *  - HandicapTile shows live index + 30-day trend, with a NEW badge for 60 days
 *  - Handicap tab is hidden from that user's own profile strip
 *  - /handicap route renders the dedicated page with MorningMoment + WhsHandicapTab
 *  - Legacy ?tab=stats deep links on own profile redirect to /handicap
 *
 * Rollout plan:
 *  1. Internal allow-list (current state) — verify telemetry + UX with team
 *  2. Flip HANDICAP_PROMOTED_TO_PAGE_GLOBAL = true for full rollout
 *  3. Rollback = flip back to false; no DB migration required
 *
 * Telemetry to watch (PostHog / analyticsEvents):
 *  - profile_hub_sheet_opened { variant: 'v2_grid' | 'v1_row' }
 *  - handicap_tile_tapped
 *  - handicap_page_viewed
 *  - morning_moment_viewed { hasHandicap, hasDelta }
 *  - handicap_legacy_redirect_fired
 */
const HANDICAP_PROMOTED_INTERNAL_USER_IDS = new Set<string>([
  '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e', // Benjamin Holmes
]);

export const HANDICAP_PROMOTED_TO_PAGE_GLOBAL = false;

export function isHandicapPromotedForUser(userId: string | null | undefined): boolean {
  if (HANDICAP_PROMOTED_TO_PAGE_GLOBAL) return true;
  if (!userId) return false;
  return HANDICAP_PROMOTED_INTERNAL_USER_IDS.has(userId);
}

// Vertical aspect ratio band - expanded to catch encoder drift
// 9:16 = 0.5625, but real-world videos vary. Range: 0.52-0.70
export const VERTICAL_MIN_AR = 0.52;  // Generous lower bound for vertical
export const VERTICAL_MAX_AR = 0.70;  // Generous upper bound (still excludes square/landscape)
