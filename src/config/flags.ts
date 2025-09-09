// Performance optimization feature flags
export const FLAGS = {
  perfTuning: true, // flip to rollback quickly
} as const;

export type FeatureFlags = typeof FLAGS;