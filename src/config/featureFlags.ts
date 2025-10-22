/**
 * Feature flags for gradual rollout and quick rollback
 */

// Clubhouse vertical-only filtering (TikTok-style)
// ON by default - set to false to revert to previous behavior
export const CLUBHOUSE_VERTICAL_ONLY = true; // Vertical 9:16±7% only, full-bleed

// Existing feature flags
export const USE_SAFE_AUTOPLAY_V2 = true;
export const USE_VIDEO_PROGRESS_SYNC_V1 = true;

export const FEATURE_FLAGS = {
  CLUBHOUSE_VERTICAL_ONLY,
  SAFE_AUTOPLAY_V2: USE_SAFE_AUTOPLAY_V2,
  VIDEO_PROGRESS_SYNC_V1: USE_VIDEO_PROGRESS_SYNC_V1,
} as const;

// Vertical aspect ratio band (9:16 ± 7%) - width/height
export const VERTICAL_MIN_AR = 0.56;  // ~9:16 lower bound
export const VERTICAL_MAX_AR = 0.60;  // ~9:16 upper bound
