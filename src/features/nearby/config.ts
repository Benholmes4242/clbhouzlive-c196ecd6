export const NEARBY_SOURCE = import.meta.env.VITE_NEARBY_SOURCE ?? 'mock';
export const isMockNearby = NEARBY_SOURCE === 'mock';
// Note: LIVE_CLUBHOUSE_DATA flag removed - now controlled by isMockLiveEnabled() in src/mocks/mockSwitch.ts
