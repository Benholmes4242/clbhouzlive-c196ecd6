import { useEffect, useRef, useCallback, RefObject } from 'react';

/**
 * Auto-preview control for horizontal rails (shorts carousel)
 * Uses scoped IntersectionObserver with rail container as root
 */
export function useAutoplayInRail(railRef: RefObject<HTMLElement>) {
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
    
    if (currentlyPlaying.current && currentlyPlaying.current !== video) {
      currentlyPlaying.current.pause();
      currentlyPlaying.current.currentTime = 0;
    }

    video.play().catch(() => {});
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
    if (prefersReducedMotion.current || !railRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          
          if (entry.isIntersecting && entry.intersectionRatio >= 0.95) {
            const timeout = setTimeout(() => playVideo(video), 150);
            (video as any).__railTimeout = timeout;
          } else {
            if ((video as any).__railTimeout) {
              clearTimeout((video as any).__railTimeout);
            }
            pauseVideo(video);
          }
        });
      },
      { 
        root: railRef.current,
        threshold: [0.95]
      }
    );

    videoRefs.current.forEach((video) => observer.observe(video));

    return () => {
      observer.disconnect();
      videoRefs.current.forEach((video) => {
        if ((video as any).__railTimeout) {
          clearTimeout((video as any).__railTimeout);
        }
      });
    };
  }, [railRef, playVideo, pauseVideo]);

  return { register, unregister };
}
