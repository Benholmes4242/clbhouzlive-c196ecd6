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
  ) => Promise<void>;
  teardown: (hlsUrl: string) => void;
}

export function useHlsPool(): HlsPoolHandle {
  const hlsRef = useRef<any>(null);

  const attach = useCallback(
    async (hlsUrl: string, video: HTMLVideoElement, mp4Fallback?: string, surface: 'feed' | 'fullscreen' = 'feed') => {
      const { default: Hls } = await import('hls.js');

      // Native HLS (iOS Safari): no hls.js instance, pool not applicable.
      if (!Hls.isSupported()) {
        if (hlsUrl) video.src = hlsUrl;
        else if (mp4Fallback) video.src = mp4Fallback;
        return;
      }

      // Pool first — instant reuse.
      const pooled = HLSPoolManager.promote(hlsUrl, video);
      if (pooled) {
        pooled.startLoad();
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
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hlsUrl && !HLSPoolManager.has(hlsUrl)) {
          try {
            HLSPoolManager.register(hlsUrl, hls, video);
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
