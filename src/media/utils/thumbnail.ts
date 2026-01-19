/**
 * Unified Thumbnail URL Generation
 * Single source of truth for all thumbnail URL generation in the app
 */

import {
  CLOUDFLARE_STREAM_SUBDOMAIN,
  THUMBNAIL_SIZE,
  THUMBNAIL_DEFAULT_TIME,
} from '@/media/constants';

export type ThumbnailSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ThumbnailOptions {
  /** Cloudflare Stream UID */
  streamId?: string;
  /** Direct image URL (for non-video thumbnails) */
  imageUrl?: string;
  /** Size preset (default: 'medium') */
  size?: ThumbnailSize;
  /** Custom width override */
  width?: number;
  /** Custom height override */
  height?: number;
  /** Time offset in seconds for video thumbnails (default: 1) */
  time?: number;
  /** Fit mode for video thumbnails. IMPORTANT: Cloudflare Stream only supports: clip, scale, crop, fill, fillmax. NOT 'cover'. */
  fit?: 'crop' | 'scale' | 'fill' | 'clip';
}

// Memoization cache for URL generation
const urlCache = new Map<string, string>();

/**
 * Generate a thumbnail URL from either a Stream ID or image URL.
 * This is THE single function for all thumbnail URL generation.
 */
export function getThumbnailUrl(options: ThumbnailOptions): string {
  const {
    streamId,
    imageUrl,
    size = 'medium',
    width,
    height,
    time = THUMBNAIL_DEFAULT_TIME,
    fit = 'crop',
  } = options;

  // Generate cache key
  const cacheKey = JSON.stringify(options);
  const cached = urlCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let url: string;

  if (streamId) {
    // Cloudflare Stream thumbnail
    const sizeValue = height || width || THUMBNAIL_SIZE[size.toUpperCase() as keyof typeof THUMBNAIL_SIZE] || THUMBNAIL_SIZE.MEDIUM;

    url = `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg`;
    url += `?time=${time}s`;
    url += `&height=${sizeValue}`;
    url += `&fit=${fit}`;
  } else if (imageUrl) {
    // For R2/Cloudflare Images, append size params if supported
    if (imageUrl.includes('imagedelivery.net')) {
      const sizeValue = height || width || THUMBNAIL_SIZE[size.toUpperCase() as keyof typeof THUMBNAIL_SIZE] || THUMBNAIL_SIZE.MEDIUM;
      url = `${imageUrl}/h=${sizeValue}`;
    } else {
      // Return as-is for other URLs
      url = imageUrl;
    }
  } else {
    // No source provided - return empty or placeholder
    url = '/placeholder-thumbnail.png';
  }

  // Cache the result
  urlCache.set(cacheKey, url);

  return url;
}

/**
 * Clear the thumbnail URL cache (useful for testing or memory management)
 */
export function clearThumbnailCache(): void {
  urlCache.clear();
}

/**
 * Common thumbnail presets for quick access
 */
export const thumbnailPresets = {
  /** Small grid thumbnail (150px) */
  gridSmall: (streamId: string) => getThumbnailUrl({ streamId, size: 'small' }),

  /** Medium grid thumbnail (300px) */
  gridMedium: (streamId: string) => getThumbnailUrl({ streamId, size: 'medium' }),

  /** Large card thumbnail (600px) */
  card: (streamId: string) => getThumbnailUrl({ streamId, size: 'large' }),

  /** Hero/featured thumbnail (1200px) */
  hero: (streamId: string) => getThumbnailUrl({ streamId, size: 'xlarge' }),

  /** Thumbnail at specific time */
  atTime: (streamId: string, timeSeconds: number) =>
    getThumbnailUrl({ streamId, time: timeSeconds, size: 'medium' }),
};
