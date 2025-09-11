// Performance optimization feature flags
export const FLAGS = {
  perfTuning: true, // flip to rollback quickly
  USE_VERTICAL_FEED_FOR_PROFILE_MEDIA: true, // unified vertical feed for all surfaces
  USE_PINCH_ZOOM: true, // enable pinch-zoom in vertical feed
  ECHO_MODAL_USE_PROFILE_BEHAVIOUR: true, // standardize Echo modals to match ProfileModalRouter
} as const;

export type FeatureFlags = typeof FLAGS;