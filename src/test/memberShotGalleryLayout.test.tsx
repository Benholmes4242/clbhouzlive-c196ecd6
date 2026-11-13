import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { FeedSlide, resolveViewerRect } from '@/components/feed/FeedSlide';
import { usesGalleryLayout } from '@/lib/media/galleryLayout';
import { resolveRestingRect } from '@/lib/media/resolveRestingRect';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));
vi.mock('@/hooks/usePostViewTracker', () => ({ usePostViewTracker: () => () => {} }));
vi.mock('@/lib/media/resolveRestingRect', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/media/resolveRestingRect')>();
  return { ...actual, getCurrentViewport: () => ({ w: 390, h: 844, safeTop: 59, safeBottom: 90, safeLeft: 0, safeRight: 0 }) };
});

const vp = { w: 390, h: 844, safeTop: 59, safeBottom: 90, safeLeft: 0, safeRight: 0 };
const post: FeedPost = {
  id: 'member-shot-gallery', userId: 'member', actorType: 'personal', actorId: 'member', username: 'member', displayName: 'Member',
  avatarUrl: '', isVerified: false, creatorRelation: 'none', caption: '', createdAt: '2026-11-13T00:00:00Z',
  likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false,
  mediaItems: [{ id: 'portrait', type: 'image', imageUrl: '/gallery-fixture.jpg', width: 1080, height: 1920 }],
};
const original = useFullscreenFeedStore.getState();
beforeEach(() => useFullscreenFeedStore.setState({ openedFrom: 'course-media', syntheticPosts: true, courseGallery: null }));
afterEach(() => {
  cleanup();
  useFullscreenFeedStore.setState({ openedFrom: original.openedFrom, syntheticPosts: original.syntheticPosts, courseGallery: original.courseGallery });
});

describe('member-shot gallery layout', () => {
  it('uses gallery layout for synthetic shots without courseGallery', () => {
    expect(usesGalleryLayout({ courseGallery: null, syntheticPosts: true })).toBe(true);
  });
  it('uses gallery layout for the course media gallery', () => {
    expect(usesGalleryLayout({ courseGallery: {}, syntheticPosts: true })).toBe(true);
    expect(usesGalleryLayout({ courseGallery: {}, syntheticPosts: false })).toBe(true);
  });
  it('does not use gallery layout for ordinary feed posts', () => {
    expect(usesGalleryLayout({ courseGallery: null, syntheticPosts: false })).toBe(false);
  });
  it('fills the full 390x844 viewport with portrait cover, ignoring safeTop 59', () => {
    expect(resolveViewerRect(1080, 1920, vp, 'image')).toEqual({ top: 0, left: 0, width: 390, height: 844, fit: 'cover' });
  });
  it('centres landscape video in the full viewport with contain', () => {
    expect(resolveViewerRect(1920, 1080, vp, 'video')).toEqual({ top: 0, left: 0, width: 390, height: 844, fit: 'contain' });
  });
  it.each([[1080, 1920, 'image'], [1920, 1080, 'video']] as const)('preserves ordinary feed resting geometry for %ix%i %s', (width, height, type) => {
    useFullscreenFeedStore.setState({ syntheticPosts: false });
    const resting = resolveRestingRect(width, height, vp, type);
    expect(resolveViewerRect(width, height, vp, type)).toEqual(resting);
    expect(resting).not.toEqual({ top: 0, left: 0, width: 390, height: 844, fit: 'cover' });
  });
  it('preserves the about-strip full-viewport exception without synthetic posts', () => {
    useFullscreenFeedStore.setState({ syntheticPosts: false, openedFrom: 'about-strip' });
    expect(resolveViewerRect(1080, 1920, vp, 'image')).toEqual({ top: 0, left: 0, width: 390, height: 844, fit: 'cover' });
  });
  it('renders synthetic fullscreen gallery media without the notch scrim and reacts to store changes', () => {
    const { container } = render(<FeedSlide post={post} index={0} activeIndexOverride={0} setRef={() => {}} activeTab="foryou"
      followOverrides={new Map()} onFollowChange={() => {}} isFullscreen />);
    expect(container.querySelector('[data-index="0"]')).toHaveClass('course-gallery-slide');
    expect(container.querySelector('.course-gallery-media-gradient')).not.toBeNull();
    expect(container.querySelector('[data-fullscreen-notch-scrim]')).toBeNull();
    const backdrop = container.querySelector('img[loading="lazy"]') as HTMLImageElement | null;
    expect(backdrop?.style.inset).toBe('-40px');
    expect(backdrop?.style.width).toBe('calc(100% + 80px)');
    expect(backdrop?.style.height).toBe('calc(100% + 80px)');
    expect(backdrop?.style.filter).toBe('blur(36px) brightness(0.45) saturate(1.2)');
    act(() => useFullscreenFeedStore.setState({ syntheticPosts: false }));
    expect(container.querySelector('[data-index="0"]')).not.toHaveClass('course-gallery-slide');
    expect(container.querySelector('.course-gallery-media-gradient')).toBeNull();
    expect(container.querySelector('[data-fullscreen-notch-scrim]')).not.toBeNull();
    expect(backdrop?.style.inset).toBe('0');
    expect(backdrop?.style.filter).toBe('blur(40px) brightness(0.5) saturate(1.2)');
  });
});