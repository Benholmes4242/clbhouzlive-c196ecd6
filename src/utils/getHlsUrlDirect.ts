import { getVideoId } from './getVideoId';

const CLOUDFLARE_CUSTOMER_CODE = 'customer-4ah4gni80ytefpck';

/**
 * Get HLS URL directly from media object - NO API CALLS.
 * 
 * Priority:
 * 1. Use pre-computed hls_url from database (fastest - no computation)
 * 2. Construct from stream_id (fast - just string concat)
 * 3. Parse stream_id from media_url and construct (fallback)
 * 
 * This eliminates all async HLS URL fetching for instant video playback.
 */
export function getHlsUrlDirect(media: {
  hls_url?: string | null;
  stream_id?: string | null;
  media_url?: string | null;
} | null | undefined): string | null {
  if (!media) return null;

  // 1. Use pre-computed hls_url if available (fastest - from database)
  if (media.hls_url) {
    return media.hls_url;
  }

  // 2. Construct from stream_id if available
  if (media.stream_id) {
    return `https://${CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${media.stream_id}/manifest/video.m3u8`;
  }

  // 3. Fallback: parse stream_id from media_url using existing utility
  const videoId = getVideoId(media);
  if (videoId) {
    return `https://${CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
  }

  return null;
}

/**
 * Get stream thumbnail URL using correct Cloudflare format.
 * 
 * @param streamId - Cloudflare Stream video ID
 * @param time - Time offset for thumbnail (default: '0s')
 * @param height - Optional height in pixels (default: 720)
 */
export function getStreamThumbnail(
  streamId: string | null | undefined, 
  time = '0s', 
  height = 720
): string | null {
  if (!streamId) return null;
  return `https://${CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${streamId}/thumbnails/thumbnail.jpg?time=${time}&height=${height}`;
}

/**
 * Get animated thumbnail GIF for preview.
 * 
 * @param streamId - Cloudflare Stream video ID
 * @param duration - Duration of animated preview (default: '4s')
 * @param height - Optional height in pixels (default: 720)
 */
export function getStreamAnimatedThumbnail(
  streamId: string | null | undefined,
  duration = '4s',
  height = 720
): string | null {
  if (!streamId) return null;
  return `https://${CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${streamId}/thumbnails/thumbnail.gif?duration=${duration}&height=${height}`;
}

/**
 * Get the best available poster URL for a media item.
 * 
 * Priority:
 * 1. Use poster_url from database (user-uploaded or pre-generated)
 * 2. Generate from stream_id
 * 3. Return null
 */
export function getBestPosterUrl(media: {
  poster_url?: string | null;
  stream_id?: string | null;
  media_url?: string | null;
} | null | undefined): string | null {
  if (!media) return null;

  // 1. Use poster_url from database if available
  if (media.poster_url) {
    return media.poster_url;
  }

  // 2. Generate from stream_id
  if (media.stream_id) {
    return getStreamThumbnail(media.stream_id, '1s');
  }

  // 3. Try to extract stream_id from media_url
  const videoId = getVideoId(media);
  if (videoId) {
    return getStreamThumbnail(videoId, '1s');
  }

  return null;
}
