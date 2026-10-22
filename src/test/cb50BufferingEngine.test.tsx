import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/store/fullscreenFeedStore', async () => {
  const { create } = await import('zustand');
  return { useFullscreenFeedStore: create(() => ({ isOpen: false, borrow: null, activePagerIdx: 0, closeAnim: 'idle' })) };
});
import { VideoEngine } from '@/video/VideoEngine';
import { BufferingSpinner } from '@/components/media/BufferingSpinner';
import { FullscreenBuffering } from '@/components/fullscreen-feed/FullscreenBuffering';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { feedLaneRoles } from '@/video/feedLaneRoles';
import type { FeedPost } from '@/components/media-system/types/media';

const owner = 'cb50:0';
async function start() {
  VideoEngine.mountLane('feed-active', document.body.appendChild(document.createElement('div')));
  VideoEngine.load('feed-active', { hlsUrl: 'https://example.test/cb50.m3u8', postId: owner });
  VideoEngine.resetFirstFrame('feed-active');
  const el = VideoEngine._debugGetElement('feed-active');
  if (!el) throw new Error('Missing lane');
  el.currentTime = 0;
  await VideoEngine.play('feed-active', { callerPostId: owner });
  return el;
}
describe('CB50 engine and active presentation integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
      Object.defineProperty(this, 'paused', { configurable: true, value: false }); return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
      Object.defineProperty(this, 'paused', { configurable: true, value: true }); this.dispatchEvent(new Event('pause'));
    });
    VideoEngine.boot(); VideoEngine.pauseAll(); feedLaneRoles.__resetForTests();
    useFullscreenFeedStore.setState({ isOpen: false, borrow: null, activePagerIdx: 0 });
  });
  afterEach(() => { cleanup(); VideoEngine.pauseAll(); vi.restoreAllMocks(); vi.useRealTimers(); });
  it('snapshot measures a start without waiting and timeupdate clears it immediately', async () => {
    const el = await start(); vi.advanceTimersByTime(499); expect(VideoEngine.snapshot('feed-active').buffering).toBe(false);
    vi.advanceTimersByTime(1); expect(VideoEngine.snapshot('feed-active').buffering).toBe(true);
    el.currentTime = 0.2; el.dispatchEvent(new Event('timeupdate')); expect(VideoEngine.snapshot('feed-active').buffering).toBe(false);
  });
  it.each(['tap', 'hold', 'all', 'hidden'] as const)('%s pause clears buffering without changing gesture implementation', async (kind) => {
    await start(); vi.advanceTimersByTime(500);
    if (kind === 'all') VideoEngine.pauseAll();
    else if (kind === 'hidden') {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
    } else VideoEngine.pause('feed-active', { callerPostId: owner, viaViewer: true });
    expect(VideoEngine.snapshot('feed-active').buffering).toBe(false);
  });
  it('only active matching inline owner renders; inactive and recycled owners never do', async () => {
    await start();
    const result = render(<BufferingSpinner laneId="feed-active" ownerKey={owner} active />);
    act(() => vi.advanceTimersByTime(500)); expect(result.container.querySelector('[data-video-buffering="inline"]')).not.toBeNull();
    result.rerender(<BufferingSpinner laneId="feed-active" ownerKey={owner} active={false} />);
    expect(result.container.querySelector('[data-video-buffering]')).toBeNull();
    result.rerender(<BufferingSpinner laneId="feed-active" ownerKey="other:0" active />);
    expect(result.container.querySelector('[data-video-buffering]')).toBeNull();
  });
  it('fullscreen observes active borrowed lane only, not a photo or closed viewer', async () => {
    await start();
    const post = { id: 'cb50', mediaItems: [{ type: 'video' }, { type: 'image' }] } as FeedPost;
    useFullscreenFeedStore.setState({ isOpen: true, borrow: { laneId: 'feed-active', postId: 'cb50', ownerKey: 'cb50:0', posterUrl: null, viewportW: 390, viewportH: 844 } });
    const result = render(<FullscreenBuffering activePost={post} />);
    act(() => vi.advanceTimersByTime(500)); expect(result.container.querySelector('[data-video-buffering="fullscreen"]')).not.toBeNull();
    act(() => useFullscreenFeedStore.setState({ activePagerIdx: 1 })); expect(result.container.querySelector('[data-video-buffering]')).toBeNull();
    act(() => useFullscreenFeedStore.setState({ activePagerIdx: 0, isOpen: false })); expect(result.container.querySelector('[data-video-buffering]')).toBeNull();
  });
  it('a slow tap-to-play starts buffering only after the unchanged 400ms flash expires', async () => {
    await start(); VideoEngine.pause('feed-active', { viaViewer: true });
    await VideoEngine.play('feed-active', { callerPostId: owner, viaViewer: true });
    vi.advanceTimersByTime(400); expect(VideoEngine.snapshot('feed-active').buffering).toBe(false);
    vi.advanceTimersByTime(100); expect(VideoEngine.snapshot('feed-active').buffering).toBe(true);
  });
});