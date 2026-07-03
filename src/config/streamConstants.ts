/**
 * Cloudflare Stream constants — extracted from src/media/constants.ts
 * so consumers survive the Stage E deletion sweep.
 */

export const CLOUDFLARE_STREAM_SUBDOMAIN =
  'customer-4ah4gni80ytefpck.cloudflarestream.com';

export const THUMBNAIL_SIZE = {
  SMALL: 150,
  MEDIUM: 300,
  LARGE: 600,
  XLARGE: 1200,
} as const;

export const THUMBNAIL_DEFAULT_TIME = 1;
