/**
 * Feature flags for gradual rollout and quick rollback
 */

export const USE_SAFE_AUTOPLAY_V2 = true;
export const USE_VIDEO_PROGRESS_SYNC_V1 = true;
export const USE_ACCESS_GATE_V2 = import.meta.env.VITE_ACCESS_GATE_VERSION?.toString().toLowerCase() === "v2";

// Debug flag: Set to true to show ALL achievements as unlocked for Benjamin Holmes
// Set to false to return to real data
export const DEBUG_UNLOCK_ALL_ACHIEVEMENTS = false;
export const DEBUG_ACHIEVEMENTS_USER_EMAIL = 'benjamin@clbhouz.co.uk';

/**
 * DISCOVER_VIDEOS_MOCK_DATA
 * 
 * When true: Videos tab shows 25 mock videos with mock users for stress testing
 * When false: Videos tab behaves normally with real data
 * 
 * Use this flag to test autoplay, scroll performance, and prewarm under load.
 * Set to false and remove mock data file after testing is complete.
 */
export const DISCOVER_VIDEOS_MOCK_DATA = false;

export const FEATURE_FLAGS = {
  SAFE_AUTOPLAY_V2: USE_SAFE_AUTOPLAY_V2,
  VIDEO_PROGRESS_SYNC_V1: USE_VIDEO_PROGRESS_SYNC_V1,
  ACCESS_GATE_V2: USE_ACCESS_GATE_V2,
  DEBUG_UNLOCK_ALL_ACHIEVEMENTS,
  DISCOVER_VIDEOS_MOCK_DATA,
} as const;