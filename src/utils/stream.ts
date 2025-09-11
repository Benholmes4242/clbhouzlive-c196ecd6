/**
 * Utilities for handling Cloudflare Stream video URLs and poster generation
 */

/**
 * Extracts Stream ID from a Cloudflare Stream URL
 * @param url - The Stream URL (e.g., https://customer-xxxx.cloudflarestream.com/<STREAM_ID>/manifest/video.m3u8)
 * @returns Stream ID or null if not found
 */
export function getStreamIdFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Match pattern: cloudflarestream.com/<STREAM_ID>/
  const match = url.match(/cloudflarestream\.com\/([^/]+)\//i);
  return match?.[1] ?? null;
}

/**
 * Generates a Cloudflare Stream poster URL
 * @param urlOrId - Either a Stream URL or Stream ID
 * @param time - Time offset for thumbnail (default: '1s')
 * @returns Poster URL or null if Stream ID cannot be determined
 */
export function getStreamPoster(urlOrId: string, time = '1s'): string | null {
  if (!urlOrId) return null;
  
  const streamId = urlOrId.includes('cloudflarestream.com')
    ? getStreamIdFromUrl(urlOrId)
    : urlOrId;
    
  if (!streamId) return null;
  
  return `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${streamId}/thumbnails/thumbnail.jpg?time=${time}`;
}