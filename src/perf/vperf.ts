/**
 * vperf — permanent video Quality-of-Experience instrumentation.
 *
 * IG/YouTube-style timing: one summary [VPERF] line per completed span with
 * named phase timings and a pass/fail budget verdict. NOT a per-event trace
 * (that was the retired [FSV] telemetry — high volume, gone by design).
 *
 * All entry points no-op instantly when `isPerfEnabled()` is false. Nothing
 * here changes playback behaviour — pure measurement.
 *
 * Public API
 * ----------
 * Span lifecycle:
 *   vperfStart(spanId, kind, meta?)  — capture t0
 *   vperfMark(spanId, phase)         — record intermediate phase
 *   vperfEnd(spanId, extraMeta?)     — emit ONE line: { totalMs, phases, budgetMs, verdict, ...meta }
 *
 * Lane bridging (spans that resolve on a video event):
 *   vperfArmLane(laneId, { spanId, endOn, phase? })
 *     — VideoEngine will emit `vperfLaneEvent(laneId, event)` from its
 *       existing element listeners. When `event === endOn`, the armed span
 *       ends. `phase` (optional) records an intermediate mark instead.
 *   vperfLaneEvent(laneId, event, data?)
 *     — called by VideoEngine only.
 *
 * Session health (Part 3):
 *   vperfSessionStart(laneId, meta)     — begin health tracking for a play session
 *   vperfSessionStall(laneId, kind)     — 'waiting' | 'playing' (state edges)
 *   vperfSessionLevel(laneId, level, bwEstimate?)   — hls.js LEVEL_SWITCHED
 *   vperfSessionEnd(laneId, reason)     — emit [VPERF] session summary
 *
 * Emission format (single ASCII line via console.info):
 *   [VPERF] <kind> { totalMs, phases: {a: 12, b: 31}, budgetMs, verdict, ...meta }
 *
 * Spans that outlive `SPAN_TTL_MS` auto-expire with verdict: 'TIMEOUT'.
 */

import { isPerfEnabled } from '@/perf/navTiming';
import { writeBandwidthSample, getNetClass } from '@/video/bandwidthMemory';


const SPAN_TTL_MS = 15_000;

type Verdict = 'PASS' | 'SLOW' | 'TIMEOUT' | 'SUPERSEDED';

interface SpanRec {
  spanId: string;
  kind: string;
  t0: number;
  budgetMs: number;
  meta: Record<string, unknown>;
  phases: Record<string, number>;
  lastMark: number;
  timer: ReturnType<typeof setTimeout>;
}

interface LaneArm {
  spanId: string;
  endOn: LaneEvent;
  phase?: string;
}

export type LaneEvent =
  | 'firstFrame'
  | 'playing'
  | 'waiting'
  | 'seeked'
  | 'levelswitch'
  | 'canplay';

interface SessionRec {
  laneId: string;
  t0: number;
  meta: Record<string, unknown>;
  stallCount: number;
  stallTotalMs: number;
  longestStallMs: number;
  waitingT0: number | null; // when a stall began (after startup)
  hadFirstPlaying: boolean;
  startFrames: number | null;
  startDropped: number | null;
  startLevel: number | null;
  endLevel: number | null;
  levelSwitches: number;
  bwEstimateStart: number | null;
  bwEstimateEnd: number | null;
  seededBw: number | null;
  timer: ReturnType<typeof setTimeout>;
}


const spans = new Map<string, SpanRec>();
const laneArms = new Map<string, LaneArm[]>();
const sessions = new Map<string, SessionRec>();

// Default budgets by kind (ms). Callers may override via vperfStart meta.budgetMs.
// fs.close = 250 while FS_TRANSITION_MODE === 'cut' (snap-handoff, no reverse
// motion). Flipping the mode back to 'expand' should widen this to ~450 to
// accommodate the 300ms wrapper shrink + returnBorrow/handback tail.
const DEFAULT_BUDGETS: Record<string, number> = {
  'fs.open.borrow': 150,
  'fs.open.lane': 500,
  'fs.open.image': 200,
  'fs.close': 250,

  'autoplay.warm': 120,
  'autoplay.cold': 600,
  'swipe.vertical': 450,
  'swipe.pager': 450,
  seek: 300,
  'loop.gap': 120,

  'feed.scroll': 0,
  'feed.activate.image': 250,
  'feed.activate.video.warm': 120,
  'feed.activate.video.cold': 600,
};

// -------- page tag (auto-injected into every emit) --------
let __currentPage: string = 'unknown';
export function vperfSetPage(page: string): void {
  __currentPage = page || 'unknown';
  // Trigger per-page nav summary when the page changes.
  try { scorecardEmitOnNav(); } catch {}
}
export function vperfGetPage(): string { return __currentPage; }

// PHASE-2 GATE SPLIT.
//   recordOn() — always true; drives every counter/rollup path so real
//     devices silently accumulate aggregate stats for the telemetry shipper.
//   consoleOn() — mirrors isPerfEnabled(); guards every console.info /
//     scorecard emission so pill/console behaviour stays byte-identical.
// Old `on()` is kept (=recordOn) so the ~25 existing call sites don't churn.
function on(): boolean { return true; }
function consoleOn(): boolean {
  try { return isPerfEnabled(); } catch { return false; }
}


function budgetFor(kind: string, metaBudget: number | undefined): number {
  if (typeof metaBudget === 'number' && isFinite(metaBudget) && metaBudget > 0) {
    return metaBudget;
  }
  return DEFAULT_BUDGETS[kind] ?? 500;
}

function emit(kind: string, payload: Record<string, unknown>): void {
  const merged = { ...payload, page: (payload as any).page ?? __currentPage };
  try { scorecardIngest(kind, merged); } catch {}
  if (!consoleOn()) return; // pill off: no console spam, no format work
  // eslint-disable-next-line no-console
  console.info(`[VPERF] ${kind}`, merged);
}


function finish(rec: SpanRec, verdict: Verdict, extra: Record<string, unknown>): void {
  clearTimeout(rec.timer);
  const totalMs = Math.round(performance.now() - rec.t0);
  const finalVerdict: Verdict =
    verdict === 'TIMEOUT' ? 'TIMEOUT' : totalMs <= rec.budgetMs ? 'PASS' : 'SLOW';
  emit(rec.kind, {
    totalMs,
    phases: rec.phases,
    budgetMs: rec.budgetMs,
    verdict: finalVerdict,
    ...rec.meta,
    ...extra,
  });
}

export function vperfStart(
  spanId: string,
  kind: string,
  meta: Record<string, unknown> & { budgetMs?: number } = {},
): void {
  if (!on()) return;
  // Replace any prior span with the same id (e.g. rapid re-tap).
  const prior = spans.get(spanId);
  if (prior) clearTimeout(prior.timer);
  const { budgetMs: metaBudget, ...restMeta } = meta;
  const now = performance.now();
  const rec: SpanRec = {
    spanId,
    kind,
    t0: now,
    budgetMs: budgetFor(kind, metaBudget),
    meta: restMeta,
    phases: {},
    lastMark: now,
    timer: setTimeout(() => {
      const r = spans.get(spanId);
      if (!r) return;
      spans.delete(spanId);
      finish(r, 'TIMEOUT', {});
    }, SPAN_TTL_MS),
  };
  spans.set(spanId, rec);
}

export function vperfMark(spanId: string, phase: string): void {
  if (!on()) return;
  const rec = spans.get(spanId);
  if (!rec) return;
  const now = performance.now();
  // Phase value = elapsed since last mark (or start). Named phases compose
  // into a sequential timeline: { storeOpen: 3, slotMount: 12, firstFrame: 84, playing: 22 }.
  rec.phases[phase] = Math.round(now - rec.lastMark);
  rec.lastMark = now;
}

