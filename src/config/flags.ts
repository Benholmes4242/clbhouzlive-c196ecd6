// Performance optimization feature flags
export const FLAGS = {
  perfTuning: true, // flip to rollback quickly
  USE_VERTICAL_FEED_FOR_PROFILE_MEDIA: true, // unified vertical feed for all surfaces
  USE_PINCH_ZOOM: true, // enable pinch-zoom in vertical feed
  FRIEND_COURSES_MOCK_ENABLED: false, // mock friends data for testing
  LOCATION_BROADCAST_ENABLED: false, // gates GPS + Supabase writes for Nearby beacon
  TOP100_MOCK_FRIENDS_ENABLED: false, // inject 10 mock Top 100 friends for testing
  
  // Video System Refactor: Poster → Paused Video Architecture
  // When true: Videos render paused showing first frame (Instagram/TikTok style)
  // When false: Videos render with poster images that fade to video (current behavior)
  // Phase 0: Default OFF - will be enabled incrementally per surface
  USE_PAUSED_VIDEO_INSTEAD_OF_POSTER: false,
} as const;

export type FeatureFlags = typeof FLAGS;