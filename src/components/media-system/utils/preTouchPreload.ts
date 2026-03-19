/**
 * preTouchPreload — called on onTouchStart of any video tile.
 * Pre-creates the HLS instance for the video that is about to be tapped
 * so that by the time the fullscreen overlay mounts, the instance is ready
 * for instant promotion — no cold attachMedia needed.
 */
import { preCreateHlsInstance } from '@/components/media-system/utils/hlsManager';

let _lastPreloadedUrl = '';

export const _preloadTimings = new Map<string, { touchStart: number; playStart?: number }>();

export function preTouchPreload(hlsUrl: string | undefined): void {
  if (!hlsUrl) return;
  _preloadTimings.set(hlsUrl, { touchStart: performance.now() });
  if (hlsUrl === _lastPreloadedUrl) return;
  _lastPreloadedUrl = hlsUrl;
  // Fire and forget — creates HLS instance, loads manifest, buffers first segment
  preCreateHlsInstance(hlsUrl).catch(() => {});
}

export function recordPlayStart(hlsUrl: string): void {
  const entry = _preloadTimings.get(hlsUrl);
  if (entry && !entry.playStart) {
    entry.playStart = performance.now();
    const tapToPlay = Math.round(entry.playStart - entry.touchStart);
    console.log(`[TapToPlay] ${tapToPlay}ms from touch to first frame — ${hlsUrl.slice(-30)}`);
  }
}
