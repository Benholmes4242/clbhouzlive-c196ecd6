import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { logVideoTelemetry } from '@/utils/videoTelemetry';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { DecoderLimitManager } from '@/utils/video/DecoderLimitManager';
import { videoDebug } from '@/config/videoDebug';

interface VideoPreloaderOptions {
  maxPreloadItems?: number;
  preloadTimeoutMs?: number;
}

interface PreloadedVideo {
  video: HTMLVideoElement;
  url: string;
  created: number;
}

/**
 * useVideoPreloader - Preloads HLS videos and registers with global HLSPoolManager
 * 
 * FIX #2: Now integrates with HLSPoolManager for instance promotion.
 * Preloaded HLS instances are registered with the pool, allowing UnifiedVideoPlayer
 * to promote them instead of creating new instances.
 */
export function useVideoPreloader(
  mediaItems: any[],
  currentIndex: number,
  options: VideoPreloaderOptions = {}
) {
  const preloadedVideos = useRef(new Map<string, PreloadedVideo>());
  // Instagram-style prefetch: ±8 items for smooth scrolling
  const { maxPreloadItems = 8, preloadTimeoutMs = 10000 } = options;
  const swapToken = useRef(0);

  // Enhanced preload with HLS Pool integration
  useEffect(() => {
    const token = ++swapToken.current;

    const preloadVideo = async (item: any, index: number) => {
      if (!item || item.media_type !== 'video') return;
      if (preloadedVideos.current.has(item.media_url)) return;

      logVideoTelemetry('video_preload_started', { url: item.media_url, index });

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous'; // Consistent CORS handling

      const preloadEntry: PreloadedVideo = {
        video,
        url: item.media_url,
        created: Date.now()
      };

      // For HLS videos, setup HLS.js and register with pool
      if (item.media_url.includes('.m3u8') && Hls.isSupported()) {
        // Request preload-priority decoder slot first
        const slotGranted = DecoderLimitManager.requestSlot(
          item.media_url,
          video,
          'preload',
          () => {
            // Evicted - clean up preload
            videoDebug('decoderLimit', 'Preloader evicted from decoder pool', { url: item.media_url });
            cleanupPreloadEntry(item.media_url);
          }
        );

        if (!slotGranted) {
          // Skip preload if no slot available
          videoDebug('decoderLimit', 'Preloader decoder slot denied', { url: item.media_url });
          video.remove();
          return;
        }

        const hls = new Hls({
          // Match UnifiedVideoPlayer quality config exactly
          startLevel: -1,                         // ABR auto-select (not forced to lowest)
          capLevelToPlayerSize: false,             // No pixel-dimension quality cap
          maxBufferLength: 4,                     // Modest buffer for preload
          maxMaxBufferLength: 10,                 // Cap preload buffer
          backBufferLength: 2,
          lowLatencyMode: false,
          abrEwmaDefaultEstimate: 5_000_000 > 0 ? 5_000_000 : 1_000_000,
          abrBandWidthFactor: 0.95,
          abrBandWidthUpFactor: 0.5,
          highBufferWatchdogPeriod: 1,
          nudgeOffset: 0.1,
          abrMaxWithRealBitrate: true,
          startFragPrefetch: true,
          testBandwidth: false,
        });

        hls.attachMedia(video);
        hls.loadSource(item.media_url);

        // After first fragment loads at low quality, re-enable ABR for promotion
        hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
          if (data.frag.sn === 0) {
            hls.currentLevel = -1;
          }
        });

        // FIX #2: Register with global HLS Pool for promotion
        HLSPoolManager.register(item.media_url, hls, video);
      } else {
        video.src = item.media_url;
      }

      preloadedVideos.current.set(item.media_url, preloadEntry);
    };

    const cleanupPreloadEntry = (url: string) => {
      const entry = preloadedVideos.current.get(url);
      if (entry) {
        // Release decoder slot
        DecoderLimitManager.releaseSlot(url);
        
        // FIX #2: Cleanup via HLS Pool (handles HLS instance destruction)
        HLSPoolManager.cleanup(url);
        
        // Cleanup video element
        entry.video.src = '';
        entry.video.remove();
        preloadedVideos.current.delete(url);
      }
    };

    // Preload only adjacent items (current ± maxPreloadItems)
    const preloadIndexes = [];
    for (let i = 1; i <= maxPreloadItems; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < mediaItems.length) {
        preloadIndexes.push(nextIndex);
      }
      const prevIndex = currentIndex - i;
      if (prevIndex >= 0 && maxPreloadItems > 1) {
        preloadIndexes.push(prevIndex);
      }
    }

    preloadIndexes.forEach(index => {
      preloadVideo(mediaItems[index], index);
    });

    // Cleanup old preloaded videos (keep only adjacent items)
    const keepUrls = new Set<string>();
    preloadIndexes.forEach(index => {
      if (mediaItems[index]?.media_type === 'video') {
        keepUrls.add(mediaItems[index].media_url);
      }
    });

    preloadedVideos.current.forEach((entry, url) => {
      if (!keepUrls.has(url)) {
        cleanupPreloadEntry(url);
      }
    });

  }, [currentIndex, mediaItems, maxPreloadItems, preloadTimeoutMs]);

  // Cleanup all on unmount
  useEffect(() => {
    return () => {
      preloadedVideos.current.forEach((entry, url) => {
        // Release decoder slot
        DecoderLimitManager.releaseSlot(url);
        // FIX #2: Cleanup via HLS Pool
        HLSPoolManager.cleanup(url);
        entry.video.src = '';
        entry.video.remove();
      });
      preloadedVideos.current.clear();
    };
  }, []);

  // FIX #2: Updated API - promotion now handled by HLSPoolManager
  const promotePreload = (url: string, targetVideo: HTMLVideoElement) => {
    return HLSPoolManager.promote(url, targetVideo);
  };

  return {
    getPreloadedVideo: (url: string) => preloadedVideos.current.get(url)?.video,
    promotePreload,
    isPreloaded: (url: string) => HLSPoolManager.has(url) || preloadedVideos.current.has(url),
    getPoolStats: () => HLSPoolManager.getStats(),
  };
}
