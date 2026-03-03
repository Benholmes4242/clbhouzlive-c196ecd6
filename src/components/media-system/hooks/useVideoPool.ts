import { useRef, useCallback, useEffect } from 'react';
import type { PoolElement, VideoSessionState } from '../types/media';
import { attachMedia, detachMedia, destroyAll } from '../utils/hlsManager';
import { useSessionCache } from './useSessionCache';

const POOL_SIZE = 3;

/**
 * Video Pool Manager — maintains 3 reusable <video> elements.
 * Elements are recycled via LRU when a new URL needs assignment.
 */
export function useVideoPool() {
  const poolRef = useRef<PoolElement[]>([]);
  const hiddenContainerRef = useRef<HTMLDivElement | null>(null);
  const sessionCache = useSessionCache();
  const initialized = useRef(false);

  // Create pool elements on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);
    hiddenContainerRef.current = container;

    const pool: PoolElement[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const video = document.createElement('video');
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      video.preload = 'auto';
      video.muted = true;
      video.loop = false;
      video.crossOrigin = 'anonymous';
      video.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;';

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
      pool.forEach((p) => {
        p.video.pause();
        p.video.removeAttribute('src');
        p.video.load();
      });
      container.remove();
    };
  }, []);

  /**
   * Assign a video element to a container for the given HLS URL.
   * Returns the video element, or null if pool isn't ready.
   */
  const assign = useCallback(
    async (
      hlsUrl: string,
      feedIndex: number,
      container: HTMLElement
    ): Promise<HTMLVideoElement | null> => {
      const pool = poolRef.current;
      if (!pool.length) return null;

      // 1. Check if URL is already assigned (cache hit — instant)
      const cached = pool.find((p) => p.assignedUrl === hlsUrl);
      if (cached) {
        cached.lastUsedAt = Date.now();
        cached.assignedIndex = feedIndex;
        // Move element to requesting container
        container.appendChild(cached.video);
        return cached.video;
      }

      // 2. Find an unassigned element first
      let target = pool.find((p) => p.assignedUrl === null);

      // 3. If all assigned, find LRU element furthest from viewport
      if (!target) {
        const sorted = [...pool]
          .filter((p) => p.assignedIndex !== feedIndex) // never recycle current
          .sort((a, b) => {
            // Furthest from active index first, then LRU
            const distA = Math.abs((a.assignedIndex ?? 0) - feedIndex);
            const distB = Math.abs((b.assignedIndex ?? 0) - feedIndex);
            if (distA !== distB) return distB - distA;
            return a.lastUsedAt - b.lastUsedAt;
          });
        target = sorted[0];
      }

      if (!target) return null;

      // 4. Save session state of recycled element
      if (target.assignedUrl) {
        const video = target.video;
        sessionCache.save(target.assignedUrl, {
          currentTime: video.currentTime,
          wasMuted: video.muted,
          duration: video.duration || 0,
        });
        video.pause();
        detachMedia(video);
      }

      // 5. Assign new source
      target.assignedUrl = hlsUrl;
      target.assignedIndex = feedIndex;
      target.lastUsedAt = Date.now();
      container.appendChild(target.video);

      await attachMedia(target.video, hlsUrl);

      // 6. Restore session state if available
      const saved = sessionCache.restore(hlsUrl);
      if (saved && saved.currentTime > 0) {
        target.video.currentTime = saved.currentTime;
      }

      return target.video;
    },
    [sessionCache]
  );

  /**
   * Release a video element back to the pool (pause + hide).
   */
  const release = useCallback((hlsUrl: string) => {
    const pool = poolRef.current;
    const elem = pool.find((p) => p.assignedUrl === hlsUrl);
    if (elem) {
      // Save state before releasing
      sessionCache.save(hlsUrl, {
        currentTime: elem.video.currentTime,
        wasMuted: elem.video.muted,
        duration: elem.video.duration || 0,
      });
      elem.video.pause();
      // Move back to hidden container
      if (hiddenContainerRef.current) {
        hiddenContainerRef.current.appendChild(elem.video);
      }
    }
  }, [sessionCache]);

  /**
   * Get the video element currently assigned to a URL.
   */
  const getElement = useCallback((hlsUrl: string): HTMLVideoElement | null => {
    const pool = poolRef.current;
    return pool.find((p) => p.assignedUrl === hlsUrl)?.video ?? null;
  }, []);

  return { assign, release, getElement };
}
