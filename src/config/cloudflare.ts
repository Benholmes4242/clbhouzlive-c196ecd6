/**
 * Cloudflare configuration constants
 */

import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/media/constants';

// Maximum video duration allowed for uploads (in seconds)
// Cloudflare Stream requires this in the direct_upload request
export const MAX_VIDEO_DURATION_SECONDS = 3600; // 1 hour

// Customer subdomain for Stream URLs - MUST match the account in CLOUDFLARE_ACCOUNT_ID secret
// Correct account: 4ah4gni80ytefpck (linked to a1b264d44ddbe2b5127bb6ff5c274108)
/** @deprecated Use CLOUDFLARE_STREAM_SUBDOMAIN from @/media/constants */
export const CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN = CLOUDFLARE_STREAM_SUBDOMAIN.replace('.cloudflarestream.com', '');
