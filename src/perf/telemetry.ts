// ============================================================================
// Silent video-perf telemetry shipper (Phase 2).
//
// Reads aggregate-only counters from vperf.ts and posts small rollup batches
// to Supabase. NO raw [TRACE]/[VPERF]/[FLOW] lines ever leave the device.
// Console emission remains gated by isPerfEnabled(); this module is separate.
//
// Sampling: 10% of sessions, sticky per browser session (sessionStorage).
//   - Pill-on sessions ENROL regardless and are tagged is_debug=true so Ben's
//     debug runs can be filtered out of production charts.
// Flush points: visibilitychange→hidden (primary), pagehide (belt), 120s
//   interval while visible, and an early flush when the approximate row count
//   crosses 40. Every flush is snapshot-then-clear so rows are deltas.
// Transport: keepalive fetch to PostgREST (primary), navigator.sendBeacon
//   fallback. On both failing, drop the batch (never block teardown, never
//   retry-loop).
// Privacy: no user_id, no post/media ids, no URLs. session_id is per-boot
//   random; device_class is a coarse UA bucket.
// ============================================================================

import { isPerfEnabled, subscribePerfLive } from '@/perf/navTiming';
import {
  __vperfSnapshotTelemetry,
  __vperfResetTelemetry,
  __vperfApproxRowCount,
  type VperfSnapshot,
} from '@/perf/vperf';

const SAMPLE_RATE = 0.10;
const SESSION_KEY = 'clb_vperf_telemetry_session';
const FLUSH_INTERVAL_MS = 120_000;
const FLUSH_ROW_THRESHOLD = 40;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

let __installed = false;
let __sessionId: string | null = null;
let __enrolled = false;

function pct(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return Math.round(sorted[i]);
}
function worstOf(arr: number[]): number {
  let m = 0;
  for (const v of arr) if (v > m) m = v;
  return Math.round(m);
}
function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
  } catch {}
  return 'sxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function detectDeviceClass(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isWebView =
    (isIos && !/Safari/.test(ua)) ||
    (isAndroid && /; wv\)/.test(ua)) ||
    // Median UA fingerprint (best-effort — falls through to safari/other)
    /Median/i.test(ua);
  if (isIos) return isWebView ? 'ios-webview' : 'ios-safari';
  if (isAndroid) return isWebView ? 'android-webview' : 'android-browser';
  return 'desktop';
}

function readBuildStamp(): string {
  const w = typeof window !== 'undefined' ? (window as any) : {};
  return String(
    w.__BUILD_STAMP__ ??
    (import.meta.env.VITE_APP_BUILD as string | undefined) ??
    'unknown',
  );
}

function enrolSession(): void {
  if (__sessionId) return;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      __sessionId = String(p.sessionId);
      __enrolled = Boolean(p.enrolled);
      return;
    }
  } catch {}
  __sessionId = uuid();
  __enrolled = Math.random() < SAMPLE_RATE;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      sessionId: __sessionId,
      enrolled: __enrolled,
    }));
  } catch {}
}

interface RollupRow {
  session_id: string;
  flushed_at: string;
  app_build: string;
  device_class: string;
  is_debug: boolean;
  row_kind: 'bucket' | 'session' | 'prefetch' | 'feed' | 'startlevel' | 'decide';
  kind?: string | null;
  page?: string | null;
  count?: number | null;
  p50?: number | null;
  p95?: number | null;
  worst?: number | null;
  pass?: number | null;
  slow?: number | null;
  timeout?: number | null;
  superseded?: number | null;
  extra?: Record<string, unknown> | null;
}

