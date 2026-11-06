import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  laneLoad: vi.fn(),
  useVideoLane: vi.fn(() => ({ hostRef: { current: null }, snapshot: null })),
  feedCardImpl: { current: null as null | ((p: { post: never }) => React.ReactNode) },
}));

vi.mock('@/video/useVideoLane', () => ({ useVideoLane: h.useVideoLane }));
vi.mock('@/video/VideoEngine', () => ({
  VideoEngine: {
    load: h.laneLoad,
    snapshot: () => ({ postId: null, currentTime: 0, firstFrame: false, duration: 0 }),
    getLastPos: () => -1,
    pause: vi.fn(),
    preload: vi.fn(),
    isAnyLaneLoading: () => false,
  },
}));
vi.mock('@/video/feedLaneRoles', () => ({
  feedLaneRoles: {
    subscribe: () => () => {},
    laneForRole: () => null,
    snapshot: () => ({ active: null, next: null, prev: null, frozen: [] }),
    rotate: vi.fn(() => null),
    roleForLane: () => null,
  },
  carouselNeighbourOverride: { set: vi.fn(), clear: vi.fn() },
}));
vi.mock('@/video/PrefetchController', () => ({ PrefetchController: { request: vi.fn(), wasPrefetched: () => false } }));
vi.mock('@/video/originHostRegistry', () => ({ originHostRegistry: { register: vi.fn(), unregister: vi.fn() } }));
vi.mock('@/store/clubhouseStore', () => ({ useClubhouseStore: () => ({}) }));
vi.mock('@/audio/MuteButton', () => ({ MuteButton: () => null }));
vi.mock('@/components/media/BufferingSpinner', () => ({ BufferingSpinner: () => null }));
vi.mock('@/components/feed/VideoProcessingCard', () => ({ VideoProcessingCard: () => null }));
vi.mock('@/perf/vperf', () => ({
  vperfMarkEarlyStarted: vi.fn(), vperfCardFraction: vi.fn(() => 0), vperfCardEarlyStart: vi.fn(),
  vperfCardFirstMotion: vi.fn(), vperfCardPromoted: vi.fn(), vperfCardReleased: vi.fn(),
  vperfHandoverStart: vi.fn(), vperfHandoverFrame: vi.fn(),
}));
vi.mock('@/perf/navTiming', () => ({ isPerfEnabled: () => false }));
vi.mock('@/components/feed/FeedCard', () => ({
  FeedCard: (p: { post: never }) => (h.feedCardImpl.current ? h.feedCardImpl.current(p) : <div data-testid="feed-card" />),
}));

import { InlineVideo } from '@/components/feed/InlineVideo';
import { MediaCarousel } from '@/components/feed/MediaCarousel';
import { buildDraftFeedPost, PostPreview } from '@/features/post-v2/components/golf/PostPreview';
import type { StageMediaItem } from '@/features/post-v2/hooks/useStageComposer';

const actor = { id: 'a1', type: 'personal' as const, name: 'Ann', avatarUrl: null, username: 'ann' };
const photoDraft = () => buildDraftFeedPost({
  caption: '',
  media: [{ id: 'm1', type: 'image', previewUrl: 'blob:img-1', naturalWidth: 800, naturalHeight: 1000 } as StageMediaItem],
  course: null, actor, userId: 'u1',
});
const blobItem = { id: 'v1', type: 'video', mp4Url: 'blob:draft-1', width: 1080, height: 1920, displayOrder: 0 } as never;

