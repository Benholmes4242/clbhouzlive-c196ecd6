/**
 * Event constants for nearby features
 */
export const EVT_GAME_CREATED = 'game-created';
export const EVT_OPEN_TO_PLAY_UPDATED = 'openToPlay-updated';

/**
 * Staleness threshold for location data (5 minutes)
 * Any location older than this is considered stale and excluded from Nearby results
 */
export const NEARBY_LOCATION_STALE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Minimum distance change required to trigger a location update (meters)
 * Prevents unnecessary database writes when user hasn't moved significantly
 */
export const MIN_LOCATION_CHANGE_METERS = 10;
