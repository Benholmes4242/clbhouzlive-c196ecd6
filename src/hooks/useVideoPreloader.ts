import { useEffect, useRef, useState } from 'react';

interface VideoPreloaderOptions {
  videos: Array<{ id: string; url: string; }>;
  currentIndex: number;
  preloadCount?: number;
}

export const useVideoPreloader = ({ 
  videos, 
  currentIndex, 
  preloadCount = 2 
}: VideoPreloaderOptions) => {
  const [preloadedVideos, setPreloadedVideos] = useState<Set<string>>(new Set());
  const preloadQueue = useRef<HTMLVideoElement[]>([]);

  useEffect(() => {
    const preloadVideo = (videoUrl: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (preloadedVideos.has(videoUrl)) {
          resolve();
          return;
        }

        const video = document.createElement('video');
        video.src = videoUrl;
        video.preload = 'auto'; // Lightweight full preload for instant playback
        video.muted = true;
        video.playsInline = true;

        const onCanPlay = () => {
          console.log('📱 Preloader: Video preloaded', { url: videoUrl.slice(-20) });
          setPreloadedVideos(prev => new Set(prev).add(videoUrl));
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          resolve();
        };

        const onError = (error: Event) => {
          console.error('📱 Preloader: Failed to preload video', { url: videoUrl.slice(-20), error });
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          reject(error);
        };

        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('error', onError);

        // Add to queue for cleanup
        preloadQueue.current.push(video);

        // Start loading
        video.load();
      });
    };

    const preloadNextVideos = async () => {
      const videosToPreload: string[] = [];
      
      // Preload next videos
      for (let i = 1; i <= preloadCount; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < videos.length) {
          videosToPreload.push(videos[nextIndex].url);
        }
      }

      // Preload previous videos (for smooth backwards scrolling)
      for (let i = 1; i <= Math.min(preloadCount, 1); i++) {
        const prevIndex = currentIndex - i;
        if (prevIndex >= 0) {
          videosToPreload.push(videos[prevIndex].url);
        }
      }

      // Remove duplicates and already preloaded videos
      const uniqueVideos = [...new Set(videosToPreload)].filter(
        url => !preloadedVideos.has(url)
      );

      console.log('📱 Preloader: Starting preload batch', { 
        currentIndex, 
        videosToPreload: uniqueVideos.length,
        urls: uniqueVideos.map(url => url.slice(-20))
      });

      // Preload videos with a small delay between each to avoid overwhelming the browser
      for (const videoUrl of uniqueVideos) {
        try {
          await preloadVideo(videoUrl);
          // Small delay to prevent overwhelming mobile browsers
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('📱 Preloader: Error preloading video', error);
        }
      }
    };

    // Start preloading after current video starts playing
    const timer = setTimeout(() => {
      preloadNextVideos();
    }, 1000); // Wait 1 second after current video loads

    return () => {
      clearTimeout(timer);
    };
  }, [currentIndex, videos, preloadCount, preloadedVideos]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadQueue.current.forEach(video => {
        video.src = '';
        video.load(); // This effectively stops the loading
      });
      preloadQueue.current = [];
    };
  }, []);

  return {
    isPreloaded: (videoUrl: string) => preloadedVideos.has(videoUrl),
    preloadedCount: preloadedVideos.size
  };
};