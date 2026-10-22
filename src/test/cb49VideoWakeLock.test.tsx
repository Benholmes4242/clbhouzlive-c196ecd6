import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/store/fullscreenFeedStore', async () => {
  const { create } = await import('zustand');
  const useFullscreenFeedStore = create(() => ({ isOpen: false, borrow: null }));
  return { useFullscreenFeedStore };
});
import { VideoEngine, type LaneId } from '@/video/VideoEngine';
import { useVideoWakeLock, RELEASE_GRACE_MS } from '@/video/useVideoWakeLock';

async function start(id: LaneId, policy: 'session' | 'always-muted') {
  VideoEngine.mountLane(id, document.body.appendChild(document.createElement('div')));
  VideoEngine.setAudioPolicy(id, policy);
  VideoEngine.load(id, { hlsUrl: 'https://example.test/v.m3u8', postId: `${id}:0` });
  await VideoEngine.play(id, { callerPostId: `${id}:0` });
}

describe('CB49 any-lane-playing aggregate and wake lock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, 'paused', { configurable: true, value: false });
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, 'paused', { configurable: true, value: true });
      this.dispatchEvent(new Event('pause'));
    });
    VideoEngine.boot();
    VideoEngine.pauseAll();
  });
  afterEach(() => { VideoEngine.pauseAll(); vi.restoreAllMocks(); vi.useRealTimers(); });

  it('ignores always-muted lanes', async () => {
    await start('rail-0', 'always-muted');
    expect(VideoEngine.isAnyLanePlaying()).toBe(false);
    await start('fullscreen', 'session');
    expect(VideoEngine.isAnyLanePlaying()).toBe(true);
  });

  it('acquires on play and releases only after the 2-second grace', async () => {
    const release = vi.fn(() => Promise.resolve());
    const request = vi.fn(() => Promise.resolve({ release, addEventListener: vi.fn() }));
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
    renderHook(() => useVideoWakeLock());
    expect(request).not.toHaveBeenCalled();
    await start('fullscreen', 'session');
    await vi.advanceTimersByTimeAsync(0);
    expect(request).toHaveBeenCalledTimes(1);
    VideoEngine.pauseAll();
    expect(VideoEngine.isAnyLanePlaying()).toBe(false);
    await vi.advanceTimersByTimeAsync(RELEASE_GRACE_MS - 1);
    expect(release).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(release).toHaveBeenCalledTimes(1);
    expect(RELEASE_GRACE_MS).toBe(2000);
  });
});
