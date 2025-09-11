// Performance optimization feature flags
export const FLAGS = {
  perfTuning: true, // flip to rollback quickly
  USE_VERTICAL_FEED_FOR_PROFILE_MEDIA: true, // unified vertical feed for all surfaces
} as const;

export type FeatureFlags = typeof FLAGS;