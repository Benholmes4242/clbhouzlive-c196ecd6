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

// Vertical aspect ratio band - expanded to catch encoder drift
// 9:16 = 0.5625, but real-world videos vary. Range: 0.52-0.70
export const VERTICAL_MIN_AR = 0.52;  // Generous lower bound for vertical
export const VERTICAL_MAX_AR = 0.70;  // Generous upper bound (still excludes square/landscape)