beforeEach(() => {
  h.laneLoad.mockClear();
  h.useVideoLane.mockClear();
  h.feedCardImpl.current = null;
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => cleanup());

describe('PostPreview touch and navigation guards (FIX 1)', () => {
  it('no ancestor of the card has pointer-events none', () => {
    const view = render(<PostPreview open onBack={() => {}} post={photoDraft()} tags={{}} pars={new Map()} withPeople={[]} />);
    const card = view.getByTestId('feed-card');
    const root = view.getByTestId('post-preview');
    let el: HTMLElement | null = card.parentElement;
    while (el) {
      expect(el.style.pointerEvents).not.toBe('none');
      if (el === root) break;
      el = el.parentElement;
    }
  });

  it('a click on an a[href] inside the card is prevented', () => {
    h.feedCardImpl.current = () => <a href="/course/x">A course</a>;
    const view = render(<PostPreview open onBack={() => {}} post={photoDraft()} tags={{}} pars={new Map()} withPeople={[]} />);
    const link = view.getByText('A course');
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('a swipe on a two-item draft changes the active slide and plays the video slide', () => {
    vi.useFakeTimers();
    const raf = window.requestAnimationFrame;
    const caf = window.cancelAnimationFrame;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => { cb(0); return 0; }) as never;
    window.cancelAnimationFrame = (() => {}) as never;
    const origScrollTo = window.HTMLElement.prototype.scrollTo;
    window.HTMLElement.prototype.scrollTo = vi.fn() as never;
    try {
      const post = buildDraftFeedPost({
        caption: '',
        media: [
          { id: 'm1', type: 'image', previewUrl: 'blob:img-1', naturalWidth: 800, naturalHeight: 1000 },
          { id: 'm2', type: 'video', previewUrl: 'blob:vid-1' },
        ] as StageMediaItem[],
        course: null, actor, userId: 'u1',
      });
      const onIndexChange = vi.fn();
      h.feedCardImpl.current = (p) => (
        <MediaCarousel
          items={(p.post as { mediaItems: never[] }).mediaItems}
          isCardActive
          initialIndex={0}
          mountVideo
          postId={(p.post as { id: string }).id}
          onIndexChange={onIndexChange}
          onOpen={() => {}}
        />
      );
      const view = render(<PostPreview open onBack={() => {}} post={post} tags={{}} pars={new Map()} withPeople={[]} />);
      // The blob-video dimension probe holds the card for up to 1500ms.
      act(() => { vi.advanceTimersByTime(1500); });
      const track = view.container.querySelector('[style*="scroll-snap-type"]') as HTMLElement | null;
      expect(track).not.toBeNull();
      Object.defineProperty(track, 'clientWidth', { value: 390, configurable: true });
      track!.scrollLeft = 390;
      fireEvent.scroll(track!);
      act(() => { vi.advanceTimersByTime(200); });
      expect(onIndexChange).toHaveBeenCalledWith(1);
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    } finally {
      window.requestAnimationFrame = raf;
      window.cancelAnimationFrame = caf;
      window.HTMLElement.prototype.scrollTo = origScrollTo;
      vi.useRealTimers();
    }
  });
});

describe('LocalBlobVideo playback hardening (FIX 2)', () => {
  it('primes muted, defaultMuted and playsInline imperatively before play()', () => {
    const view = render(<InlineVideo item={blobItem} isActive isNear={false} />);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    const video = view.container.querySelector('video')!;
    expect(video.muted).toBe(true);
    expect(video.defaultMuted).toBe(true);
    expect(video.playsInline).toBe(true);
  });

  it('a rejected play() retries once on canplay', async () => {
    const play = window.HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>;
    play.mockRejectedValueOnce(new Error('NotAllowedError'));
    const view = render(<InlineVideo item={blobItem} isActive isNear={false} />);
    await act(async () => { /* flush the rejection */ });
    const video = view.container.querySelector('video')!;
    act(() => { video.dispatchEvent(new Event('canplay')); });
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('after 2000ms without playing a tap-to-play button shows; the tap plays and playing hides it', () => {
    vi.useFakeTimers();
    try {
      const play = window.HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>;
      const view = render(<InlineVideo item={blobItem} isActive isNear={false} />);
      const video = view.container.querySelector('video')!;
      expect(view.queryByLabelText('Play video')).toBeNull();
      act(() => { vi.advanceTimersByTime(2000); });
      const btn = view.getByLabelText('Play video');
      const calls = play.mock.calls.length;
      fireEvent.click(btn);
      expect(play.mock.calls.length).toBe(calls + 1);
      act(() => { video.dispatchEvent(new Event('playing')); });
      expect(view.queryByLabelText('Play video')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('isActive false pauses', () => {
    const view = render(<InlineVideo item={blobItem} isActive isNear={false} />);
    view.rerender(<InlineVideo item={blobItem} isActive={false} isNear={false} />);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
});

describe('PostPreview Share footer (PV1)', () => {
  const share = (onShare: () => void) => ({
    label: 'Share', subLine: 'Shares to your Clubhouse feed', disabled: false, busy: false, onShare,
  });

  it('renders the composer Share pill and sub-line, and tapping it posts through onShare', () => {
    const onShare = vi.fn();
    const view = render(<PostPreview open onBack={() => {}} post={photoDraft()} tags={{}} pars={new Map()} withPeople={[]} share={share(onShare)} />);
    const sub = view.getByTestId('share-sub');
    expect(sub.textContent).toBe('Shares to your Clubhouse feed');
    const pill = sub.previousElementSibling as HTMLButtonElement;
    expect(pill.textContent).toBe('Share');
    fireEvent.click(pill);
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('the footer is pinned to the preview root, outside the scrolling card area', () => {
    const view = render(<PostPreview open onBack={() => {}} post={photoDraft()} tags={{}} pars={new Map()} withPeople={[]} share={share(() => {})} />);
    const root = view.getByTestId('post-preview');
    const footer = view.getByTestId('share-sub').parentElement!;
    expect(footer.parentElement).toBe(root);
    expect(root.style.display).toBe('flex');
    expect(root.style.flexDirection).toBe('column');
  });

  it('Back still returns to the composer', () => {
    const onBack = vi.fn();
    const view = render(<PostPreview open onBack={onBack} post={photoDraft()} tags={{}} pars={new Map()} withPeople={[]} share={share(() => {})} />);
    fireEvent.click(view.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
