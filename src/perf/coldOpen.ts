/**
 * [COLDOPEN] Cold-path fullscreen open tracer.
 *
 * Instruments the "non-autoplaying tile → fullscreen" path where the tap
 * cannot borrow a live rail lane and must cold-load the 'fullscreen' lane.
 * All lines are prefixed with [COLDOPEN], gated on isPerfEnabled(), and add
 * ZERO behaviour changes.
 *
 * Wiring:
 *   • openWithOrigin.ts    → coldOpenRoute() when railOwnerKey present but
 *                            no borrow was taken.
 *   • VideoEngine.load     → coldOpenAttach() when the 'fullscreen' lane
 *                            gets its hls instance/source for the tap.
 *   • VideoEngine.markReady → coldOpenFirstFrame() when the fullscreen lane
 *                            paints its first real frame.
 *   • FullscreenFeedOverlay → coldOpenRevealSample() at open, +500ms, +2s.
 */

import Hls from 'hls.js';
import { isPerfEnabled } from '@/perf/navTiming';

interface ActiveTrace {
  ownerKey: string;
  hlsUrl: string;
  t0: number;
  firstFrame: boolean;
  laneId?: string;
  laneEl?: HTMLVideoElement;
  hls?: Hls | null;
  cap?: number | null;
  capReason?: string;
  lastError?: { type?: string; details?: string } | null;
  watchdog?: ReturnType<typeof setTimeout>;
  manifestStart?: number;
}

let active: ActiveTrace | null = null;

const tSince = () => (active ? Math.round(performance.now() - active.t0) : 0);

const log = (evt: string, payload: Record<string, unknown> = {}) => {
  if (!isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info('[COLDOPEN]', evt, { ...payload, t: tSince() });
};

function clearWatchdog() {
  if (active?.watchdog) {
    clearTimeout(active.watchdog);
    active.watchdog = undefined;
  }
}

export function coldOpenRoute(opts: {
  ownerKey: string;
  hlsUrl: string;
  prefetched: boolean;
}): void {
  if (!isPerfEnabled()) return;
  clearWatchdog();
  active = {
    ownerKey: opts.ownerKey,
    hlsUrl: opts.hlsUrl,
    t0: performance.now(),
    firstFrame: false,
    lastError: null,
  };
  // eslint-disable-next-line no-console
  console.info('[COLDOPEN]', 'route', {
    ownerKey: opts.ownerKey,
    hasRailLane: false,
    willColdLoad: true,
    prefetched: opts.prefetched,
    hlsUrl: opts.hlsUrl,
    t: 0,
  });
  // 5s firstFrame watchdog.
  active.watchdog = setTimeout(() => {
    if (!active || active.firstFrame) return;
    const el = active.laneEl;
    let bufferedSec = 0;
    try {
      if (el && el.buffered.length) {
        for (let i = 0; i < el.buffered.length; i++) {
          bufferedSec += el.buffered.end(i) - el.buffered.start(i);
        }
      }
    } catch {}
    log('firstFrame.timeout', {
      ms: 5000,
      lastReadyState: el?.readyState ?? null,
      networkState: el?.networkState ?? null,
      bufferedSec: +bufferedSec.toFixed(2),
      hlsError: active.lastError ?? null,
    });
  }, 5000);
}

export function coldOpenAttach(opts: {
  laneId: string;
  hlsUrl: string;
  hls: Hls | null;
  el: HTMLVideoElement;
  cap: number | null;
  startLevel: number | null;
  capReason: string;
}): void {
  if (!isPerfEnabled() || !active) return;
  if (opts.laneId !== 'fullscreen') return;
  if (active.hlsUrl !== opts.hlsUrl) return;
  active.laneId = opts.laneId;
  active.laneEl = opts.el;
  active.hls = opts.hls;
  active.cap = opts.cap;
  active.capReason = opts.capReason;
  active.manifestStart = performance.now();
  log('load.start', {
    ownerKey: active.ownerKey,
    laneId: opts.laneId,
    hlsUrl: opts.hlsUrl,
    cap: opts.cap,
    startLevel: opts.startLevel,
  });
  const hls = opts.hls;
  if (hls) {
    hls.on(Hls.Events.MANIFEST_PARSED, (_e, data: any) => {
      if (!active) return;
      log('manifest', {
        ok: true,
        ms: Math.round(performance.now() - (active.manifestStart ?? performance.now())),
        variants: data?.levels?.length ?? 0,
        fromCache: false,
      });
    });
    hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data: any) => {
      if (!active) return;
      const lvl = hls.levels?.[data?.level];
      log('level.selected', {
        level: data?.level,
        width: lvl?.width,
        height: lvl?.height,
        bitrate: lvl?.bitrate,
      });
    });
    hls.on(Hls.Events.ERROR, (_e, data: any) => {
      if (!active) return;
      active.lastError = { type: data?.type, details: data?.details };
      log('hls.error', {
        type: data?.type,
        details: data?.details,
        fatal: !!data?.fatal,
        ownerKey: active.ownerKey,
      });
    });
  }
}

export function coldOpenFirstFrame(laneId: string): void {
  if (!isPerfEnabled() || !active || active.firstFrame) return;
  if (active.laneId !== laneId) return;
  active.firstFrame = true;
  log('firstFrame', { ms: tSince() });
  const hls = active.hls;
  const level = hls?.currentLevel ?? null;
  const lvl = hls && level != null && level >= 0 ? hls.levels?.[level] : null;
  log('quality', {
    level,
    width: lvl?.width ?? null,
    height: lvl?.height ?? null,
    isLowestRung: level === 0,
    capActive: (hls?.autoLevelCapping ?? -1) >= 0 && (hls?.autoLevelCapping ?? -1) < (hls?.levels?.length ?? 0) - 1,
    capReason: active.capReason ?? 'none',
  });
  clearWatchdog();
}

export function coldOpenRevealSample(state: {
  needsFirstFrame: boolean;
  hasFirstFrame: boolean;
  posterVisible: boolean;
  blurLayerVisible: boolean;
}): void {
  if (!isPerfEnabled() || !active) return;
  log('reveal.wait', state);
}

export function coldOpenIsActive(): boolean {
  return !!active;
}
