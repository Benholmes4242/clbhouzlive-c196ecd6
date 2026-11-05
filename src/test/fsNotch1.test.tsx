import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { FeedSlide } from '@/components/feed/FeedSlide';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));
vi.mock('@/hooks/usePostViewTracker', () => ({ usePostViewTracker: () => () => {} }));
vi.mock('@/lib/media/resolveRestingRect', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/media/resolveRestingRect')>();
  return { ...actual, getCurrentViewport: () => ({ w: 390, h: 844, safeTop: 47, safeBottom: 90, safeLeft: 0, safeRight: 0 }) };
});

const photo = (width: number, height: number): MediaItem => ({ id: `${width}-${height}`, type: 'image', imageUrl: '/notch-fixture.jpg', width, height });
const post = (mediaItems: MediaItem[]): FeedPost => ({
  id: 'notch-post', userId: 'member', actorType: 'personal', actorId: 'member', username: 'member', displayName: 'Member',
  avatarUrl: '', isVerified: false, creatorRelation: 'none', caption: '', mediaItems, createdAt: '2026-11-05T00:00:00Z',
  likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false,
});
function mount(mediaItems: MediaItem[], isFullscreen = true) {
  return render(<FeedSlide post={post(mediaItems)} index={0} activeIndexOverride={0} setRef={() => {}} activeTab="foryou"
    followOverrides={new Map()} onFollowChange={() => {}} isFullscreen={isFullscreen} />);
}

beforeEach(() => useFullscreenFeedStore.setState({ courseGallery: null, syntheticPosts: false }));
afterEach(() => { cleanup(); useFullscreenFeedStore.setState({ courseGallery: null, syntheticPosts: false }); });

describe('FS_NOTCH_1 mounted slides', () => {
  it('renders the scrim inside a top-0 portrait slide', () => {
    const { container } = mount([photo(900, 1600)]);
    const scrim = container.querySelector('[data-fullscreen-notch-scrim]');
    expect(scrim).not.toBeNull();
    expect(scrim?.closest('[data-index="0"]')).not.toBeNull();
    const image = container.querySelector('img[decoding="async"]');
    expect(image?.parentElement?.style.top).toBe('0px');
    expect(image?.parentElement?.style.height).toBe('693.3333333333334px');
    expect((image as HTMLImageElement | null)?.style.objectFit).toBe('contain');
  });

  it.each([[1080, 1350], [1600, 900]])('omits the scrim for centred %i×%i media', (width, height) => {
    const { container } = mount([photo(width, height)]);
    expect(container.querySelector('[data-fullscreen-notch-scrim]')).toBeNull();
  });

  it('omits the scrim on inline portrait media', () => {
    const { container } = mount([photo(900, 1600)], false);
    expect(container.querySelector('[data-fullscreen-notch-scrim]')).toBeNull();
  });

  it('keeps the course gallery top-0 path free of the notch scrim', () => {
    useFullscreenFeedStore.setState({ courseGallery: {} as NonNullable<ReturnType<typeof useFullscreenFeedStore.getState>['courseGallery']> });
    const { container } = mount([photo(900, 1600)]);
    expect(container.querySelector('[data-fullscreen-notch-scrim]')).toBeNull();
    expect(container.querySelector('.course-gallery-media-gradient')).not.toBeNull();
  });

  it('renders the scrim only on the bleeding page of a mixed-aspect pager', () => {
    const { container } = mount([photo(900, 1600), photo(1080, 1350)]);
    expect(container.querySelectorAll('[data-fullscreen-notch-scrim]')).toHaveLength(1);
    expect(container.querySelector('[data-fullscreen-notch-scrim]')?.parentElement?.querySelector('img')?.style.objectFit).toBe('contain');
  });
});