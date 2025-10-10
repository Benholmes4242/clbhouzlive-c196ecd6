/**
 * Cloudflare Stream utilities for generating poster/thumbnail URLs
 */

export interface CloudflarePosterOptions {
  height?: number;
  time?: string;
  fit?: 'cover' | 'contain' | 'crop';
}

/**
 * Generates a Cloudflare Stream poster/thumbnail URL from a video URL or asset ID
 * @param src - Stream manifest URL, MP4 URL, or asset ID
 * @param opts - Options for thumbnail generation
 * @returns Poster URL or undefined if unable to derive
 */
export function getCloudflarePoster(
  src?: string,
  opts?: CloudflarePosterOptions
): string | undefined {
  if (!src) return undefined;

  try {
    const height = opts?.height ?? 720;
    const time = opts?.time ?? '1s';
    const fit = opts?.fit ?? 'cover';

    // If it's already a full URL, parse it
    if (src.includes('://')) {
      const u = new URL(src);
      
      // Extract asset ID from various CF Stream URL patterns:
      // https://customer-XXXX.cloudflarestream.com/<asset>/manifest/video.m3u8
      // https://customer-XXXX.cloudflarestream.com/<asset>/downloads/default.mp4
      // https://videodelivery.net/<asset>
      const parts = u.pathname.split('/').filter(Boolean);
      const asset = parts[0];
      
      if (!asset || asset.length < 10) return undefined;

      // Use the same origin for thumbnail
      return `${u.origin}/${asset}/thumbnails/thumbnail.jpg?height=${height}&time=${time}&fit=${fit}`;
    }

    // If it's just an asset ID (fallback)
    if (src.length >= 10 && !src.includes('/')) {
      // Default to customer subdomain
      return `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${src}/thumbnails/thumbnail.jpg?height=${height}&time=${time}&fit=${fit}`;
    }

    return undefined;
  } catch (error) {
    console.error('Error generating CF poster:', error);
    return undefined;
  }
}

/**
 * Adds a cache-busting parameter to a poster URL
 * @param posterUrl - The base poster URL
 * @param timestamp - Timestamp to use for cache busting (e.g., updated_at)
 */
export function addCacheBuster(posterUrl: string, timestamp?: string | Date): string {
  if (!timestamp) return posterUrl;
  
  const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp.getTime();
  const separator = posterUrl.includes('?') ? '&' : '?';
  
  return `${posterUrl}${separator}cb=${ts}`;
}
