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

const SPAN_TTL_MS = 15_000;

type Verdict = 'PASS' | 'SLOW' | 'TIMEOUT';

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
  timer: ReturnType<typeof setTimeout>;
}

const spans = new Map<string, SpanRec>();
const laneArms = new Map<string, LaneArm[]>();
const sessions = new Map<string, SessionRec>();

// Default budgets by kind (ms). Callers may override via vperfStart meta.budgetMs.
// fs.close bumped 250→450 to accommodate the symmetric reverse-shrink close
// motion (300ms wrapper transition + returnBorrow/handback + overlay fade).
// Pre-motion the instant snap-handoff fit under 250; the animated mirror does not.
const DEFAULT_BUDGETS: Record<string, number> = {
  'fs.open.borrow': 150,
  'fs.open.lane': 500,
  'fs.close': 450,
  'autoplay.warm': 120,
  'autoplay.cold': 600,
  'swipe.vertical': 450,
  'swipe.pager': 450,
  seek: 300,
  'loop.gap': 120,
};

function on(): boolean {
  try {
    return isPerfEnabled();
  } catch {
    return false;
  }
}

function budgetFor(kind: string, metaBudget: number | undefined): number {
  if (typeof metaBudget === 'number' && isFinite(metaBudget) && metaBudget > 0) {
    return metaBudget;
  }
  return DEFAULT_BUDGETS[kind] ?? 500;
}

function emit(kind: string, payload: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.info(`[VPERF] ${kind}`, payload);
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
  finish(rec, 'PASS', extraMeta);
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
      const { el, startLevel, bwEstimate, ...rest } = meta;
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
  _bwEstimate?: number | null,
): void {
  if (!on()) return;
  const rec = sessions.get(laneId);
  if (!rec) return;
  rec.levelSwitches += 1;
  rec.endLevel = level;
  if (rec.startLevel == null) rec.startLevel = level;
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
    verdict,
    longStall,
    reason,
    ...rec.meta,
  });
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

// ------------------------ Convenience helpers ------------------------

let __seq = 0;
export function vperfNextId(prefix: string): string {
  __seq = (__seq + 1) | 0;
  return `${prefix}#${__seq}`;
}
