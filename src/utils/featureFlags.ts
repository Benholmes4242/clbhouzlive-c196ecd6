/**
 * Feature flags for gradual rollout and quick rollback
 */

export const USE_SAFE_AUTOPLAY_V2 = true;
export const USE_VIDEO_PROGRESS_SYNC_V1 = true;
export const USE_ACCESS_GATE_V2 = import.meta.env.VITE_ACCESS_GATE_VERSION?.toString().toLowerCase() === "v2";

export const FEATURE_FLAGS = {
  SAFE_AUTOPLAY_V2: USE_SAFE_AUTOPLAY_V2,
  VIDEO_PROGRESS_SYNC_V1: USE_VIDEO_PROGRESS_SYNC_V1,
  ACCESS_GATE_V2: USE_ACCESS_GATE_V2,
} as const;