export function vperfEnd(
  spanId: string,
  extraMeta: Record<string, unknown> = {},
): void {
  if (!on()) return;
  const rec = spans.get(spanId);
  if (!rec) return;
  spans.delete(spanId);
  clearLaneArmsBySpan(spanId);
  finish(rec, 'PASS', extraMeta);
}

/** Close an in-flight span as SUPERSEDED — reports actual elapsed time but
 *  is excluded from PASS/SLOW/TIMEOUT verdict rollups (flicked-past posts
 *  and abandoned opens are not slow, they were superseded). No-op if the
 *  span is not currently in the map. */
export function vperfSupersede(
  spanId: string,
  extraMeta: Record<string, unknown> = {},
): void {
  if (!on()) return;
  const rec = spans.get(spanId);
  if (!rec) return;
  spans.delete(spanId);
  clearLaneArmsBySpan(spanId);
  clearTimeout(rec.timer);
  const totalMs = Math.round(performance.now() - rec.t0);
  emit(rec.kind, {
    totalMs,
    phases: rec.phases,
    budgetMs: rec.budgetMs,
    verdict: 'SUPERSEDED' as Verdict,
    ...rec.meta,
    ...extraMeta,
  });
}

function clearLaneArmsBySpan(spanId: string): void {
  for (const [laneId, list] of laneArms) {
    const filtered = list.filter((a) => a.spanId !== spanId);
    if (filtered.length === 0) laneArms.delete(laneId);
    else if (filtered.length !== list.length) laneArms.set(laneId, filtered);
  }
}


/** Adjust the budget for an in-flight span (e.g. once you know whether the
 *  open path is borrow vs cold-lane). No-op if the span has already ended. */
export function vperfSetBudget(spanId: string, budgetMs: number): void {
  if (!on()) return;
  const rec = spans.get(spanId);
  if (!rec) return;
  if (isFinite(budgetMs) && budgetMs > 0) rec.budgetMs = budgetMs;
}

/** Attach additional meta to an in-flight span (e.g. source once known). */
export function vperfMeta(spanId: string, meta: Record<string, unknown>): void {
  if (!on()) return;
  const rec = spans.get(spanId);
  if (!rec) return;
  Object.assign(rec.meta, meta);
}

// ------------------------ Lane bridging ------------------------

export function vperfArmLane(
  laneId: string,
  arm: { spanId: string; endOn: LaneEvent; phase?: string },
): void {
  if (!on()) return;
  const list = laneArms.get(laneId) ?? [];
  list.push({ spanId: arm.spanId, endOn: arm.endOn, phase: arm.phase });
  laneArms.set(laneId, list);
}

export function vperfClearLane(laneId: string, spanId?: string): void {
  if (!spanId) {
    laneArms.delete(laneId);
    return;
  }
  const list = laneArms.get(laneId);
  if (!list) return;
  const filtered = list.filter((a) => a.spanId !== spanId);
  if (filtered.length === 0) laneArms.delete(laneId);
  else laneArms.set(laneId, filtered);
}

export function vperfLaneEvent(
  laneId: string,
  event: LaneEvent,
  data?: Record<string, unknown>,
): void {
  if (!on()) return;
  // Feed session tracker first (its counters must run before span teardown).
  if (event === 'waiting' || event === 'playing') {
    sessionOnStateEdge(laneId, event);
  }
  const list = laneArms.get(laneId);
  if (!list || list.length === 0) return;
  const remaining: LaneArm[] = [];
  for (const arm of list) {
    if (arm.endOn === event) {
      if (arm.phase) {
        vperfMark(arm.spanId, arm.phase);
      } else {
        vperfEnd(arm.spanId, data ?? {});
      }
      continue;
    }
    remaining.push(arm);
  }
  if (remaining.length === 0) laneArms.delete(laneId);
  else laneArms.set(laneId, remaining);
}

// ------------------------ Session health ------------------------

function readQualityDelta(
  el: HTMLVideoElement | null | undefined,
): { totalFrames: number | null; droppedFrames: number | null } {
  if (!el) return { totalFrames: null, droppedFrames: null };
  const q = (el as any).getVideoPlaybackQuality;
  if (typeof q !== 'function') return { totalFrames: null, droppedFrames: null };
  try {
    const s = q.call(el);
    return {
      totalFrames: typeof s.totalVideoFrames === 'number' ? s.totalVideoFrames : null,
      droppedFrames: typeof s.droppedVideoFrames === 'number' ? s.droppedVideoFrames : null,
    };
  } catch {
    return { totalFrames: null, droppedFrames: null };
  }
}

export function vperfSessionStart(
  laneId: string,
  meta: Record<string, unknown> & {
    el?: HTMLVideoElement | null;
    startLevel?: number | null;
    bwEstimate?: number | null;
    seededBw?: number | null;
  },
): void {
  if (!on()) return;
  const prior = sessions.get(laneId);
  if (prior) {
    // End the prior session cleanly before starting a new one.
    vperfSessionEnd(laneId, 'reopened');
  }
  const q = readQualityDelta(meta.el ?? null);
  const rec: SessionRec = {
    laneId,
    t0: performance.now(),
    meta: (() => {
      const { el, startLevel, bwEstimate, seededBw, ...rest } = meta;
      return rest;
    })(),
    stallCount: 0,
    stallTotalMs: 0,
    longestStallMs: 0,
    waitingT0: null,
    hadFirstPlaying: false,
    startFrames: q.totalFrames,
    startDropped: q.droppedFrames,
    startLevel: meta.startLevel ?? null,
    endLevel: meta.startLevel ?? null,
    levelSwitches: 0,
    bwEstimateStart: meta.bwEstimate ?? null,
    bwEstimateEnd: meta.bwEstimate ?? null,
    seededBw: meta.seededBw ?? null,

    timer: setTimeout(() => {
      // Absolute ceiling: 5-min sessions get flushed so long-running lanes
      // don't accumulate silently.
      vperfSessionEnd(laneId, 'ttl');
    }, 5 * 60_000),
  };
  // Stash the element for end-time quality readback.
  (rec as any)._el = meta.el ?? null;
  sessions.set(laneId, rec);
}

function sessionOnStateEdge(laneId: string, edge: 'waiting' | 'playing'): void {
  const rec = sessions.get(laneId);
  if (!rec) return;
  const now = performance.now();
  if (edge === 'waiting') {
    // Exclude the initial startup — stalls only count AFTER the first
    // sustained playing state. Also excludes seeks (which are separate S6
    // spans; the seek handler calls vperfSessionSuppressNextStall).
    if (!rec.hadFirstPlaying) return;
    if ((rec as any)._suppressNextStall) {
      (rec as any)._suppressNextStall = false;
      return;
    }
    if (rec.waitingT0 == null) rec.waitingT0 = now;
  } else if (edge === 'playing') {
    if (!rec.hadFirstPlaying) {
      rec.hadFirstPlaying = true;
      return;
    }
    if (rec.waitingT0 != null) {
      const dur = now - rec.waitingT0;
      rec.waitingT0 = null;
      rec.stallCount += 1;
      rec.stallTotalMs += dur;
      if (dur > rec.longestStallMs) rec.longestStallMs = dur;
    }
  }
}

/** Called by VideoEngine.seek so the resulting waiting→playing pair isn't
 *  counted as a rebuffer stall (that's the S6 seek span's territory). */
export function vperfSessionSuppressNextStall(laneId: string): void {
  const rec = sessions.get(laneId);
  if (!rec) return;
  (rec as any)._suppressNextStall = true;
}

