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
import { writeBandwidthSample } from '@/video/bandwidthMemory';


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
  const merged = { ...payload, page: (payload as any).page ?? __currentPage };
  try { scorecardIngest(kind, merged); } catch {}
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
  totals: number[]; // durations for p50/p95/worst
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
const startLevelsByLane = new Map<string, number[]>(); // laneId → startLevels
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
  }

  if (!isFinite(totalMs) || totalMs < 0) return;
  const key = bucketKey(kind, page);
  const stat = scorecardBuckets.get(key) ?? { count: 0, pass: 0, slow: 0, timeout: 0, totals: [] };
  stat.count += 1;
  if (verdict === 'PASS') stat.pass += 1;
  else if (verdict === 'SLOW') stat.slow += 1;
  else if (verdict === 'TIMEOUT') stat.timeout += 1;
  stat.totals.push(totalMs);
  if (stat.totals.length > 500) stat.totals.shift();
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

function pct(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return Math.round(sorted[i]);
}

/** Emit one multi-line [BASELINE] scorecard block. */
export function vperfScorecard(trigger: 'auto' | 'nav' | 'manual' = 'manual'): void {
  if (!on()) return;
  const lines: string[] = [];
  lines.push(`[BASELINE] trigger=${trigger} page=${__currentPage} @${Math.round(performance.now())}ms`);
  lines.push('  kind|page                              count  p50   p95  worst  PASS%');
  const keys = [...scorecardBuckets.keys()].sort();
  for (const k of keys) {
    const s = scorecardBuckets.get(k)!;
    const passPct = s.count > 0 ? Math.round((s.pass / s.count) * 100) : 0;
    const worst = s.totals.reduce((m, v) => v > m ? v : m, 0);
    lines.push(
      `  ${k.padEnd(36)} ${String(s.count).padStart(5)} ${String(pct(s.totals, 0.5)).padStart(4)} ${String(pct(s.totals, 0.95)).padStart(5)} ${String(Math.round(worst)).padStart(6)}  ${String(passPct).padStart(3)}%  (SLOW=${s.slow} TO=${s.timeout})`,
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
  // eslint-disable-next-line no-console
  console.info(lines.join('\n'));
}

function scorecardEmitOnNav(): void {
  if (!on()) return;
  vperfScorecard('nav');
}

// Auto-emit every 60s while enabled (installed once at module eval).
if (typeof window !== 'undefined') {
  setInterval(() => { try { if (on()) vperfScorecard('auto'); } catch {} }, 60_000);
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
}): void {
  if (!on()) return;
  const totalMs = Math.round(performance.now() - opts.t0);
  const budget = opts.mediaType === 'image' ? 250 : (opts.warm ? 120 : 600);
  emit('feed.activate', {
    idx: opts.idx,
    mediaType: opts.mediaType,
    warm: !!opts.warm,
    totalMs,
    budgetMs: budget,
    verdict: totalMs <= budget ? 'PASS' : 'SLOW',
  });
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

