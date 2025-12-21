/**
 * useMediaAutoplay - Unified autoplay engine
 * Single intersection observer system for all grid/feed autoplay
 * 
 * Replaces: useGridAutoplay, custom Clubhouse observers
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaSystem } from './MediaSystemProvider';

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
  // Mode
  mode?: 'grid' | 'feed';
  
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

export function useMediaAutoplay(options: UseMediaAutoplayOptions = {}) {
  const {
    mode = 'grid',
    // Updated thresholds for grid mode with observeTarget sentinel pattern
    // Lower thresholds work better when observing full tile wrappers
    startThreshold = 0.4,
    stopThreshold = 0.25,
    preloadMargin = 300,
    maxPreloading = 3,
    scrollSettleDelay = 200,
    warmWindowSize = 1,
  } = options;
  
  const mediaSystem = useMediaSystem();
  
  // Registry
  const registry = useRef<Map<string, MediaAutoplayRegistration>>(new Map());
  const visibleIds = useRef<Set<string>>(new Set());
  
  // Observers
  const playObserver = useRef<IntersectionObserver | null>(null);
  const preloadObserver = useRef<IntersectionObserver | null>(null);
  
  // State
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());

  // Autoplay debug plumbing (targets window.__DEBUG_MEDIA_AUTOPLAY_ID or sessionStorage debug_media_autoplay_id)
  const debugVideoCleanupRef = useRef<Map<string, () => void>>(new Map());
  const debugSnapshotRef = useRef<string>('');

  const getDebugTargetId = useCallback((): string | undefined => {
    const winId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
    if (winId) return winId;
    try {
      return sessionStorage.getItem('debug_media_autoplay_id') || undefined;
    } catch {
      return undefined;
    }
  }, []);

  const debugLog = useCallback(
    (id: string, event: string, data?: Record<string, unknown>) => {
      const debugId = getDebugTargetId();
      if (!debugId || id !== debugId) return;
      const label = (window as any).__DEBUG_MEDIA_AUTOPLAY_LABEL as string | undefined;
      console.log('[AutoplayDebug]', event, {
        id: id.slice(0, 8),
        label,
        ...data,
      });
    },
    [getDebugTargetId]
  );
  
  // Scroll protection
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Tab visibility
  const isTabVisible = useRef(!document.hidden);
  
  // ============ Pause All ============
  
  const pauseAllLocal = useCallback(() => {
    registry.current.forEach((reg) => {
      if (reg.element && !reg.element.paused) {
        reg.element.pause();
      }
    });
    setPlayingIds(new Set());
  }, []);
  
  // ============ Core Playback Logic ============
  
  const updatePlayback = useCallback(() => {
    const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;

    // Don't play if scrolling fast or tab hidden
    if (isScrolling.current || !isTabVisible.current) {
      if (debugId && (visibleIds.current.has(debugId) || registry.current.has(debugId))) {
        debugLog(debugId, 'updatePlayback:blocked', {
          isScrolling: isScrolling.current,
          isTabVisible: isTabVisible.current,
          visible: visibleIds.current.has(debugId),
          inRegistry: registry.current.has(debugId),
        });
      }
      pauseAllLocal();
      return;
    }

    const items = Array.from(registry.current.values());

    // Get visible candidates
    const visibleCandidates = items.filter(
      (item) => item.isCandidate && visibleIds.current.has(item.id)
    );

    // Sort by sortIndex (stable grid order)
    visibleCandidates.sort((a, b) => a.sortIndex - b.sortIndex);

    // In grid mode: play first candidate only
    // In feed mode: play first candidate, keep warm ±N
    const toPlay = new Set<string>();
    const toWarm = new Set<string>();

    if (visibleCandidates.length > 0) {
      toPlay.add(visibleCandidates[0].id);

      if (mode === 'feed') {
        // Warm window around current
        const currentIdx = 0;
        for (let i = Math.max(0, currentIdx - warmWindowSize); i <= Math.min(visibleCandidates.length - 1, currentIdx + warmWindowSize); i++) {
          if (i !== currentIdx) {
            toWarm.add(visibleCandidates[i].id);
          }
        }
      }
    }

    if (debugId && (visibleIds.current.has(debugId) || registry.current.has(debugId))) {
      const reg = registry.current.get(debugId);
      const el = reg?.element;
      const snapshot = JSON.stringify({
        tabVisible: isTabVisible.current,
        isScrolling: isScrolling.current,
        isVisible: visibleIds.current.has(debugId),
        shouldPlay: toPlay.has(debugId),
        shouldWarm: toWarm.has(debugId),
        inRegistry: !!reg,
        paused: el?.paused,
        ended: el?.ended,
        readyState: el?.readyState,
        currentTime: el?.currentTime,
        currentSrc: el?.currentSrc,
        prewarmed: (el as any)?.__hlsPlayerRef ? true : false,
        attached: (el as any)?.__hlsPlayerRef?.isAttached?.(),
      });
      if (snapshot !== debugSnapshotRef.current) {
        debugSnapshotRef.current = snapshot;
        debugLog(debugId, 'updatePlayback:snapshot', JSON.parse(snapshot));
      }
    }

    const newPlayingIds = new Set<string>();

    items.forEach((item) => {
      if (!item.element) return;

      const shouldPlay = toPlay.has(item.id);
      const shouldWarm = toWarm.has(item.id);

      if (shouldPlay) {
        // Check if already playing to avoid play() churn
        if (!item.element.paused && !item.element.ended) {
          newPlayingIds.add(item.id);
          return;
        }

        // Ensure HLS source is attached before attempting to play (fixes re-entry after detach)
        (item.element as any).__hlsPlayerRef?.attach?.();
        if (debugId && item.id === debugId) {
          debugLog(item.id, 'play:attempt', {
            paused: item.element.paused,
            readyState: item.element.readyState,
            currentTime: item.element.currentTime,
            currentSrc: item.element.currentSrc,
            attached: (item.element as any).__hlsPlayerRef?.isAttached?.(),
          });
        }

        // Request play through media system
        mediaSystem.requestPlay(item.id).then((success) => {
          if (debugId && item.id === debugId) {
            debugLog(item.id, 'play:requestPlay:resolved', {
              success,
              paused: item.element.paused,
              readyState: item.element.readyState,
              currentSrc: item.element.currentSrc,
              currentTime: item.element.currentTime,
            });

            // Post-check: did currentTime actually advance? (detect "frozen" playback)
            const t0 = item.element.currentTime;
            setTimeout(() => {
              const t1 = item.element.currentTime;
              debugLog(item.id, 'play:postcheck', {
                advanced: t1 > t0 + 0.01,
                t0,
                t1,
                paused: item.element.paused,
                ended: item.element.ended,
                readyState: item.element.readyState,
                networkState: item.element.networkState,
                bufferedEnd: (() => {
                  try {
                    const b = item.element.buffered;
                    return b.length ? b.end(b.length - 1) : null;
                  } catch {
                    return null;
                  }
                })(),
                attached: (item.element as any).__hlsPlayerRef?.isAttached?.(),
              });
            }, 800);
          }

          if (success) {
            setPlayingIds((prev) => new Set([...prev, item.id]));
          }
        });

        newPlayingIds.add(item.id);
      } else if (shouldWarm) {
        // Keep warm but paused
        item.element.pause();
      } else {
        // Pause and reset
        item.element.pause();
      }
    });

    setPlayingIds(newPlayingIds);
  }, [pauseAllLocal, mode, warmWindowSize, mediaSystem, debugLog]);
  
  // ============ Registration ============
  
  const registerMedia: RegisterMediaFn = useCallback((args) => {
    const { id, element, isCandidate = true, sortIndex = 0, observeTarget } = args;

    // Unregister
    if (!element) {
      debugVideoCleanupRef.current.get(id)?.();
      debugVideoCleanupRef.current.delete(id);
      debugLog(id, 'unregister');

      const existing = registry.current.get(id);
      if (existing) {
        if (existing.observeTarget) {
          playObserver.current?.unobserve(existing.observeTarget);
        } else {
          playObserver.current?.unobserve(existing.element);
        }
        preloadObserver.current?.unobserve(existing.element);

        // Unregister from media system
        mediaSystem.unregister(id);
      }

      registry.current.delete(id);
      visibleIds.current.delete(id);
      updatePlayback();
      return;
    }

    // Debug listeners for target video
    const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
    if (debugId && id === debugId && !debugVideoCleanupRef.current.has(id)) {
      const el = element;
      let lastTimeUpdateLog = 0;

      const events: Array<keyof HTMLMediaElementEventMap> = [
        'loadstart',
        'loadedmetadata',
        'loadeddata',
        'canplay',
        'play',
        'pause',
        'waiting',
        'stalled',
        'seeking',
        'seeked',
        'emptied',
        'timeupdate',
        'error',
      ];

      const cleanups: Array<() => void> = [];
      events.forEach((evt) => {
        const handler = () => {
          if (evt === 'timeupdate') {
            const now = Date.now();
            if (now - lastTimeUpdateLog < 1000) return;
            lastTimeUpdateLog = now;
          }

          debugLog(id, `video:${evt}`, {
            readyState: el.readyState,
            paused: el.paused,
            ended: el.ended,
            currentTime: el.currentTime,
            duration: Number.isFinite(el.duration) ? el.duration : null,
            currentSrc: el.currentSrc,
            attached: (el as any).__hlsPlayerRef?.isAttached?.(),
            autoplayAttr: el.autoplay,
          });
        };
        el.addEventListener(evt, handler);
        cleanups.push(() => el.removeEventListener(evt, handler));
      });

      debugVideoCleanupRef.current.set(id, () => cleanups.forEach((c) => c()));

      debugLog(id, 'register:debugListenersAttached', {
        observeTarget: !!observeTarget,
        isCandidate,
        sortIndex,
      });
    }

    // Register with media system
    mediaSystem.register({
      id,
      element,
      kind: 'video',
    });

    debugLog(id, 'register', {
      isCandidate,
      sortIndex,
      currentSrc: element.currentSrc,
      readyState: element.readyState,
      observeTarget: !!observeTarget,
    });

    // Create/update registration
    const existing = registry.current.get(id);
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

    // Trigger playback check after short delay
    setTimeout(() => updatePlayback(), 50);
  }, [mediaSystem, updatePlayback, debugLog]);
  
  // ============ Scroll Protection ============
  
  useEffect(() => {
    const handleScroll = () => {
      if (!isScrolling.current) {
        isScrolling.current = true;
        pauseAllLocal();
      }
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
        updatePlayback();
      }, scrollSettleDelay);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [scrollSettleDelay, pauseAllLocal, updatePlayback]);
  
  // ============ Tab Visibility ============
  
  useEffect(() => {
    const handleVisibility = () => {
      isTabVisible.current = !document.hidden;
      const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
      if (debugId) {
        debugLog(debugId, 'tab:visibilitychange', { hidden: document.hidden });
      }

      if (document.hidden) {
        pauseAllLocal();
      } else {
        setTimeout(() => updatePlayback(), 100);
      }
    };

    const handleBlur = () => {
      isTabVisible.current = false;
      const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
      if (debugId) {
        debugLog(debugId, 'tab:blur');
      }
      pauseAllLocal();
    };

    const handleFocus = () => {
      isTabVisible.current = true;
      const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
      if (debugId) {
        debugLog(debugId, 'tab:focus');
      }
      setTimeout(() => updatePlayback(), 100);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pauseAllLocal, updatePlayback, debugLog]);
  
  // ============ Preload Observer (Real Prewarm) ============
  
  // Track which items are prewarmed (attached)
  const prewarmedIds = useRef<Set<string>>(new Set());
  // Debounce detach to prevent thrash on fast scroll
  const detachTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const DETACH_DELAY = 400; // ms delay before detaching
  
  useEffect(() => {
    preloadObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLVideoElement;
          const id = target.dataset.mediaAutoplayId;
          if (!id) return;
          
          const reg = registry.current.get(id);
          if (!reg) return;
          
          if (entry.isIntersecting) {
            // Cancel any pending detach for this item
            const pendingDetach = detachTimeouts.current.get(id);
            if (pendingDetach) {
              clearTimeout(pendingDetach);
              detachTimeouts.current.delete(id);
              debugLog(id, 'prewarm:detachCancelled');
            }
            
            const playerRef = (target as any).__hlsPlayerRef;
            const isCurrentlyAttached = playerRef?.isAttached?.() ?? false;
            const isVisible = visibleIds.current.has(id);
            const canPrewarm = prewarmedIds.current.size < maxPreloading || prewarmedIds.current.has(id);

            debugLog(id, 'prewarm:intersecting', {
              isVisible,
              canPrewarm,
              isAttached: isCurrentlyAttached,
              prewarmedCount: prewarmedIds.current.size,
            });

            if (!isCurrentlyAttached && (isVisible || canPrewarm)) {
              debugLog(id, 'prewarm:attach:calling');
              playerRef?.attach?.();
            }

            // Track as prewarmed so we can detach later
            if ((isVisible || canPrewarm) && !prewarmedIds.current.has(id)) {
              target.preload = 'auto';
              prewarmedIds.current.add(id);
              reg.hasBeenPreloaded = true;
              registry.current.set(id, reg);
              debugLog(id, 'prewarm:marked');
            }
          } else {
            // Far from viewport - debounced detach to prevent thrash
            if (prewarmedIds.current.has(id) && !detachTimeouts.current.has(id)) {
              // Only detach if not currently visible (playing)
              const isVisible = visibleIds.current.has(id);
              if (!isVisible) {
                debugLog(id, 'prewarm:detachScheduled', { delayMs: DETACH_DELAY });
                const timeout = setTimeout(() => {
                  const playerRef = (target as any).__hlsPlayerRef;
                  debugLog(id, 'prewarm:detach:executing');
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
    
    // Observe existing
    registry.current.forEach((reg) => {
      preloadObserver.current?.observe(reg.element);
    });
    
    return () => {
      preloadObserver.current?.disconnect();
      preloadObserver.current = null;
      prewarmedIds.current.clear();
      // Clear all pending detach timeouts
      detachTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      detachTimeouts.current.clear();
    };
  }, [preloadMargin, maxPreloading, debugLog]);
  
  // ============ Play Observer (Hysteresis) ============
  
  // Store updatePlayback in a ref to avoid re-creating observer on every render
  const updatePlaybackRef = useRef(updatePlayback);
  updatePlaybackRef.current = updatePlayback;
  
  useEffect(() => {
    const thresholds = [stopThreshold, startThreshold];
    
    playObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const id = target.dataset.mediaAutoplayId;
          if (!id) return;
          
          const ratio = entry.intersectionRatio;
          const wasVisible = visibleIds.current.has(id);
          
          // Hysteresis: start at startThreshold, stop at stopThreshold
          let nextVisible = wasVisible;
          
          if (ratio >= startThreshold) {
            visibleIds.current.add(id);
            nextVisible = true;
          } else if (ratio <= stopThreshold) {
            visibleIds.current.delete(id);
            nextVisible = false;
          }
          // Between thresholds: keep current state

          if (wasVisible !== nextVisible) {
            debugLog(id, 'visibility:changed', {
              ratio: Number(ratio.toFixed(3)),
              wasVisible,
              nextVisible,
              startThreshold,
              stopThreshold,
            });
          }
          
          if (import.meta.env.DEV && wasVisible !== nextVisible) {
            console.log('[MediaAutoplay]', id.slice(0, 8), `ratio=${ratio.toFixed(2)}`, `visible: ${wasVisible} → ${nextVisible}`);
          }
        });
        
        updatePlaybackRef.current();
      },
      {
        threshold: thresholds,
      }
    );
    
    // Observe existing
    registry.current.forEach((reg) => {
      const target = reg.observeTarget ?? reg.element;
      playObserver.current?.observe(target);
    });
    
    // Initial check
    const initialCheck = setTimeout(() => updatePlaybackRef.current(), 150);
    
    return () => {
      clearTimeout(initialCheck);
      playObserver.current?.disconnect();
      playObserver.current = null;
      // Don't clear registry on cleanup - registrations are managed by registerMedia
      visibleIds.current.clear();
    };
  }, [startThreshold, stopThreshold, debugLog]);
  
  return {
    registerMedia,
    playingIds,
  };
}
