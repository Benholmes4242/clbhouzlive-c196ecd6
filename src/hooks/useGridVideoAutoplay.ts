import { useEffect, useRef } from 'react';

export interface VideoEntry {
  id: string;
  element: HTMLVideoElement | null;
  canAutoplay: boolean;
}

/**
 * Hook to manage grid video autoplay with IntersectionObserver
 * - Max 2 videos playing at once
 * - Only eligible videos (canAutoplay=true) will autoplay
 * - Videos pause when scrolled out of view
 */
export function useGridVideoAutoplay(videos: VideoEntry[]) {
  const playingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const MAX_PLAYING = 2;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          const id = video.dataset.postId;
          const canAutoplay = video.dataset.canAutoplay === 'true';

          if (!id || !canAutoplay) continue;

          const currentlyPlaying = playingIdsRef.current;

          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            // Try to start playback
            if (!currentlyPlaying.has(id)) {
              // Enforce max 2 videos playing
              if (currentlyPlaying.size >= MAX_PLAYING) {
                // Pause oldest
                const [first] = currentlyPlaying;
                const oldVideo = document.querySelector<HTMLVideoElement>(
                  `video[data-post-id="${first}"]`
                );
                if (oldVideo) {
                  oldVideo.pause();
                  oldVideo.currentTime = 0;
                }
                currentlyPlaying.delete(first);
              }

              video
                .play()
                .then(() => {
                  currentlyPlaying.add(id);
                })
                .catch(() => {
                  // autoplay blocked – leave it paused
                });
            }
          } else {
            // Out of view – pause + remove from active set
            if (currentlyPlaying.has(id)) {
              video.pause();
              currentlyPlaying.delete(id);
            }
          }
        }
      },
      {
        threshold: [0, 0.6],
      }
    );

    // Filter valid video entries and observe them
    videos.forEach(({ element, canAutoplay, id }) => {
      if (!element) return;
      element.dataset.postId = id;
      element.dataset.canAutoplay = canAutoplay ? 'true' : 'false';
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      playingIdsRef.current.clear();
    };
  }, [videos]);
}
