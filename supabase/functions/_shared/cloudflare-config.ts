/**
 * Shared Cloudflare Stream configuration for Supabase Edge Functions
 * 
 * Uses environment variable with fallback to default customer subdomain.
 * Set CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN in Supabase secrets for staging/prod environments.
 */

// Default customer subdomain - matches frontend config in src/config/cloudflare.ts
const DEFAULT_CUSTOMER_SUBDOMAIN = 'customer-4ah4gni80ytefpck.cloudflarestream.com';

/**
 * Get the Cloudflare Stream customer subdomain from environment or use default
 */
export function getCustomerSubdomain(): string {
  return Deno.env.get('CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN') || DEFAULT_CUSTOMER_SUBDOMAIN;
}

/**
 * Generate HLS manifest URL for a Cloudflare Stream video
 */
export function generateStreamHlsUrl(videoId: string): string {
  const subdomain = getCustomerSubdomain();
  return `https://${subdomain}/${videoId}/manifest/video.m3u8`;
}

/**
 * Generate thumbnail URL for a Cloudflare Stream video
 */
export function generateStreamThumbnailUrl(
  videoId: string, 
  options?: { time?: string; width?: number; height?: number }
): string {
  const subdomain = getCustomerSubdomain();
  const params = new URLSearchParams();
  
  if (options?.time) params.set('time', options.time);
  if (options?.width) params.set('width', options.width.toString());
  if (options?.height) params.set('height', options.height.toString());
  
  const queryString = params.toString();
  return `https://${subdomain}/${videoId}/thumbnails/thumbnail.jpg${queryString ? `?${queryString}` : ''}`;
}

/**
 * Generate iframe embed URL for a Cloudflare Stream video
 */
export function generateStreamEmbedUrl(videoId: string): string {
  const subdomain = getCustomerSubdomain();
  return `https://${subdomain}/${videoId}/iframe`;
}
