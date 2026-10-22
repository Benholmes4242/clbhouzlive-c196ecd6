/**
 * CB52 — video timings tell the truth. Pure vperf/telemetry checks plus two
 * source-structure checks for call sites too heavy to render (SnapFeed,
 * FeedSlide's pager).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

vi.mock('@/perf/navTiming', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/perf/navTiming')>();
  return { ...actual, isPerfEnabled: () => true };
});

import {
  vperfStart,
  vperfArmMoving,
  vperfArmMovingFromSnapshot,
  vperfLaneProgress,
  vperfLaneEvent,
  vperfLaneFailure,
  vperfSetKind,
  vperfArmBorrowMount,
  vperfBorrowMounted,
  vperfSetLaneResolver,
  vperfFeedActivateVideo,
  vperfFeedActivateEnd,
  vperfFeedScrollTick,
  vperfSetPage,
  vperfOnHidden,
  __vperfSnapshotTelemetry,
  __vperfResetTelemetry,
  MOVING_AFTER_SEEK_S,
} from '@/perf/vperf';
import { readBuildStamp, buildRows } from '@/perf/telemetry';

type Line = { kind: string; payload: Record<string, any> };
let lines: Line[] = [];
let spy: ReturnType<typeof vi.spyOn>;
let n = 0;
const id = (p: string) => `${p}#${++n}`;

beforeEach(() => {
  lines = [];
  spy = vi.spyOn(console, 'info').mockImplementation((tag: unknown, payload?: unknown) => {
    if (typeof tag === 'string' && tag.startsWith('[VPERF] ')) {
      lines.push({ kind: tag.slice(8), payload: payload as Record<string, any> });
    }
  });
  __vperfResetTelemetry();
});
afterEach(() => {
  spy.mockRestore();
  vperfSetLaneResolver(null);
  vi.useRealTimers();
});

const ended = (spanKind: string) => lines.filter((l) => l.kind === spanKind);

describe('CB52 moving-frame end', () => {
  it('cold: baselines on the first observed playhead, ends when it advances; other owners ignored', () => {
    const s = id('swipe');
    vperfStart(s, 'swipe.vertical');
    vperfArmMoving('fullscreen', s, { owner: 'p1:0', from: null });
    vperfLaneProgress('fullscreen', 4.0, 'old:0');
    vperfLaneProgress('fullscreen', 4.5, 'old:0');
    vperfLaneProgress('fullscreen', 0, 'p1:0');
    expect(ended('swipe.vertical')).toHaveLength(0);
    vperfLaneProgress('fullscreen', 0.04, 'p1');
    expect(ended('swipe.vertical')).toHaveLength(1);
    expect(ended('swipe.vertical')[0].payload.closedBy).toBe('movingFrame');
  });

  it('already decoded: ends once the playhead passes its value at arm time', () => {
    const s = id('pager');
    vperfStart(s, 'swipe.pager');
    const { warm } = vperfArmMovingFromSnapshot('fullscreen', s, 'p2:1', { postId: 'p2:1', currentTime: 3, firstFrame: true });
    expect(warm).toBe(true);
    vperfLaneProgress('fullscreen', 3, 'p2:1');
    expect(ended('swipe.pager')).toHaveLength(0);
    vperfLaneProgress('fullscreen', 3.03, 'p2:1');
    expect(ended('swipe.pager')).toHaveLength(1);
  });

  it('swapped in: resolves the element behind the lane id and ends on its next presented frame', () => {
    let cb: ((now: number, md: { mediaTime: number }) => void) | null = null;
    const el = { currentTime: 1, requestVideoFrameCallback: (f: typeof cb) => { cb = f; return 7; }, cancelVideoFrameCallback: vi.fn() };
    vperfSetLaneResolver(() => ({ el: el as unknown as HTMLVideoElement, owner: 'p3:2' }));
    const s = id('pager');
    vperfStart(s, 'swipe.pager');
    vperfArmMovingFromSnapshot('fullscreen', s, 'p3:2', { postId: 'p3:2', currentTime: 1, firstFrame: true });
    expect(cb).not.toBeNull();
    cb!(0, { mediaTime: 1 });
    expect(ended('swipe.pager')).toHaveLength(0);
    cb!(16, { mediaTime: 1.016 });
    expect(ended('swipe.pager')).toHaveLength(1);
    expect(ended('swipe.pager')[0].payload.via).toBe('rvfc');
  });

  it('after a seek to 0: only currentTime > 0.05 below the pre-seek ceiling counts', () => {
    const s = id('loop');
    vperfStart(s, 'loop.gap');
    vperfArmMoving('feed-active', s, { owner: 'p4:0', from: MOVING_AFTER_SEEK_S, ceiling: 9.9 });
    vperfLaneProgress('feed-active', 9.95, 'p4:0');
    vperfLaneProgress('feed-active', 0.02, 'p4:0');
    expect(ended('loop.gap')).toHaveLength(0);
    vperfLaneProgress('feed-active', 0.06, 'p4:0');
    expect(ended('loop.gap')).toHaveLength(1);
  });

  it('firstFrame and playing never end a moving-frame span', () => {
    const s = id('swipe');
    vperfStart(s, 'swipe.vertical');
    vperfArmMoving('fullscreen', s, { owner: 'p5:0', from: 0 });
    vperfLaneEvent('fullscreen', 'firstFrame', { warmSkip: true });
    vperfLaneEvent('fullscreen', 'playing');
    expect(ended('swipe.vertical')).toHaveLength(0);
  });
});

describe('CB52 feed activation warm flag', () => {
  it('warm when the active lane already shows the owner, cold otherwise', () => {
    vperfFeedActivateVideo({ laneId: 'feed-a', ownerKey: 'w1:0', idx: 0, snap: { postId: 'w1', currentTime: 2, firstFrame: true } });
    vperfLaneProgress('feed-a', 2.1, 'w1:0');
    vperfFeedActivateVideo({ laneId: 'feed-b', ownerKey: 'c1:0', idx: 1, snap: { postId: 'other:0', currentTime: 2, firstFrame: true } });
    vperfLaneProgress('feed-b', 0, 'c1:0');
    vperfLaneProgress('feed-b', 0.1, 'c1:0');
    const acts = ended('feed.activate');
    expect(acts.map((a) => a.payload.warm)).toEqual([true, false]);
    expect(acts.map((a) => a.payload.budgetMs)).toEqual([120, 600]);
  });
});

describe('CB52 fullscreen settle has one span', () => {
  it('SnapFeed starts only swipe.vertical and emits no feed.activate', () => {
    const src = readFileSync(path.resolve(__dirname, '../components/feed/SnapFeed.tsx'), 'utf8');
    expect(src.match(/vperfStart\(/g)).toHaveLength(1);
    expect(src).toContain("'swipe.vertical'");
    expect(src).not.toMatch(/feed\.activate\.video|feed\.activate\.image|vperfFeedActivate/);
  });
});

describe('CB52 fs.open kind split', () => {
  it.each([
    ['fs.open.lane', 500],
    ['fs.open.image', 200],
  ])('%s carries its own bucket and budget', (kind, budget) => {
    const s = id('fs');
    vperfStart(s, 'fs.open');
    vperfSetKind(s, kind);
    vperfArmMoving('fullscreen', s, { owner: null, from: 0 });
    vperfLaneProgress('fullscreen', 0.2, 'x:0');
    const l = ended(kind);
    expect(l).toHaveLength(1);
    expect(l[0].payload.budgetMs).toBe(budget);
    expect(ended('fs.open')).toHaveLength(0);
  });

  it('fs.open.borrow ends only after the borrowed element is mounted', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'setTimeout'] });
    const s = id('fs');
    vperfStart(s, 'fs.open');
    vperfSetKind(s, 'fs.open.borrow');
    vperfArmBorrowMount(s);
    vi.advanceTimersByTime(100);
    expect(ended('fs.open.borrow')).toHaveLength(0);
    vperfBorrowMounted();
    vi.advanceTimersByTime(100);
    const l = ended('fs.open.borrow');
    expect(l).toHaveLength(1);
    expect(l[0].payload.closedBy).toBe('borrowMounted');
    expect(l[0].payload.budgetMs).toBe(150);
  });
});

describe('CB52 failure closings', () => {
  it.each(['error', 'saveData'] as const)('%s ends a lane open at once as FAIL', (reason) => {
    const s = id('fs');
    vperfStart(s, 'fs.open');
    vperfSetKind(s, 'fs.open.lane');
    vperfArmMoving('fullscreen', s, { owner: null, from: null, failOnLane: true });
    vperfLaneFailure('fullscreen', reason);
    const l = ended('fs.open.lane');
    expect(l).toHaveLength(1);
    expect(l[0].payload.verdict).toBe('FAIL');
    expect(l[0].payload.closedBy).toBe(reason);
    const bucket = __vperfSnapshotTelemetry().buckets.find((b) => b.key.startsWith('fs.open.lane|'));
    expect(bucket?.failed).toBe(1);
    expect(bucket?.pass).toBe(0);
  });
});

describe('CB52 pager swapped tag', () => {
  it('every swipe.pager span carries the swap outcome of its settle', () => {
    const src = readFileSync(path.resolve(__dirname, '../components/feed/FeedSlide.tsx'), 'utf8');
    expect(src).toContain('lastSwapRef.current = swapped;');
    expect(src).toMatch(/vperfStart\(spanId, 'swipe\.pager', \{[^}]*swapped: lastSwapRef\.current/);
  });
});

describe('CB52 hidden supersede', () => {
  it('supersedes open spans with supersededBy hidden and drops a pending activation', () => {
    vperfOnHidden(); // clear spans left open by earlier cases
    lines = [];
    const s = id('swipe');
    vperfStart(s, 'swipe.vertical');
    const t0 = performance.now();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    const l = ended('swipe.vertical');
    expect(l).toHaveLength(1);
    expect(l[0].payload.verdict).toBe('SUPERSEDED');
    expect(l[0].payload.supersededBy).toBe('hidden');
    vperfFeedActivateEnd({ t0, idx: 0, mediaType: 'image' });
    expect(ended('feed.activate')).toHaveLength(0);
    vperfOnHidden();
  });
});

describe('CB52 build label', () => {
  it('rows carry the per-build id and a readable build time in extra', () => {
    expect(readBuildStamp()).toBe('test');
    const rows = buildRows({
      buckets: [{ key: 'swipe.vertical|clubhouse', count: 1, pass: 1, slow: 0, timeout: 0, superseded: 0, failed: 0, totals: [100] }],
      sessionHealth: { sessionCount: 0, totalDurationMs: 0, levelSwitches: 0, totalFrames: 0, droppedFrames: 0 },
      prefetchStats: { issued: 0, aborted: {}, activationsWithPrefetch: 0, activationsWithPrefetchWarm: 0 },
      feedRollup: [],
      startLevelsByLane: [],
      decideCounters: [],
    });
    expect(rows[0].app_build).toBe('test');
    expect(rows[0].extra).toHaveProperty('build_stamp');
  });
});

describe('CB52 scroll keys', () => {
  it('inline and fullscreen scroll samples land in separate feed rollups', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] });
    vperfSetPage('clubhouse');
    vperfFeedScrollTick('cardfeed', 'inline');
    vperfFeedScrollTick('snapfeed', 'fullscreen');
    vi.advanceTimersByTime(300);
    const pages = __vperfSnapshotTelemetry().feedRollup.map((f) => f.page).sort();
    expect(pages).toEqual(['clubhouse:fullscreen', 'clubhouse:inline']);
  });
});
