import { useCallback, useEffect, useRef, useState } from 'react';
import { safePlay } from '@/utils/safePlay';

type VideoRegistration = {
  id: string;
  element: HTMLVideoElement; // media element to play/pause
  autoplayTarget: HTMLElement; // element observed for visibility (e.g. wrapper)
  isCandidate: boolean;
  sortIndex: number;
  hasBeenPreloaded: boolean;
};

type UseGridAutoplayOptions = {
  maxPlaying?: number;
  visibilityThreshold?: number; // 0–1, threshold to START playing
  visibilityStopThreshold?: number; // 0–1, threshold to STOP playing (hysteresis)
  preloadMargin?: number; // pixels above/below viewport to start preloading
  scrollSettleDelay?: number; // ms to wait after scroll stops before resuming playback
};

/**
 * Hook to manage grid video autoplay with IntersectionObserver
 * - Max 1 video playing at once (configurable)
 * - Only candidate videos (1 in every 3) will autoplay
 * - Videos pause when scrolled out of view or displaced
 * - Preloads videos near viewport for smooth playback start
 * - Scroll velocity protection: pauses during fast scroll, resumes after settle
 * - Tab/window blur: pauses all when tab hidden, resumes when visible
 * - Returns playingIds set for UI state and registerVideo function
 */
