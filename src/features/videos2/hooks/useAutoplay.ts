import { useEffect, useRef, useCallback } from 'react';

/**
 * Auto-preview control hook - ensures only one video plays at a time
 * Uses IntersectionObserver with 0.75 threshold for viewport detection
 */
export function useAutoplay() {
  const videoRefs = useRef<Set<HTMLVideoElement>>(new Set());
  const currentlyPlaying = useRef<HTMLVideoElement | null>(null);
  const prefersReducedMotion = useRef(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const register = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    videoRefs.current.add(video);
  }, []);

  const unregister = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    videoRefs.current.delete(video);
    if (currentlyPlaying.current === video) {
      currentlyPlaying.current = null;
    }
  }, []);

  const playVideo = useCallback((video: HTMLVideoElement) => {
    if (prefersReducedMotion.current) return;
    
    // Pause any currently playing video
    if (currentlyPlaying.current && currentlyPlaying.current !== video) {
      currentlyPlaying.current.pause();
      currentlyPlaying.current.currentTime = 0;
    }

    // Play the new video
    video.play().catch(() => {
      // Ignore autoplay errors
    });
    currentlyPlaying.current = video;
  }, []);

  const pauseVideo = useCallback((video: HTMLVideoElement) => {
    video.pause();
    video.currentTime = 0;
    if (currentlyPlaying.current === video) {
      currentlyPlaying.current = null;
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          
          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            // Debounce preview start
            const timeout = setTimeout(() => {
              playVideo(video);
            }, 200);
            (video as any).__previewTimeout = timeout;
          } else {
            // Clear timeout and pause
            if ((video as any).__previewTimeout) {
              clearTimeout((video as any).__previewTimeout);
            }
            pauseVideo(video);
          }
        });
      },
      { threshold: [0.75] }
    );

    // Observe all registered videos
    videoRefs.current.forEach((video) => observer.observe(video));

    return () => {
      observer.disconnect();
      // Clear all timeouts
      videoRefs.current.forEach((video) => {
        if ((video as any).__previewTimeout) {
          clearTimeout((video as any).__previewTimeout);
        }
      });
    };
  }, [playVideo, pauseVideo]);

  // Pause all videos when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentlyPlaying.current) {
        pauseVideo(currentlyPlaying.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pauseVideo]);

  return { register, unregister };
}
