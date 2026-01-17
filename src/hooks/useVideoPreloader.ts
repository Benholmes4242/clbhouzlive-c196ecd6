import { useEffect, useRef } from 'react';
import { logVideoTelemetry } from '@/utils/videoTelemetry';

interface VideoPreloaderOptions {
  maxPreloadItems?: number;
  preloadTimeoutMs?: number;
}

interface PreloadedVideo {
  video: HTMLVideoElement;
  hlsInstance?: any;
  timeoutId?: NodeJS.Timeout;
  created: number;
}

export function useVideoPreloader(
  mediaItems: any[],
  currentIndex: number,
  options: VideoPreloaderOptions = {}
) {
  const preloadedVideos = useRef(new Map<string, PreloadedVideo>());
  // Instagram-style prefetch: ±4 items for smooth scrolling
  const { maxPreloadItems = 4, preloadTimeoutMs = 10000 } = options;
  const swapToken = useRef(0);

  // Enhanced preload with memory discipline
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
        created: Date.now()
      };

      // For HLS videos, setup lightweight HLS.js preloader
      if (item.media_url.includes('.m3u8') && window.Hls?.isSupported()) {
        const hls = new window.Hls({
          maxBufferLength: 4,  // Modest buffer for preload
          backBufferLength: 2,
        });

        hls.attachMedia(video);
        hls.loadSource(item.media_url);
        preloadEntry.hlsInstance = hls;

        // Auto-cleanup after timeout to prevent memory creep
        preloadEntry.timeoutId = setTimeout(() => {
          if (token === swapToken.current) { // Only cleanup if we haven't swapped
            console.log(`[VideoPreloader] Auto-cleanup preloaded video: ${item.media_url}`);
            logVideoTelemetry('video_preload_aborted', { url: item.media_url, reason: 'timeout' });
            cleanupPreloadEntry(item.media_url);
          }
        }, preloadTimeoutMs);
      } else {
        video.src = item.media_url;
      }

      preloadedVideos.current.set(item.media_url, preloadEntry);
      console.log(`[VideoPreloader] Preloaded video for index ${index}`);
    };

    const cleanupPreloadEntry = (url: string) => {
      const entry = preloadedVideos.current.get(url);
      if (entry) {
        if (entry.timeoutId) {
          clearTimeout(entry.timeoutId);
        }
        if (entry.hlsInstance) {
          try {
            entry.hlsInstance.stopLoad();
            entry.hlsInstance.detachMedia();
            entry.hlsInstance.destroy();
          } catch (e) {
            console.warn('[VideoPreloader] Error cleaning up HLS:', e);
          }
        }
        entry.video.src = '';
        entry.video.remove();
        preloadedVideos.current.delete(url);
      }
    };

    // Preload only adjacent items (current ± 1)
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
        console.log(`[VideoPreloader] Cleaning up unused preloaded video: ${url}`);
        cleanupPreloadEntry(url);
      }
    });

  }, [currentIndex, mediaItems, maxPreloadItems, preloadTimeoutMs]);

  // Cleanup all on unmount
  useEffect(() => {
    return () => {
      preloadedVideos.current.forEach((entry, url) => {
        if (entry.timeoutId) {
          clearTimeout(entry.timeoutId);
        }
        if (entry.hlsInstance) {
          try {
            entry.hlsInstance.stopLoad();
            entry.hlsInstance.detachMedia();
            entry.hlsInstance.destroy();
          } catch (e) {
            console.warn('[VideoPreloader] Error during cleanup:', e);
          }
        }
        entry.video.src = '';
        entry.video.remove();
      });
      preloadedVideos.current.clear();
    };
  }, []);

  const promotePreload = (url: string, targetVideo: HTMLVideoElement) => {
    const entry = preloadedVideos.current.get(url);
    if (entry?.hlsInstance) {
      logVideoTelemetry('video_preload_promoted', { url });
      
      // Clear timeout since we're promoting
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }
      
      // Detach from preload video and attach to target
      try {
        entry.hlsInstance.detachMedia();
        entry.hlsInstance.attachMedia(targetVideo);
        return entry.hlsInstance;
      } catch (e) {
        console.warn('[VideoPreloader] Error promoting preload:', e);
        return null;
      }
    }
    return null;
  };

  return {
    getPreloadedVideo: (url: string) => preloadedVideos.current.get(url)?.video,
    promotePreload,
    isPreloaded: (url: string) => preloadedVideos.current.has(url),
  };
}
