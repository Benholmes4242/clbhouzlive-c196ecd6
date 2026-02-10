/**
 * Video Classification Rules (Phase 1)
 * 
 * These rules underpin the entire platform's content organization.
 * Do NOT modify without product alignment.
 */

// Duration threshold in seconds
// PRODUCTION: 4 minutes minimum for long-form videos
export const VIDEO_DURATION_THRESHOLD_SECONDS = 240; // 4 minutes

/**
 * Video Classification:
 * - SHORT: duration < 4 minutes (240 seconds) → Watch tab ONLY
 * - LONG_FORM: duration ≥ 4 minutes (240 seconds) → Videos tab ONLY
 * 
 * NO CROSSOVER between tabs.
 */
export const isShortVideo = (durationSeconds: number | null | undefined): boolean => {
  if (durationSeconds == null) return true; // Default to short if unknown
  return durationSeconds < VIDEO_DURATION_THRESHOLD_SECONDS;
};

export const isLongFormVideo = (durationSeconds: number | null | undefined): boolean => {
  if (durationSeconds == null) return false; // Default to not long-form if unknown
  return durationSeconds >= VIDEO_DURATION_THRESHOLD_SECONDS;
};

/**
 * Routing Rules
 * 
 * Context                    | User taps avatar/username | Destination
 * ---------------------------|---------------------------|------------------
 * Watch tab (shorts)         | Creator                   | Profile Page
 * Videos tab (long-form)     | Creator                   | Profile Page
 */
export type VideoContext = 'watch' | 'videos' | 'profile';

export const getCreatorDestination = (_context: VideoContext): string => {
  // All contexts route to profile
  return 'profile';
};

/**
 * Creator Toggle Behaviour
 * 
 * When is_creator = ON:
 * - User can publish long-form videos
 * - Their videos appear in Videos tab
 * - Enhanced creator tools on their profile
 * 
 * When is_creator = OFF:
 * - They can still post shorts (Watch)
 * - They do NOT appear as creators in Videos tab
 */
export const CREATOR_FEATURES = {
  canPublishLongForm: true,
  appearsInVideosTab: true,
} as const;
