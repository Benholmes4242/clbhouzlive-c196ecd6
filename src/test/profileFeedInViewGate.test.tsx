import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const setAudioFocus = vi.fn();
vi.mock('@/video/VideoEngine', () => ({
  VideoEngine: {
    setAudioFocus: (...a: unknown[]) => setAudioFocus(...a),
    snapshot: () => ({ postId: null, state: 'idle' }),
    preload: vi.fn(),
    play: vi.fn(),
  },
}));
vi.mock('@/video/feedLaneRoles', () => ({
  feedLaneRoles: {
    rotate: vi.fn(),
    snapshot: () => ({}),
    laneForRole: () => 'lane-a',
    roleForLane: () => null,
    promoteToActive: vi.fn(),
  },
}));
vi.mock('@/video/fullscreenVerticalWarm', () => ({ onLentLaneReturned: () => () => {} }));
vi.mock('@/perf/vperf', () => ({
  vperfFeedActivateStart: () => 0,
  vperfFeedActivateEnd: vi.fn(),
  vperfConsumeEarlyStarted: () => false,
  vperfFeedActivateVideo: () => ({ spanId: 's' }),
  vperfSupersede: vi.fn(),
  vperfFeedScrollTick: vi.fn(),
}));
vi.mock('@/hooks/feed/useFeedCommentPreview', () => ({ useFeedCommentPreview: () => ({ map: new Map() }) }));
vi.mock('@/hooks/feed/usePostGolfTags', () => ({ usePostGolfTags: () => ({ withByPost: new Map(), slideTags: new Map() }) }));
vi.mock('@/lib/getScrollParent', () => ({ getPrimaryScrollElement: () => document.body }));
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent, computeItemKey }: any) => (
    <div>{data.map((d: any, i: number) => <div key={computeItemKey(i, d)}>{itemContent(i, d)}</div>)}</div>
  ),
}));
vi.mock('@/components/feed/FeedCard', () => ({
  FeedCard: ({ post, isActive }: any) => <div data-testid={`card-${post.id}`} data-active={isActive ? 'yes' : 'no'} />,
}));

type IOCb = (entries: Array<{ target: Element; isIntersecting: boolean; intersectionRatio: number }>) => void;
let ioCb: IOCb | null = null;
class FakeIO {
  constructor(cb: IOCb) { ioCb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

import { LightCardFeed } from '@/components/posts-tab/LightCardFeed';

const post = (id: string) => ({
  id,
  mediaItems: [{ type: 'video', hlsUrl: `https://v/${id}.m3u8`, thumbnailUrl: null, duration: 20 }],
}) as any;
const posts = [post('p0'), post('p1'), post('p2')];

function see(ratios: Record<number, number>) {
  const entries = Object.entries(ratios).map(([i, r]) => ({
    target: document.querySelector(`[data-card-index="${i}"]`)!,
    isIntersecting: r > 0,
    intersectionRatio: r,
  }));
  act(() => { ioCb!(entries); });
  act(() => { vi.advanceTimersByTime(200); });
}
const active = () => posts.filter((p) => screen.getByTestId(`card-${p.id}`).dataset.active === 'yes').map((p) => p.id);

describe('profile feed in-view gate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setAudioFocus.mockClear();
    (globalThis as any).IntersectionObserver = FakeIO;
  });
  afterEach(() => { vi.useRealTimers(); });

  function mount() {
    render(
      <LightCardFeed
        posts={posts}
        onLike={() => {}} onComment={() => {}} onShare={() => {}} onProfile={() => {}}
        getLikeState={() => null} getCommentCount={() => 0}
      />,
    );
    act(() => { vi.advanceTimersByTime(200); });
  }

  it('plays nothing while the hero covers the screen and no card is visible', () => {
    mount();
    expect(active()).toEqual([]);
    expect(setAudioFocus).not.toHaveBeenCalledWith('active', 'feed');
  });

  it('plays nothing while the first card only peeks in below the hero', () => {
    mount();
    see({ 0: 0.1 });
    expect(active()).toEqual([]);
  });

  it('plays the first card once it is properly on screen', () => {
    mount();
    see({ 0: 0.5 });
    expect(active()).toEqual(['p0']);
    expect(setAudioFocus).toHaveBeenLastCalledWith('active', 'feed');
  });

  it('stops and releases audio once the member scrolls back up to the hero', () => {
    mount();
    see({ 0: 0.6 });
    expect(active()).toEqual(['p0']);
    see({ 0: 0.1 });
    expect(active()).toEqual([]);
    expect(setAudioFocus).toHaveBeenLastCalledWith(null, 'feed');
    see({ 0: 0 });
    expect(active()).toEqual([]);
  });

  it('keeps playing through the hysteresis band and resumes when back in view', () => {
    mount();
    see({ 0: 0.6 });
    see({ 0: 0.25 });
    expect(active()).toEqual(['p0']);
    see({ 0: 0 });
    expect(active()).toEqual([]);
    see({ 0: 0.7 });
    expect(active()).toEqual(['p0']);
  });

  it('still promotes the centred card while scrolling through the feed', () => {
    mount();
    see({ 0: 0.6 });
    see({ 0: 0, 1: 0.9 });
    expect(active()).toEqual(['p1']);
  });
});
