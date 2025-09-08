// Centralized Cloudflare Stream configuration
export const CLOUDFLARE_STREAM_CONFIG = {
  ACCOUNT_ID: 'a1b264d44ddbe2b5127bb6ff5c274108',
  CUSTOMER_SUBDOMAIN: 'customer-4ah4gni80ytefpck.cloudflarestream.com',
  VIDEODELIVERY_DOMAIN: 'videodelivery.net'
} as const;

// Helper functions for generating Cloudflare Stream URLs
export const generateStreamHlsUrl = (videoId: string): string => {
  return `https://${CLOUDFLARE_STREAM_CONFIG.CUSTOMER_SUBDOMAIN}/${videoId}/manifest/video.m3u8`;
};

export const generateStreamThumbnailUrl = (videoId: string, options: {
  width?: number;
  height?: number;
  time?: number;
} = {}): string => {
  const { width = 1280, height = 720, time = 1 } = options;
  return `https://${CLOUDFLARE_STREAM_CONFIG.CUSTOMER_SUBDOMAIN}/${videoId}/thumbnails/thumbnail.jpg?width=${width}&height=${height}&time=${time}s`;
};

// Fallback URLs using videodelivery.net (when customer subdomain fails)
export const generateFallbackHlsUrl = (videoId: string): string => {
  return `https://${CLOUDFLARE_STREAM_CONFIG.VIDEODELIVERY_DOMAIN}/${videoId}/manifest/video.m3u8`;
};

export const generateFallbackThumbnailUrl = (videoId: string, options: {
  width?: number;
  height?: number;
  time?: number;
} = {}): string => {
  const { width = 1280, height = 720, time = 1 } = options;
  return `https://${CLOUDFLARE_STREAM_CONFIG.VIDEODELIVERY_DOMAIN}/${videoId}/thumbnails/thumbnail.jpg?width=${width}&height=${height}&time=${time}s`;
};