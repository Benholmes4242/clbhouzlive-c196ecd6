/**
 * [FEEDPLAY] Feed-playback latency instrumentation.
 *
 * Measures the timeline from "card enters viewport" to "first painted frame"
 * across 8 marks per video post. Gap-since-previous-mark for each card lets
 * us pinpoint WHERE the stall is (activation? load? manifest? buffer? play?).
 *
 * All logs are console.info, gated on isPerfEnabled() (the DBG pill), and
 * tagged [FEEDPLAY]. No behaviour change — measurement only.
 */

import { isPerfEnabled } from '@/perf/navTiming';

interface Rec {
  visible?: number;
  active?: number;
  playingIdx?: number;
  laneLoad?: number;
  manifest?: number;
  canplay?: number;
  playCall?: number;
  firstFrame?: number;
}

const marks = new Map<string, Rec>();

const totals: number[] = [];
const gaps: Record<string, number[]> = {
  'VISIBLE->ACTIVE': [],
  'ACTIVE->PLAYING_IDX': [],
  'PLAYING_IDX->LANE_LOAD': [],
  'LANE_LOAD->HLS_MANIFEST': [],
  'HLS_MANIFEST->CANPLAY': [],
  'CANPLAY->PLAY_CALL': [],
  'PLAY_CALL->FIRSTFRAME': [],
};

let netLogged = false;

function on(): boolean {
  try {
    return isPerfEnabled();
  } catch {
    return false;
  }
}

function now(): number {
  return performance.now();
}

function log(tag: string, data: Record<string, unknown>): void {
  if (!on()) return;
  // eslint-disable-next-line no-console
  console.info(`[FEEDPLAY] ${tag}`, data);
}

function logNetOnce(): void {
  if (netLogged) return;
  netLogged = true;
  if (!on()) return;
  const c: any = (typeof navigator !== 'undefined' && (navigator as any).connection) || null;
  // eslint-disable-next-line no-console
  console.info('[FEEDPLAY] net', {
    effectiveType: c?.effectiveType ?? 'unknown',
    downlink: c?.downlink ?? null,
    saveData: c?.saveData ?? null,
  });
}

function get(postId: string): Rec {
  let rec = marks.get(postId);
  if (!rec) {
    rec = {};
    marks.set(postId, rec);
  }
  return rec;
}

function pct(arr: number[], p: number): number {
  if (!arr.length) return -1;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor((p / 100) * s.length));
  return s[i];
}

function flushSummary(): void {
  if (!on()) return;
  const n = totals.length;
  if (n === 0) return;
  const p50 = pct(totals, 50);
  const p95 = pct(totals, 95);
  const max = Math.max(...totals);
  let worstKey = '';
  let worstP50 = -1;
  for (const [k, arr] of Object.entries(gaps)) {
    const p = pct(arr, 50);
    if (p > worstP50) {
      worstP50 = p;
      worstKey = k;
    }
  }
  // eslint-disable-next-line no-console
  console.info(
    `[FEEDPLAY] SUMMARY n=${n} dt_total p50=${p50} p95=${p95} max=${max} | worst gap: ${worstKey} p50=${worstP50}`,
  );
}

export const fp = {
  visible(postId: string | null | undefined, ratio: number): void {
    if (!postId) return;
    logNetOnce();
    const rec = get(postId);
    if (rec.visible != null) return;
    rec.visible = now();
    log('FP_VISIBLE', { postId, ratio: +ratio.toFixed(2) });
  },
  active(postId: string | null | undefined): void {
    if (!postId) return;
    const rec = get(postId);
    if (rec.active != null || rec.visible == null) return;
    rec.active = now();
    const dt = Math.round(rec.active - rec.visible);
    gaps['VISIBLE->ACTIVE'].push(dt);
    log('FP_ACTIVE', { postId, dt_visible: dt });
  },
  playingIdx(postId: string | null | undefined): void {
    if (!postId) return;
    const rec = get(postId);
    if (rec.playingIdx != null || rec.active == null) return;
    rec.playingIdx = now();
    const dt = Math.round(rec.playingIdx - rec.active);
    gaps['ACTIVE->PLAYING_IDX'].push(dt);
    log('FP_PLAYING_IDX', { postId, dt_active: dt });
  },
  laneLoad(
    postId: string | null | undefined,
    opts: { preloaded: boolean; startPositionSet: boolean },
  ): void {
    if (!postId) return;
    const rec = get(postId);
    if (rec.laneLoad != null) return;
    rec.laneLoad = now();
    const dt = rec.playingIdx != null ? Math.round(rec.laneLoad - rec.playingIdx) : -1;
    if (dt >= 0) gaps['PLAYING_IDX->LANE_LOAD'].push(dt);
    log('FP_LANE_LOAD', {
      postId,
      dt_playidx: dt,
      preloaded: opts.preloaded,
      startPositionSet: opts.startPositionSet,
    });
  },
  hlsManifest(postId: string | null | undefined): void {
    if (!postId) return;
    const rec = get(postId);
    if (rec.manifest != null || rec.laneLoad == null) return;
    rec.manifest = now();
    const dt = Math.round(rec.manifest - rec.laneLoad);
    gaps['LANE_LOAD->HLS_MANIFEST'].push(dt);
    log('FP_HLS_MANIFEST', { postId, dt_load: dt });
  },
  canplay(postId: string | null | undefined): void {
    if (!postId) return;
    const rec = get(postId);
    if (rec.canplay != null || rec.manifest == null) return;
    rec.canplay = now();
    const dt = Math.round(rec.canplay - rec.manifest);
    gaps['HLS_MANIFEST->CANPLAY'].push(dt);
    log('FP_CANPLAY', { postId, dt_manifest: dt });
  },
  playCall(postId: string | null | undefined): void {
    if (!postId) return;
    const rec = get(postId);
    if (rec.playCall != null) return;
    rec.playCall = now();
    const dt = rec.canplay != null ? Math.round(rec.playCall - rec.canplay) : -1;
    if (dt >= 0) gaps['CANPLAY->PLAY_CALL'].push(dt);
    log('FP_PLAY_CALL', { postId, dt_canplay: dt });
  },
  firstFrame(postId: string | null | undefined): void {
    if (!postId) return;
    const rec = get(postId);
    if (rec.firstFrame != null || rec.visible == null) return;
    rec.firstFrame = now();
    const dt_playcall = rec.playCall != null ? Math.round(rec.firstFrame - rec.playCall) : -1;
    const dt_total = Math.round(rec.firstFrame - rec.visible);
    if (dt_playcall >= 0) gaps['PLAY_CALL->FIRSTFRAME'].push(dt_playcall);
    totals.push(dt_total);
    log('FP_FIRSTFRAME', { postId, dt_playcall, dt_total_from_visible: dt_total });
    if (totals.length % 10 === 0) flushSummary();
  },
  /** Called when a post scrolls out of the near-window; lets subsequent
   *  re-entries measure a fresh timeline for the same card. */
  reset(postId: string | null | undefined): void {
    if (!postId) return;
    marks.delete(postId);
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSummary);
}
