import { useEffect, useRef } from 'react';

interface VideoPreloaderOptions {
  maxPreloadItems?: number;
}

export function useVideoPreloader(
  mediaItems: any[],
  currentIndex: number,
  options: VideoPreloaderOptions = {}
) {
  const preloadedVideos = useRef(new Map<string, HTMLVideoElement>());
  const { maxPreloadItems = 2 } = options;

  // Preload next video(s)
  useEffect(() => {
    const preloadVideo = async (item: any, index: number) => {
      if (!item || item.media_type !== 'video') return;
      if (preloadedVideos.current.has(item.media_url)) return;

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = item.media_url;

      // For HLS videos, setup HLS.js
      if (item.media_url.includes('.m3u8') && window.Hls?.isSupported()) {
        const hls = new window.Hls({
          maxBufferLength: 5,
          backBufferLength: 2,
        });
        hls.loadSource(item.media_url);
        hls.attachMedia(video);
        
        // Store HLS instance for cleanup
        (video as any)._hlsInstance = hls;
      }

      preloadedVideos.current.set(item.media_url, video);
      console.log(`[VideoPreloader] Preloaded video for index ${index}`);
    };

    // Preload next items
    for (let i = 1; i <= maxPreloadItems; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < mediaItems.length) {
        preloadVideo(mediaItems[nextIndex], nextIndex);
      }
    }

    // Cleanup old preloaded videos (keep only adjacent items)
    const keepKeys = new Set<string>();
    for (let i = -1; i <= maxPreloadItems; i++) {
      const index = currentIndex + i;
      if (index >= 0 && index < mediaItems.length && mediaItems[index]?.media_type === 'video') {
        keepKeys.add(mediaItems[index].media_url);
      }
    }

    preloadedVideos.current.forEach((video, url) => {
      if (!keepKeys.has(url)) {
        console.log(`[VideoPreloader] Cleaning up preloaded video: ${url}`);
        
        // Cleanup HLS instance
        if ((video as any)._hlsInstance) {
          (video as any)._hlsInstance.destroy();
        }
        
        video.src = '';
        video.remove();
        preloadedVideos.current.delete(url);
      }
    });

  }, [currentIndex, mediaItems, maxPreloadItems]);

  // Cleanup all on unmount
  useEffect(() => {
    return () => {
      preloadedVideos.current.forEach((video, url) => {
        if ((video as any)._hlsInstance) {
          (video as any)._hlsInstance.destroy();
        }
        video.src = '';
        video.remove();
      });
      preloadedVideos.current.clear();
    };
  }, []);

  return {
    getPreloadedVideo: (url: string) => preloadedVideos.current.get(url),
    isPreloaded: (url: string) => preloadedVideos.current.has(url),
  };
}
