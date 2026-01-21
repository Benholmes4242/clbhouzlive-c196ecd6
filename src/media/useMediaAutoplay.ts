/**
 * useMediaAutoplay - Unified autoplay engine
 * Single intersection observer system for all grid/feed autoplay
 * 
 * IMPORTANT: This hook does NOT call play/pause directly.
 * All playback decisions are made exclusively by MediaRuntime.
 * 
 * Responsibilities:
 * - Observes visibility and reports to MediaRuntime.setCandidateState()
 * - Registers/unregisters media with MediaRuntime
 * - Reports UI state (scrolling, panel animations) to MediaRuntime
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaSystemSafe } from './MediaSystemProvider';
import { useSlidingPanels } from '@/components/ui/SlidingPanelsContext';
import { MediaRuntime } from './runtime';
import type { MediaSurface } from './runtime';

// ============ Types ============

export interface MediaAutoplayRegistration {
  id: string;
  element: HTMLVideoElement;
  observeTarget?: HTMLElement; // Optional wrapper to observe (defaults to element)
  isCandidate: boolean; // Whether this item should autoplay
  sortIndex: number; // For tie-breaking (lower = higher priority)
  hasBeenPreloaded: boolean;
}

export interface UseMediaAutoplayOptions {
  // Mode: 'grid' for sparse grids (Watch/Profile), 'feed' for dense feeds, 'videos' for long-form YouTube-style
  mode?: 'grid' | 'feed' | 'videos';
  
  // Surface for runtime (maps mode to surface)
  surface?: MediaSurface;
  
  // Thresholds (40/25 standard for sentinel-based observation)
  startThreshold?: number;  // Start playing at this visibility (default: 0.4)
  stopThreshold?: number;   // Stop playing at this visibility (default: 0.25)
  
  // Preload
  preloadMargin?: number;   // Pixels to start preloading (default: 300)
  maxPreloading?: number;   // Max concurrent preloads (default: 3)
  
  // Scroll protection
  scrollSettleDelay?: number; // ms to wait after scroll stops (default: 200)
  
  // Feed mode specific
  warmWindowSize?: number;  // Keep ±N items warm in feed mode (default: 1)
}

export type RegisterMediaFn = (args: {
  id: string;
  element: HTMLVideoElement | null;
  isCandidate?: boolean;
  sortIndex?: number;
  observeTarget?: HTMLElement | null;
}) => void;

// ============ Hook ============

/**
 * Hook for managing video autoplay with intersection observers
 * 
 * @param options Configuration options
 * @param options.startThreshold Visibility ratio (0.0-1.0) at which video starts playing. Default: 0.4 (40%)
 * @param options.stopThreshold Visibility ratio (0.0-1.0) at which video pauses. Default: 0.25 (25%)
 * @param options.preloadMargin Distance in pixels before viewport to start preloading. Default: 300px
 * @param options.scrollSettleDelay Milliseconds to wait after scroll stops. Default: 50ms
 */
