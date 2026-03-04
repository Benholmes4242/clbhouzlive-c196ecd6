import { useRef, useCallback, useEffect } from 'react';
import type { PoolElement, VideoSessionState } from '../types/media';
import { POOL_CONFIG, TIMING } from '../types/media';
import {
  attachMedia,
  detachMedia,
  destroyAll,
  promotePreCreated,
  recoverMediaError,
  retryLoad,
} from '../utils/hlsManager';
import { fadeOut, fadeIn } from '../utils/audioFade';
import { useSessionCache } from './useSessionCache';
import { useMediaStore } from '../store/mediaStore';

/**
 * Video Pool Manager — maintains 5 reusable <video> elements with
 * tracked listeners, full recycle sequence, error recovery, and
 * audio crossfade support.
 */
export function useVideoPool() {
  const poolRef = useRef<PoolElement[]>([]);
  const hiddenContainerRef = useRef<HTMLDivElement | null>(null);
  const sessionCache = useSessionCache();
  
  const lastSwipeTime = useRef(0);

  // Tracked event listeners per pool element index
  const listenerMap = useRef<Map<number, Map<string, EventListener>>>(new Map());
  // Recovery timeouts per pool element — cleared on detach to prevent stale onError
  const recoveryTimeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // ── Tracked listener helpers ──────────────────────────────────────
  const addTrackedListener = useCallback(
    (poolIdx: number, video: HTMLVideoElement, event: string, handler: EventListener, opts?: AddEventListenerOptions) => {
      if (!listenerMap.current.has(poolIdx)) listenerMap.current.set(poolIdx, new Map());
      // Remove existing listener for this event if any
      const existing = listenerMap.current.get(poolIdx)!.get(event);
      if (existing) video.removeEventListener(event, existing);
      listenerMap.current.get(poolIdx)!.set(event, handler);
      video.addEventListener(event, handler, opts);
    },
    []
  );

  const removeAllTrackedListeners = useCallback((poolIdx: number, video: HTMLVideoElement) => {
    const listeners = listenerMap.current.get(poolIdx);
    if (!listeners) return;
    listeners.forEach((handler, event) => video.removeEventListener(event, handler));
    listeners.clear();
  }, []);

  // ── Pool element creation ─────────────────────────────────────────
  useEffect(() => {
    // Idempotency: if pool already has elements and container exists, skip
    if (poolRef.current.length > 0 && hiddenContainerRef.current) return;

    const container = document.createElement('div');
    container.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);
    hiddenContainerRef.current = container;

    const pool: PoolElement[] = [];
    for (let i = 0; i < POOL_CONFIG.MAX_POOL_SIZE; i++) {
      const video = document.createElement('video');
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      video.preload = 'auto';
      video.muted = true;
      video.loop = false;
      video.crossOrigin = 'anonymous';
      video.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;';

      container.appendChild(video);
      pool.push({
        video,
        assignedUrl: null,
        assignedIndex: null,
        lastUsedAt: 0,
      });
    }
    poolRef.current = pool;

    return () => {
      destroyAll();
      recoveryTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      recoveryTimeouts.current.clear();
      pool.forEach((p, idx) => {
        removeAllTrackedListeners(idx, p.video);
        p.video.pause();
        p.video.removeAttribute('src');
        p.video.load();
      });
      container.remove();

      // Reset refs so re-mount creates fresh pool
      poolRef.current = [];
      hiddenContainerRef.current = null;
    };
  }, [removeAllTrackedListeners]);

  // ── Rapid scroll detection ────────────────────────────────────────
  const isRapidScrolling = useCallback((): boolean => {
    const now = Date.now();
    const elapsed = now - lastSwipeTime.current;
    lastSwipeTime.current = now;
    return elapsed < TIMING.RAPID_SCROLL_THRESHOLD_MS;
  }, []);

  // ── Safe play with iOS retry ──────────────────────────────────────
  const safePlay = useCallback(async (video: HTMLVideoElement): Promise<boolean> => {
    try {
      await video.play();
      return true;
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          video.muted = true;
          useMediaStore.getState().setMuted(true);
          try {
            await video.play();
            return true;
          } catch {
            return false;
          }
        }
        if (error.name === 'AbortError') return false;
      }
      console.error('[Pool] safePlay failed:', error);
      return false;
    }
  }, []);

  // ── Core assign function (full recycle sequence) ──────────────────
  const assign = useCallback(
    async (
      hlsUrl: string,
      feedIndex: number,
      container: HTMLElement,
      onPlaying?: () => void,
      onError?: () => void,
      mp4Url?: string
    ): Promise<HTMLVideoElement | null> => {
      const pool = poolRef.current;
      if (!pool.length) return null;

      const rapid = isRapidScrolling();

      // ── 1. Cache hit — same URL already loaded ────────────────
      const cachedIdx = pool.findIndex((p) => p.assignedUrl === hlsUrl);
      if (cachedIdx >= 0) {
        const cached = pool[cachedIdx];
        cached.lastUsedAt = Date.now();
        cached.assignedIndex = feedIndex;
        container.appendChild(cached.video);
        cached.video.muted = useMediaStore.getState().isMuted;
        const ok = await safePlay(cached.video);
        if (ok) onPlaying?.();
        return cached.video;
      }

      // ── 2. Find target element (unassigned or LRU) ────────────
      let target: PoolElement | undefined;
      let targetIdx = -1;

      // Prefer unassigned
      for (let i = 0; i < pool.length; i++) {
        if (pool[i].assignedUrl === null) {
          target = pool[i];
          targetIdx = i;
          break;
        }
      }

      // Otherwise LRU by distance from active index
      if (!target) {
        const activeIndex = useMediaStore.getState().activeIndex;
        let bestIdx = -1;
        let bestScore = -1;

        for (let i = 0; i < pool.length; i++) {
          const p = pool[i];
          if (p.assignedIndex === feedIndex) continue; // never recycle self
          const dist = Math.abs((p.assignedIndex ?? 0) - activeIndex);
          if (dist <= 1) continue; // NEVER recycle immediately adjacent to active
          // Score: higher = more recyclable
          const score = dist * 1_000_000 + (Date.now() - p.lastUsedAt);
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
        if (bestIdx >= 0) {
          target = pool[bestIdx];
          targetIdx = bestIdx;
        }
      }

      if (!target || targetIdx < 0) return null;

      // ── Step 1: DETACH from old item ──────────────────────────
      const video = target.video;

      if (target.assignedUrl) {
        const isMuted = useMediaStore.getState().isMuted;

        // Save session state
        sessionCache.save(target.assignedUrl, {
          currentTime: video.currentTime,
          wasMuted: video.muted,
          duration: video.duration || 0,
        });

        // Remove all tracked listeners
        removeAllTrackedListeners(targetIdx, video);

        // Clear any active recovery timeout for this element
        const activeRecoveryTimeout = recoveryTimeouts.current.get(targetIdx);
        if (activeRecoveryTimeout) {
          clearTimeout(activeRecoveryTimeout);
          recoveryTimeouts.current.delete(targetIdx);
        }

        // Audio fade out (or instant if rapid/muted)
        if (!isMuted && !rapid && !video.paused) {
          await fadeOut(video);
        } else {
          video.pause();
        }

        // Detach HLS
        detachMedia(video);
      } else {
        removeAllTrackedListeners(targetIdx, video);
      }

      // ── Step 1f: Reset element (detachMedia already handles src removal)
      video.currentTime = 0;

      // ── Step 2: MOVE element to new container ─────────────────
      container.appendChild(video);

      // ── Step 3: ATTACH new source ─────────────────────────────
      target.assignedUrl = hlsUrl;
      target.assignedIndex = feedIndex;
      target.lastUsedAt = Date.now();
      video.muted = useMediaStore.getState().isMuted;

      // Master load timeout
      let loadTimedOut = false;
      const loadTimeout = setTimeout(() => {
        loadTimedOut = true;
        console.warn('[Pool] Load timeout for', hlsUrl);
        onError?.();
      }, TIMING.LOAD_TIMEOUT_MS);

      // Error handler with recovery verification
      const handleHlsError = (type: string, details: string) => {
        console.error('[Pool] HLS error:', type, details);
        clearTimeout(loadTimeout);

        let recovered = false;
        if (type === 'mediaError') {
          recovered = recoverMediaError(video);
        } else if (type === 'networkError') {
          recovered = retryLoad(video);
        }

        if (recovered) {
          // Clear any previous recovery timeout for this element
          const existingTimeout = recoveryTimeouts.current.get(targetIdx);
          if (existingTimeout) clearTimeout(existingTimeout);

          const recoveryTimeout = setTimeout(() => {
            recoveryTimeouts.current.delete(targetIdx);
            if (video.paused || video.readyState < 3) {
              onError?.();
            }
          }, 5000);
          recoveryTimeouts.current.set(targetIdx, recoveryTimeout);

          const onRecoveryPlaying = () => {
            const timeout = recoveryTimeouts.current.get(targetIdx);
            if (timeout) {
              clearTimeout(timeout);
              recoveryTimeouts.current.delete(targetIdx);
            }
            video.removeEventListener('playing', onRecoveryPlaying);
          };
          video.addEventListener('playing', onRecoveryPlaying, { once: true });
        } else {
          onError?.();
        }
      };

      // Try promote pre-created instance first
      const promoted = promotePreCreated(hlsUrl, video, handleHlsError);

      if (!promoted) {
        // Cold load path
        try {
          await attachMedia(video, hlsUrl, handleHlsError);
        } catch (err) {
          clearTimeout(loadTimeout);
          console.error('[Pool] attachMedia failed:', err);
          onError?.();
          return video;
        }
      }

      if (loadTimedOut) return video;

      // ── Step 4: Restore session & play ────────────────────────
      const saved = sessionCache.restore(hlsUrl);
      if (saved && saved.currentTime > 0 && saved.duration > 0) {
        // Don't restore if very close to end (would trigger immediate loop)
        if (saved.currentTime < saved.duration - 0.5) {
          video.currentTime = saved.currentTime;
        }
      }

      // ── Step 5: PLAY ──────────────────────────────────────────
      const isMutedNow = useMediaStore.getState().isMuted;
      if (!isMutedNow && !rapid) {
        video.volume = 0; // Start silent, fade in after play
      }
      const playOk = await safePlay(video);

      // Fade in audio if unmuted
      if (playOk && !isMutedNow && !rapid) {
        fadeIn(video, useMediaStore.getState().volume); // Fire and forget
      }

      // ── Step 6: Signal ready on 'playing' event ───────────────
      if (video.readyState >= 3 && !video.paused) {
        clearTimeout(loadTimeout);
        onPlaying?.();
      } else {
        const onPlayingEvt: EventListener = () => {
          if (!loadTimedOut) {
            clearTimeout(loadTimeout);
            onPlaying?.();
          }
        };
        addTrackedListener(targetIdx, video, 'playing', onPlayingEvt, { once: true });
      }

      // Safety ended listener (gapless loop hook is primary)
      const onEnded: EventListener = () => {
        video.currentTime = 0;
        video.play().catch(() => {});
      };
      addTrackedListener(targetIdx, video, 'ended', onEnded);

      // Native video error listener
      const onVideoError: EventListener = () => {
        const err = video.error;
        if (err) {
          console.error('[Pool] Video element error:', err.code, err.message);
          clearTimeout(loadTimeout);
          onError?.();
        }
      };
      addTrackedListener(targetIdx, video, 'error', onVideoError);

      if (!playOk) {
        // Play failed — don't clear timeout, let it fire or show tap-to-play
        clearTimeout(loadTimeout);
        onError?.();
      }

      return video;
    },
    [sessionCache, isRapidScrolling, safePlay, removeAllTrackedListeners, addTrackedListener]
  );

  // ── Release ───────────────────────────────────────────────────────
  const release = useCallback(
    (hlsUrl: string) => {
      const pool = poolRef.current;
      const idx = pool.findIndex((p) => p.assignedUrl === hlsUrl);
      if (idx < 0) return;
      const elem = pool[idx];

      sessionCache.save(hlsUrl, {
        currentTime: elem.video.currentTime,
        wasMuted: elem.video.muted,
        duration: elem.video.duration || 0,
      });

      elem.video.pause();
      removeAllTrackedListeners(idx, elem.video);
      detachMedia(elem.video);

      // Clear assignment
      elem.assignedUrl = null;
      elem.assignedIndex = null;

      if (hiddenContainerRef.current) {
        hiddenContainerRef.current.appendChild(elem.video);
      }
    },
    [sessionCache, removeAllTrackedListeners]
  );

  // ── Get element ───────────────────────────────────────────────────
  const getElement = useCallback((hlsUrl: string): HTMLVideoElement | null => {
    return poolRef.current.find((p) => p.assignedUrl === hlsUrl)?.video ?? null;
  }, []);

  return { assign, release, getElement };
}
