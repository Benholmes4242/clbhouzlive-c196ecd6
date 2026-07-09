/**
 * usePreroutePrefetch — scroll-guarded pointerdown warm for cold video tiles.
 *
 * Returns `{ onPrerouteArm, onPreroute, onPrerouteCancel }` callbacks that
 * Pressable invokes across the gesture:
 *   - `onPrerouteArm`    at pointerdown (before the guard runs).
 *   - `onPreroute`       once the fire timer elapses and the gesture still
 *                        looks like a tap → warms via PrefetchController.
 *   - `onPrerouteCancel` when the guard cancels (moved/scroll/longpress) →
 *                        aborts the in-flight warm.
 *
 * DBG logging is gated on `isPerfEnabled()` — production is silent unless the
 * perf pill is on. When on, a scroll shows lots of `armed → cancelled{scroll}`
 * and zero `fired`; a clean tap shows `armed → fired`.
 */
import { useCallback, useMemo } from 'react';
import { PrefetchController } from '@/video/PrefetchController';
import { isPerfEnabled } from '@/perf/navTiming';

type CancelReason = 'moved' | 'scroll' | 'longpress';

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

function dbg(kind: 'armed' | 'fired' | 'cancelled', payload: Record<string, unknown>): void {
  if (!isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info(`[PREROUTE] ${kind}`, payload);
}

export function usePreroutePrefetch({ ownerKey, hlsUrl, enabled }: Options) {
  const onPrerouteArm = useCallback(() => {
    if (!enabled || !ownerKey || !hlsUrl) return;
    dbg('armed', { ownerKey });
  }, [enabled, ownerKey, hlsUrl]);

  const onPreroute = useCallback(() => {
    if (!enabled || !ownerKey || !hlsUrl) return;
    PrefetchController.request(ownerKey, hlsUrl);
    dbg('fired', { ownerKey });
  }, [enabled, ownerKey, hlsUrl]);

  const onPrerouteCancel = useCallback((reason: CancelReason) => {
    if (!ownerKey) return;
    PrefetchController.abort(ownerKey, `preroute-${reason}`);
    dbg('cancelled', { ownerKey, reason });
  }, [ownerKey]);

  return useMemo(
    () => ({ onPrerouteArm, onPreroute, onPrerouteCancel }),
    [onPrerouteArm, onPreroute, onPrerouteCancel],
  );
}

export default usePreroutePrefetch;
