import { useCallback, useEffect, useRef, useState } from 'react';

type VideoRegistration = {
  id: string;
  element: HTMLVideoElement;
  isCandidate: boolean;
  sortIndex: number;
};

type UseGridAutoplayOptions = {
  maxPlaying?: number;
  visibilityThreshold?: number; // 0–1
};

/**
 * Hook to manage grid video autoplay with IntersectionObserver
 * - Max 2 videos playing at once (configurable)
 * - Only candidate videos (1 in every 3) will autoplay
 * - Videos pause when scrolled out of view or displaced
 * - Returns playingIds set for UI state and registerVideo function
 */
export function useGridAutoplay(
  { maxPlaying = 2, visibilityThreshold = 0.6 }: UseGridAutoplayOptions = {}
) {
  const videosRef = useRef<Map<string, VideoRegistration>>(new Map());
  const visibleRef = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
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
        // best-effort play; ignore errors
        v.element.play().catch(() => {});
        newPlayingIds.add(v.id);
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

      if (!observerRef.current) return;

      // Deregister
      if (!element) {
        const existing = videosRef.current.get(id);
        if (existing?.element) {
          observerRef.current.unobserve(existing.element);
        }
        videosRef.current.delete(id);
        visibleRef.current.delete(id);
        updatePlayback();
        return;
      }

      // Register / update
      videosRef.current.set(id, { id, element, isCandidate, sortIndex });
      observerRef.current.observe(element);
      // don't call updatePlayback yet; wait for IntersectionObserver
    },
    [updatePlayback]
  );

  // Init / teardown IntersectionObserver
  useEffect(() => {
    if (observerRef.current) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const el = entry.target as HTMLVideoElement;
          // find which id this element belongs to
          const match = Array.from(videosRef.current.values()).find(
            v => v.element === el
          );
          if (!match) return;

          if (entry.intersectionRatio >= visibilityThreshold) {
            visibleRef.current.add(match.id);
          } else {
            visibleRef.current.delete(match.id);
          }
        });

        updatePlayback();
      },
      {
        threshold: [0, visibilityThreshold],
      }
    );

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      videosRef.current.clear();
      visibleRef.current.clear();
    };
  }, [updatePlayback, visibilityThreshold]);

  return { registerVideo, playingIds };
}

export type RegisterVideoFn = ReturnType<typeof useGridAutoplay>['registerVideo'];