export function vperfSessionLevel(
  laneId: string,
  level: number,
  bwEstimate?: number | null,
): void {
  if (!on()) return;
  const rec = sessions.get(laneId);
  if (!rec) return;
  rec.levelSwitches += 1;
  rec.endLevel = level;
  if (rec.startLevel == null) rec.startLevel = level;
  if (typeof bwEstimate === 'number' && bwEstimate > 0) {
    rec.bwEstimateEnd = Math.round(bwEstimate);
  }
}


export function vperfSessionEnd(laneId: string, reason: string): void {
  if (!on()) return;
  const rec = sessions.get(laneId);
  if (!rec) return;
  sessions.delete(laneId);
  clearTimeout(rec.timer);
  const now = performance.now();
  // If we ended mid-stall, count the tail.
  if (rec.waitingT0 != null) {
    const dur = now - rec.waitingT0;
    rec.stallCount += 1;
    rec.stallTotalMs += dur;
    if (dur > rec.longestStallMs) rec.longestStallMs = dur;
  }
  const durationMs = Math.round(now - rec.t0);
  const el: HTMLVideoElement | null = (rec as any)._el ?? null;
  const q = readQualityDelta(el);
  const totalFrames =
    q.totalFrames != null && rec.startFrames != null ? q.totalFrames - rec.startFrames : null;
  const droppedFrames =
    q.droppedFrames != null && rec.startDropped != null
      ? q.droppedFrames - rec.startDropped
      : null;
  const stallRatio = durationMs > 0 ? rec.stallTotalMs / durationMs : 0;
  const longStall = rec.longestStallMs > 1000;
  const verdict: Verdict = stallRatio <= 0.005 && !longStall ? 'PASS' : 'SLOW';
  emit('session', {
    laneId,
    durationMs,
    stallCount: rec.stallCount,
    stallTotalMs: Math.round(rec.stallTotalMs),
    longestStallMs: Math.round(rec.longestStallMs),
    droppedFrames,
    totalFrames,
    levelSwitches: rec.levelSwitches,
    startLevel: rec.startLevel,
    endLevel: rec.endLevel,
    bwEstimateStart: rec.bwEstimateStart,
    bwEstimateEnd: rec.bwEstimateEnd,
    seededBw: rec.seededBw,
    netClass: getNetClass(),
    verdict,
    longStall,
    reason,
    ...rec.meta,
  });
  // [PREDICT] Part 1a — persist the terminal bandwidth estimate so the next
  // cold hls.js instance can seed its ABR. Only feed-active / fullscreen
  // lanes contribute (rails run capped at level 0 — not representative).
  if (
    (laneId === 'feed-active' || laneId === 'fullscreen') &&
    rec.bwEstimateEnd != null &&
    durationMs >= 3000
  ) {
    try { writeBandwidthSample(rec.bwEstimateEnd); } catch {}
  }
}


// ------------------------ Motion trace (fs.open jump diagnosis) ------------------------
//
// Chromium-only Layout Instability API is absent in the iOS WebView, so this
// is the manual equivalent: rAF-sample the FLIP wrapper / overlay / underlay
// rects and viewport state for a bounded window inside an fs.open span, plus
// event-log any visualViewport/window resizes and the body-scroll-lock edge.
// Emits ONE compact summary line at end. Strict no-op when DBG is off.

interface MotionRec {
  spanId: string;
  t0: number;
  originRect: { top: number; left: number; width: number; height: number } | null;
  frames: number[][]; // compact tuples — see FRAME_SHAPE below
  events: Array<{ t: number; kind: string; data?: Record<string, unknown> }>;
  phaseMarks: Record<string, number>;
  rafId: number;
  timerId: ReturnType<typeof setTimeout>;
  cleanup: () => void;
  ended: boolean;
}
// Frame tuple layout (indices, all numbers):
//  0 t
//  1..4  wrapper x,y,w,h
//  5..8  overlay x,y,w,h
//  9 underlay opacity (0..1, 2dp)
// 10 objectFit  (0=cover, 1=contain, -1=n/a)
// 11 scrollY
// 12 vvOffsetTop
// 13 vvScale (3dp)
// 14 bodyScrollLock (1|0)
const FRAME_SHAPE =
  't,wx,wy,ww,wh,ox,oy,ow,oh,uOpacity,fit,scrollY,vvTop,vvScale,lock';

const activeMotion = new Map<string, MotionRec>();
let activeMotionSpanId: string | null = null;

function rr(v: number): number { return Math.round(v); }
function r2(v: number): number { return Math.round(v * 100) / 100; }
function r3(v: number): number { return Math.round(v * 1000) / 1000; }

function readRect(el: Element | null): [number, number, number, number] {
  if (!el) return [0, 0, 0, 0];
  const r = (el as HTMLElement).getBoundingClientRect();
  return [rr(r.left), rr(r.top), rr(r.width), rr(r.height)];
}

function isBodyLocked(): number {
  if (typeof document === 'undefined') return 0;
  return document.body.style.position === 'fixed' ? 1 : 0;
}

export function vperfMotionTrace(
  spanId: string,
  opts: {
    originRect?: { top: number; left: number; width: number; height: number } | null;
    windowMs?: number;
  } = {},
): void {
  if (!on()) return;
  if (typeof window === 'undefined') return;
  // Replace any prior trace for this span.
  const prior = activeMotion.get(spanId);
  if (prior) { try { prior.cleanup(); } catch {} }

  const windowMs = opts.windowMs ?? 700;
  const t0 = performance.now();
  const rec: MotionRec = {
    spanId,
    t0,
    originRect: opts.originRect ?? null,
    frames: [],
    events: [],
    phaseMarks: {},
    rafId: 0,
    timerId: 0 as unknown as ReturnType<typeof setTimeout>,
    cleanup: () => {},
    ended: false,
  };

  const onVvResize = () => rec.events.push({ t: rr(performance.now() - t0), kind: 'vv.resize' });
  const onVvScroll = () => rec.events.push({ t: rr(performance.now() - t0), kind: 'vv.scroll' });
  const onWinResize = () => rec.events.push({ t: rr(performance.now() - t0), kind: 'win.resize' });
  const vv = (window as any).visualViewport as VisualViewport | undefined;
  try { vv?.addEventListener('resize', onVvResize); } catch {}
  try { vv?.addEventListener('scroll', onVvScroll); } catch {}
  try { window.addEventListener('resize', onWinResize); } catch {}

  let lastLock = -1;
  const sample = () => {
    if (rec.ended) return;
    const t = rr(performance.now() - t0);
    const wrapper = document.querySelector('[data-vperf="flip-wrapper"]');
    const overlay = document.querySelector('[data-vperf="fs-overlay"]');
    const underlay = document.querySelector('[data-vperf="flip-underlay"]') as HTMLElement | null;
    const video = wrapper?.querySelector('video') as HTMLVideoElement | null;
    const [wx, wy, ww, wh] = readRect(wrapper);
    const [ox, oy, ow, oh] = readRect(overlay);
    const uOpacity = underlay ? r2(parseFloat(underlay.style.opacity || '0') || 0) : 0;
    const fitStr = video ? video.style.objectFit : '';
    const fit = fitStr === 'contain' ? 1 : fitStr === 'cover' ? 0 : -1;
    const scrollY = rr(window.scrollY || 0);
    const vvTop = vv ? rr(vv.offsetTop) : 0;
    const vvScale = vv ? r3(vv.scale) : 1;
    const lock = isBodyLocked();
    if (lock !== lastLock) {
      rec.events.push({ t, kind: 'bodyScrollLock', data: { locked: !!lock } });
      lastLock = lock;
    }
    rec.frames.push([t, wx, wy, ww, wh, ox, oy, ow, oh, uOpacity, fit, scrollY, vvTop, vvScale, lock]);
    rec.rafId = requestAnimationFrame(sample);
  };
  rec.rafId = requestAnimationFrame(sample);

  rec.cleanup = () => {
    if (rec.ended) return;
    rec.ended = true;
    try { cancelAnimationFrame(rec.rafId); } catch {}
    try { clearTimeout(rec.timerId); } catch {}
    try { vv?.removeEventListener('resize', onVvResize); } catch {}
    try { vv?.removeEventListener('scroll', onVvScroll); } catch {}
    try { window.removeEventListener('resize', onWinResize); } catch {}
    activeMotion.delete(spanId);
    if (activeMotionSpanId === spanId) activeMotionSpanId = null;
    emit('fs.open.motion', {
      spanId,
      shape: FRAME_SHAPE,
      originRect: rec.originRect,
      phaseMarks: rec.phaseMarks,
      frames: rec.frames,
      events: rec.events,
    });
  };
  rec.timerId = setTimeout(() => rec.cleanup(), windowMs);
  activeMotion.set(spanId, rec);
  activeMotionSpanId = spanId;
}

