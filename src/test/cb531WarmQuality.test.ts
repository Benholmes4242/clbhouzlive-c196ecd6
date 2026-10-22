/**
 * CB53.1 — the warmed video must be as sharp as a cold one:
 *  1. the lent lane preloads in a viewport-sized staging host, never the
 *     1px hidden host;
 *  2. the opening rung uses viewport height with the 720 floor while lent;
 *  3. the swap calls nudgeLevelCap('fullscreen') and applies the fullscreen
 *     buffer values;
 *  4. the return to the feed restores the feed values;
 *  5. swipe.vertical carries startHeight (rendition height at first motion).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@/perf/navTiming', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/perf/navTiming')>();
  return { ...actual, isPerfEnabled: () => true };
});

type Snap = { postId: string | null; state: string };
const engine = vi.hoisted(() => {
  const state = {
    borrowed: new Set<string>(),
    saveData: false,
    policy: new Map<string, string>(),
    snaps: new Map<string, Snap>(),
    swapRefuse: false,
    lentMarks: new Set<string>(),
    buffering: [] as { fn: string; lane: string }[],
    nudged: [] as string[],
  };
  const api = {
    isSaveDataGated: vi.fn(() => state.saveData),
    isBorrowed: vi.fn((id: string) => state.borrowed.has(id)),
    getAudioPolicy: vi.fn((id: string) => state.policy.get(id) ?? 'session'),
    setAudioPolicy: vi.fn((id: string, p: string) => { state.policy.set(id, p); }),
    mountedHostOf: vi.fn(() => null),
    unmountLane: vi.fn(),
    mountLane: vi.fn(),
    markVerticalWarmLent: vi.fn((id: string) => { state.lentMarks.add(id); }),
    clearVerticalWarmLent: vi.fn((id: string) => { state.lentMarks.delete(id); }),
    nudgeLevelCap: vi.fn((id: string) => { state.nudged.push(id); }),
    applyFullscreenBuffering: vi.fn((lane: string) => { state.buffering.push({ fn: 'fullscreen', lane }); }),
    restoreFeedBuffering: vi.fn((lane: string) => { state.buffering.push({ fn: 'feed', lane }); }),
    preload: vi.fn((id: string, o: { postId: string }) => {
      state.snaps.set(id, { postId: o.postId, state: 'paused' });
    }),
    release: vi.fn((id: string) => { state.snaps.set(id, { postId: null, state: 'idle' }); }),
    snapshot: vi.fn((id: string) => state.snaps.get(id) ?? { postId: null, state: 'idle' }),
    swapLanes: vi.fn((a: string, b: string) => {
      if (state.swapRefuse) return false;
      const sa = state.snaps.get(a); const sb = state.snaps.get(b);
      state.snaps.set(a, sb ?? { postId: null, state: 'idle' });
      state.snaps.set(b, sa ?? { postId: null, state: 'idle' });
      return true;
    }),
  };
  return { state, api };
});
vi.mock('@/video/VideoEngine', () => ({ VideoEngine: engine.api }));

import { feedLaneRoles } from '@/video/feedLaneRoles';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import {
  __resetVerticalWarmForTests, ensureVerticalWarmStagingHost, getLentLane,
  returnLentLane, settleVertical, warmVerticalNeighbour,
} from '@/video/fullscreenVerticalWarm';
import { startLevelMeasure, viewportPixelHeight } from '@/video/startLevel';
import {
  vperfStart, vperfArmMovingFromSnapshot, vperfLaneProgress, vperfSetLaneResolver,
  __vperfResetTelemetry,
} from '@/perf/vperf';

const vid = (id: string) => ({ id, mediaItems: [{ type: 'video', hlsUrl: `https://x/${id}.m3u8`, thumbnailUrl: null }] }) as any;

let perfSpy: ReturnType<typeof vi.spyOn>;
let perfLines: { kind: string; payload: Record<string, any> }[] = [];
let spanN = 0;

beforeEach(() => {
  __resetVerticalWarmForTests();
  engine.state.borrowed.clear();
  engine.state.saveData = false;
  engine.state.policy.clear();
  engine.state.snaps.clear();
  engine.state.swapRefuse = false;
  engine.state.lentMarks.clear();
  engine.state.buffering = [];
  engine.state.nudged = [];
  Object.values(engine.api).forEach((f) => (f as any).mockClear());
  for (const l of ['feed-active', 'feed-next', 'feed-prev'] as const) feedLaneRoles.unfreeze(l);
  useFullscreenFeedStore.setState({ borrow: null } as any);
  __vperfResetTelemetry();
  vperfSetLaneResolver(null);
  perfLines = [];
  perfSpy = vi.spyOn(console, 'info').mockImplementation((tag: unknown, payload?: unknown) => {
    if (typeof tag === 'string' && tag.startsWith('[VPERF] ')) {
      perfLines.push({ kind: tag.slice(8), payload: payload as Record<string, any> });
    }
  });
});

afterEach(() => {
  perfSpy.mockRestore();
});

describe('CB53.1 viewport-sized staging host', () => {
  it('the lent lane preloads in a 100vw x 100vh offscreen host, never the 1px hidden host', () => {
    expect(warmVerticalNeighbour(vid('B'))).toBe('issued');
    const lane = getLentLane()!;
    const mount = engine.api.mountLane.mock.calls.find(([l]) => l === lane);
    expect(mount).toBeTruthy();
    const host = mount![1] as HTMLElement;
    expect(host.id).toBe('__video_engine_vertical_warm_staging__');
    expect(host.id).not.toBe('__video_engine_hidden_host__');
    expect(host.style.position).toBe('fixed');
    expect(host.style.width).toBe('100vw');
    expect(host.style.height).toBe('100vh');
    expect(host.style.visibility).toBe('hidden');
    expect(host.style.pointerEvents).toBe('none');
    expect(engine.api.markVerticalWarmLent).toHaveBeenCalledWith(lane);
    // The preload lands on the staged lane.
    expect(engine.api.preload).toHaveBeenCalledWith(lane, expect.objectContaining({ postId: 'B:0' }));
  });

  it('the staging host is a singleton reused across lends', () => {
    expect(ensureVerticalWarmStagingHost()).toBe(ensureVerticalWarmStagingHost());
  });
});

describe('CB53.1 opening rung while lent', () => {
  it('fullscreen-like lanes measure the viewport with the 720 floor; feed lanes the element with 540', () => {
    const el = { getBoundingClientRect: () => ({ height: 300 }) } as unknown as Element;
    const fs = startLevelMeasure(true, el);
    expect(fs.minHeight).toBe(720);
    expect(fs.renderedPixelHeight).toBe(viewportPixelHeight());
    const feed = startLevelMeasure(false, el);
    expect(feed.minHeight).toBe(540);
    expect(feed.renderedPixelHeight).toBe(300); // jsdom dpr is 1
  });

  it('the engine treats a lent lane as fullscreen-like at manifest time', () => {
    const src = readFileSync(resolve(__dirname, '../video/VideoEngine.ts'), 'utf8');
    const onManifest = src.slice(src.indexOf('const onManifest = () => {'));
    expect(onManifest).toMatch(/isFullscreenLane\(lane\.id\) \|\| this\.verticalWarmLent\.has\(lane\.id\)/);
    expect(onManifest).toMatch(/startLevelMeasure\(fullscreenLike, lane\.el\)/);
  });
});

describe('CB53.1 swap quality and feed restore', () => {
  it('a warmed settle nudges the level cap and applies the fullscreen buffer values', () => {
    warmVerticalNeighbour(vid('B'));
    const lane = getLentLane()!;
    expect(settleVertical(vid('B'))).toBe(true);
    expect(engine.api.nudgeLevelCap).toHaveBeenCalledWith('fullscreen');
    expect(engine.api.applyFullscreenBuffering).toHaveBeenCalledWith('fullscreen');
    // The swapped-out lane re-parks in the staging host, not the hidden host.
    const repark = engine.api.mountLane.mock.calls.filter(([l]) => l === lane);
    expect(repark.length).toBeGreaterThanOrEqual(2);
    expect((repark[repark.length - 1][1] as HTMLElement).id).toBe('__video_engine_vertical_warm_staging__');
  });

  it('a cold settle (refused swap) applies no fullscreen buffering', () => {
    warmVerticalNeighbour(vid('B'));
    engine.state.swapRefuse = true;
    expect(settleVertical(vid('B'))).toBe(false);
    expect(engine.api.nudgeLevelCap).not.toHaveBeenCalled();
    expect(engine.api.applyFullscreenBuffering).not.toHaveBeenCalled();
  });

  it('the return to the feed restores the feed buffer values and clears the lent mark', () => {
    warmVerticalNeighbour(vid('B'));
    const lane = getLentLane()!;
    settleVertical(vid('B'));
    returnLentLane();
    expect(engine.api.restoreFeedBuffering).toHaveBeenCalledWith(lane);
    expect(engine.api.clearVerticalWarmLent).toHaveBeenCalledWith(lane);
    expect(engine.state.lentMarks.has(lane)).toBe(false);
  });

  it('the engine buffer methods set the declared config values', () => {
    const src = readFileSync(resolve(__dirname, '../video/VideoEngine.ts'), 'utf8');
    const apply = src.slice(src.indexOf('applyFullscreenBuffering(laneId'));
    expect(apply).toMatch(/config\.maxBufferLength = HLS_CONFIG\.maxBufferLength/);
    expect(apply).toMatch(/config\.backBufferLength = FULLSCREEN_HLS_OVERRIDES\.backBufferLength/);
    const restore = src.slice(src.indexOf('restoreFeedBuffering(laneId'));
    expect(restore).toMatch(/config\.maxBufferLength = HLS_CONFIG\.maxBufferLength/);
    expect(restore).toMatch(/config\.backBufferLength = HLS_CONFIG\.backBufferLength/);
  });
});

describe('CB53.1 swipe.vertical startHeight', () => {
  it('tags the moving-frame end with the rendition height playing at first motion', () => {
    vperfSetLaneResolver(() => ({ el: null, owner: 'p1:0', height: 720 }));
    const s = `swipe.vertical:t${++spanN}`;
    vperfStart(s, 'swipe.vertical');
    vperfArmMovingFromSnapshot('fullscreen', s, 'p1:0', { postId: 'p1:0', currentTime: 1, firstFrame: true }, { tagStartHeight: true });
    vperfLaneProgress('fullscreen', 1, 'p1:0');
    vperfLaneProgress('fullscreen', 1.05, 'p1:0');
    const ended = perfLines.filter((l) => l.kind === 'swipe.vertical');
    expect(ended).toHaveLength(1);
    expect(ended[0].payload.closedBy).toBe('movingFrame');
    expect(ended[0].payload.startHeight).toBe(720);
  });

  it('spans without the flag carry no startHeight', () => {
    vperfSetLaneResolver(() => ({ el: null, owner: 'p2:0', height: 720 }));
    const s = `swipe.pager:t${++spanN}`;
    vperfStart(s, 'swipe.pager');
    vperfArmMovingFromSnapshot('fullscreen', s, 'p2:0', { postId: 'p2:0', currentTime: 1, firstFrame: true });
    vperfLaneProgress('fullscreen', 1, 'p2:0');
    vperfLaneProgress('fullscreen', 1.05, 'p2:0');
    const ended = perfLines.filter((l) => l.kind === 'swipe.pager');
    expect(ended).toHaveLength(1);
    expect('startHeight' in ended[0].payload).toBe(false);
  });

  it('SnapFeed arms swipe.vertical with the startHeight tag', () => {
    const src = readFileSync(resolve(__dirname, '../components/feed/SnapFeed.tsx'), 'utf8');
    expect(src).toMatch(/vperfArmMovingFromSnapshot\(armLane, swipeSpanId, `\$\{post\.id\}:0`, snap, \{ tagStartHeight: true \}\)/);
  });
});
