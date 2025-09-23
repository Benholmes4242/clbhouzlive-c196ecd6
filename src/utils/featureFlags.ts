/**
 * Feature flags for gradual rollout and quick rollback
 */

export const USE_SAFE_AUTOPLAY_V2 = true;
export const USE_VIDEO_PROGRESS_SYNC_V1 = true;

export const FEATURE_FLAGS = {
  SAFE_AUTOPLAY_V2: USE_SAFE_AUTOPLAY_V2,
  VIDEO_PROGRESS_SYNC_V1: USE_VIDEO_PROGRESS_SYNC_V1,
} as const;