/** Mark a phase on the currently-armed motion trace (single-active model —
 *  motion tracing is always tied to the in-flight fs.open borrow span). */
export function vperfMotionMark(phase: string): void {
  if (!on()) return;
  const spanId = activeMotionSpanId;
  if (!spanId) return;
  const rec = activeMotion.get(spanId);
  if (!rec) return;
  rec.phaseMarks[phase] = rr(performance.now() - rec.t0);
}

/** End the active motion trace early (e.g. on vperfEnd of the parent span). */
export function vperfMotionEnd(spanId: string): void {
  const rec = activeMotion.get(spanId);
  if (!rec) return;
  rec.cleanup();
}

// ------------------------ Close-motion trace (fs.close symmetry) ------------------------
//
// Mirror of fs.open.motion, tuned for the RETURN animation. Per-frame samples
// the FLIP wrapper's rect versus a live re-measured origin-tile rect (the
// crucial pair: if the tile moves mid-flight, the diff appears as a frame
// where targetTile* shifts and by how much). Also captures scrollY, whether
// the fullscreen body class is still present, whether the body scroll lock is
// still engaged, and the underlay opacity. Event marks are recorded via
// vperfCloseMotionMark: closeRequested / chromeUnsuppressed / bodyClassRemoved
// / scrollUnlocked / returnAnimStart / returnAnimEnd / laneRemounted.
// Emits ONE compact 'fs.close.motion' summary line at end. Strict no-op when
// DBG is off. Independent from vperfMotionTrace (open) — they may overlap in
// theory but the FLIP wrapper is only mounted once at a time.

interface CloseMotionRec {
  spanId: string;
  t0: number;
  originResolver: (() => { top: number; left: number; width: number; height: number } | null) | null;
  frames: number[][]; // see CLOSE_FRAME_SHAPE
  events: Array<{ t: number; kind: string; data?: Record<string, unknown> }>;
  phaseMarks: Record<string, number>;
  rafId: number;
  timerId: ReturnType<typeof setTimeout>;
  cleanup: () => void;
  ended: boolean;
}
// Frame tuple:
//  0 t
//  1..4 wrapper x,y,w,h
//  5..8 tileLive x,y,w,h   (0,0,0,0 when resolver returns null)
//  9 underlayOpacity (0..1, 2dp)
// 10 scrollY
// 11 chromeSuppressed (1|0) — body has route-fullscreen-overlay class
// 12 bodyClassPresent (1|0) — same as chromeSuppressed today; kept as separate
//                             slot for future divergence
// 13 lockState (1|0) — bodyScrollLock still engaged
const CLOSE_FRAME_SHAPE =
  't,wx,wy,ww,wh,tx,ty,tw,th,uOpacity,scrollY,chromeSuppressed,bodyClassPresent,lockState';

const activeCloseMotion = new Map<string, CloseMotionRec>();
let activeCloseMotionSpanId: string | null = null;

function chromeSuppressedNow(): number {
  if (typeof document === 'undefined') return 0;
  return document.body.classList.contains('route-fullscreen-overlay') ? 1 : 0;
}

export function vperfCloseMotionTrace(
  spanId: string,
  opts: {
    originResolver?: (() => { top: number; left: number; width: number; height: number } | null) | null;
    windowMs?: number;
  } = {},
): void {
  if (!on()) return;
  if (typeof window === 'undefined') return;
  const prior = activeCloseMotion.get(spanId);
  if (prior) { try { prior.cleanup(); } catch {} }

  const windowMs = opts.windowMs ?? 700;
  const t0 = performance.now();
  const rec: CloseMotionRec = {
    spanId,
    t0,
    originResolver: opts.originResolver ?? null,
    frames: [],
    events: [],
    phaseMarks: {},
    rafId: 0,
    timerId: 0 as unknown as ReturnType<typeof setTimeout>,
    cleanup: () => {},
    ended: false,
  };

  const sample = () => {
    if (rec.ended) return;
    const t = rr(performance.now() - t0);
    const wrapper = document.querySelector('[data-vperf="flip-wrapper"]');
    const underlay = document.querySelector('[data-vperf="flip-underlay"]') as HTMLElement | null;
    const [wx, wy, ww, wh] = readRect(wrapper);
    let tx = 0, ty = 0, tw = 0, th = 0;
    if (rec.originResolver) {
      try {
        const r = rec.originResolver();
        if (r) { tx = rr(r.left); ty = rr(r.top); tw = rr(r.width); th = rr(r.height); }
      } catch {}
    }
    const uOpacity = underlay ? r2(parseFloat(underlay.style.opacity || '0') || 0) : 0;
    const scrollY = rr(window.scrollY || 0);
    const cs = chromeSuppressedNow();
    rec.frames.push([t, wx, wy, ww, wh, tx, ty, tw, th, uOpacity, scrollY, cs, cs, isBodyLocked()]);
    rec.rafId = requestAnimationFrame(sample);
  };
  rec.rafId = requestAnimationFrame(sample);

  rec.cleanup = () => {
    if (rec.ended) return;
    rec.ended = true;
    try { cancelAnimationFrame(rec.rafId); } catch {}
    try { clearTimeout(rec.timerId); } catch {}
    activeCloseMotion.delete(spanId);
    if (activeCloseMotionSpanId === spanId) activeCloseMotionSpanId = null;
    emit('fs.close.motion', {
      spanId,
      shape: CLOSE_FRAME_SHAPE,
      phaseMarks: rec.phaseMarks,
      frames: rec.frames,
      events: rec.events,
    });
  };
  rec.timerId = setTimeout(() => rec.cleanup(), windowMs);
  activeCloseMotion.set(spanId, rec);
  activeCloseMotionSpanId = spanId;
}

/** Mark a phase on the currently-armed close-motion trace. Also pushes an
 *  event with the same name so the ordering question (does chrome reflow
 *  land mid-animation?) is answered by timestamps, not theory. */
export function vperfCloseMotionMark(phase: string, data?: Record<string, unknown>): void {
  if (!on()) return;
  const spanId = activeCloseMotionSpanId;
  if (!spanId) return;
  const rec = activeCloseMotion.get(spanId);
  if (!rec) return;
  const t = rr(performance.now() - rec.t0);
  rec.phaseMarks[phase] = t;
  rec.events.push({ t, kind: phase, data });
}

export function vperfCloseMotionEnd(spanId: string): void {
  const rec = activeCloseMotion.get(spanId);
  if (!rec) return;
  rec.cleanup();
}

// ------------------------ Convenience helpers ------------------------

let __seq = 0;
export function vperfNextId(prefix: string): string {
  __seq = (__seq + 1) | 0;
  return `${prefix}#${__seq}`;
}

// ============================================================================
// BASELINE — session scorecard aggregator, feed metrics, image phase helper,
// [DECIDE] tally, per-page "sinceActiveMs" bookkeeping. All isPerfEnabled-gated.
// ============================================================================

