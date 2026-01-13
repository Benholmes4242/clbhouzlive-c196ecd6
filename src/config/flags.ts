// Performance optimization feature flags
export const FLAGS = {
  perfTuning: true, // flip to rollback quickly
  USE_VERTICAL_FEED_FOR_PROFILE_MEDIA: true, // unified vertical feed for all surfaces
  USE_PINCH_ZOOM: true, // enable pinch-zoom in vertical feed
  FRIEND_COURSES_MOCK_ENABLED: false, // DISABLED – mock friends data decommissioned
  LOCATION_BROADCAST_ENABLED: false, // gates GPS + Supabase writes for Nearby beacon
  TOP100_MOCK_FRIENDS_ENABLED: false, // inject 10 mock Top 100 friends for testing
  MOCK_FULL_GAME_PLAYERS: true, // TEST: inject mock players into Benjamin's Ardglass game (set false for prod)
  LEADERBOARD_V2_MOCK_100: true, // TEST: inject 100 mock players into V2 leaderboard for busy-state testing
} as const;

export type FeatureFlags = typeof FLAGS;