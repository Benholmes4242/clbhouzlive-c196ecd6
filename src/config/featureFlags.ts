/**
 * Feature flags for gradual rollout and quick rollback
 */

// Clubhouse vertical-only filtering (TikTok-style)
export const CLUBHOUSE_PORTRAIT_ONLY = true; // ON by default - kill switch to revert

// Existing feature flags
export const USE_SAFE_AUTOPLAY_V2 = true;
export const USE_VIDEO_PROGRESS_SYNC_V1 = true;

export const FEATURE_FLAGS = {
  CLUBHOUSE_PORTRAIT_ONLY,
  SAFE_AUTOPLAY_V2: USE_SAFE_AUTOPLAY_V2,
  VIDEO_PROGRESS_SYNC_V1: USE_VIDEO_PROGRESS_SYNC_V1,
} as const;

// Vertical aspect ratio band (9:16 ± 7%) - width/height
export const VERTICAL_MIN_AR = 0.56;  // ~9:16 lower bound
export const VERTICAL_MAX_AR = 0.60;  // ~9:16 upper bound

// Legacy constant for backwards compatibility
export const PORTRAIT_MAX_ASPECT_RATIO = VERTICAL_MAX_AR;
