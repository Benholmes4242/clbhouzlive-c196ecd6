/**
 * [FSV] Fullscreen-viewer open/close instrumentation.
 *
 * All logs are `console.info`, gated on `isPerfEnabled()` (the DBG pill),
 * and tagged `[FSV/<subtag>]`. No behaviour change — measurement only.
 *
 * A session id increments on every `fsvNewSession(...)` call so open/close
 * cycles can be correlated in the on-device log capture.
 *
 * Tags used across the platform (grep-friendly):
 *   [FSV/sess]           new open/close session boundary
 *   [FSV/tap]            openWithOrigin — tap-time snapshot
 *   [FSV/tap.origin]     origin rect + poster URL
 *   [FSV/tap.start]      chosen startPosition + source (feedSnap vs lastPos)
 *   [FSV/tap.statusbar]  statusbar.set flip attempted
 *   [FSV/tap.storeOpen]  useFullscreenFeedStore.open dispatched
 *   [FSV/open.effect]    overlay open effect fired (isOpen -> true)
 *   [FSV/open.viewport]  viewport dims before/after body-class + statusbar
 *   [FSV/target]         targetRect useMemo value on isOpen change
 *   [FSV/clone.init]     clone lifecycle effect fired (setCloneVisible true)
 *   [FSV/clone.raf1]     raf1 tick fired
 *   [FSV/clone.raf2]     raf2 tick fired — setCloneExpanded(true)
 *   [FSV/clone.watchdog] 400ms watchdog fired (setFirstFrameReady blindly)
 *   [FSV/clone.slideFF]  onFirstFrameReady from slide fired
 *   [FSV/clone.retire]   cloneVisible flipped false (post-crossfade)
 *   [FSV/close.effect]   overlay close cleanup fired (isOpen -> false)
 *   [FSV/slot.mount]     FullscreenVideoSlot mount w/ postId + startPosition
 *   [FSV/slot.active]    isActive flipped
 *   [FSV/slot.snapFF]    lane.snapshot.firstFrame flipped true
 *   [FSV/slot.unmount]   FullscreenVideoSlot unmount
 *   [FSV/lane.mount]     useVideoLane mount effect (mountLane called)
 *   [FSV/lane.load]      useVideoLane load effect (VideoEngine.load called)
 *   [FSV/lane.play]      useVideoLane play() invoked
 *   [FSV/lane.pause]     useVideoLane pause() invoked
 *   [FSV/eng.mountLane]  engine.mountLane resolved (appended | already parented)
 *   [FSV/eng.unmount]    engine.unmountLane
 *   [FSV/eng.load]       engine.load — url, startPosition, alreadyLoaded, native/hls, reuse
 *   [FSV/eng.load.hlsCfg] hls.js config.startPosition write + loadSource
 *   [FSV/eng.play]       engine.play invoked, wantPlay before, mounted?
 *   [FSV/eng.play.queued] play queued (no mounted host)
 *   [FSV/eng.play.kick]  play actually called on element
 *   [FSV/eng.pause]      engine.pause invoked, guard verdict
 *   [FSV/eng.pause.stale] owner-guard rejected stale caller
 *   [FSV/eng.markFF]     markFsFirstFrame — source (loadeddata|seeked|timeupdate), target, now, flipped?
 *   [FSV/eng.canplayKick] onCanPlay kicked el.play() because wantPlay
 *   [FSV/el.loadstart]   element loadstart
 *   [FSV/el.loadedmeta]  element loadedmetadata
 *   [FSV/el.loadeddata]  element loadeddata
 *   [FSV/el.seeking]     element seeking (currentTime target)
 *   [FSV/el.seeked]      element seeked (currentTime landed)
 *   [FSV/el.canplay]     element canplay
 *   [FSV/el.canplaythru] element canplaythrough
 *   [FSV/el.play]        element play event
 *   [FSV/el.playing]     element playing event (first-frame-decoded)
 *   [FSV/el.pause]       element pause event
 *   [FSV/el.waiting]     element waiting event (stall)
 *   [FSV/el.stalled]     element stalled event
 *   [FSV/el.ratechange]  element ratechange
 *   [FSV/el.time]        element timeupdate — sampled at 250ms/lane
 *   [FSV/el.error]       element error event
 *   [FSV/inline.mount]   InlineVideo (feed lane) mount
 *   [FSV/inline.active]  InlineVideo isActive flipped
 *   [FSV/inline.snapFF]  InlineVideo lane.snapshot.firstFrame flipped
 *   [FSV/inline.unmount] InlineVideo unmount
 */

import { isPerfEnabled } from '@/perf/navTiming';

let sessionId = 0;

function on(): boolean {
  try {
    return isPerfEnabled();
  } catch {
    return false;
  }
}

/** Bump the session id and emit a session-boundary marker. */
export function fsvNewSession(reason: string, extra?: Record<string, unknown>): number {
  sessionId += 1;
  if (on()) {
    // eslint-disable-next-line no-console
    console.info('[FSV/sess]', {
      sid: sessionId,
      reason,
      t: Math.round(performance.now()),
      ...(extra ?? {}),
    });
  }
  return sessionId;
}

/** Current session id (0 before any open). */
export function fsvSessionId(): number {
  return sessionId;
}

/** Generic FSV log — auto-stamped with sid + ms timestamp. */
export function fsv(tag: string, data?: Record<string, unknown>): void {
  if (!on()) return;
  // eslint-disable-next-line no-console
  console.info(`[FSV/${tag}]`, {
    sid: sessionId,
    t: Math.round(performance.now()),
    ...(data ?? {}),
  });
}

/** FSV log with common <video>-element fields (currentTime, readyState, paused, seeking, tail of src). */
export function fsvEl(
  tag: string,
  el: HTMLVideoElement | null | undefined,
  extra?: Record<string, unknown>,
): void {
  if (!on()) return;
  const ct = el?.currentTime ?? -1;
  const rs = el?.readyState ?? -1;
  const paused = el?.paused ?? null;
  const seeking = el?.seeking ?? null;
  const dur = el && isFinite(el.duration) ? +el.duration.toFixed(3) : null;
  const src = el?.currentSrc ? el.currentSrc.slice(-42) : null;
  // eslint-disable-next-line no-console
  console.info(`[FSV/${tag}]`, {
    sid: sessionId,
    t: Math.round(performance.now()),
    ct: +ct.toFixed(3),
    rs,
    paused,
    seeking,
    dur,
    src,
    ...(extra ?? {}),
  });
}

/** timeupdate sampler — one log per 250ms per (lane+phase) key to keep the log readable. */
const lastTimeLog = new Map<string, number>();
export function fsvTimeSample(
  key: string,
  el: HTMLVideoElement,
  extra?: Record<string, unknown>,
): void {
  if (!on()) return;
  const now = performance.now();
  const last = lastTimeLog.get(key) ?? 0;
  if (now - last < 250) return;
  lastTimeLog.set(key, now);
  fsvEl('el.time', el, { key, ...(extra ?? {}) });
}

/** Snapshot the current visual viewport for quick before/after comparisons. */
export function fsvViewport(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const vv = (window as any).visualViewport;
  return {
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    docH: document.documentElement?.clientHeight ?? -1,
    vvW: vv?.width ?? -1,
    vvH: vv?.height ?? -1,
    vvTop: vv?.offsetTop ?? -1,
    dpr: window.devicePixelRatio ?? -1,
  };
}
