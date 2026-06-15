/**
 * hlsPoolPreloader — Bridges the prefetch pipeline and HLS pool
 *
 * After hlsPreload warms the manifest + first segments (via the Service
 * Worker cache), this module creates a hidden HLS.js instance attached
 * to a hidden video element, loads the source, and registers it in
 * HLSPoolManager so SnapVideoPlayer can promote it instantly on
 * activation — giving sub-100ms first frame.
 */

import { HLSPoolManager } from '@/media/HLSPoolManager';
import { loadHlsJs } from '@/utils/hlsLoader';
import { getSharedBandwidth } from '@/utils/sharedBandwidth';

// Track which URLs have a pool instance being prepared
const poolPreloadInFlight = new Set<string>();

/**
 * After prefetch completes, create a hidden HLS instance and register
 * it in the pool so it's ready for instant promotion.
 * 
 * Call this immediately after preloadHlsManifest() resolves.
 */
export async function registerInPool(hlsUrl: string): Promise<void> {
  // Skip if the URL already has any pool entry (promoted or waiting) or is being prepared.
  // has() only means "available to promote" and returns false for live/promoted entries.
  if (HLSPoolManager.isPooled(hlsUrl) || poolPreloadInFlight.has(hlsUrl)) {
    return;
  }

  poolPreloadInFlight.add(hlsUrl);
  let preloadVideo: HTMLVideoElement | null = null;
  let hls: InstanceType<Awaited<ReturnType<typeof loadHlsJs>>> | null = null;

  try {
    const Hls = await loadHlsJs();
    if (!Hls || !Hls.isSupported()) return;

    // Create hidden video element for preloading
    preloadVideo = document.createElement('video');
    preloadVideo.muted = true;
    preloadVideo.playsInline = true;
    preloadVideo.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(preloadVideo);

    // Create HLS instance with cached loader so it reads from blob cache
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferLength: 12,
      maxMaxBufferLength: 24,
      startLevel: -1,
      capLevelToPlayerSize: false,
      abrEwmaDefaultEstimate: getSharedBandwidth(),
    });

    hls.loadSource(hlsUrl);
    hls.attachMedia(preloadVideo);

    // Wait for manifest to parse — confirms HLS is initialised
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Pool preload timeout'));
      }, 5000);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeout(timeout);
        resolve();
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          clearTimeout(timeout);
          reject(new Error(`HLS error: ${data.details}`));
        }
      });
    });

    // Start buffering silently
    preloadVideo.play().catch(() => {});
    preloadVideo.pause();

    // A radius attach may have pooled/promoted this URL while the hidden preload parsed.
    // Do not register over an existing entry; discard this now-redundant preload.
    if (HLSPoolManager.isPooled(hlsUrl)) {
      try { hls.destroy(); } catch {}
      preloadVideo.remove();
      return;
    }

    // Register in pool — ready for instant promotion
    HLSPoolManager.register(hlsUrl, hls, preloadVideo);

  } catch {
    // Silent fail — pool miss is acceptable, just slower first frame
    try { hls?.destroy(); } catch {}
    preloadVideo?.remove();
  } finally {
    poolPreloadInFlight.delete(hlsUrl);
  }
}
