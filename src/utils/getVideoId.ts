/**
 * Extracts a consistent video ID from media object.
 * Prefers stream_id if available, falls back to parsing the Cloudflare Stream URL.
 * 
 * This ensures HLS cache uses proper video IDs like "ae00fcdaf1e19d309ea648a4ff5c2a71"
 * instead of full URLs, enabling proper cache lookups and deduplication.
 */
export function getVideoId(media: { stream_id?: string | null; media_url?: string | null }): string | null {
  // Prefer stream_id if available
  if (media.stream_id) return media.stream_id;
  
  // Fallback: parse from Cloudflare Stream URL
  if (media.media_url?.includes('cloudflarestream.com')) {
    try {
      const url = new URL(media.media_url);
      // URL format: https://customer-xxx.cloudflarestream.com/{video_id}/manifest/video.m3u8
      const pathParts = url.pathname.split('/').filter(Boolean);
      return pathParts[0] || null;
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Extracts video ID from a raw URL string.
 * Useful when you only have the URL and not the full media object.
 */
export function getVideoIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return getVideoId({ media_url: url });
}
