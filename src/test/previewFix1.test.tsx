import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  laneLoad: vi.fn(),
  useVideoLane: vi.fn(() => ({ hostRef: { current: null }, snapshot: null })),
  feedCard: vi.fn(),
}));

vi.mock('@/video/useVideoLane', () => ({ useVideoLane: h.useVideoLane }));
vi.mock('@/video/VideoEngine', () => ({
  VideoEngine: {
    load: h.laneLoad,
    snapshot: () => ({ postId: null, currentTime: 0, firstFrame: false, duration: 0 }),
    getLastPos: () => -1,
    pause: vi.fn(),
  },
}));
vi.mock('@/video/feedLaneRoles', () => ({ feedLaneRoles: { subscribe: () => () => {}, laneForRole: () => null } }));
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
  FeedCard: (p: { post: unknown }) => { h.feedCard(p); return <div data-testid="feed-card" />; },
}));

import { InlineVideo } from '@/components/feed/InlineVideo';
import { buildDraftFeedPost, PostPreview } from '@/features/post-v2/components/golf/PostPreview';
import type { StageMediaItem } from '@/features/post-v2/hooks/useStageComposer';

const actor = { id: 'a1', type: 'personal' as const, name: 'Ann', avatarUrl: null, username: 'ann' };
const mediaItem = (over: Partial<StageMediaItem>): StageMediaItem => ({
  id: 'm1', type: 'video', previewUrl: 'blob:local-1', ...over,
} as StageMediaItem);

