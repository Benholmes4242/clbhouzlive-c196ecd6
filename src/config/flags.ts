// Performance optimization feature flags
export const FLAGS = {
  perfTuning: true, // flip to rollback quickly
  USE_VERTICAL_FEED_FOR_PROFILE_MEDIA: true, // unified vertical feed for all surfaces
  USE_PINCH_ZOOM: true, // enable pinch-zoom in vertical feed
  FRIEND_COURSES_MOCK_ENABLED: false, // mock friends data for testing
  LOCATION_BROADCAST_ENABLED: false, // gates GPS + Supabase writes for Nearby beacon
  TOP100_MOCK_FRIENDS_ENABLED: false, // inject 10 mock Top 100 friends for testing
  MOCK_FULL_GAME_PLAYERS: true, // TEST: inject mock players into Benjamin's Ardglass game (set false for prod)
  /**
   * Leaderboard Mock Users Flag
   * 
   * When enabled, injects 100 mock users into Benjamin Holmes' leaderboard page
   * for UI/UX testing. Only affects Benjamin Holmes' view.
   * 
   * Set via VITE_LEADERBOARD_MOCK_USERS_ENABLED env variable or hardcode here.
   * Default: true (for testing), set false for production.
   */
  LEADERBOARD_MOCK_USERS_ENABLED: import.meta.env.VITE_LEADERBOARD_MOCK_USERS_ENABLED !== 'false', // Default true
} as const;

export type FeatureFlags = typeof FLAGS;