export function useMediaAutoplay(options: UseMediaAutoplayOptions = {}) {
  const {
    mode = 'grid',
    surface = 'grid',
    startThreshold,      // No default - use effectiveStartThreshold below
    stopThreshold,       // No default - use effectiveStopThreshold below
    preloadMargin = 300,
    scrollSettleDelay = 50,
  } = options;
  
  // Apply proper defaults AFTER destructuring so passed values take precedence
  const effectiveStartThreshold = startThreshold ?? 0.4;  // Default 40% visible to play
  const effectiveStopThreshold = stopThreshold ?? 0.25;   // Default 25% visible to pause
  
  // Use safe version - MediaSystemProvider may not exist in all contexts
  const mediaSystem = useMediaSystemSafe();
  
  // Panel animation state - freeze during transitions
  const { isAnimating: isPanelAnimating } = useSlidingPanels();
  const isPanelAnimatingRef = useRef(isPanelAnimating);
  isPanelAnimatingRef.current = isPanelAnimating;
  
  // Registry
  const registry = useRef<Map<string, MediaAutoplayRegistration>>(new Map());
  const visibleIds = useRef<Set<string>>(new Set());
  
  // Observers
  const playObserver = useRef<IntersectionObserver | null>(null);
  const preloadObserver = useRef<IntersectionObserver | null>(null);
  
  // State - reflects what MediaRuntime says is playing
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  
  // Scroll protection
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Tab visibility
  const isTabVisible = useRef(!document.hidden);
  
  // ============ Sync panel animation state to runtime ============
  
  useEffect(() => {
    MediaRuntime.setUIState({ isPanelOpen: isPanelAnimating });
  }, [isPanelAnimating]);
  
  // ============ Sync playingIds from runtime ============
  
  const syncPlayingFromRuntime = useCallback(() => {
    // Get ALL active IDs for multi-video autoplay support
    const activeIds = MediaRuntime.getActiveIds();
    setPlayingIds(activeIds);
  }, []);
  
  // ============ Subscribe to MediaRuntime state changes ============
  
  useEffect(() => {
    // Subscribe to MediaRuntime state changes to keep playingIds in sync
    const unsubscribe = MediaRuntime.subscribe(() => {
      syncPlayingFromRuntime();
    });
    
    // Initial sync
    syncPlayingFromRuntime();
    
    return unsubscribe;
  }, [syncPlayingFromRuntime]);
  
  // ============ Resume playback when panel animation completes ============
  
  useEffect(() => {
    if (!isPanelAnimating) {
      const timer = setTimeout(() => syncPlayingFromRuntime(), 100);
      return () => clearTimeout(timer);
    }
  }, [isPanelAnimating, syncPlayingFromRuntime]);
  
  // ============ Registration ============
  
  /**
   * Register a video element for autoplay management.
   * 
   * IMPORTANT: Never call video.play() or video.pause() directly.
   * MediaRuntime is the ONLY entity allowed to control playback.
   * 
   * @param args.id - Unique identifier (typically post ID)
   * @param args.element - The video element (pass null to unregister)
   * @param args.isCandidate - Whether this video can autoplay
   * @param args.sortIndex - Lower = higher priority for autoplay
   * @param args.observeTarget - Optional wrapper element to observe instead of video
   */
  const registerMedia: RegisterMediaFn = useCallback((args) => {
    const { id, element, isCandidate = true, sortIndex = 0, observeTarget } = args;

    // Unregister
    if (!element) {
      const existing = registry.current.get(id);
      if (existing) {
        console.log(`[useMediaAutoplay] 🗑️ Unregistering: ${id.slice(0, 8)} (${surface})`);
        if (existing.observeTarget) {
          playObserver.current?.unobserve(existing.observeTarget);
        } else {
          playObserver.current?.unobserve(existing.element);
        }
        preloadObserver.current?.unobserve(existing.element);

        mediaSystem.unregister(id);
        MediaRuntime.unregisterMedia(id);
      }

      registry.current.delete(id);
      visibleIds.current.delete(id);
      syncPlayingFromRuntime();
      return;
    }

    // Guard: Skip if already registered with same element
    const existing = registry.current.get(id);
    if (existing && existing.element === element) {
      // Already registered with same element, skip duplicate registration
      return;
    }
    
    console.log(`[useMediaAutoplay] ✅ Registering: ${id.slice(0, 8)} (surface: ${surface}, candidate: ${isCandidate})`);

    // Register with media system
    mediaSystem.register({
      id,
      element,
      kind: 'video',
    });
    
    // Register with MediaRuntime (the playback authority)
    MediaRuntime.registerMedia({
      id,
      element,
      surface,
      sortIndex,
      observeTarget: observeTarget ?? element,
    });

    // Create/update registration
    const registration: MediaAutoplayRegistration = {
      id,
      element,
      observeTarget: observeTarget ?? undefined,
      isCandidate,
      sortIndex,
      hasBeenPreloaded: existing?.hasBeenPreloaded ?? false,
    };

    registry.current.set(id, registration);

    // Tag for observer callbacks
    element.dataset.mediaAutoplayId = id;
    const target = observeTarget ?? element;
    target.dataset.mediaAutoplayId = id;

    // Observe
    if (playObserver.current) {
      playObserver.current.observe(target);
    }
    if (preloadObserver.current) {
      preloadObserver.current.observe(element);
    }

    // Sync after short delay
    setTimeout(() => syncPlayingFromRuntime(), 50);
  }, [mediaSystem, syncPlayingFromRuntime, surface]);
  
  // ============ Scroll Protection ============
  
  useEffect(() => {
    const handleScroll = () => {
      MediaRuntime.setUIState({ isScrolling: true });
      
      if (!isScrolling.current) {
        isScrolling.current = true;
      }
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
        MediaRuntime.setUIState({ isScrolling: false });
        syncPlayingFromRuntime();
      }, scrollSettleDelay);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [scrollSettleDelay, syncPlayingFromRuntime]);
  
  // ============ Tab Visibility ============
  
  useEffect(() => {
    const handleVisibility = () => {
      isTabVisible.current = !document.hidden;

      if (document.hidden) {
        MediaRuntime.pauseAll();
        setPlayingIds(new Set());
      } else {
        setTimeout(() => syncPlayingFromRuntime(), 100);
      }
    };

    const handleBlur = () => {
      isTabVisible.current = false;
      MediaRuntime.pauseAll();
      setPlayingIds(new Set());
    };

    const handleFocus = () => {
      isTabVisible.current = true;
      setTimeout(() => syncPlayingFromRuntime(), 100);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncPlayingFromRuntime]);
  
  // ============ Preload Observer (Real Prewarm) ============
  
  const prewarmedIds = useRef<Set<string>>(new Set());
  const detachTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const DETACH_DELAY = 400;
  
  useEffect(() => {
    preloadObserver.current = new IntersectionObserver(
      (entries) => {
        if (isPanelAnimatingRef.current) return;
        
        entries.forEach((entry) => {
          const target = entry.target as HTMLVideoElement;
          const id = target.dataset.mediaAutoplayId;
          if (!id) return;
          
          const reg = registry.current.get(id);
          if (!reg) return;
          
          if (entry.isIntersecting) {
            // Cancel any pending detach
            const pendingDetach = detachTimeouts.current.get(id);
            if (pendingDetach) {
              clearTimeout(pendingDetach);
              detachTimeouts.current.delete(id);
            }
            
            // Use runtime prewarm
            MediaRuntime.prewarmCandidate(id);
            prewarmedIds.current.add(id);
            reg.hasBeenPreloaded = true;
          } else {
            // Debounced detach
            if (prewarmedIds.current.has(id) && !detachTimeouts.current.has(id)) {
              const isVisible = visibleIds.current.has(id);
              if (!isVisible) {
                const timeout = setTimeout(() => {
                  const playerRef = (target as any).__hlsPlayerRef;
                  if (playerRef?.detach) {
                    playerRef.detach();
                  }
                  prewarmedIds.current.delete(id);
                  detachTimeouts.current.delete(id);
                }, DETACH_DELAY);
                detachTimeouts.current.set(id, timeout);
              }
            }
          }
        });
      },
      {
        root: null,
        rootMargin: `${preloadMargin}px 0px ${preloadMargin}px 0px`,
        threshold: 0.01,
      }
    );
    
    registry.current.forEach((reg) => {
      preloadObserver.current?.observe(reg.element);
    });
    
    return () => {
      preloadObserver.current?.disconnect();
      preloadObserver.current = null;
      prewarmedIds.current.clear();
      detachTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      detachTimeouts.current.clear();
    };
  }, [preloadMargin]);
  
  // ============ Play Observer (Visibility) ============
  
  const syncPlayingRef = useRef(syncPlayingFromRuntime);
  syncPlayingRef.current = syncPlayingFromRuntime;
  
  useEffect(() => {
    // Use effective thresholds for hysteresis (40% play, 25% pause by default)
    const thresholds = [effectiveStopThreshold, effectiveStartThreshold];
    
    playObserver.current = new IntersectionObserver(
      (entries) => {
        if (isPanelAnimatingRef.current) return;
        
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const id = target.dataset.mediaAutoplayId;
          if (!id) return;
          
          const ratio = entry.intersectionRatio;
          const wasVisible = visibleIds.current.has(id);
          
          // Hysteresis: start at effectiveStartThreshold, stop at effectiveStopThreshold
          let nextVisible = wasVisible;
          
          if (ratio >= effectiveStartThreshold) {
            visibleIds.current.add(id);
            nextVisible = true;
          } else if (ratio <= effectiveStopThreshold) {
            visibleIds.current.delete(id);
            nextVisible = false;
          }
          
          // Report visibility to runtime - it decides what to play
          MediaRuntime.setCandidateState(id, {
            visible: nextVisible,
            ratio,
          });
        });
        
        syncPlayingRef.current();
      },
      {
        threshold: thresholds,
        rootMargin: '0px 0px 0px 0px', // Play/pause exactly at viewport boundary
      }
    );
    
    registry.current.forEach((reg) => {
      const target = reg.observeTarget ?? reg.element;
      playObserver.current?.observe(target);
    });
    
    const initialCheck = setTimeout(() => syncPlayingRef.current(), 150);
    
    return () => {
      clearTimeout(initialCheck);
      playObserver.current?.disconnect();
      playObserver.current = null;
      visibleIds.current.clear();
    };
  }, [effectiveStartThreshold, effectiveStopThreshold]);
  
  return {
    registerMedia,
    playingIds,
  };
}
