/**
 * Video Classification Rules (Phase 1)
 * 
 * These rules underpin the entire platform's content organization.
 * Do NOT modify without product alignment.
 */

// Duration threshold in seconds
// ⚠️ TEMPORARILY 10 for testing - change back to 240 when you have real long-form content!
export const VIDEO_DURATION_THRESHOLD_SECONDS = 10; // 10 seconds (TESTING ONLY)

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
 * Routing Rules (Phase 1)
 * 
 * Context                    | User taps avatar/username | Destination
 * ---------------------------|---------------------------|------------------
 * Watch tab (shorts)         | Creator                   | Profile Page
 * Videos tab (long-form)     | Creator                   | Creator Page (future)
 * Profile page               | "View videos" CTA         | Creator Page (future)
 * 
 * For now, Videos tab routes to Profile until Creator Page is built.
 */
export type VideoContext = 'watch' | 'videos' | 'profile';

export const getCreatorDestination = (context: VideoContext): string => {
  switch (context) {
    case 'watch':
      return 'profile'; // Shorts → always Profile
    case 'videos':
      return 'profile'; // Long-form → Creator Page (future), Profile for now
    case 'profile':
      return 'creator-page'; // Profile CTA → Creator Page (future)
    default:
      return 'profile';
  }
};

/**
 * Creator Toggle Behaviour (Phase 1)
 * 
 * When is_creator = ON:
 * - User can publish long-form videos
 * - Their videos appear in Videos tab
 * - They will have a Creator Page (future)
 * 
 * When is_creator = OFF:
 * - They can still post shorts (Watch)
 * - They do NOT appear as creators in Videos tab
 */
export const CREATOR_FEATURES = {
  canPublishLongForm: true,
  appearsInVideosTab: true,
  hasCreatorPage: false, // Future feature
} as const;