interface KindStat {
  count: number;
  pass: number;
  slow: number;
  timeout: number;
  superseded: number;
  totals: number[];  // fixed-size ring; length ≤ TOTALS_CAP, order not meaningful
  totalsIdx: number; // next write index once full
}

// PHASE-2: bounded rings for always-on collection. push+shift was O(n) and
// caused GC churn under load; ring push is O(1). p50/p95/worst are computed
// only at flush time (scorecard emit / telemetry snapshot), never on the
// hot path.
const TOTALS_CAP = 500;
const STARTLEVELS_CAP = 500;
function ringPush(arr: number[], idx: number, cap: number, v: number): number {
  if (arr.length < cap) { arr.push(v); return arr.length === cap ? 0 : idx; }
  arr[idx] = v;
  return (idx + 1) % cap;
}

const scorecardBuckets = new Map<string, KindStat>();      // key = `${kind}|${page}`
const sessionHealth = {
  sessionCount: 0,
  totalStalls: 0,
  totalDurationMs: 0,
  totalStallMs: 0,
  levelSwitches: 0,
  totalFrames: 0,
  droppedFrames: 0,
};
const decideCounters = new Map<string, Map<string, number>>(); // bucket → key → count
const feedRollup = new Map<string, { scrolls: number; longFrames: number; frames: number; worstMs: number; activateWarm: number; activateCold: number }>(); // per page

// [PREDICT] scorecard extras — per-lane-class start levels (median target)
// and prefetch counters (issued / aborted / hit-rate).
const startLevelsByLane = new Map<string, { arr: number[]; idx: number }>();
const prefetchStats = {
  issued: 0,
  aborted: new Map<string, number>(),
  activationsWithPrefetch: 0,
  activationsWithPrefetchWarm: 0,
};



function bucketKey(kind: string, page: string): string { return `${kind}|${page}`; }

function scorecardIngest(kind: string, payload: Record<string, unknown>): void {
  const page = String((payload as any).page ?? 'unknown');
  const totalMs = Number((payload as any).totalMs);
  const verdict = String((payload as any).verdict ?? '');

  if (kind === 'session') {
    sessionHealth.sessionCount += 1;
    sessionHealth.totalStalls += Number((payload as any).stallCount) || 0;
    sessionHealth.totalDurationMs += Number((payload as any).durationMs) || 0;
    sessionHealth.totalStallMs += Number((payload as any).stallTotalMs) || 0;
    sessionHealth.levelSwitches += Number((payload as any).levelSwitches) || 0;
    sessionHealth.totalFrames += Number((payload as any).totalFrames) || 0;
    sessionHealth.droppedFrames += Number((payload as any).droppedFrames) || 0;
    const laneId = String((payload as any).laneId ?? '');
    const sl = (payload as any).startLevel;
    if (typeof sl === 'number' && (laneId === 'feed-active' || laneId === 'fullscreen')) {
      const ring = startLevelsByLane.get(laneId) ?? { arr: [], idx: 0 };
      ring.idx = ringPush(ring.arr, ring.idx, STARTLEVELS_CAP, sl);
      startLevelsByLane.set(laneId, ring);
    }

    return;
  }

  if (kind === 'feed.scroll') {
    const r = feedRollup.get(page) ?? { scrolls: 0, longFrames: 0, frames: 0, worstMs: 0, activateWarm: 0, activateCold: 0 };
    r.scrolls += 1;
    r.longFrames += Number((payload as any).longFrames) || 0;
    r.frames += Number((payload as any).frames) || 0;
    r.worstMs = Math.max(r.worstMs, Number((payload as any).worstFrameMs) || 0);
    feedRollup.set(page, r);
  }
  if (kind === 'feed.activate') {
    const r = feedRollup.get(page) ?? { scrolls: 0, longFrames: 0, frames: 0, worstMs: 0, activateWarm: 0, activateCold: 0 };
    if ((payload as any).warm) r.activateWarm += 1; else r.activateCold += 1;
    feedRollup.set(page, r);
    if ((payload as any).prefetched === true) {
      prefetchStats.activationsWithPrefetch += 1;
      if ((payload as any).warm) prefetchStats.activationsWithPrefetchWarm += 1;
    }
  }


  if (!isFinite(totalMs) || totalMs < 0) return;
  const key = bucketKey(kind, page);
  const stat: KindStat = scorecardBuckets.get(key)
    ?? { count: 0, pass: 0, slow: 0, timeout: 0, superseded: 0, totals: [], totalsIdx: 0 };
  // SUPERSEDED spans (flick-past, abandoned open) are counted separately
  // and never contribute to pass/slow/timeout tallies or p50/p95 totals —
  // otherwise abandoned events would inflate SLOW verdicts.
  if (verdict === 'SUPERSEDED') {
    stat.count += 1;
    stat.superseded = (stat.superseded ?? 0) + 1;
    scorecardBuckets.set(key, stat);
    return;
  }
  stat.count += 1;
  if (verdict === 'PASS') stat.pass += 1;
  else if (verdict === 'SLOW') stat.slow += 1;
  else if (verdict === 'TIMEOUT') stat.timeout += 1;
  stat.totalsIdx = ringPush(stat.totals, stat.totalsIdx, TOTALS_CAP, totalMs);
  scorecardBuckets.set(key, stat);
}



/** Tally a [DECIDE] outcome for the scorecard's counters. Call sites are
 *  incremental; unused buckets don't render. */
export function vperfDecideTally(bucket: string, key: string): void {
  if (!on()) return;
  let m = decideCounters.get(bucket);
  if (!m) { m = new Map(); decideCounters.set(bucket, m); }
  m.set(key, (m.get(key) ?? 0) + 1);
}

/** [PREDICT] PrefetchController tallies. `reason` is required for aborts. */
export function vperfPrefetchTally(evt: 'issued' | 'aborted', reason?: string): void {
  if (!on()) return;
  if (evt === 'issued') {
    prefetchStats.issued += 1;
  } else {
    const k = reason || 'unknown';
    prefetchStats.aborted.set(k, (prefetchStats.aborted.get(k) ?? 0) + 1);
  }
}


function pct(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return Math.round(sorted[i]);
}

