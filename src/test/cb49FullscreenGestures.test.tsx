import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';

const engine = vi.hoisted(() => ({
  state: 'playing' as string,
  snapshot: vi.fn(),
  pause: vi.fn(),
  play: vi.fn(),
}));
vi.mock('@/video/VideoEngine', () => ({
  VideoEngine: {
    snapshot: engine.snapshot,
    pause: engine.pause,
    play: engine.play,
  },
}));

import { FullscreenScrubber } from '@/components/fullscreen-feed/FullscreenScrubber';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { DOUBLE_TAP_WINDOW_MS } from '@/components/feed/mediaTap';
import { likeOnlyOnDoubleTap } from '@/components/fullscreen-feed/scrubberMath';

const videoPost = { id: 'p1', mediaItems: [{ type: 'video' }] } as any;
const imagePost = { id: 'p2', mediaItems: [{ type: 'image' }] } as any;

function press(type: string, x = 100, y = 100) {
  const target = document.getElementById('media')!;
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
}
const tapOnce = () => { press('pointerdown'); press('pointerup'); };
const paused = () => useFullscreenFeedStore.getState().pausedOwnerKeys;

describe('CB49 fullscreen double-tap like and press-and-hold', () => {
  let onLike: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    engine.state = 'playing';
    engine.snapshot.mockImplementation(() => ({ postId: 'p1:0', state: engine.state }));
    engine.pause.mockImplementation(() => { engine.state = 'paused'; });
    engine.play.mockImplementation(() => { engine.state = 'playing'; return Promise.resolve(); });
    useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null, pausedOwnerKeys: new Set() } as any);
    onLike = vi.fn();
    const media = document.createElement('div'); media.id = 'media';
    document.body.appendChild(media);
  });
  afterEach(() => {
    cleanup(); vi.clearAllMocks(); vi.useRealTimers();
    document.getElementById('media')?.remove();
  });
  const mount = (post = videoPost) =>
    render(<FullscreenScrubber activePost={post} activeIndex={0} onDoubleTapLike={onLike} />);

  it('a double tap likes and shows the burst without toggling playback', () => {
    const { container } = mount();
    act(() => { tapOnce(); tapOnce(); });
    act(() => { vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS + 50); });
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(onLike).toHaveBeenCalledWith(videoPost);
    expect(engine.pause).not.toHaveBeenCalled();
    expect(engine.play).not.toHaveBeenCalled();
    expect(document.querySelector('[data-fs-heart-burst]') ?? container.querySelector('[data-fs-heart-burst]')).not.toBeNull();
  });

  it('a double tap on an image also likes', () => {
    mount(imagePost);
    act(() => { tapOnce(); tapOnce(); });
    expect(onLike).toHaveBeenCalledWith(imagePost);
  });

  it('a single tap toggles only after the double-tap window', () => {
    mount();
    act(() => { tapOnce(); });
    act(() => { vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS - 1); });
    expect(engine.pause).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(engine.pause).toHaveBeenCalledTimes(1);
    expect(paused().has('p1:0')).toBe(true);
    expect(onLike).not.toHaveBeenCalled();
  });

  it('a hold pauses and release resumes a playing video, without pausedOwnerKeys', () => {
    mount();
    act(() => { press('pointerdown'); vi.advanceTimersByTime(300); });
    expect(engine.pause).toHaveBeenCalledTimes(1);
    expect(paused().has('p1:0')).toBe(false);
    act(() => { press('pointerup'); });
    expect(engine.play).toHaveBeenCalledTimes(1);
    expect(engine.state).toBe('playing');
    expect(paused().size).toBe(0);
  });

  it('a hold on a paused video leaves it paused on release', () => {
    engine.state = 'paused';
    mount();
    act(() => { press('pointerdown'); vi.advanceTimersByTime(300); press('pointerup'); });
    expect(engine.pause).not.toHaveBeenCalled();
    expect(engine.play).not.toHaveBeenCalled();
    expect(engine.state).toBe('paused');
  });

  it('the pointer-up ending a hold is not a tap and starts no double-tap', () => {
    mount();
    act(() => { press('pointerdown'); vi.advanceTimersByTime(300); press('pointerup'); });
    // A following tap must be a fresh single tap, not the second half of a double.
    act(() => { tapOnce(); vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS + 10); });
    expect(onLike).not.toHaveBeenCalled();
    expect(engine.pause).toHaveBeenCalledTimes(2); // hold + the single tap
    expect(engine.play).toHaveBeenCalledTimes(1);  // hold release only
  });

  it('movement after the hold fired still restores the pre-hold state', () => {
    mount();
    act(() => { press('pointerdown'); vi.advanceTimersByTime(300); press('pointermove', 160, 100); press('pointerup', 160, 100); });
    expect(engine.state).toBe('playing');
  });
});

describe('CB49 double-tap never unlikes', () => {
  it('likes when unliked and leaves an existing like in place', () => {
    const like = vi.fn();
    expect(likeOnlyOnDoubleTap(true, like)).toBe(false);
    expect(like).not.toHaveBeenCalled();
    expect(likeOnlyOnDoubleTap(false, like)).toBe(true);
    expect(like).toHaveBeenCalledTimes(1);
  });
});
