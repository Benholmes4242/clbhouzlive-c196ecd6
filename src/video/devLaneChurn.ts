/**
 * devLaneChurn — dev-only synthetic lane-churn harness.
 *
 * Purpose: prove `VideoEngine.preload()`'s active-lane identity guard keeps
 * the currently-playing feed-active binding intact when neighbour warms hammer
 * the 3-lane pool. This is the evidence gate we must pass BEFORE turning on
 * the horizontal carousel neighbour warm.
 *
 * Usage (from a feed page with a video actively playing):
 *   window.__lovable_laneChurn.run({ cycles: 100, intervalMs: 20 })
 *
 * The harness:
 *   • Snapshots the current feed-active ownerKey.
 *   • Per cycle: fires 4 synthetic preload() calls (feed-active, feed-next,
 *     feed-prev, random) with fake ownerKeys — each passes the real active
 *     key as expectedActiveOwnerKey.
 *   • After intervalMs, samples active.health via findLaneForOwner.
 *   • Prints a PASS/FAIL summary + a CSV block of per-cycle health rows.
 *
 * Pass criteria:
 *   • 0 cycles where the active ownerKey lost its lane binding.
 *   • 0 cycles where firstFrame regressed true→false.
 *   • preload.rejected count >= cycles (guard actually fired at least once per cycle).
 */

import { VideoEngine } from './VideoEngine';
import { feedLaneRoles } from './feedLaneRoles';
import type { LaneId } from './lanePolicy';

type HealthRow = {
  cycle: number;
  activeOwner: string;
  laneId: LaneId | null;
  firstFrame: boolean;
  playing: boolean;
  readyState: number;
  bindingLost: boolean;
  firstFrameRegressed: boolean;
};

const FEED_LANES: LaneId[] = ['feed-active', 'feed-next', 'feed-prev'];

function findLaneForOwner(owner: string): { laneId: LaneId; snap: ReturnType<typeof VideoEngine.snapshot> } | null {
  for (const lid of FEED_LANES) {
    try {
      const s = VideoEngine.snapshot(lid);
      if (s.postId === owner) return { laneId: lid, snap: s };
    } catch { /* not booted */ }
  }
  return null;
}

