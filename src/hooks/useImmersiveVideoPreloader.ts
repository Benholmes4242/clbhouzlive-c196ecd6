import { useRef, useEffect, useCallback, useState } from 'react';

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  duration: number;
  display_order: number;
}

interface VideoPool {
  [key: string]: {
    element: HTMLVideoElement;
    isReady: boolean;
    readyState: number;
    preloaded: boolean;
    lastUsed: number;
  };
}

interface PreloadTelemetry {
  videoId: string;
  primeStart: number;
  primeReady?: number;
  playImmediate: boolean;
  readyState: number;
  timeout?: boolean;
}

const MAX_POOL_SIZE = 3;
const PRIME_TIMEOUT = 300;
const READY_STATE_TARGET = 3; // HAVE_FUTURE_DATA

export const useImmersiveVideoPreloader = (
  mediaItems: MediaItem[],
  currentIndex: number,
  isGloballyMuted: boolean
) => {
  const videoPool = useRef<VideoPool>({});
  const [telemetry, setTelemetry] = useState<PreloadTelemetry[]>([]);
  const preloadQueue = useRef<Set<string>>(new Set());
  const imageCache = useRef<Set<string>>(new Set());

  // Create video element with optimal settings
  const createVideoElement = useCallback((src: string): HTMLVideoElement => {
    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.style.position = 'absolute';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    
    // iOS Safari specific attributes
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    
    document.body.appendChild(video);
    return video;
  }, []);

  // Preload image into memory
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (imageCache.current.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        imageCache.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  // Prime video for immediate playback
  const primeVideo = useCallback((videoElement: HTMLVideoElement, videoId: string): Promise<PreloadTelemetry> => {
    return new Promise((resolve) => {
      const telemetryData: PreloadTelemetry = {
        videoId,
        primeStart: performance.now(),
        playImmediate: false,
        readyState: videoElement.readyState
      };

      if (videoElement.readyState >= READY_STATE_TARGET) {
        // Already ready
        telemetryData.primeReady = performance.now();
        telemetryData.playImmediate = true;
        telemetryData.readyState = videoElement.readyState;
        resolve(telemetryData);
        return;
      }

      const timeout = setTimeout(() => {
        telemetryData.timeout = true;
        telemetryData.readyState = videoElement.readyState;
        resolve(telemetryData);
      }, PRIME_TIMEOUT);

      const onCanPlay = () => {
        clearTimeout(timeout);
        telemetryData.primeReady = performance.now();
        telemetryData.playImmediate = true;
        telemetryData.readyState = videoElement.readyState;
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('canplaythrough', onCanPlayThrough);
        resolve(telemetryData);
      };

      const onCanPlayThrough = () => {
        clearTimeout(timeout);
        telemetryData.primeReady = performance.now();
        telemetryData.playImmediate = true;
        telemetryData.readyState = videoElement.readyState;
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('canplaythrough', onCanPlayThrough);
        resolve(telemetryData);
      };

      videoElement.addEventListener('canplay', onCanPlay);
      videoElement.addEventListener('canplaythrough', onCanPlayThrough);
      
      // Trigger load if not already loading
      if (videoElement.readyState === 0) {
        videoElement.load();
      }
    });
  }, []);

  // Get indices to preload (current, next, previous)
  const getPreloadIndices = useCallback((index: number): number[] => {
    const indices: number[] = [index]; // Always include current
    
    // Add next
    if (index + 1 < mediaItems.length) {
      indices.push(index + 1);
    }
    
    // Add previous (limit to 1 for performance)
    if (index - 1 >= 0) {
      indices.push(index - 1);
    }
    
    return indices;
  }, [mediaItems.length]);

  // Cleanup old videos from pool
  const cleanupVideoPool = useCallback(() => {
    const keys = Object.keys(videoPool.current);
    if (keys.length <= MAX_POOL_SIZE) return;

    // Sort by last used time and remove oldest
    const sortedKeys = keys.sort((a, b) => 
      videoPool.current[a].lastUsed - videoPool.current[b].lastUsed
    );

    const toRemove = sortedKeys.slice(0, keys.length - MAX_POOL_SIZE);
    toRemove.forEach(key => {
      const video = videoPool.current[key];
      if (video.element.parentNode) {
        video.element.parentNode.removeChild(video.element);
      }
      delete videoPool.current[key];
    });
  }, []);

  // Preload media items
  const preloadMediaItems = useCallback(async (indices: number[]) => {
    const promises: Promise<void>[] = [];

    for (const index of indices) {
      const item = mediaItems[index];
      if (!item) continue;

      if (item.media_type === 'image') {
        // Preload image
        promises.push(preloadImage(item.media_url));
      } else if (item.media_type === 'video') {
        // Preload video
        const videoId = item.id;
        
        if (!videoPool.current[videoId] && !preloadQueue.current.has(videoId)) {
          preloadQueue.current.add(videoId);
          
          promises.push(
            new Promise<void>((resolve) => {
              const videoElement = createVideoElement(item.media_url);
              
              videoPool.current[videoId] = {
                element: videoElement,
                isReady: false,
                readyState: 0,
                preloaded: false,
                lastUsed: Date.now()
              };

              const onLoadStart = () => {
                videoPool.current[videoId].preloaded = true;
              };

              const onCanPlay = () => {
                if (videoPool.current[videoId]) {
                  videoPool.current[videoId].isReady = true;
                  videoPool.current[videoId].readyState = videoElement.readyState;
                  console.log(`📱 Video preloaded: ${videoId} (readyState: ${videoElement.readyState})`);
                }
                videoElement.removeEventListener('loadstart', onLoadStart);
                videoElement.removeEventListener('canplay', onCanPlay);
                preloadQueue.current.delete(videoId);
                resolve();
              };

              const onError = (error: Event) => {
                console.log(`📱 Video preload skipped: ${videoId} (network/access issue)`);
                preloadQueue.current.delete(videoId);
                videoElement.removeEventListener('loadstart', onLoadStart);
                videoElement.removeEventListener('canplay', onCanPlay);
                videoElement.removeEventListener('error', onError);
                
                // Clean up the failed element
                if (videoElement.parentNode) {
                  videoElement.parentNode.removeChild(videoElement);
                }
                delete videoPool.current[videoId];
                
                resolve();
              };

              // Add timeout for preload attempts (10 seconds max)
              const timeout = setTimeout(() => {
                console.log(`📱 Video preload timeout: ${videoId}`);
                preloadQueue.current.delete(videoId);
                videoElement.removeEventListener('loadstart', onLoadStart);
                videoElement.removeEventListener('canplay', onCanPlay);
                videoElement.removeEventListener('error', onError);
                
                if (videoElement.parentNode) {
                  videoElement.parentNode.removeChild(videoElement);
                }
                delete videoPool.current[videoId];
                
                resolve();
              }, 10000);

              videoElement.addEventListener('loadstart', onLoadStart);
              videoElement.addEventListener('canplay', () => {
                clearTimeout(timeout);
                onCanPlay();
              });
              videoElement.addEventListener('error', onError);
              
              // Start loading with error protection
              try {
                videoElement.load();
              } catch (error) {
                console.log(`📱 Video load failed immediately: ${videoId}`);
                preloadQueue.current.delete(videoId);
                if (videoElement.parentNode) {
                  videoElement.parentNode.removeChild(videoElement);
                }
                delete videoPool.current[videoId];
                resolve();
              }
            })
          );
        }
      }
    }

    await Promise.allSettled(promises);
    cleanupVideoPool();
  }, [mediaItems, preloadImage, createVideoElement, cleanupVideoPool]);

  // Get ready video element for immediate playback
  const getReadyVideo = useCallback(async (videoId: string): Promise<{
    videoElement: HTMLVideoElement | null;
    telemetry: PreloadTelemetry;
  }> => {
    const poolEntry = videoPool.current[videoId];
    
    if (!poolEntry) {
      return {
        videoElement: null,
        telemetry: {
          videoId,
          primeStart: performance.now(),
          playImmediate: false,
          readyState: 0
        }
      };
    }

    // Update last used time
    poolEntry.lastUsed = Date.now();
    
    // Prime the video for immediate playback
    const telemetryData = await primeVideo(poolEntry.element, videoId);
    
    return {
      videoElement: poolEntry.element,
      telemetry: telemetryData
    };
  }, [primeVideo]);

  // Update video mute state
  const updateVideoMuteState = useCallback(() => {
    Object.values(videoPool.current).forEach(({ element }) => {
      element.muted = isGloballyMuted;
    });
  }, [isGloballyMuted]);

  // Main preloading effect
  useEffect(() => {
    const indicesToPreload = getPreloadIndices(currentIndex);
    
    // Small delay to avoid overwhelming on rapid changes
    const timer = setTimeout(() => {
      preloadMediaItems(indicesToPreload);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentIndex, getPreloadIndices, preloadMediaItems]);

  // Update mute state when global mute changes
  useEffect(() => {
    updateVideoMuteState();
  }, [updateVideoMuteState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(videoPool.current).forEach(({ element }) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      videoPool.current = {};
      preloadQueue.current.clear();
      imageCache.current.clear();
    };
  }, []);

  // Log telemetry
  const logTelemetry = useCallback((data: PreloadTelemetry) => {
    setTelemetry(prev => [...prev, data]);
    console.log('📱 Video Telemetry:', {
      videoId: data.videoId,
      primeTime: data.primeReady ? data.primeReady - data.primeStart : 'timeout',
      playImmediate: data.playImmediate,
      readyState: data.readyState,
      timeout: data.timeout
    });
  }, []);

  return {
    getReadyVideo,
    isImagePreloaded: (src: string) => imageCache.current.has(src),
    isVideoPreloaded: (videoId: string) => videoPool.current[videoId]?.preloaded || false,
    isVideoReady: (videoId: string) => videoPool.current[videoId]?.isReady || false,
    getVideoReadyState: (videoId: string) => videoPool.current[videoId]?.readyState || 0,
    telemetry,
    logTelemetry
  };
};