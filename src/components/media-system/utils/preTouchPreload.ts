/**
 * preTouchPreload — called on onTouchStart of any video tile.
 * Pre-creates the HLS instance for the video that is about to be tapped
 * so that by the time the fullscreen overlay mounts, the instance is ready
 * for instant promotion — no cold attachMedia needed.
 */
import { preCreateHlsInstance } from '@/components/media-system/utils/hlsManager';
import { devLog } from '@/components/debug/ConsoleLogCapture';

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
    // TapToPlay metric captured silently — enable clbhouz-video-debug for visibility
  }
}

/**
 * onViewPreload — call this when a video tile scrolls into view.
 * Starts HLS pre-creation ~500ms-2s before the user taps,
 * so the instance is ready for instant promotion when fullscreen opens.
 */
export function onViewPreload(hlsUrl: string | undefined): void {
  if (!hlsUrl) return;
  // Don't re-create if already preloaded recently
  if (hlsUrl === _lastPreloadedUrl) return;
  // Don't overwrite an existing timing entry (touchStart takes priority)
  if (_preloadTimings.has(hlsUrl)) return;
  _lastPreloadedUrl = hlsUrl;
  preCreateHlsInstance(hlsUrl).catch(() => {});
}
