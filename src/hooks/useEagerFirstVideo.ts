/**
 * useEagerFirstVideo - Optimizes first video load performance
 * 
 * Uses useLayoutEffect to:
 * 1. Immediately flag first video for attachment (before paint)
 * 2. Preload its HLS manifest
 * 
 * This eliminates the 2+ second React render delay experienced on first load.
 */

import { useLayoutEffect, useRef } from 'react';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

interface VideoItem {
  id: string;
  type?: string;
  mediaType?: string;
  src?: string;
  mediaUrl?: string;
  media?: Array<{ media_url?: string; media_type?: string }>;
}

interface UseEagerFirstVideoOptions<T extends VideoItem> {
  items: T[];
  getVideoUrl?: (item: T) => string | undefined;
  isVideo?: (item: T) => boolean;
}

/**
 * Hook to optimize first video load by preloading immediately on mount.
 * 
 * @returns firstPreloadedId - The ID of the first preloaded video (if any)
 */
export function useEagerFirstVideo<T extends VideoItem>({
  items,
  getVideoUrl,
  isVideo,
}: UseEagerFirstVideoOptions<T>): string | null {
  const hasPreloadedRef = useRef(false);
  const firstVideoIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (hasPreloadedRef.current) return;
    if (!items.length) return;

    // Find first video item
    const firstVideo = items.find((item) => {
      if (isVideo) return isVideo(item);
      return item.type === 'video' || 
             item.mediaType === 'video' || 
             item.media?.[0]?.media_type === 'video';
    });

    if (!firstVideo) return;

    hasPreloadedRef.current = true;
    firstVideoIdRef.current = firstVideo.id;

    // Get the video URL
    let videoUrl: string | undefined;
    if (getVideoUrl) {
      videoUrl = getVideoUrl(firstVideo);
    } else {
      videoUrl = firstVideo.src || 
                 firstVideo.mediaUrl || 
                 firstVideo.media?.[0]?.media_url;
    }

    if (!videoUrl) return;

    // Preload HLS manifest immediately
    const uid = uidFromNode({ src: videoUrl });
    if (uid) {
      const hlsUrl = generateStreamHlsUrl(uid);
      
      if (import.meta.env.DEV) {
        console.log(`[${performance.now().toFixed(2)}ms] [useEagerFirstVideo] PRELOAD`, { 
          id: firstVideo.id.slice(0, 8),
          hlsUrl: hlsUrl.slice(0, 50)
        });
      }
      
      preloadHlsManifest(hlsUrl);
    }
  }, [items, getVideoUrl, isVideo]);

  return firstVideoIdRef.current;
}
