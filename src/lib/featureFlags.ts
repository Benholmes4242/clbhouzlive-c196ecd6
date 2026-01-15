/**
 * Feature flags for the application
 * These control experimental or test-only features
 */

// Enable verification bypass button in admin panel (test mode only)
// Set to false for production deployments
export const ENABLE_VERIFICATION_BYPASS = false;

// Enable mock videos in Videos tab sections (for UI testing)
// Set to false for production deployments
export const ENABLE_MOCK_VIDEOS = false; // ⚠️ DISABLED for testing real data
