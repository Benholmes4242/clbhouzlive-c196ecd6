/**
 * Feed telemetry — compact, greppable, LogHud-friendly.
 *
 * Emits ONE formatted string per event via console.info (never console.table,
 * never bare object args), because the device LogHud → COPY path drops both.
 *
 * Flag-gated: only active when localStorage.FEED_TELEMETRY === '1'.
 *
 * Line shapes (all prefixed with [FEEDTEL]):
 *   [FEEDTEL] swipe        i=12 kind=vid t=1737054321987
 *   [FEEDTEL] visible      i=12 dt_swipe_visible=48ms
 *   [FEEDTEL] poster       i=12 dt_swipe_poster=112ms
 *   [FEEDTEL] firstframe   i=12 dt_swipe_ff=214ms poolHit=1 cached=0
 *   [FEEDTEL] tab          from=for-you to=friends t=...
 *   [FEEDTEL] ptr          t=...
 *   [FEEDTEL] summary      n=42 poolHitRate=0.71 cachedRate=0.55 |
 *                          poster p50=98 p95=310 max=812 |
 *                          firstframe p50=190 p95=640 max=1420
 */

import { isPerfEnabled } from '@/perf/navTiming';

const FLAG_KEY = 'FEED_TELEMETRY';
const AUTO_FLUSH_EVERY = 20;

function on(): boolean {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(FLAG_KEY) === '1') return true;
  } catch {}
  try {
    return isPerfEnabled();
  } catch {
    return false;
  }
}

function now(): number {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

interface CardStamps {
  swipe?: number;
  visible?: number;
  poster?: number;
  firstFrame?: number;
  poolHit?: boolean;
  cached?: boolean;
}

const stamps = new Map<number, CardStamps>();
const posterDeltas: number[] = [];
const firstFrameDeltas: number[] = [];
let poolHits = 0;
let poolTotal = 0;
let cachedHits = 0;
let cachedTotal = 0;

function get(i: number): CardStamps {
  let s = stamps.get(i);
  if (!s) { s = {}; stamps.set(i, s); }
  return s;
}

function fmt(n: number): string {
  return Math.round(n).toString();
}

export function markSwipe(index: number, kind: 'img' | 'vid' | 'mix' | '?'): void {
  if (!on()) return;
  const t = now();
  const s = get(index);
  // Reset per-card stamps on every swipe-in so we always measure the fresh cycle.
  s.swipe = t;
  s.visible = undefined;
  s.poster = undefined;
  s.firstFrame = undefined;
  s.poolHit = undefined;
  s.cached = undefined;
  console.info(`[FEEDTEL] swipe        i=${index} kind=${kind} t=${fmt(t)}`);
}

export function markVisible(index: number): void {
  if (!on()) return;
  const s = get(index);
  if (s.visible != null) return; // first visible only, per swipe cycle
  const t = now();
  s.visible = t;
  const dt = s.swipe != null ? t - s.swipe : -1;
  console.info(`[FEEDTEL] visible      i=${index} dt_swipe_visible=${dt >= 0 ? fmt(dt) + 'ms' : 'n/a'}`);
}

export function markPoster(index: number): void {
  if (!on()) return;
  const s = get(index);
  if (s.poster != null) return;
  const t = now();
  s.poster = t;
  const dt = s.swipe != null ? t - s.swipe : -1;
  if (dt >= 0) posterDeltas.push(dt);
  console.info(`[FEEDTEL] poster       i=${index} dt_swipe_poster=${dt >= 0 ? fmt(dt) + 'ms' : 'n/a'}`);
}

export function markFirstFrame(
  index: number,
  meta: { poolHit: boolean; cached: boolean },
): void {
  if (!on()) return;
  const s = get(index);
  if (s.firstFrame != null) return;
  const t = now();
  s.firstFrame = t;
  s.poolHit = meta.poolHit;
  s.cached = meta.cached;
  const dt = s.swipe != null ? t - s.swipe : -1;
  if (dt >= 0) firstFrameDeltas.push(dt);
  poolTotal += 1;
  if (meta.poolHit) poolHits += 1;
  cachedTotal += 1;
  if (meta.cached) cachedHits += 1;
  console.info(
    `[FEEDTEL] firstframe   i=${index} dt_swipe_ff=${dt >= 0 ? fmt(dt) + 'ms' : 'n/a'} poolHit=${meta.poolHit ? 1 : 0} cached=${meta.cached ? 1 : 0}`,
  );
}

export function markTabSwitch(from: string, to: string): void {
  if (!on()) return;
  console.info(`[FEEDTEL] tab          from=${from} to=${to} t=${fmt(now())}`);
}

export function markPTR(): void {
  if (!on()) return;
  console.info(`[FEEDTEL] ptr          t=${fmt(now())}`);
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/** Emit one compact summary line covering every card seen since last flush. */
export function flushSummary(): void {
  if (!on()) return;
  const n = Math.max(posterDeltas.length, firstFrameDeltas.length);
  const psorted = [...posterDeltas].sort((a, b) => a - b);
  const fsorted = [...firstFrameDeltas].sort((a, b) => a - b);
  const poolRate = poolTotal ? poolHits / poolTotal : 0;
  const cachedRate = cachedTotal ? cachedHits / cachedTotal : 0;
  console.info(
    `[FEEDTEL] summary      n=${n} poolHitRate=${poolRate.toFixed(2)} cachedRate=${cachedRate.toFixed(2)} | ` +
      `poster p50=${fmt(pct(psorted, 50))} p95=${fmt(pct(psorted, 95))} max=${fmt(psorted[psorted.length - 1] ?? 0)} | ` +
      `firstframe p50=${fmt(pct(fsorted, 50))} p95=${fmt(pct(fsorted, 95))} max=${fmt(fsorted[fsorted.length - 1] ?? 0)}`,
  );
}

// Expose a manual flush hook for the device COPY path.
if (typeof window !== 'undefined') {
  (window as unknown as { __feedTelFlush?: () => void }).__feedTelFlush = flushSummary;
}
