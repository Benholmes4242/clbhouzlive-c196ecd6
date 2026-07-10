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
 *   • preload.rejected count > 0 (guard actually fired).
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

  // Count rejects by monkey-patching trace briefly.
  let rejectCount = 0;
  const w = window as unknown as { __trace_sink__?: (name: string) => void };
  const priorSink = w.__trace_sink__;
  w.__trace_sink__ = (name: string) => {
    if (name === 'preload.rejected') rejectCount++;
    priorSink?.(name);
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
  const pass = bindingLosses === 0 && ffRegressions === 0 && rejectCount > 0;

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

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as unknown as { __lovable_laneChurn?: { run: typeof run } }).__lovable_laneChurn = { run };
}

export const laneChurnHarness = { run };
