/**
 * Utilities for handling Cloudflare Stream video URLs and poster generation
 * 
 * @example
 * // Extract stream ID from manifest URL
 * const streamId = getStreamIdFromUrl('https://customer-4ah4gni80ytefpck.cloudflarestream.com/abc123/manifest/video.m3u8');
 * // Returns: 'abc123'
 * 
 * // Generate poster URL from stream URL or ID
 * const posterUrl = getStreamPoster('https://customer-4ah4gni80ytefpck.cloudflarestream.com/abc123/manifest/video.m3u8', '2s');
 * // Returns: 'https://customer-4ah4gni80ytefpck.cloudflarestream.com/abc123/thumbnails/thumbnail.jpg?time=2s'
 */

/**
 * Extracts Stream ID from a Cloudflare Stream URL
 * @param url - The Stream URL (e.g., https://customer-xxxx.cloudflarestream.com/<STREAM_ID>/manifest/video.m3u8)
 * @returns Stream ID or null if not found
 */
export function getStreamIdFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Match various Cloudflare Stream URL patterns
  const patterns = [
    /\/([a-f0-9]{32})\/manifest\/video\.m3u8/i,
    /\/([a-f0-9]{32})\/thumbnails\//i,
    /videodelivery\.net\/([a-f0-9]{32})/i,
    /customer-[^.]+\.cloudflarestream\.com\/([a-f0-9]{32})/i,
    /cloudflarestream\.com\/([^/]+)\//i  // Keep existing pattern for backward compatibility
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Generates a Cloudflare Stream poster URL
 * Handles UIDs, full stream URLs, and existing image URLs
 * @param srcOrUid - Stream UID, full URL, or existing image URL
 * @param time - Time offset for thumbnail (default: '1s')
 * @returns Poster URL or null if cannot be determined
 */
export function getStreamPoster(srcOrUid?: string | null, time = '1s'): string | null {
  if (!srcOrUid) return null;

  // Case 1: Direct UID (e.g., "a1b2c3d4e5f6...")
  const uidLike = /^[a-z0-9]{13,}$/i.test(srcOrUid);
  if (uidLike && !srcOrUid.includes('http')) {
    return `https://videodelivery.net/${srcOrUid}/thumbnails/thumbnail.jpg?time=${time}&height=720`;
  }

  // Case 2: Full Stream URL (videodelivery.net or cloudflarestream.com)
  try {
    const u = new URL(srcOrUid);
    const parts = u.pathname.split('/').filter(Boolean);
    const uid = parts.find(p => /^[a-z0-9]{13,}$/i.test(p));
    if (uid) {
      return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=${time}&height=720`;
    }
  } catch {
    // Not a URL, fall through
  }

  // Case 3: Unknown – assume it's already an image URL (poster or thumbnail)
  if (/\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(srcOrUid)) return srcOrUid;

  return null;
}