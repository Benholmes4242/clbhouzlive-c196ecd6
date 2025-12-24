/**
 * useGridMediaRuntime - MediaRuntime integration for grid surfaces
 * 
 * Bridges the UniversalMediaGrid to MediaRuntime for playback control.
 * Uses useMediaAutoplay for IntersectionObserver-based visibility tracking.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useMediaAutoplay, RegisterMediaFn } from '@/media';
import { MediaRuntime } from '@/media/runtime';
import { GridSurface, UniversalMediaItem } from '../types';

interface UseGridMediaRuntimeOptions {
  surface: GridSurface;
  maxConcurrent?: number;
  playThreshold?: number;
  pauseThreshold?: number;
  enabled?: boolean;
}

interface UseGridMediaRuntimeResult {
  /** Register a video element for autoplay management */
  registerMedia: RegisterMediaFn;
  /** Set of currently playing media IDs */
  playingIds: Set<string>;
  /** Notify runtime of scroll state */
  setScrolling: (isScrolling: boolean) => void;
}

// Map our surface types to MediaRuntime surfaces
const SURFACE_MAP: Record<GridSurface, 'grid' | 'clubhouse'> = {
  clubhouse: 'clubhouse',
  shorts: 'grid',
  discover: 'grid',
  profile: 'grid',
  trending: 'grid',
  business: 'grid',
};

export function useGridMediaRuntime({
  surface,
  maxConcurrent,
  playThreshold = 0.4,
  pauseThreshold = 0.25,
  enabled = true,
}: UseGridMediaRuntimeOptions): UseGridMediaRuntimeResult {
  
  const runtimeSurface = SURFACE_MAP[surface];
  
  // Use the unified media autoplay hook
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: surface === 'clubhouse' ? 'feed' : 'grid',
    surface: runtimeSurface,
    startThreshold: playThreshold,
    stopThreshold: pauseThreshold,
  });
  
  // Track scroll state
  const setScrolling = useCallback((isScrolling: boolean) => {
    MediaRuntime.setUIState({ isScrolling });
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Pause all when component unmounts
      if (surface !== 'clubhouse') {
        // Don't pause clubhouse on unmount - it handles its own cleanup
        MediaRuntime.setUIState({ isScrolling: false });
      }
    };
  }, [surface]);
  
  return {
    registerMedia: enabled ? registerMedia : (() => {}),
    playingIds: enabled ? playingIds : new Set(),
    setScrolling,
  };
}

/**
 * useVerticalFeedRuntime - Specialized runtime for vertical snap-scroll feeds
 * 
 * For Clubhouse-style vertical feeds where center index determines playback.
 */
export function useVerticalFeedRuntime({
  items,
  currentIndex,
  videoRefs,
  enabled = true,
}: {
  items: UniversalMediaItem[];
  currentIndex: number;
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>;
  enabled?: boolean;
}) {
  const prevCenterIdRef = useRef<string | null>(null);
  const registeredIdsRef = useRef<Set<string>>(new Set());
  
  // Register/unregister videos in the window
  useEffect(() => {
    if (!enabled || !items.length) return;
    
    const windowRadius = 1;
    const start = Math.max(0, currentIndex - windowRadius);
    const end = Math.min(items.length - 1, currentIndex + windowRadius);
    
    const shouldBeRegistered = new Set<string>();
    
    for (let i = start; i <= end; i++) {
      const item = items[i];
      if (!item || item.type !== 'video') continue;
      
      const videoEl = videoRefs.current[item.id];
      if (!videoEl) continue;
      
      shouldBeRegistered.add(item.id);
      
      if (!registeredIdsRef.current.has(item.id)) {
        MediaRuntime.registerMedia({
          id: item.id,
          element: videoEl,
          surface: 'clubhouse',
          sortIndex: i,
          observeTarget: videoEl,
        });
        registeredIdsRef.current.add(item.id);
      }
    }
    
    // Unregister videos that left the window
    registeredIdsRef.current.forEach((id) => {
      if (!shouldBeRegistered.has(id)) {
        MediaRuntime.unregisterMedia(id);
        registeredIdsRef.current.delete(id);
      }
    });
  }, [items, currentIndex, videoRefs, enabled]);
  
  // Update candidate state based on center index
  useEffect(() => {
    if (!enabled || !items.length) return;
    
    const currentItem = items[currentIndex];
    if (!currentItem || currentItem.type !== 'video') {
      if (prevCenterIdRef.current) {
        MediaRuntime.setCandidateState(prevCenterIdRef.current, { visible: false, ratio: 0 });
        prevCenterIdRef.current = null;
      }
      return;
    }
    
    const centerId = currentItem.id;
    
    // Mark centered item as 100% visible
    MediaRuntime.setCandidateState(centerId, { visible: true, ratio: 1 });
    
    // Clear old center
    if (prevCenterIdRef.current && prevCenterIdRef.current !== centerId) {
      MediaRuntime.setCandidateState(prevCenterIdRef.current, { visible: false, ratio: 0 });
    }
    
    prevCenterIdRef.current = centerId;
  }, [items, currentIndex, enabled]);
  
  // Prewarm prev/next videos
  useEffect(() => {
    if (!enabled || !items.length) return;
    
    const prevItem = items[currentIndex - 1];
    const nextItem = items[currentIndex + 1];
    
    if (prevItem?.type === 'video') {
      MediaRuntime.prewarmCandidate(prevItem.id);
    }
    if (nextItem?.type === 'video') {
      MediaRuntime.prewarmCandidate(nextItem.id);
    }
  }, [items, currentIndex, enabled]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      registeredIdsRef.current.forEach((id) => {
        MediaRuntime.unregisterMedia(id);
      });
      registeredIdsRef.current.clear();
      prevCenterIdRef.current = null;
    };
  }, []);
  
  return {
    setScrolling: (isScrolling: boolean) => {
      MediaRuntime.setUIState({ isScrolling });
    },
  };
}
