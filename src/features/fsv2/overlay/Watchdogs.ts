/**
 * Watchdogs — every wait state has a bounded timeout that forces visible
 * recovery and emits a trace. Nothing may white-screen silently.
 */

import { useEffect, useRef } from 'react';

import { FSV2 } from '../tokens';
import { traceRevealForced } from '../perf/trace';

/**
 * Arm a one-shot timer that runs `onExpire` and traces `fsv2.reveal.forced`
 * unless `cancel()` is called first. Returns a cancel function.
 */
export function armWatchdog(
  openId: string,
  reason: string,
  timeoutMs: number,
  onExpire: () => void,
  extra: Record<string, unknown> = {},
): () => void {
  let cancelled = false;
  const t = setTimeout(() => {
    if (cancelled) return;
    try { onExpire(); } catch { /* swallow */ }
    traceRevealForced(openId, reason, { timeoutMs, ...extra });
  }, timeoutMs);
  return () => {
    cancelled = true;
    clearTimeout(t);
  };
}

/**
 * React hook flavour — arms on mount, cancels on unmount or when
 * `disarm` becomes true (e.g. after a real first-frame event).
 */
export function useWatchdog(
  openId: string,
  reason: string,
  timeoutMs: number,
  onExpire: () => void,
  disarm: boolean,
  extra: Record<string, unknown> = {},
): void {
  const disarmRef = useRef(disarm);
  disarmRef.current = disarm;

  useEffect(() => {
    if (disarm) return;
    const cancel = armWatchdog(openId, reason, timeoutMs, () => {
      if (!disarmRef.current) onExpire();
    }, extra);
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, reason, timeoutMs, disarm]);
}

export const WATCHDOG_MS = {
  VIDEO_FIRST_FRAME: FSV2.WATCHDOG_VIDEO_FIRST_FRAME_MS,
  IMAGE_DECODE: FSV2.WATCHDOG_IMAGE_DECODE_MS,
  INITIAL_SCROLL: FSV2.WATCHDOG_INITIAL_SCROLL_MS,
} as const;
