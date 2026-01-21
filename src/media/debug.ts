/**
 * Media system debug flags
 * Set to true for comprehensive debugging, false for production
 */

// Master switch for all media debug logging
// DISABLED: Clubhouse/Watch debugging complete
export const DEBUG_MEDIA = false;

// Granular flags (only apply if DEBUG_MEDIA is true)
export const DEBUG_HLS_PLAYER = DEBUG_MEDIA;
export const DEBUG_MEDIA_RUNTIME = DEBUG_MEDIA;
export const DEBUG_SAFE_PLAY = DEBUG_MEDIA;
export const DEBUG_MEDIA_TELEMETRY = DEBUG_MEDIA;
export const DEBUG_CLUBHOUSE_FEED = DEBUG_MEDIA;

// Profile page debugging - ENABLED
export const DEBUG_PROFILE = true;

// Force HLS.js even on Safari/native-capable browsers (for debugging)
// DISABLED: Causing format errors on desktop - let native playback work where supported
export const FORCE_HLS_JS = false;
