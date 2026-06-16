/**
 * useTileVideoPlayer — Shared HLS init for tile-based autoplay surfaces
 * 
 * Used by: ExploreAutoplay, WatchAutoplay, VideosAutoplay, FriendsAutoplay,
 *          PostsAutoplay, CourseMediaAutoplay
 * 
 * Improvements over the previous per-file implementation:
 * - Uses shared bandwidth estimate (not hardcoded 5Mbps)
 * - Checks HLSPoolManager for pre-buffered instance before cold init
 * - Saves measured bandwidth after each fragment loads
 * - Removes forced currentLevel = 0 (lets ABR choose quality)
 * - Triggers prefetch for nearby tiles to warm the pool
 */

import { HLSPoolManager } from '@/media/HLSPoolManager';
import { getSharedBandwidth, saveSharedBandwidth } from '@/utils/sharedBandwidth';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { registerInPool } from '@/utils/hlsPoolPreloader';
import { extractCloudflareUid } from '@/utils/videoIdUtils';

interface AttachHlsToTileOptions {
  hlsUrl: string;
  mp4Fallback?: string;
  video: HTMLVideoElement;
  onReady?: () => void;
}

/**
 * Attach HLS to a tile video element.
 * Checks pool first for instant playback, falls back to cold init.
 * Returns the HLS instance (or null for native HLS / mp4 fallback).
 */
export async function attachHlsToTile({
  hlsUrl,
  mp4Fallback,
  video,
  onReady,
}: AttachHlsToTileOptions): Promise<any | null> {
  // Dynamic import HLS.js
  const { default: Hls } = await import('hls.js');

  // Native HLS path (Safari). NOTE: never call video.play() here —
  // MediaRuntime/safePlay is the sole authority for play(). We only set
  // src so the runtime can promote this element on its next evaluation.
  if (!Hls.isSupported()) {
    if (hlsUrl) {
      video.src = hlsUrl;
    } else if (mp4Fallback) {
      video.src = mp4Fallback;
    }
    onReady?.();
    return null;
  }

  // Try pool first — instant playback if pre-buffered
  const pooledHls = HLSPoolManager.promote(hlsUrl, video);

  if (pooledHls) {
    pooledHls.startLoad();

    pooledHls.on(Hls.Events.FRAG_LOADED, (_: any, data: any) => {
      if (data.frag?.stats?.bwEstimate > 0) {
        saveSharedBandwidth(data.frag.stats.bwEstimate);
      }
    });

    onReady?.();
    return pooledHls;
  }

  // Cold init — create new HLS instance
  const cloudflareUid = extractCloudflareUid(hlsUrl);

  const hls = new Hls({
    startLevel: -1,                              // Let ABR choose — never force level 0
    capLevelToPlayerSize: false,
    abrEwmaDefaultEstimate: getSharedBandwidth(), // Use real measured bandwidth
    maxBufferLength: 12,
    maxMaxBufferLength: 24,
    enableWorker: true,
  });

  hls.loadSource(hlsUrl);
  hls.attachMedia(video);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    // Do NOT set hls.currentLevel = 0 — let ABR pick quality.
    // Do NOT call video.play() — the MediaRuntime spotlight owns play/pause.
    onReady?.();
    // Register cold-init into the pool so teardown can demote() (keeping the
    // instance warm) and a future mount can promote() instead of rebuilding.
    if (hlsUrl && !HLSPoolManager.isPooled(hlsUrl)) {
      try { HLSPoolManager.register(hlsUrl, hls, video, 'feed'); } catch {}
    }
  });

  hls.on(Hls.Events.FRAG_LOADED, (_: any, data: any) => {
    if (data.frag?.stats?.bwEstimate > 0) {
      saveSharedBandwidth(data.frag.stats.bwEstimate);
    }
  });

  hls.on(Hls.Events.ERROR, (_: any, data: any) => {
    if (data.fatal && mp4Fallback) {
      hls.destroy();
      video.src = mp4Fallback;
      // No video.play() — runtime will retry on next nudge/evaluation.
    }
  });

  return hls;
}

/**
 * Trigger prefetch + pool registration for a tile that's about to enter view.
 * Call this when a tile is 1-2 positions away from the active tile.
 */
export function prefetchTile(hlsUrl: string): void {
  if (!hlsUrl) return;
  preloadHlsManifest(hlsUrl)
    .then(() => registerInPool(hlsUrl))
    .catch(() => {});
}
