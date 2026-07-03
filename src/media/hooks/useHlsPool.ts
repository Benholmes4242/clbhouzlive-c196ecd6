/**
 * useHlsPool — single source of truth for HLS pool lifecycle.
 *
 * Owns promote/register/demote for one <video> element.
 * Critical contract: `attach` NEVER calls video.play().
 * Play/pause is the caller's decision (usePausedFirstFrame).
 */
import { useCallback, useRef } from 'react';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { getSharedBandwidth, saveSharedBandwidth } from '@/utils/sharedBandwidth';

export interface HlsPoolHandle {
  attach: (
    hlsUrl: string,
    video: HTMLVideoElement,
    mp4Fallback?: string,
    surface?: 'feed' | 'fullscreen',
    startPosition?: number,
  ) => Promise<void>;
  teardown: (hlsUrl: string) => void;
}

export function useHlsPool(): HlsPoolHandle {
  const hlsRef = useRef<any>(null);

  const attach = useCallback(
    async (
      hlsUrl: string,
      video: HTMLVideoElement,
      mp4Fallback?: string,
      surface: 'feed' | 'fullscreen' = 'feed',
      startPosition?: number,
    ) => {
      const { default: Hls } = await import('hls.js');

      const hasStart = startPosition != null && startPosition > 0.05;

      // Native HLS (iOS Safari): no hls.js instance, pool not applicable.
      if (!Hls.isSupported()) {
        if (hlsUrl) video.src = hlsUrl;
        else if (mp4Fallback) video.src = mp4Fallback;
        if (hasStart) {
          const seek = () => { try { video.currentTime = startPosition!; } catch {} };
          if (video.readyState >= 1) seek();
          else video.addEventListener('loadedmetadata', seek, { once: true });
        }
        return;
      }

      // Pool first — instant reuse. Thread startPosition so hls.js starts
      // fetching segments at the seek point (not 0).
      const pooled = HLSPoolManager.promote(hlsUrl, video, hasStart ? startPosition : undefined);
      if (pooled) {
        if (hasStart) {
          try { video.currentTime = startPosition!; } catch {}
          try { pooled.startLoad(startPosition!); } catch { try { pooled.startLoad(); } catch {} }
        } else {
          pooled.startLoad();
        }
        pooled.on(Hls.Events.FRAG_LOADED, (_: any, d: any) => {
          if (d.frag?.stats?.bwEstimate > 0)
            saveSharedBandwidth(d.frag.stats.bwEstimate);
        });
        hlsRef.current = pooled;
        return;
      }

      // Cold init.
      const hls = new Hls({
        startLevel: -1,
        capLevelToPlayerSize: false,
        abrEwmaDefaultEstimate: getSharedBandwidth(),
        maxBufferLength: 12,
        maxMaxBufferLength: 24,
        enableWorker: true,
        startPosition: hasStart ? startPosition! : -1,
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      // Seek inside MEDIA_ATTACHED so hls.js's own sourceopen startPosition
      // handling doesn't clobber a post-attach microtask seek.
      hls.once(Hls.Events.MEDIA_ATTACHED, () => {
        if (hasStart) {
          try { video.currentTime = startPosition!; } catch {}
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hlsUrl && !HLSPoolManager.has(hlsUrl)) {
          try {
            HLSPoolManager.register(hlsUrl, hls, video, surface);
          } catch {}
        }
      });
      hls.on(Hls.Events.FRAG_LOADED, (_: any, d: any) => {
        if (d.frag?.stats?.bwEstimate > 0)
          saveSharedBandwidth(d.frag.stats.bwEstimate);
      });
      hls.on(Hls.Events.ERROR, (_: any, d: any) => {
        if (d.fatal && mp4Fallback) {
          try { hls.destroy(); } catch {}
          video.src = mp4Fallback;
        }
      });
      hlsRef.current = hls;
    },
    [],
  );

  const teardown = useCallback((hlsUrl: string) => {
    const hls = hlsRef.current;
    if (!hls) return;
    // Return to pool if this url is pool-managed (promoted OR preloaded).
    // has() is false for promoted entries, so use isPooled() which covers both.
    if (hlsUrl && HLSPoolManager.isPooled(hlsUrl)) {
      try { HLSPoolManager.demote(hlsUrl, hls); } catch {}
    } else {
      try { hls.stopLoad?.(); } catch {}
      try { hls.detachMedia?.(); } catch {}
      try { hls.destroy?.(); } catch {}
    }
    hlsRef.current = null;
  }, []);

  return { attach, teardown };
}