/** Emit one multi-line [BASELINE] scorecard block. */
export function vperfScorecard(trigger: 'auto' | 'nav' | 'manual' = 'manual'): void {
  if (!consoleOn()) return; // PHASE-2: emission gated on pill; counters are always-on

  const lines: string[] = [];
  lines.push(`[BASELINE] trigger=${trigger} page=${__currentPage} @${Math.round(performance.now())}ms`);
  lines.push('  kind|page                              count  p50   p95  worst  PASS%');
  const keys = [...scorecardBuckets.keys()].sort();
  for (const k of keys) {
    const s = scorecardBuckets.get(k)!;
    const evaluated = Math.max(0, s.count - (s.superseded ?? 0));
    const passPct = evaluated > 0 ? Math.round((s.pass / evaluated) * 100) : 0;
    const worst = s.totals.reduce((m, v) => v > m ? v : m, 0);
    const supTag = (s.superseded ?? 0) > 0 ? ` SUP=${s.superseded}` : '';
    lines.push(
      `  ${k.padEnd(36)} ${String(s.count).padStart(5)} ${String(pct(s.totals, 0.5)).padStart(4)} ${String(pct(s.totals, 0.95)).padStart(5)} ${String(Math.round(worst)).padStart(6)}  ${String(passPct).padStart(3)}%  (SLOW=${s.slow} TO=${s.timeout}${supTag})`,
    );
  }

  const sh = sessionHealth;
  const stallRate = sh.totalDurationMs > 0 ? (sh.totalStallMs / sh.totalDurationMs) : 0;
  const dropRate = sh.totalFrames > 0 ? (sh.droppedFrames / sh.totalFrames) : 0;
  const avgLevelSw = sh.sessionCount > 0 ? (sh.levelSwitches / sh.sessionCount) : 0;
  lines.push(`  session-health: sessions=${sh.sessionCount} stalls=${sh.totalStalls} stallRate=${(stallRate*100).toFixed(2)}% dropRate=${(dropRate*100).toFixed(2)}% avgLevelSw=${avgLevelSw.toFixed(2)}`);
  for (const [page, r] of feedRollup) {
    const longPct = r.frames > 0 ? (r.longFrames / r.frames) * 100 : 0;
    lines.push(`  feed@${page}: scrolls=${r.scrolls} longFrames=${longPct.toFixed(1)}% worstFrame=${Math.round(r.worstMs)}ms activateWarm=${r.activateWarm} activateCold=${r.activateCold}`);
  }
  for (const [bucket, m] of decideCounters) {
    const parts: string[] = [];
    for (const [k, v] of m) parts.push(`${k}=${v}`);
    lines.push(`  decide.${bucket}: ${parts.join(' ')}`);
  }
  // [PREDICT] median startLevel per feed lane class.
  for (const [laneId, ring] of startLevelsByLane) {
    if (ring.arr.length === 0) continue;
    lines.push(`  startLevel.${laneId}: n=${ring.arr.length} p50=${pct(ring.arr, 0.5)} p95=${pct(ring.arr, 0.95)}`);
  }

  // [PREDICT] prefetch counters.
  const ps = prefetchStats;
  const hitRate = ps.activationsWithPrefetch > 0
    ? (ps.activationsWithPrefetchWarm / ps.activationsWithPrefetch)
    : 0;
  const abortParts: string[] = [];
  for (const [k, v] of ps.aborted) abortParts.push(`${k}=${v}`);
  lines.push(
    `  prefetch: issued=${ps.issued} aborted=${abortParts.join(' ') || '0'} activationsWithPrefetch=${ps.activationsWithPrefetch} warmHits=${ps.activationsWithPrefetchWarm} hitRate=${(hitRate*100).toFixed(1)}%`,
  );
  // [FLOW] card lifecycle + handover continuity rollup
  try { for (const l of __vperfFlowRollupLines()) lines.push(l); } catch {}
  // eslint-disable-next-line no-console
  console.info(lines.join('\n'));
}


function scorecardEmitOnNav(): void {
  if (!consoleOn()) return; // PHASE-2: console-only path
  vperfScorecard('nav');
}

// Auto-emit every 60s while the pill is on (installed once at module eval).
if (typeof window !== 'undefined') {
  setInterval(() => { try { if (consoleOn()) vperfScorecard('auto'); } catch {} }, 60_000);

  (window as any).vperfScorecard = vperfScorecard;
}

// ---------------- Feed scroll sampler ----------------

interface FeedScrollRec {
  page: string;
  t0: number;
  frames: number;
  longFrames: number;
  worstMs: number;
  lastFrameT: number;
  rafId: number;
  idleTimer: ReturnType<typeof setTimeout>;
}
const feedScroll = new Map<string, FeedScrollRec>();

/** Called on scroll events. Coalesces sampling into one span per scroll burst. */
export function vperfFeedScrollTick(key: string = 'default'): void {
  if (!on()) return;
  const now = performance.now();
  let rec = feedScroll.get(key);
  if (!rec) {
    rec = {
      page: __currentPage,
      t0: now,
      frames: 0,
      longFrames: 0,
      worstMs: 0,
      lastFrameT: now,
      rafId: 0,
      idleTimer: 0 as any,
    };
    const sample = () => {
      const t = performance.now();
      const dt = t - rec!.lastFrameT;
      rec!.lastFrameT = t;
      rec!.frames += 1;
      if (dt > rec!.worstMs) rec!.worstMs = dt;
      if (dt > 26) rec!.longFrames += 1;
      rec!.rafId = requestAnimationFrame(sample);
    };
    rec.rafId = requestAnimationFrame(sample);
    feedScroll.set(key, rec);
  }
  clearTimeout(rec.idleTimer);
  rec.idleTimer = setTimeout(() => {
    const r = feedScroll.get(key);
    if (!r) return;
    feedScroll.delete(key);
    cancelAnimationFrame(r.rafId);
    const durationMs = Math.round(performance.now() - r.t0);
    emit('feed.scroll', {
      page: r.page,
      durationMs,
      frames: r.frames,
      longFrames: r.longFrames,
      worstFrameMs: Math.round(r.worstMs),
      avgMs: r.frames > 0 ? Math.round(durationMs / r.frames) : 0,
      budgetMs: 0,
      verdict: r.frames > 0 && (r.longFrames / r.frames) <= 0.05 ? 'PASS' : 'SLOW',
    });
  }, 120);
}

// ---------------- Feed activate ----------------

const lastActivateAt = new Map<string, number>(); // per-page timestamp

export function vperfFeedActivateStart(page?: string): number {
  const t = performance.now();
  lastActivateAt.set(page ?? __currentPage, t);
  return t;
}

/** Age (ms) of the currently-active card since it became active on this page. */
export function vperfSinceActiveMs(page?: string): number | null {
  const t = lastActivateAt.get(page ?? __currentPage);
  return t == null ? null : Math.round(performance.now() - t);
}

export function vperfFeedActivateEnd(opts: {
  t0: number;
  idx: number;
  mediaType: 'image' | 'video';
  warm?: boolean;
  prefetched?: boolean;
  /** True when the incoming card was already playing (early-motion handover)
   *  at the moment it was promoted to playingIdx. See vperfMarkEarlyStarted. */
  earlyStarted?: boolean;
}): void {
  if (!on()) return;
  const totalMs = Math.round(performance.now() - opts.t0);
  const budget = opts.mediaType === 'image' ? 250 : (opts.warm ? 120 : 600);
  emit('feed.activate', {
    idx: opts.idx,
    mediaType: opts.mediaType,
    warm: !!opts.warm,
    prefetched: !!opts.prefetched,
    earlyStarted: !!opts.earlyStarted,
    dualActiveMs: __dualActiveMsTotal,
    totalMs,
    budgetMs: budget,
    verdict: totalMs <= budget ? 'PASS' : 'SLOW',
  });
}

// ---------------- Early-motion handover telemetry ----------------
//
// The feed's early-motion window plays the incoming card on the `feed-next`
// lane (already warm from preload) BEFORE it centers. On promotion the
// normal lane rotation runs untouched; earlyStarted below records whether
// the promoted card was already in motion at the handover moment.
//
// dualActiveMs accumulates the total time two feed lanes were playing
// simultaneously, so the decode cost is visible in every capture.

const __earlyStartedSet = new Set<string>(); // ownerKey → seen an early-start
let __dualActiveMsTotal = 0;

/** InlineVideo calls this the moment it plays feed-next for early motion. */
export function vperfMarkEarlyStarted(ownerKey: string | null | undefined): void {
  if (!ownerKey) return;
  __earlyStartedSet.add(ownerKey);
}

/** Feed calls this on promotion to read+clear the flag for one ownerKey. */
export function vperfConsumeEarlyStarted(ownerKey: string | null | undefined): boolean {
  if (!ownerKey) return false;
  const hit = __earlyStartedSet.has(ownerKey);
  if (hit) __earlyStartedSet.delete(ownerKey);
  return hit;
}

/** InlineVideo calls this on cleanup with the elapsed dual-active duration. */
export function vperfDualActiveAdd(ms: number): void {
  if (!isFinite(ms) || ms <= 0) return;
  __dualActiveMsTotal += Math.round(ms);
}


// ---------------- Image phase helper (Part 1) ----------------

/** Mark an image-specific phase on an fs.open span. Also updates the span's
 *  meta (upscaleFactor, cacheHit, etc.). Safe no-op if span isn't live. */
