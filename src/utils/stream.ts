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