async function run(opts: { cycles?: number; intervalMs?: number } = {}) {
  const cycles = opts.cycles ?? 50;
  const intervalMs = opts.intervalMs ?? 20;

  const activeLaneId = feedLaneRoles.laneForRole('active');
  const activeSnap = VideoEngine.snapshot(activeLaneId);
  const activeOwner = activeSnap.postId;

  if (!activeOwner) {
    // eslint-disable-next-line no-console
    console.warn('[laneChurn] no active ownerKey — start a video first');
    return;
  }

  const baselineFirstFrame = activeSnap.firstFrame;
  const rows: HealthRow[] = [];

  // Count rejects from the actual trace('preload.rejected') emission path.
  let rejectCount = 0;
  const w = window as unknown as { __trace_sink__?: (name: string, payload?: Record<string, unknown>) => void };
  const priorSink = w.__trace_sink__;
  w.__trace_sink__ = (name: string, payload?: Record<string, unknown>) => {
    if (name === 'preload.rejected') rejectCount++;
    priorSink?.(name, payload);
  };

  // eslint-disable-next-line no-console
  console.info('[laneChurn] start', { cycles, intervalMs, activeOwner });

  const FAKE_URL = activeSnap.postId ? 'about:blank#churn' : 'about:blank#churn';

  for (let c = 0; c < cycles; c++) {
    const targets: LaneId[] = [
      'feed-active',
      'feed-next',
      'feed-prev',
      FEED_LANES[Math.floor(Math.random() * FEED_LANES.length)],
    ];
    for (let i = 0; i < targets.length; i++) {
      try {
        VideoEngine.preload(targets[i], {
          hlsUrl: FAKE_URL,
          posterUrl: null,
          postId: `churn:${c}:${i}`,
          expectedActiveOwnerKey: activeOwner,
        });
      } catch { /* ignore */ }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
    const loc = findLaneForOwner(activeOwner);
    const row: HealthRow = {
      cycle: c,
      activeOwner,
      laneId: loc?.laneId ?? null,
      firstFrame: loc?.snap.firstFrame ?? false,
      playing: loc?.snap.state === 'playing',
      readyState: loc?.snap.readyState ?? 0,
      bindingLost: loc == null,
      firstFrameRegressed: baselineFirstFrame && !(loc?.snap.firstFrame ?? false),
    };
    rows.push(row);
  }

  w.__trace_sink__ = priorSink;

  const bindingLosses = rows.filter((r) => r.bindingLost).length;
  const ffRegressions = rows.filter((r) => r.firstFrameRegressed).length;
  const pass = bindingLosses === 0 && ffRegressions === 0 && rejectCount >= cycles;

  // eslint-disable-next-line no-console
  console.info(`[laneChurn] ${pass ? 'PASS' : 'FAIL'}`, {
    cycles,
    bindingLosses,
    firstFrameRegressions: ffRegressions,
    preloadRejected: rejectCount,
    activeOwner,
  });

  // CSV block for capture.
  const csv = [
    'cycle,laneId,firstFrame,playing,readyState,bindingLost,firstFrameRegressed',
    ...rows.map((r) =>
      [r.cycle, r.laneId ?? '', r.firstFrame, r.playing, r.readyState, r.bindingLost, r.firstFrameRegressed].join(','),
    ),
  ].join('\n');
  // eslint-disable-next-line no-console
  console.info('[laneChurn] csv\n' + csv);

  return { pass, bindingLosses, ffRegressions, rejectCount, rows };
}

/**
 * Attach + auto-trigger gating.
 *
 * Gated on the DBG pill (`isPerfEnabled`) — NOT `import.meta.env.DEV` — so
 * the harness is reachable in both the Lovable preview and the on-device
 * build wherever the pill is toggled on. When the pill is off, nothing
 * attaches to `window` and `?churn=1` is a no-op.
 *
 * Auto-run: if the URL contains `?churn=1` and the pill is on, we poll
 * the feed-active lane and kick off a single run once a video is bound.
 * All output flows through `console.info` / `trace()` which the DBG
 * consoleCapture ring buffer records, so a pill LOG capture includes the
 * `[laneChurn]` summary and every `preload.rejected` trace.
 */
import { isPerfEnabled, subscribePerfLive } from '@/perf/navTiming';

let attached = false;
let autoRunScheduled = false;

function attach(): void {
  if (attached) return;
  if (typeof window === 'undefined') return;
  if (!isPerfEnabled()) return;
  attached = true;
  (window as unknown as { __lovable_laneChurn?: { run: typeof run } }).__lovable_laneChurn = { run };
  console.info('[laneChurn] attached (window.__lovable_laneChurn.run available)');
  maybeScheduleAutoRun();
}

function maybeScheduleAutoRun(): void {
  if (autoRunScheduled) return;
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('churn') !== '1') return;
  } catch { return; }
  autoRunScheduled = true;

  const started = performance.now();
  const TIMEOUT_MS = 60_000;
  const POLL_MS = 250;

  console.info('[laneChurn] ?churn=1 detected — waiting for feed-active video…');

  const poll = () => {
    if (!isPerfEnabled()) { autoRunScheduled = false; return; }
    let ownerKey: string | null = null;
    try {
      const laneId = feedLaneRoles.laneForRole('active');
      const snap = VideoEngine.snapshot(laneId);
      if (snap.postId && (snap.state === 'playing' || snap.firstFrame || snap.readyState >= 2)) {
        ownerKey = snap.postId;
      }
    } catch { /* engine not booted yet */ }

    if (ownerKey) {
      console.info('[laneChurn] auto-run start', { ownerKey });
      run({ cycles: 100, intervalMs: 20 }).catch((e) => {
        console.warn('[laneChurn] auto-run error', e);
      });
      return;
    }
    if (performance.now() - started > TIMEOUT_MS) {
      console.warn('[laneChurn] auto-run timeout — no feed-active video within 60s');
      return;
    }
    setTimeout(poll, POLL_MS);
  };
  setTimeout(poll, POLL_MS);
}

attach();
subscribePerfLive(() => { try { attach(); } catch { /* ignore */ } });

export const laneChurnHarness = { run };
