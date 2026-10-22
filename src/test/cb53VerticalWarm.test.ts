import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Snap = { postId: string | null; state: string };
const engine = vi.hoisted(() => {
  const state = {
    borrowed: new Set<string>(),
    saveData: false,
    policy: new Map<string, string>(),
    snaps: new Map<string, Snap>(),
    swapRefuse: false,
    unmuted: [] as string[],
  };
  const api = {
    isSaveDataGated: vi.fn(() => state.saveData),
    isBorrowed: vi.fn((id: string) => state.borrowed.has(id)),
    getAudioPolicy: vi.fn((id: string) => state.policy.get(id) ?? 'session'),
    setAudioPolicy: vi.fn((id: string, p: string) => { state.policy.set(id, p); }),
    mountedHostOf: vi.fn(() => null),
    unmountLane: vi.fn(),
    mountLane: vi.fn(),
    setMuted: vi.fn((id: string, m: boolean) => { if (!m) state.unmuted.push(id); }),
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
  __resetVerticalWarmForTests, getLentLane, installVerticalWarmReturn, onLentLaneReturned,
  settleVertical, warmVerticalNeighbour, wasVerticalSettleWarmed,
} from '@/video/fullscreenVerticalWarm';

const vid = (id: string) => ({ id, mediaItems: [{ type: 'video', hlsUrl: `https://x/${id}.m3u8`, thumbnailUrl: null }] }) as any;
const img = (id: string) => ({ id, mediaItems: [{ type: 'image', url: 'https://x/i.jpg' }] }) as any;

beforeEach(() => {
  __resetVerticalWarmForTests();
  engine.state.borrowed.clear();
  engine.state.saveData = false;
  engine.state.policy.clear();
  engine.state.snaps.clear();
  engine.state.swapRefuse = false;
  engine.state.unmuted = [];
  Object.values(engine.api).forEach((f) => (f as any).mockClear());
  for (const l of ['feed-active', 'feed-next', 'feed-prev'] as const) feedLaneRoles.unfreeze(l);
  useFullscreenFeedStore.setState({ borrow: null } as any);
});

describe('CB53 fullscreen vertical warm', () => {
  it('preloads the next post on a lent idle feed lane, never a borrowed or frozen one', () => {
    const active = feedLaneRoles.laneForRole('active');
    const next = feedLaneRoles.laneForRole('next');
    const prev = feedLaneRoles.laneForRole('prev');
    feedLaneRoles.freeze(next);
    engine.state.borrowed.add(active);
    expect(warmVerticalNeighbour(vid('B'))).toBe('issued');
    expect(getLentLane()).toBe(prev);
    expect(engine.api.preload).toHaveBeenCalledWith(prev, expect.objectContaining({ postId: 'B:0' }));
    for (const [lane] of engine.api.preload.mock.calls) {
      expect(lane).not.toBe(next);
      expect(lane).not.toBe(active);
    }
  });

  it('warms nothing for an image-first neighbour, and lends nothing when all lanes are unavailable', () => {
    expect(warmVerticalNeighbour(img('I'))).toBe('noop:not-video');
    feedLaneRoles.freeze(feedLaneRoles.laneForRole('next'));
    engine.state.borrowed.add(feedLaneRoles.laneForRole('prev'));
    expect(warmVerticalNeighbour(vid('B'))).toBe('noop:no-lane');
    expect(engine.api.preload).not.toHaveBeenCalled();
  });

  it('a settle onto the warmed post swaps it into fullscreen and tags warmed', () => {
    warmVerticalNeighbour(vid('B'));
    const lane = getLentLane()!;
    expect(settleVertical(vid('B'))).toBe(true);
    expect(engine.api.swapLanes).toHaveBeenCalledWith('fullscreen', lane);
    expect(wasVerticalSettleWarmed('B')).toBe(true);
    expect(engine.state.snaps.get('fullscreen')?.postId).toBe('B:0');
  });

  it('a refused swap or an owner mismatch falls back cold', () => {
    warmVerticalNeighbour(vid('B'));
    engine.state.swapRefuse = true;
    expect(settleVertical(vid('B'))).toBe(false);
    expect(wasVerticalSettleWarmed('B')).toBe(false);
    engine.state.swapRefuse = false;
    warmVerticalNeighbour(vid('C'));
    expect(settleVertical(vid('D'))).toBe(false);
    expect(engine.api.swapLanes).toHaveBeenCalledTimes(1);
    expect(wasVerticalSettleWarmed('D')).toBe(false);
  });

  it('the lent lane is always-muted and never unmuted while lent', () => {
    warmVerticalNeighbour(vid('B'));
    const lane = getLentLane()!;
    expect(engine.state.policy.get(lane)).toBe('always-muted');
    settleVertical(vid('B'));
    warmVerticalNeighbour(vid('C'));
    expect(engine.state.unmuted).not.toContain(lane);
    expect(engine.api.setAudioPolicy.mock.calls.filter(([l]) => l === lane).map(([, p]) => p)).toEqual(['always-muted']);
  });

  it('does not warm under save-data', () => {
    engine.state.saveData = true;
    expect(warmVerticalNeighbour(vid('B'))).toBe('noop:save-data');
    expect(engine.api.preload).not.toHaveBeenCalled();
    expect(getLentLane()).toBeNull();
  });

  it('on close the lane returns to the feed, released, policy restored, and the feed re-warms its role', () => {
    installVerticalWarmReturn();
    useFullscreenFeedStore.setState({ isOpen: true } as any);
    const lane = feedLaneRoles.laneForRole('next');
    engine.state.policy.set(lane, 'session');
    warmVerticalNeighbour(vid('B'));
    expect(getLentLane()).toBe(lane);
    const rewarm = vi.fn();
    const off = onLentLaneReturned(rewarm);
    useFullscreenFeedStore.setState({ isOpen: false } as any);
    off();
    expect(getLentLane()).toBeNull();
    expect(engine.api.release).toHaveBeenCalledWith(lane);
    expect(engine.state.snaps.get(lane)?.postId).toBeNull();
    expect(engine.state.policy.get(lane)).toBe('session');
    expect(rewarm).toHaveBeenCalledWith(lane);
  });
});

describe('CB53 feed scroll handlers stand down under the viewer', () => {
  const src = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');
  for (const file of ['components/feed/CardFeed.tsx', 'components/posts-tab/LightCardFeed.tsx']) {
    it(`${file}: onScroll returns first while open, read from a ref`, () => {
      const s = src(file);
      const body = s.slice(s.indexOf('const onScroll = (e: Event) => {'));
      const firstStatement = body.split('\n').slice(1).find((l) => l.trim() && !l.trim().startsWith('//'));
      expect(firstStatement?.trim()).toBe('if (fsOpenScrollRef.current) return;');
      expect(s).toMatch(/fsOpenScrollRef\.current = fsOpenForScroll;/);
      // Listener binding is unchanged: still keyed on recheckActive only.
      expect(body).toMatch(/\}, \[recheckActive\]\);/);
    });
  }
});