export function vperfImagePhase(
  spanId: string,
  phase: 'blurMount' | 'chromePaint' | 'fullResRequested' | 'fullResDecoded' | 'settled',
  meta?: Record<string, unknown>,
): void {
  if (!on()) return;
  vperfMark(spanId, phase);
  if (meta) vperfMeta(spanId, meta);
}


// ============================================================================
// [FLOW] card lifecycle + handover continuity telemetry
// ----------------------------------------------------------------------------
// Objective verdicts for the early-motion feed:
//   1. Card timeline — earlyStart → playing → promoted → released → summary,
//      each stamped with the tile's visible fraction at that instant. The
//      key answer number is fractionAtFirstMotion (IG ≤ 0.33 = moving before
//      one-third centred, LATE otherwise).
//   2. Handover continuity — at each promotion where the incoming tile was
//      running on `feed-next`, measure the gap between the feed-next unmount
//      and the feed-active first painted frame; sample poster opacity across
//      that gap (poster >0.1 = the eye saw the still); diff playhead position
//      across the swap. SEAMLESS / HICCUP / JUMP verdict per handover.
//
// All entry points strict no-op when DBG off. Zero behaviour changes.
// ============================================================================

function emitFlow(kind: string, payload: Record<string, unknown>): void {
  if (!consoleOn()) return; // PHASE-2: [FLOW] is console-only diagnostic
  const merged = { ...payload, page: (payload as any).page ?? __currentPage };
  // eslint-disable-next-line no-console
  console.info(`[FLOW] ${kind}`, merged);
}


/** Visible fraction of `el` inside the current viewport, 2dp, clamped 0..1. */
export function vperfCardFraction(el: HTMLElement | null | undefined): number {
  if (!el || typeof window === 'undefined') return 0;
  try {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    if (r.height <= 0) return 0;
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return Math.round((visible / r.height) * 100) / 100;
  } catch { return 0; }
}

interface CardRec {
  ownerKey: string;
  idx: number;
  postId: string | null;
  earlyStartT: number | null;
  playingT: number | null;
  fractionAtFirstMotion: number | null;
  promotedT: number | null;
  releasedT: number | null;
  playedMs: number;
  earlyStarted: boolean;
  released: boolean;
}
const __cardRecs = new Map<string, CardRec>();
// Scorecard rollup
const __cardStats = { activations: 0, ig: 0, fractions: [] as number[] };

function getCardRec(ownerKey: string, idx?: number, postId?: string | null): CardRec {
  let rec = __cardRecs.get(ownerKey);
  if (!rec) {
    rec = {
      ownerKey,
      idx: idx ?? -1,
      postId: postId ?? null,
      earlyStartT: null,
      playingT: null,
      fractionAtFirstMotion: null,
      promotedT: null,
      releasedT: null,
      playedMs: 0,
      earlyStarted: false,
      released: false,
    };
    __cardRecs.set(ownerKey, rec);
  } else {
    if (idx != null && idx >= 0) rec.idx = idx;
    if (postId != null) rec.postId = postId;
  }
  return rec;
}

export function vperfCardEarlyStart(
  ownerKey: string | null | undefined,
  opts: { idx: number; postId: string | null; fraction: number },
): void {
  if (!on() || !ownerKey) return;
  const rec = getCardRec(ownerKey, opts.idx, opts.postId);
  rec.earlyStartT = performance.now();
  rec.earlyStarted = true;
  emitFlow('card.earlyStart', {
    idx: rec.idx, postId: rec.postId, ownerKey, fraction: opts.fraction,
    t: Math.round(rec.earlyStartT),
  });
}

export function vperfCardFirstMotion(
  ownerKey: string | null | undefined,
  opts: { fraction: number; source?: 'feed-next' | 'feed-active' },
): void {
  if (!on() || !ownerKey) return;
  const rec = __cardRecs.get(ownerKey);
  if (!rec || rec.playingT != null) return; // idempotent
  rec.playingT = performance.now();
  rec.fractionAtFirstMotion = opts.fraction;
  emitFlow('card.playing', {
    idx: rec.idx, postId: rec.postId, ownerKey,
    fraction: opts.fraction, source: opts.source ?? null,
    t: Math.round(rec.playingT),
  });
}

export function vperfCardPromoted(
  ownerKey: string | null | undefined,
  opts: { idx: number; fraction: number },
): void {
  if (!on() || !ownerKey) return;
  const rec = getCardRec(ownerKey, opts.idx);
  if (rec.promotedT != null) return; // idempotent
  rec.promotedT = performance.now();
  emitFlow('card.promoted', {
    idx: rec.idx, postId: rec.postId, ownerKey, fraction: opts.fraction,
    t: Math.round(rec.promotedT),
  });
}

export function vperfCardReleased(
  ownerKey: string | null | undefined,
  opts: { fraction: number },
): void {
  if (!on() || !ownerKey) return;
  const rec = __cardRecs.get(ownerKey);
  if (!rec || rec.released) return;
  rec.released = true;
  rec.releasedT = performance.now();
  if (rec.promotedT != null) {
    rec.playedMs = Math.max(0, Math.round(rec.releasedT - rec.promotedT));
  }
  emitFlow('card.released', {
    idx: rec.idx, postId: rec.postId, ownerKey, fraction: opts.fraction,
    t: Math.round(rec.releasedT),
  });
  // Summary
  const fFM = rec.fractionAtFirstMotion;
  const verdict: 'IG' | 'LATE' = fFM != null && fFM <= 0.33 ? 'IG' : 'LATE';
  const motionLeadMs = (rec.earlyStartT != null && rec.promotedT != null)
    ? Math.max(0, Math.round(rec.promotedT - rec.earlyStartT)) : null;
  emitFlow('card.summary', {
    idx: rec.idx, postId: rec.postId, ownerKey,
    earlyStarted: rec.earlyStarted,
    fractionAtFirstMotion: fFM,
    motionLeadMs,
    playedMs: rec.playedMs,
    verdict,
  });
  // Scorecard
  if (rec.promotedT != null) {
    __cardStats.activations += 1;
    if (verdict === 'IG') __cardStats.ig += 1;
    if (fFM != null) {
      __cardStats.fractions.push(fFM);
      if (__cardStats.fractions.length > 500) __cardStats.fractions.shift();
    }
  }
  __cardRecs.delete(ownerKey);
}

// ---------------- Handover continuity probe ----------------

interface HandoverRec {
  ownerKey: string;
  idx: number;
  tUnmount: number;
  feedNextCT: number;
  posterEl: HTMLElement | null;
  maxPosterOpacity: number;
  rafId: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
  emitted: boolean;
}
const __handoverRecs = new Map<string, HandoverRec>();
const __handoverStats = {
  seamless: 0, hiccup: 0, jump: 0,
  gapMs: [] as number[], posJumpMs: [] as number[],
};

function readOpacity(el: HTMLElement | null): number {
  if (!el) return 0;
  try {
    const inline = parseFloat((el.style && el.style.opacity) || '');
    if (isFinite(inline)) return inline;
    const cs = getComputedStyle(el);
    const v = parseFloat(cs.opacity || '1');
    return isFinite(v) ? v : 1;
  } catch { return 1; }
}

