/** Real FeedCard sizing contract; only playback/data collaborators are stubbed. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/store/clubhouseStore', () => ({ useClubhouseStore: (sel: (s: unknown) => unknown) => sel({ carouselPositions: new Map(), carouselPositionsByTab: {} }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: () => vi.fn() }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => new Set(), useTeamBusinessIds: () => new Set() }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => null }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: ({ maxHeight }: { maxHeight?: string }) => <div data-carousel style={{ maxHeight }} /> }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: ({ objectFit }: { objectFit?: React.CSSProperties['objectFit'] }) => <video data-inline-video style={{ objectFit }} /> }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/ExploreCard', () => ({ ExploreCard: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));

import { FeedCard } from '@/components/feed/FeedCard';
import { clampFeedMediaRatio, FALLBACK_RATIO, mediaMaxHeight, MEDIA_CHROME_RESERVE, RATIO_MAX, RATIO_MIN } from '@/components/feed/feedMediaSizing';
import { REVIEW_CARD_MAX_HEIGHT, REVIEW_MEDIA_MIN_HEIGHT } from '@/components/feed/reviewPostCard';

const PHOTO: MediaItem = { id: 'm1', type: 'image', imageUrl: '/photo.jpg', width: 1080, height: 1350 };
const POST = {
  id: 'post', userId: 'reviewer', actorId: 'reviewer', actorType: 'personal', displayName: 'Reviewer', avatarUrl: '',
  createdAt: '2026-10-30T00:00:00Z', caption: 'Review words', isReview: true,
  review: { reviewId: 'review', courseId: 'course', courseName: 'Course', rating: 8, reviewText: 'Review words' },
} as FeedPost;
function card(items: MediaItem[], layout: 'standard' | 'mediaFirst' = 'mediaFirst', isReview = true) {
  return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><FeedCard
    post={{ ...POST, mediaItems: items, isReview, review: isReview ? POST.review : null }} layout={layout}
    liked={false} likeCount={0} commentCount={0} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onOpenMedia={vi.fn()} onProfile={vi.fn()}
  /></MemoryRouter></QueryClientProvider>).container;
}
function element(container: HTMLElement, selector: string): HTMLElement {
  const node = container.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
}
afterEach(cleanup);

describe('shared feed media sizing', () => {
  it('preserves the exact ratio bounds, fallback and viewport budget', () => {
    expect(RATIO_MIN).toBe(0.8); expect(RATIO_MAX).toBe(1.91); expect(FALLBACK_RATIO).toBe(4 / 5);
    expect(MEDIA_CHROME_RESERVE).toBe(305);
    expect(mediaMaxHeight()).toBe('max(280px, calc(100svh - 305px - env(safe-area-inset-bottom)))');
    expect(clampFeedMediaRatio(undefined)).toBe(0.8);
    expect(clampFeedMediaRatio({ width: 0, height: 1350 })).toBe(0.8);
    expect(clampFeedMediaRatio({ width: 100, height: 1000 })).toBe(0.8);
    expect(clampFeedMediaRatio({ width: 3000, height: 1000 })).toBe(1.91);
  });
  it.each([[1080, 1350, '0.8'], [1920, 1005, '1.91']] as const)('review photo %sx%s uses intrinsic ratio %s and shared cap', (width, height, ratio) => {
    const c = card([{ ...PHOTO, width, height }]);
    const wrapper = element(c, '[data-review-media]');
    const box = element(c, 'button[data-post-id] > div');
    expect(box.style.aspectRatio).toBe(ratio); expect(box.style.maxHeight).toBe(mediaMaxHeight());
    expect(element(c, '[data-review-media] img').style.objectFit).toBe('cover');
    expect(wrapper.style.aspectRatio ?? '').toBe(''); expect(wrapper.getAttribute('style') ?? '').not.toContain('aspect-ratio'); expect(wrapper.style.maxHeight).toBe('');
    expect(wrapper.style.minHeight).toBe(''); expect(wrapper.style.flex).toBe('');
    expect(wrapper.style.marginTop).toBe('10px'); expect(wrapper.firstElementChild?.getAttribute('style')).not.toContain('absolute');
  });
  it('review video takes the same intrinsic box as a photo', () => {
    const c = card([{ ...PHOTO, type: 'video' }]);
    const box = element(c, 'button[data-post-id] > div');
    expect(box.style.aspectRatio).toBe('0.8'); expect(box.style.maxHeight).toBe(mediaMaxHeight());
    expect(element(c, '[data-inline-video]').style.objectFit).toBe('cover');
  });
  it('review carousel receives the shared viewport cap without an outer square frame', () => {
    const c = card([PHOTO, { ...PHOTO, id: 'm2', width: 1920, height: 1005 }]);
    expect(element(c, '[data-carousel]').style.maxHeight).toBe(mediaMaxHeight());
    expect(element(c, '[data-review-media]').style.aspectRatio ?? '').toBe('');
    expect(element(c, '[data-review-media]').getAttribute('style') ?? '').not.toContain('aspect-ratio');
  });
  it('media-first review with media has no whole-card height cap and retains its footer below', () => {
    const c = card([PHOTO]);
    expect(element(c, '[data-review-post-card]').style.maxHeight).toBe('');
    const media = element(c, '[data-review-media]'); const footer = element(c, '[data-feed-footer]');
    expect(media.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('standard review keeps the whole-card cap, square frame, floor and absolute fill', () => {
    const c = card([PHOTO], 'standard'); const frame = element(c, '[data-review-media]');
    expect(element(c, '[data-review-post-card]').style.maxHeight).toBe(REVIEW_CARD_MAX_HEIGHT);
    expect(frame.style.aspectRatio).toBe('1 / 1'); expect(frame.style.maxHeight).toBe('100cqw');
    expect(frame.style.minHeight).toBe(`${REVIEW_MEDIA_MIN_HEIGHT}px`); expect(frame.style.flex).toBe('1 1 auto');
    expect((frame.firstElementChild as HTMLElement).style.position).toBe('absolute');
    expect(element(c, 'button[data-post-id] > div').style.height).toBe('100%');
  });
  it.each(['mediaFirst', 'standard'] as const)('no-media %s review keeps its cap and does not invent a media frame', layout => {
    const c = card([], layout);
    expect(element(c, '[data-review-post-card]').style.maxHeight).toBe(REVIEW_CARD_MAX_HEIGHT);
    expect(c.querySelector('[data-review-media]')).toBeNull();
  });
  it.each(['mediaFirst', 'standard'] as const)('normal %s post retains its exact intrinsic media box', layout => {
    const c = card([PHOTO], layout, false); const box = element(c, 'button[data-post-id] > div');
    expect(box.style.aspectRatio).toBe('0.8'); expect(box.style.maxHeight).toBe(mediaMaxHeight());
    expect(box.style.width).toBe('100%'); expect(box.style.height).toBe('');
    expect(element(c, 'button[data-post-id] img').style.objectFit).toBe('cover');
    expect(c.querySelector('[data-review-post-card]')).toBeNull();
  });
});