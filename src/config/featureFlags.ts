/**
 * Feature flags for gradual rollout and quick rollback
 */

// Clubhouse portrait-only filtering
export const CLUBHOUSE_PORTRAIT_ONLY = false; // Will flip after QA

// Existing feature flags
export const USE_SAFE_AUTOPLAY_V2 = true;
export const USE_VIDEO_PROGRESS_SYNC_V1 = true;

export const FEATURE_FLAGS = {
  CLUBHOUSE_PORTRAIT_ONLY,
  SAFE_AUTOPLAY_V2: USE_SAFE_AUTOPLAY_V2,
  VIDEO_PROGRESS_SYNC_V1: USE_VIDEO_PROGRESS_SYNC_V1,
} as const;

// Portrait aspect ratio threshold (9:16 = 0.5625)
export const PORTRAIT_MAX_ASPECT_RATIO = 0.56;