function buildRows(snap: VperfSnapshot): RollupRow[] {
  const rows: RollupRow[] = [];
  const base = {
    session_id: __sessionId!,
    flushed_at: new Date().toISOString(),
    app_build: readBuildStamp(),
    device_class: detectDeviceClass(),
    is_debug: isPerfEnabledSafe(),
  };

  for (const b of snap.buckets) {
    const [kind, page] = b.key.split('|');
    rows.push({
      ...base,
      row_kind: 'bucket',
      kind,
      page,
      count: b.count,
      p50: pct(b.totals, 0.5),
      p95: pct(b.totals, 0.95),
      worst: worstOf(b.totals),
      pass: b.pass,
      slow: b.slow,
      timeout: b.timeout,
      superseded: b.superseded,
    });
  }

  if (snap.sessionHealth.sessionCount > 0) {
    rows.push({ ...base, row_kind: 'session', extra: snap.sessionHealth });
  }
  if (
    snap.prefetchStats.issued > 0 ||
    snap.prefetchStats.activationsWithPrefetch > 0 ||
    Object.keys(snap.prefetchStats.aborted).length > 0
  ) {
    rows.push({ ...base, row_kind: 'prefetch', extra: snap.prefetchStats });
  }
  for (const f of snap.feedRollup) {
    rows.push({
      ...base,
      row_kind: 'feed',
      page: f.page,
      count: f.scrolls,
      extra: {
        longFrames: f.longFrames,
        frames: f.frames,
        worstMs: f.worstMs,
        activateWarm: f.activateWarm,
        activateCold: f.activateCold,
      },
    });
  }
  for (const s of snap.startLevelsByLane) {
    if (s.totals.length === 0) continue;
    rows.push({
      ...base,
      row_kind: 'startlevel',
      kind: s.laneId,
      count: s.totals.length,
      p50: pct(s.totals, 0.5),
      p95: pct(s.totals, 0.95),
    });
  }
  for (const d of snap.decideCounters) {
    rows.push({
      ...base,
      row_kind: 'decide',
      kind: d.bucket,
      extra: d.counts,
    });
  }
  return rows;
}

function isPerfEnabledSafe(): boolean {
  try { return isPerfEnabled(); } catch { return false; }
}

function endpoint(): string | null {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  return `${SUPABASE_URL}/rest/v1/video_perf_rollups`;
}

async function postRows(rows: RollupRow[]): Promise<boolean> {
  const url = endpoint();
  if (!url || rows.length === 0) return false;
  const body = JSON.stringify(rows);
  // Primary: keepalive fetch — supports custom headers (needed for anon key).
  try {
    const res = await fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON!,
        'Authorization': `Bearer ${SUPABASE_ANON!}`,
        'Prefer': 'return=minimal',
      },
      body,
    });
    if (res.ok) return true;
  } catch {}
  // Fallback: sendBeacon — no custom headers, so append the anon key as a
  // query string. PostgREST accepts `apikey` from either header or query.
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const beaconUrl = `${url}?apikey=${encodeURIComponent(SUPABASE_ANON!)}`;
      if (navigator.sendBeacon(beaconUrl, blob)) return true;
    }
  } catch {}
  return false;
}

async function flush(): Promise<void> {
  if (!__enrolled) return;
  const snap = __vperfSnapshotTelemetry();
  const rows = buildRows(snap);
  if (rows.length === 0) return;
  // Snapshot-then-clear semantics: reset BEFORE the network attempt so a
  // failure drops the batch cleanly (never accumulates + retries indefinitely).
  __vperfResetTelemetry();
  await postRows(rows);
}

function maybeThresholdFlush(): void {
  if (!__enrolled) return;
  if (__vperfApproxRowCount() >= FLUSH_ROW_THRESHOLD) {
    void flush();
  }
}

export function installVideoPerfTelemetry(): void {
  if (__installed) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  __installed = true;
  enrolSession();
  if (!__enrolled) return; // non-enrolled sessions do zero work beyond the coin-flip
  if (!endpoint()) return; // no supabase env → nothing to do

  const onHidden = () => {
    if (document.visibilityState === 'hidden') void flush();
  };
  document.addEventListener('visibilitychange', onHidden);
  window.addEventListener('pagehide', () => { void flush(); });
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      maybeThresholdFlush();
    }
  }, FLUSH_INTERVAL_MS);
}

// Test/debug hook (not part of any UI).
export function __flushVideoPerfTelemetryForTest(): Promise<void> { return flush(); }
