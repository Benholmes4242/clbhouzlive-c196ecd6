/**
 * usePreroutePrefetch — scroll-guarded pointerdown warm for cold video tiles.
 *
 * Returns `{ onPreroute, onPrerouteCancel }` callbacks that Pressable (or any
 * pointer host) invokes:
 *   - `onPreroute`  fires when a pointerdown has "settled" (tap intent, not
 *     scroll/drag). We ask PrefetchController to warm the HLS cache for
 *     `${ownerKey}` — reusing the SAME warmer (max 2 in-flight, saveData/2g
 *     skip, LRU). Idempotent; no-op when disabled, no live lane, or no URL.
 *   - `onPrerouteCancel` fires when the gesture proved to be a scroll/drag or
 *     long-press. Aborts the in-flight warm so we don't burn bandwidth on
 *     scroll-touches.
 *
 * The scroll-guard itself lives in Pressable (movement threshold + long-press
 * timer). This hook just wires the warm/abort to the tile's ownerKey.
 */
import { useCallback, useMemo } from 'react';
import { PrefetchController } from '@/video/PrefetchController';

interface Options {
  /** Cold-tile owner key (`${postId}:0`). Null when tile is not a video. */
  ownerKey: string | null;
  /** HLS master URL. Falsy → hook is a no-op. */
  hlsUrl: string | null | undefined;
  /**
   * Enable preroute. Pass false for tiles that already borrow a live lane
   * (autoplaying) — the borrow path is already instant.
   */
  enabled: boolean;
}

export function usePreroutePrefetch({ ownerKey, hlsUrl, enabled }: Options) {
  const onPreroute = useCallback(() => {
    if (!enabled || !ownerKey || !hlsUrl) return;
    PrefetchController.request(ownerKey, hlsUrl);
  }, [enabled, ownerKey, hlsUrl]);

  const onPrerouteCancel = useCallback(() => {
    if (!ownerKey) return;
    PrefetchController.abort(ownerKey, 'preroute-cancel');
  }, [ownerKey]);

  return useMemo(() => ({ onPreroute, onPrerouteCancel }), [onPreroute, onPrerouteCancel]);
}

export default usePreroutePrefetch;
