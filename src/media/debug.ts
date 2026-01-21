/**
 * Media system debug flags
 * TEMPORARILY SET TO TRUE FOR COMPREHENSIVE DEBUGGING
 * Set back to false after debugging is complete
 */

// Master switch for all media debug logging
// ENABLED FOR DEBUGGING - set to false in production
export const DEBUG_MEDIA = true;

// Granular flags (only apply if DEBUG_MEDIA is true)
export const DEBUG_HLS_PLAYER = DEBUG_MEDIA;
export const DEBUG_MEDIA_RUNTIME = DEBUG_MEDIA;
export const DEBUG_SAFE_PLAY = DEBUG_MEDIA;
export const DEBUG_MEDIA_TELEMETRY = DEBUG_MEDIA;
export const DEBUG_CLUBHOUSE_FEED = DEBUG_MEDIA;

// Force HLS.js even on Safari/native-capable browsers (for debugging)
// DISABLED: Causing format errors on desktop - let native playback work where supported
export const FORCE_HLS_JS = false;
