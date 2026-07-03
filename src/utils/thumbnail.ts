/**
 * Unified Thumbnail URL Generation
 * Single source of truth for all thumbnail URL generation in the app.
 * (Moved from src/media/utils/thumbnail.ts during video engine teardown.)
 */

import {
  CLOUDFLARE_STREAM_SUBDOMAIN,
  THUMBNAIL_SIZE,
  THUMBNAIL_DEFAULT_TIME,
} from '@/config/streamConstants';

export type ThumbnailSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ThumbnailOptions {
  streamId?: string;
  imageUrl?: string;
  size?: ThumbnailSize;
  width?: number;
  height?: number;
  time?: number;
  fit?: 'cover' | 'crop' | 'scale' | 'fill' | 'clip';
}

const urlCache = new Map<string, string>();

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

  const cacheKey = JSON.stringify(options);
  const cached = urlCache.get(cacheKey);
  if (cached) return cached;

  let url: string;

  if (streamId) {
    const sizeValue =
      height ||
      width ||
      THUMBNAIL_SIZE[size.toUpperCase() as keyof typeof THUMBNAIL_SIZE] ||
      THUMBNAIL_SIZE.MEDIUM;

    url = `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg`;
    url += `?height=${sizeValue}`;
    url += `&fit=${fit}`;
    if (time !== THUMBNAIL_DEFAULT_TIME) {
      url += `&time=${time}s`;
    }
  } else if (imageUrl) {
    if (imageUrl.includes('imagedelivery.net')) {
      const sizeValue =
        height ||
        width ||
        THUMBNAIL_SIZE[size.toUpperCase() as keyof typeof THUMBNAIL_SIZE] ||
        THUMBNAIL_SIZE.MEDIUM;
      url = `${imageUrl}/h=${sizeValue}`;
    } else {
      url = imageUrl;
    }
  } else {
    url = '/placeholder-thumbnail.png';
  }

  urlCache.set(cacheKey, url);
  return url;
}

export function clearThumbnailCache(): void {
  urlCache.clear();
}

export const thumbnailPresets = {
  gridSmall: (streamId: string) => getThumbnailUrl({ streamId, size: 'small' }),
  gridMedium: (streamId: string) => getThumbnailUrl({ streamId, size: 'medium' }),
  card: (streamId: string) => getThumbnailUrl({ streamId, size: 'large' }),
  hero: (streamId: string) => getThumbnailUrl({ streamId, size: 'xlarge' }),
  atTime: (streamId: string, timeSeconds: number) =>
    getThumbnailUrl({ streamId, size: 'medium', time: timeSeconds }),
};