export function vperfHandoverStart(
  ownerKey: string | null | undefined,
  opts: {
    idx: number;
    hostEl: HTMLElement | null;
    posterEl: HTMLElement | null;
    feedNextCurrentTime: number;
  },
): void {
  if (!on() || !ownerKey) return;
  // Replace any stale rec
  const stale = __handoverRecs.get(ownerKey);
  if (stale) {
    cancelAnimationFrame(stale.rafId);
    if (stale.timeoutId) clearTimeout(stale.timeoutId);
    __handoverRecs.delete(ownerKey);
  }
  const rec: HandoverRec = {
    ownerKey,
    idx: opts.idx,
    tUnmount: performance.now(),
    feedNextCT: Math.max(0, opts.feedNextCurrentTime || 0),
    posterEl: opts.posterEl,
    maxPosterOpacity: readOpacity(opts.posterEl),
    rafId: 0,
    timeoutId: null,
    emitted: false,
  };
  const tick = () => {
    const r = __handoverRecs.get(ownerKey);
    if (!r || r.emitted) return;
    r.maxPosterOpacity = Math.max(r.maxPosterOpacity, readOpacity(r.posterEl));
    r.rafId = requestAnimationFrame(tick);
  };
  rec.rafId = requestAnimationFrame(tick);
  // Failsafe: force-emit at 500ms even if the frame callback never lands
  rec.timeoutId = setTimeout(() => {
    vperfHandoverFrame(ownerKey, { feedActiveCurrentTime: NaN, timedOut: true });
  }, 500);
  __handoverRecs.set(ownerKey, rec);
}

export function vperfHandoverFrame(
  ownerKey: string | null | undefined,
  opts: { feedActiveCurrentTime: number; timedOut?: boolean },
): void {
  if (!on() || !ownerKey) return;
  const rec = __handoverRecs.get(ownerKey);
  if (!rec || rec.emitted) return;
  rec.emitted = true;
  cancelAnimationFrame(rec.rafId);
  if (rec.timeoutId) clearTimeout(rec.timeoutId);
  const tFrames = performance.now();
  const gapMs = Math.max(0, Math.round(tFrames - rec.tUnmount));
  const posterExposed = rec.maxPosterOpacity > 0.1;
  const feedActiveCT = isFinite(opts.feedActiveCurrentTime) ? opts.feedActiveCurrentTime : rec.feedNextCT;
  const posJumpMs = Math.round(Math.abs(feedActiveCT - rec.feedNextCT) * 1000);
  let verdict: 'SEAMLESS' | 'HICCUP' | 'JUMP';
  if (opts.timedOut || gapMs > 32 || posterExposed) verdict = 'HICCUP';
  else if (posJumpMs > 120) verdict = 'JUMP';
  else verdict = 'SEAMLESS';
  emitFlow('handover', {
    idx: rec.idx, ownerKey,
    gapMs, posterExposed, posJumpMs,
    timedOut: !!opts.timedOut,
    verdict,
  });
  if (verdict === 'SEAMLESS') __handoverStats.seamless += 1;
  else if (verdict === 'JUMP') __handoverStats.jump += 1;
  else __handoverStats.hiccup += 1;
  __handoverStats.gapMs.push(gapMs);
  __handoverStats.posJumpMs.push(posJumpMs);
  if (__handoverStats.gapMs.length > 500) __handoverStats.gapMs.shift();
  if (__handoverStats.posJumpMs.length > 500) __handoverStats.posJumpMs.shift();
  __handoverRecs.delete(ownerKey);
}

// Expose small rollup for the scorecard renderer.
export function __vperfFlowRollupLines(): string[] {
  const lines: string[] = [];
  const cs = __cardStats;
  if (cs.activations > 0) {
    const igPct = Math.round((cs.ig / cs.activations) * 100);
    lines.push(
      `  flow.cards: activations=${cs.activations} IG=${igPct}% medianFractionAtFirstMotion=${(pct(cs.fractions.map(f => Math.round(f * 100)), 0.5) / 100).toFixed(2)}`,
    );
  }
  const hs = __handoverStats;
  const hsTotal = hs.seamless + hs.hiccup + hs.jump;
  if (hsTotal > 0) {
    lines.push(
      `  flow.handover: n=${hsTotal} SEAMLESS=${hs.seamless} HICCUP=${hs.hiccup} JUMP=${hs.jump} p95gapMs=${pct(hs.gapMs, 0.95)} p95posJumpMs=${pct(hs.posJumpMs, 0.95)}`,
    );
  }
  return lines;
}


// ============================================================================
// PHASE-2 TELEMETRY EXPORTS
// Internal-only helpers consumed by src/perf/telemetry.ts to ship silent
// aggregates to Supabase. Do NOT call from feature code.
// snapshot() returns a plain-JSON view of every counter; reset() zeros the
// stores so rows are deltas across flushes.
// ============================================================================

export interface VperfBucketSnapshot {
  key: string;      // `${kind}|${page}`
  count: number;
  pass: number;
  slow: number;
  timeout: number;
  superseded: number;
  totals: number[]; // copy — safe to serialise
}

export interface VperfSnapshot {
  buckets: VperfBucketSnapshot[];
  sessionHealth: typeof sessionHealth;
  prefetchStats: {
    issued: number;
    aborted: Record<string, number>;
    activationsWithPrefetch: number;
    activationsWithPrefetchWarm: number;
  };
  feedRollup: Array<{ page: string } & { scrolls: number; longFrames: number; frames: number; worstMs: number; activateWarm: number; activateCold: number }>;
  startLevelsByLane: Array<{ laneId: string; totals: number[] }>;
  decideCounters: Array<{ bucket: string; counts: Record<string, number> }>;
}

export function __vperfSnapshotTelemetry(): VperfSnapshot {
  const buckets: VperfBucketSnapshot[] = [];
  for (const [key, s] of scorecardBuckets) {
    buckets.push({
      key,
      count: s.count,
      pass: s.pass,
      slow: s.slow,
      timeout: s.timeout,
      superseded: s.superseded ?? 0,
      totals: s.totals.slice(),
    });
  }
  const aborted: Record<string, number> = {};
  for (const [k, v] of prefetchStats.aborted) aborted[k] = v;
  const feedRollupOut = [] as VperfSnapshot['feedRollup'];
  for (const [page, r] of feedRollup) feedRollupOut.push({ page, ...r });
  const startLevelsOut = [] as VperfSnapshot['startLevelsByLane'];
  for (const [laneId, ring] of startLevelsByLane) startLevelsOut.push({ laneId, totals: ring.arr.slice() });
  const decideOut = [] as VperfSnapshot['decideCounters'];
  for (const [bucket, m] of decideCounters) {
    const counts: Record<string, number> = {};
    for (const [k, v] of m) counts[k] = v;
    decideOut.push({ bucket, counts });
  }
  return {
    buckets,
    sessionHealth: { ...sessionHealth },
    prefetchStats: {
      issued: prefetchStats.issued,
      aborted,
      activationsWithPrefetch: prefetchStats.activationsWithPrefetch,
      activationsWithPrefetchWarm: prefetchStats.activationsWithPrefetchWarm,
    },
    feedRollup: feedRollupOut,
    startLevelsByLane: startLevelsOut,
    decideCounters: decideOut,
  };
}

export function __vperfResetTelemetry(): void {
  scorecardBuckets.clear();
  sessionHealth.sessionCount = 0;
  sessionHealth.totalStalls = 0;
  sessionHealth.totalDurationMs = 0;
  sessionHealth.totalStallMs = 0;
  sessionHealth.levelSwitches = 0;
  sessionHealth.totalFrames = 0;
  sessionHealth.droppedFrames = 0;
  prefetchStats.issued = 0;
  prefetchStats.aborted.clear();
  prefetchStats.activationsWithPrefetch = 0;
  prefetchStats.activationsWithPrefetchWarm = 0;
  feedRollup.clear();
  startLevelsByLane.clear();
  decideCounters.clear();
}

/** Approx row count the next flush would produce — used for the >40 row
 * early-flush threshold in the shipper. */
export function __vperfApproxRowCount(): number {
  return scorecardBuckets.size
    + 1 /* session */
    + 1 /* prefetch */
    + feedRollup.size
    + startLevelsByLane.size
    + decideCounters.size;
}
