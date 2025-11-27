// Performance optimization feature flags
export const FLAGS = {
  perfTuning: true, // flip to rollback quickly
  USE_VERTICAL_FEED_FOR_PROFILE_MEDIA: true, // unified vertical feed for all surfaces
  USE_PINCH_ZOOM: true, // enable pinch-zoom in vertical feed
  FRIEND_COURSES_MOCK_ENABLED: true, // mock friends data for testing
  LOCATION_BROADCAST_ENABLED: false, // gates GPS + Supabase writes for Nearby beacon
} as const;

export type FeatureFlags = typeof FLAGS;