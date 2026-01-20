/**
 * Video ID utilities for consistent ID handling across prefetch and playback.
 * 
 * IMPORTANT: The Cloudflare Stream UID must be the canonical ID used everywhere:
 * - MediaRuntime registration
 * - Prefetch cache keys
 * - ReadyQueue tracking
 * - HLS blob cache
 */

const UID_RE = /([a-f0-9]{32})/i;

/**
 * Extracts Cloudflare Stream UID from various sources.
 * Works with full HLS URLs, stream UIDs, or cloudflarestream.com URLs.
 */
export function extractCloudflareUid(input: string): string {
  if (!input) return '';
  
  // Already a 32-char hex UID?
  if (/^[a-f0-9]{32}$/i.test(input)) {
    return input.toLowerCase();
  }
  
  // Extract from cloudflarestream.com URL
  // Format: https://customer-xxx.cloudflarestream.com/{uid}/...
  const cfMatch = input.match(/cloudflarestream\.com\/([a-f0-9]{32})/i);
  if (cfMatch) {
    return cfMatch[1].toLowerCase();
  }
  
  // Fallback: any 32-char hex in the string
  const hexMatch = input.match(UID_RE);
  if (hexMatch) {
    return hexMatch[1].toLowerCase();
  }
  
  return '';
}

/**
 * Gets short ID for logging (first 8 chars)
 */
export function shortUid(uid: string): string {
  return uid ? uid.slice(0, 8) : 'unknown';
}

/**
 * Validates that an ID looks like a Cloudflare UID
 */
export function isCloudflareUid(id: string): boolean {
  return /^[a-f0-9]{32}$/i.test(id);
}

/**
 * Given a post object, extracts the Cloudflare UID from its video URL.
 * This should be used when registering with MediaRuntime.
 */
export function getCloudflareUidFromPost(post: { 
  video_url?: string | null;
  cloudflare_uid?: string | null;
  media_url?: string | null;
}): string {
  // Try direct cloudflare_uid field first
  if (post.cloudflare_uid) {
    return extractCloudflareUid(post.cloudflare_uid);
  }
  
  // Try video_url
  if (post.video_url) {
    return extractCloudflareUid(post.video_url);
  }
  
  // Try media_url as fallback
  if (post.media_url) {
    return extractCloudflareUid(post.media_url);
  }
  
  return '';
}

/**
 * Given a NormalizedItem or similar, extracts the Cloudflare UID from its media array.
 */
export function getCloudflareUidFromMedia(item: {
  media?: Array<{ media_url?: string | null; media_type?: string | null }>;
}): string {
  if (!item.media?.length) return '';
  
  const videoMedia = item.media.find(m => m.media_type === 'video');
  if (videoMedia?.media_url) {
    return extractCloudflareUid(videoMedia.media_url);
  }
  
  return '';
}
