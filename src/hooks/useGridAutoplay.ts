import { useCallback, useEffect, useRef, useState } from 'react';

type VideoRegistration = {
  id: string;
  element: HTMLVideoElement;
  isCandidate: boolean;
  sortIndex: number;
  hasBeenPreloaded: boolean;
};

type UseGridAutoplayOptions = {
  maxPlaying?: number;
  visibilityThreshold?: number; // 0–1
  preloadMargin?: number; // pixels above/below viewport to start preloading
};

/**
 * Hook to manage grid video autoplay with IntersectionObserver
 * - Max 2 videos playing at once (configurable)
 * - Only candidate videos (1 in every 3) will autoplay
 * - Videos pause when scrolled out of view or displaced
 * - Preloads videos near viewport for smooth playback start
 * - Returns playingIds set for UI state and registerVideo function
 */
export function useGridAutoplay(
  { maxPlaying = 2, visibilityThreshold = 0.6, preloadMargin = 300 }: UseGridAutoplayOptions = {}
) {
  const videosRef = useRef<Map<string, VideoRegistration>>(new Map());
  const visibleRef = useRef<Set<string>>(new Set());
  const autoplayObserverRef = useRef<IntersectionObserver | null>(null);
  const preloadObserverRef = useRef<IntersectionObserver | null>(null);
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());

  // Core playback logic
  const updatePlayback = useCallback(() => {
    const videos = Array.from(videosRef.current.values());

    // Only visible candidates
    const visibleCandidates = videos.filter(v =>
      v.isCandidate && visibleRef.current.has(v.id)
    );

    // Sort by sortIndex (stable order in grid)
    visibleCandidates.sort((a, b) => a.sortIndex - b.sortIndex);

    const toPlay = new Set(
      visibleCandidates.slice(0, maxPlaying).map(v => v.id)
    );

    const newPlayingIds = new Set<string>();

    videos.forEach(v => {
      const shouldPlay = toPlay.has(v.id);
      if (!v.element) return;

      if (shouldPlay) {
        // Only play if video is ready enough to avoid stuttering
        if (v.element.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
          v.element.play().catch(() => {});
          newPlayingIds.add(v.id);
        } else {
          // Wait for canplay event before playing
          const onCanPlay = () => {
            v.element.play().catch(() => {});
            v.element.removeEventListener('canplay', onCanPlay);
          };
          v.element.addEventListener('canplay', onCanPlay, { once: true });
        }
      } else {
        v.element.pause();
      }
    });

    setPlayingIds(newPlayingIds);
  }, [maxPlaying]);

  // Called by each tile with its video ref
  const registerVideo = useCallback(
    (args: {
      id: string;
      element: HTMLVideoElement | null;
      isCandidate: boolean;
      sortIndex: number;
    }) => {
      const { id, element, isCandidate, sortIndex } = args;

      // Deregister
      if (!element) {
        const existing = videosRef.current.get(id);
        if (existing?.element) {
          autoplayObserverRef.current?.unobserve(existing.element);
          preloadObserverRef.current?.unobserve(existing.element);
        }
        videosRef.current.delete(id);
        visibleRef.current.delete(id);
        updatePlayback();
        return;
      }

      // Get existing or create new registration
      const existing = videosRef.current.get(id);
      const registration: VideoRegistration = {
        id,
        element,
        isCandidate,
        sortIndex,
        hasBeenPreloaded: existing?.hasBeenPreloaded ?? false,
      };

      videosRef.current.set(id, registration);

      // Tag element for observer callbacks
      element.dataset.gridVideoId = id;

      // Observe with both observers
      if (autoplayObserverRef.current) {
        autoplayObserverRef.current.observe(element);
      }
      if (preloadObserverRef.current) {
        preloadObserverRef.current.observe(element);
      }
    },
    [updatePlayback]
  );

  // Init preload observer (wide margin to buffer ahead)
  useEffect(() => {
    preloadObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLVideoElement;
          const id = target.dataset.gridVideoId;
          if (!id) return;

          const record = videosRef.current.get(id);
          if (!record || record.hasBeenPreloaded) return;

          if (entry.isIntersecting) {
            // Near viewport → upgrade preload and start buffering
            target.preload = 'auto';
            try {
              target.load();
            } catch {
              // Some browsers may not like explicit load()
            }
            record.hasBeenPreloaded = true;
            videosRef.current.set(id, record);
          }
        });
      },
      {
        root: null,
        rootMargin: `${preloadMargin}px 0px ${preloadMargin}px 0px`,
        threshold: 0.01,
      }
    );

    return () => {
      preloadObserverRef.current?.disconnect();
      preloadObserverRef.current = null;
    };
  }, [preloadMargin]);

  // Init autoplay observer
  useEffect(() => {
    autoplayObserverRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const el = entry.target as HTMLVideoElement;
          const id = el.dataset.gridVideoId;
          if (!id) return;

          const match = videosRef.current.get(id);
          if (!match) return;

          if (entry.intersectionRatio >= visibilityThreshold) {
            visibleRef.current.add(id);
          } else {
            visibleRef.current.delete(id);
          }
        });

        updatePlayback();
      },
      {
        threshold: [0, visibilityThreshold],
      }
    );

    return () => {
      autoplayObserverRef.current?.disconnect();
      autoplayObserverRef.current = null;
      videosRef.current.clear();
      visibleRef.current.clear();
    };
  }, [updatePlayback, visibilityThreshold]);

  return { registerVideo, playingIds };
}

export type RegisterVideoFn = ReturnType<typeof useGridAutoplay>['registerVideo'];
