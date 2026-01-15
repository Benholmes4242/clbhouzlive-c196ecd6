// Centralized Cloudflare Stream configuration
// IMPORTANT: All URL generation MUST use CUSTOMER_SUBDOMAIN only.
// videodelivery.net is NOT valid for our Stream configuration and causes 404s.
export const CLOUDFLARE_STREAM_CONFIG = {
  ACCOUNT_ID: 'a1b264d44ddbe2b5127bb6ff5c274108',
  CUSTOMER_SUBDOMAIN: 'customer-4ah4gni80ytefpck.cloudflarestream.com',
} as const;

// Helper functions for generating Cloudflare Stream URLs
// These are the ONLY functions that should be used for URL generation
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

// AUDIT FIX #2: MP4 fallback URL generator for universal fallback support
// Cloudflare Stream provides download/MP4 links for all videos
export const generateStreamMp4Url = (videoId: string): string => {
  return `https://${CLOUDFLARE_STREAM_CONFIG.CUSTOMER_SUBDOMAIN}/${videoId}/downloads/default.mp4`;
};

// Extract stream UID from any Cloudflare Stream URL format (detection only, not construction)
export const extractStreamUid = (url: string): string | null => {
  if (!url) return null;
  // Match patterns for detection purposes:
  // - customer subdomain URLs
  // - legacy videodelivery.net URLs (read-only for parsing old data)
  const patterns = [
    /customer-[^.]+\.cloudflarestream\.com\/([a-f0-9]{32})/i,
    /videodelivery\.net\/([a-f0-9]{32})/i, // Detection only - for parsing legacy URLs
    /\/([a-f0-9]{32})\/manifest\/video\.m3u8/i,
    /\/([a-f0-9]{32})\/thumbnails\//i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};