export function useGridAutoplay(
  { 
    maxPlaying = 1, 
    visibilityThreshold = 0.6,
    visibilityStopThreshold = 0.4, // Hysteresis: stop at lower threshold
    preloadMargin = 300,
    scrollSettleDelay = 200 
  }: UseGridAutoplayOptions = {}
) {
  const videosRef = useRef<Map<string, VideoRegistration>>(new Map());
  const visibleRef = useRef<Set<string>>(new Set());
  const autoplayObserverRef = useRef<IntersectionObserver | null>(null);
  const preloadObserverRef = useRef<IntersectionObserver | null>(null);
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  
  // Scroll velocity protection state
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackPausedByScrollRef = useRef(false);
  
  // Tab visibility state
  const isTabVisibleRef = useRef(!document.hidden);
  
  // Track pending play attempts for retry logic
  const pendingPlayRef = useRef<Set<string>>(new Set());

  // Pause all videos helper
  const pauseAllVideos = useCallback(() => {
    const videos = Array.from(videosRef.current.values());
    videos.forEach(v => {
      if (v.element) {
        v.element.pause();
      }
    });
    setPlayingIds(new Set());
  }, []);

  // Core playback logic
  const updatePlayback = useCallback(() => {
    // Don't play if scrolling fast or tab is hidden
    if (isScrollingRef.current || !isTabVisibleRef.current) {
      pauseAllVideos();
      return;
    }

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
        // IMPORTANT: Check if already playing to prevent repeated play() calls
        // This prevents AbortError from play() being interrupted by another play()
        if (!v.element.paused && !v.element.ended) {
          // Already playing, just track it
          newPlayingIds.add(v.id);
          return;
        }
        
        // IMPORTANT: for HLS/HLS.js sources, readyState can remain low until a play()
        // attempt kicks off buffering. So we always attempt play() for the chosen video.
        const attemptPlay = () => {
          safePlay(v.element)
            .then((ok) => {
              pendingPlayRef.current.delete(v.id);
              if (ok) {
                if (import.meta.env.DEV) {
                  console.log('[GridAutoplay][play] success', v.id);
                }
                return;
              }

              if (import.meta.env.DEV) {
                console.error('[GridAutoplay][playError]', v.id, {
                  readyState: v.element.readyState,
                  networkState: v.element.networkState,
                  muted: v.element.muted,
                });
              }

              // Retry once after a short delay if still visible and candidate
              if (!pendingPlayRef.current.has(v.id) && visibleRef.current.has(v.id)) {
                pendingPlayRef.current.add(v.id);
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    if (visibleRef.current.has(v.id) && v.isCandidate && v.element.paused) {
                      safePlay(v.element).finally(() => {
                        pendingPlayRef.current.delete(v.id);
                      });
                    } else {
                      pendingPlayRef.current.delete(v.id);
                    }
                  }, 200);
                });
              }
            })
            .catch((err: unknown) => {
              // safePlay should not throw in normal cases, but guard anyway
              pendingPlayRef.current.delete(v.id);
              if (import.meta.env.DEV) {
                console.error('[GridAutoplay][playError]', v.id, err);
              }
            });
        };
        attemptPlay();
        newPlayingIds.add(v.id);
      } else {
        v.element.pause();
      }
    });

    setPlayingIds(newPlayingIds);
  }, [maxPlaying, pauseAllVideos]);

  // Called by each tile with its video ref
  const registerVideo = useCallback(
    (args: {
      id: string;
      element: HTMLVideoElement | null;
      isCandidate: boolean;
      sortIndex: number;
      viewportEl?: HTMLElement | null; // element used for IntersectionObserver visibility
    }) => {
      const { id, element, isCandidate, sortIndex, viewportEl } = args;

      // Deregister
      if (!element) {
        const existing = videosRef.current.get(id);
        if (existing?.element) {
          preloadObserverRef.current?.unobserve(existing.element);
          autoplayObserverRef.current?.unobserve(existing.autoplayTarget);
        }
        videosRef.current.delete(id);
        visibleRef.current.delete(id);
        updatePlayback();
        return;
      }

      const autoplayTarget = viewportEl ?? element;

      // Get existing or create new registration
      const existing = videosRef.current.get(id);
      const registration: VideoRegistration = {
        id,
        element,
        autoplayTarget,
        isCandidate,
        sortIndex,
        hasBeenPreloaded: existing?.hasBeenPreloaded ?? false,
      };

      videosRef.current.set(id, registration);

      // Tag elements for observer callbacks
      element.dataset.gridVideoId = id;
      autoplayTarget.dataset.gridVideoId = id;

      // Observe with both observers
      if (preloadObserverRef.current) {
        preloadObserverRef.current.observe(element);
      }
      if (autoplayObserverRef.current) {
        autoplayObserverRef.current.observe(autoplayTarget);
      }

      // Trigger playback check shortly after registration to catch initially-visible videos
      setTimeout(() => updatePlayback(), 50);
    },
    [updatePlayback]
  );

  // Scroll velocity protection
  useEffect(() => {
    const handleScroll = () => {
      // Mark as scrolling
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        playbackPausedByScrollRef.current = true;
        pauseAllVideos();
      }

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to resume after scroll settles
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        playbackPausedByScrollRef.current = false;
        updatePlayback();
      }, scrollSettleDelay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollSettleDelay, pauseAllVideos, updatePlayback]);

  // Tab/window visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      if (document.hidden) {
        pauseAllVideos();
      } else {
        // Resume playback when tab becomes visible (after a brief delay)
        setTimeout(() => updatePlayback(), 100);
      }
    };

    const handleWindowBlur = () => {
      isTabVisibleRef.current = false;
      pauseAllVideos();
    };

    const handleWindowFocus = () => {
      isTabVisibleRef.current = true;
      setTimeout(() => updatePlayback(), 100);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [pauseAllVideos, updatePlayback]);

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
            // Near viewport → upgrade preload. Avoid calling load() for HLS.js-backed videos
            // (calling video.load() can reset the media element and break MSE attachment).
            target.preload = 'auto';
            const usesHlsJs = target.dataset.gridUsesHlsJs === '1';
            const src = target.dataset.gridVideoSrc || target.currentSrc || target.src || '';
            const isHlsManifest = src.includes('.m3u8');

            if (!usesHlsJs && !isHlsManifest) {
              try {
                target.load();
              } catch {
                // Some browsers may not like explicit load()
              }
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

    // Videos can register before this effect runs; ensure they're observed.
    for (const v of videosRef.current.values()) {
      preloadObserverRef.current.observe(v.element);
    }

    return () => {
      preloadObserverRef.current?.disconnect();
      preloadObserverRef.current = null;
    };
  }, [preloadMargin]);

  // Init autoplay observer with hysteresis
  useEffect(() => {
    // Use ONLY start/stop thresholds - no 0 threshold to avoid spurious triggers
    const thresholds = [visibilityStopThreshold, visibilityThreshold];
    
    autoplayObserverRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const el = entry.target as HTMLElement;
          const id = el.dataset.gridVideoId;
          if (!id) return;

          const ratio = entry.intersectionRatio;
          
          // IMPORTANT: Ignore isIntersecting, use ratio-based gating only
          // This prevents spurious 0.00 triggers from causing play/pause churn

          const match = videosRef.current.get(id);
          if (!match) return;

          const wasVisible = visibleRef.current.has(id);
          
          // Hysteresis logic (ratio-based only, ignore isIntersecting):
          // - Start playing when ratio >= visibilityThreshold (0.6)
          // - Stop playing when ratio <= visibilityStopThreshold (0.4)
          // - In between: maintain current state (no flicker)
          let nextVisible = wasVisible;
          if (ratio >= visibilityThreshold) {
            visibleRef.current.add(id);
            nextVisible = true;
          } else if (ratio <= visibilityStopThreshold) {
            visibleRef.current.delete(id);
            nextVisible = false;
          }
          // If between stop and start thresholds, keep current state (hysteresis)
          
          if (import.meta.env.DEV && wasVisible !== nextVisible) {
            // Only log when state actually changes
            // eslint-disable-next-line no-console
            console.log('[GridAutoplay][IO]', id.slice(0, 8), `ratio=${ratio.toFixed(2)}`, `visible: ${wasVisible} → ${nextVisible}`);
          }
        });

        updatePlayback();
      },
      {
        threshold: thresholds,
      }
    );

    // Videos can register before this effect runs; ensure they're observed.
    for (const v of videosRef.current.values()) {
      autoplayObserverRef.current.observe(v.autoplayTarget);
    }

    // Trigger initial playback check after a short delay to allow observer to report initial visibility
    const initialCheck = setTimeout(() => {
      updatePlayback();
    }, 150);

    return () => {
      clearTimeout(initialCheck);
      autoplayObserverRef.current?.disconnect();
      autoplayObserverRef.current = null;
      videosRef.current.clear();
      visibleRef.current.clear();
    };
  }, [updatePlayback, visibilityThreshold, visibilityStopThreshold]);

  return { registerVideo, playingIds };
}

export type RegisterVideoFn = ReturnType<typeof useGridAutoplay>['registerVideo'];
