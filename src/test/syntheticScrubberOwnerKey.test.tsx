import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import type { FeedPost } from '@/components/media-system/types/media';

const engine = vi.hoisted(() => ({ snapshot: vi.fn() }));
vi.mock('@/video/VideoEngine', () => ({ VideoEngine: { snapshot: engine.snapshot } }));

import { expectedOwnerKey } from '@/components/fullscreen-feed/scrubberMath';
import { FullscreenVideoScrubber } from '@/components/fullscreen-feed/FullscreenVideoScrubber';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

const realId = '12345678-1234-1234-1234-123456789abc';

describe('BRIEF_SYNTHETIC_SCRUBBER_OWNER_KEY helper', () => {
  it('appends slide 3 to the Latest holes synthetic post id', () => {
    expect(expectedOwnerKey('shots:latest-holes', 3)).toBe('shots:latest-holes:3');
  });
  it('appends slide 0 to a hole synthetic post id', () => {
    expect(expectedOwnerKey('shots:hole:c1:9', 0)).toBe('shots:hole:c1:9:0');
  });
  it('preserves the real UUID owner-key format', () => {
    expect(expectedOwnerKey(realId, 2)).toBe(`${realId}:2`);
  });
  it('returns null for an empty post id', () => {
    expect(expectedOwnerKey('', 0)).toBeNull();
  });
  it('defaults a missing slide index to zero', () => {
    expect(expectedOwnerKey('shots:latest-holes')).toBe('shots:latest-holes:0');
    expect(expectedOwnerKey(realId, null)).toBe(`${realId}:0`);
  });
});

describe('FullscreenVideoScrubber owner progress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useFullscreenFeedStore.setState({ activePagerIdx: 1, borrow: null });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
    useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null, syntheticPosts: false });
  });
  it.each([
    ['synthetic', 'shots:latest-holes', true],
    ['real', realId, false],
  ] as const)('writes half progress for slide 1 of a %s post', (_kind, id, syntheticPosts) => {
    useFullscreenFeedStore.setState({ syntheticPosts });
    engine.snapshot.mockReturnValue({ postId: `${id}:1`, currentTime: 5, duration: 10, state: 'playing' });
    const post = { id, mediaItems: [{ id: 'first', type: 'video' }, { id: 'second', type: 'video' }] } as FeedPost;
    render(<FullscreenVideoScrubber activePost={post} bottom="env(safe-area-inset-bottom, 0px)" onDraggingChange={() => {}} />);
    act(() => { vi.advanceTimersByTime(32); });
    expect(engine.snapshot).toHaveBeenCalledWith('fullscreen');
    expect(screen.getByRole('slider', { name: 'Video position' }).style.getPropertyValue('--fs-progress')).toBe('0.5');
  });
});