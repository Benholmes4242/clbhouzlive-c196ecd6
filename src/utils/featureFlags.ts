/**
 * Feature flags for gradual rollout and quick rollback
 */

export const USE_SAFE_AUTOPLAY_V2 = true;
export const USE_VIDEO_PROGRESS_SYNC_V1 = true;

// Debug flag: Set to true to show ALL achievements as unlocked for Benjamin Holmes
// Set to false to return to real data
export const DEBUG_UNLOCK_ALL_ACHIEVEMENTS = false;
export const DEBUG_ACHIEVEMENTS_USER_EMAIL = 'benjamin@clbhouz.co.uk';

export const FEATURE_FLAGS = {
  SAFE_AUTOPLAY_V2: USE_SAFE_AUTOPLAY_V2,
  VIDEO_PROGRESS_SYNC_V1: USE_VIDEO_PROGRESS_SYNC_V1,
  DEBUG_UNLOCK_ALL_ACHIEVEMENTS,
} as const;