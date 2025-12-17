/**
 * Cloudflare configuration constants
 */

// Maximum video duration allowed for uploads (in seconds)
// Cloudflare Stream requires this in the direct_upload request
export const MAX_VIDEO_DURATION_SECONDS = 3600; // 1 hour

// Customer subdomain for Stream URLs
export const CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN = 'customer-9p8qw7hk8dxqwnx6';
