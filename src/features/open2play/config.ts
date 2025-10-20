export const OPEN2PLAY_CONFIG = {
  // Data source: 'mock' | 'live'
  dataSource: (import.meta.env.VITE_OPEN2PLAY_SOURCE || 'mock') as 'mock' | 'live',
  
  // Nearby radius in km
  nearbyRadiusKm: 5,
  
  // Rate limits
  maxActivePings: 1,
  maxResponsesPerHour: 5,
  
  // Duration limits
  defaultDurationMins: 20,
  maxDurationMins: 60,
};