beforeEach(() => {
  h.laneLoad.mockClear();
  h.useVideoLane.mockClear();
  h.feedCard.mockClear();
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => cleanup());

describe('InlineVideo local blob branch', () => {
  it('a blob: mp4Url with no hlsUrl renders a native video with the blob src and never touches the engine', () => {
    const view = render(<InlineVideo item={{ id: 'v1', type: 'video', mp4Url: 'blob:draft-1', width: 1080, height: 1920, displayOrder: 0 } as never} isActive isNear={false} />);
    const video = view.container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video!.getAttribute('src')).toBe('blob:draft-1');
    expect(video!.muted).toBe(true);
    expect(video!.loop).toBe(true);
    expect(video!.playsInline).toBe(true);
    expect(h.laneLoad).not.toHaveBeenCalled();
    expect(h.useVideoLane).not.toHaveBeenCalled();
  });

  it('plays when isActive and pauses when not', () => {
    const item = { id: 'v1', type: 'video', mp4Url: 'blob:draft-1', width: 1080, height: 1920, displayOrder: 0 } as never;
    const view = render(<InlineVideo item={item} isActive isNear={false} />);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    view.rerender(<InlineVideo item={item} isActive={false} isNear={false} />);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it('calls onFirstFrameReady on the first loadeddata only', () => {
    const onFirstFrameReady = vi.fn();
    const view = render(<InlineVideo item={{ id: 'v1', type: 'video', mp4Url: 'blob:draft-1', width: 1080, height: 1920, displayOrder: 0 } as never} isActive isNear={false} onFirstFrameReady={onFirstFrameReady} />);
    const video = view.container.querySelector('video')!;
    video.dispatchEvent(new Event('loadeddata'));
    video.dispatchEvent(new Event('loadeddata'));
    expect(onFirstFrameReady).toHaveBeenCalledTimes(1);
  });

  it('an item with hlsUrl takes the existing engine path unchanged', () => {
    const view = render(<InlineVideo item={{ id: 'v1', type: 'video', hlsUrl: 'https://stream.test/x.m3u8', width: 1080, height: 1350, displayOrder: 0 } as never} isActive isNear={false} />);
    expect(view.container.querySelector('video')).toBeNull();
    expect(h.useVideoLane).toHaveBeenCalled();
  });
});

describe('buildDraftFeedPost video mapping', () => {
  it('a video with a streamId maps to hlsUrl from generateStreamHlsUrl and no mp4Url', () => {
    const post = buildDraftFeedPost({ caption: '', media: [mediaItem({ streamId: 's'.repeat(32), posterUrl: 'p.jpg' })], course: null, actor, userId: 'u1' });
    const item = post.mediaItems[0] as Record<string, unknown>;
    expect(item.hlsUrl).toBe(`https://videodelivery.net/${'s'.repeat(32)}/manifest/video.m3u8`);
    expect(item.mp4Url).toBeUndefined();
    expect(item.thumbnailUrl).toBe('p.jpg');
  });

  it('a new local video maps to its blob mp4Url and no hlsUrl', () => {
    const post = buildDraftFeedPost({ caption: '', media: [mediaItem({})], course: null, actor, userId: 'u1' });
    const item = post.mediaItems[0] as Record<string, unknown>;
    expect(item.mp4Url).toBe('blob:local-1');
    expect(item.hlsUrl).toBeUndefined();
  });

  it('an image is unchanged', () => {
    const post = buildDraftFeedPost({ caption: '', media: [mediaItem({ type: 'image', previewUrl: 'blob:img-1', naturalWidth: 800, naturalHeight: 1000 })], course: null, actor, userId: 'u1' });
    const item = post.mediaItems[0] as Record<string, unknown>;
    expect(item.imageUrl).toBe('blob:img-1');
    expect(item.width).toBe(800);
    expect(item.height).toBe(1000);
    expect(item.mp4Url).toBeUndefined();
    expect(item.hlsUrl).toBeUndefined();
  });
});

describe('PostPreview probed video dimensions', () => {
  const draftPost = () => buildDraftFeedPost({ caption: '', media: [mediaItem({})], course: null, actor, userId: 'u1' });

  it('a local video whose metadata reports 1080×1920 frames the card at 9:16', async () => {
    const realCreate = document.createElement.bind(document);
    const spy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag !== 'video') return realCreate(tag as 'div');
      const fake: Record<string, unknown> = {
        preload: '', muted: false, playsInline: false, src: '',
        videoWidth: 1080, videoHeight: 1920,
        onloadedmetadata: null, onerror: null,
        removeAttribute: vi.fn(), load: vi.fn(),
      };
      queueMicrotask(() => (fake.onloadedmetadata as (() => void) | null)?.());
      return fake;
    }) as typeof document.createElement);
    try {
      render(<PostPreview open onBack={() => {}} post={draftPost()} tags={{}} pars={new Map()} withPeople={[]} />);
      await vi.waitFor(() => expect(h.feedCard).toHaveBeenCalled());
      const item = (h.feedCard.mock.calls[0][0] as { post: { mediaItems: { width: number; height: number }[] } }).post.mediaItems[0];
      expect(item.width).toBe(1080);
      expect(item.height).toBe(1920);
    } finally {
      spy.mockRestore();
    }
  });

  it('with no metadata within 1500ms it falls back to 1080×1350', () => {
    vi.useFakeTimers();
    try {
      const realCreate = document.createElement.bind(document);
      const spy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
        if (tag !== 'video') return realCreate(tag as 'div');
        return { preload: '', muted: false, playsInline: false, src: '', videoWidth: 0, videoHeight: 0, onloadedmetadata: null, onerror: null, removeAttribute: vi.fn(), load: vi.fn() };
      }) as typeof document.createElement);
      try {
        render(<PostPreview open onBack={() => {}} post={draftPost()} tags={{}} pars={new Map()} withPeople={[]} />);
        expect(h.feedCard).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(1500); });
        expect(h.feedCard).toHaveBeenCalled();
        const item = (h.feedCard.mock.calls[0][0] as { post: { mediaItems: { width: number; height: number }[] } }).post.mediaItems[0];
        expect(item.width).toBe(1080);
        expect(item.height).toBe(1350);
      } finally {
        spy.mockRestore();
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('a photo-only draft renders the card immediately with no probe', () => {
    const post = buildDraftFeedPost({ caption: '', media: [mediaItem({ type: 'image', previewUrl: 'blob:img-1' })], course: null, actor, userId: 'u1' });
    render(<PostPreview open onBack={() => {}} post={post} tags={{}} pars={new Map()} withPeople={[]} />);
    expect(h.feedCard).toHaveBeenCalled();
  });
});
