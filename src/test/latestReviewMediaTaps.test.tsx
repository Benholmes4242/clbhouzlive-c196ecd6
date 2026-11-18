import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
const calls = vi.hoisted(() => ({ open: vi.fn(), track: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: calls.open }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: calls.track } }));
vi.mock('@/components/course-media-tab/HoleInlineVideo', () => ({ HoleInlineVideo: () => <span /> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
import { ReviewRailSlot } from '@/components/courses/ReviewRailSlot';
import { latestReviewFeedPost } from '@/components/courses/browse/latestReviewFeedPost';
const review = (id: string, count = 4): LatestReview => ({
  reviewId: id, courseId: 'course', courseName: 'Course', courseImage: null, userId: 'member',
  reviewerName: 'Member', reviewerUsername: null, reviewerAvatar: null, rating: 8,
  quote: 'Review', at: '2026-11-18', mediaUrl: null, mediaType: null, posterUrl: null,
  courseCountry: null, courseRegion: null, courseSubCountry: null,
  breakdown: { design: 8, conditions: null, clubhouse: null, facilities: null },
  media: Array.from({ length: count }, (_, i) => ({ id: `${id}-${i}`, type: 'image', url: `https://example.com/${id}-${i}.jpg`, posterUrl: null, streamId: null, durationSeconds: null, width: i === 0 ? 600 : null, height: i === 0 ? 900 : null })),
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('Latest review media entry', () => {
  it('opens the third tile with every media and adjacent review, without opening the sheet', () => {
    const sheet = vi.fn(); const a = review('a'); const b = review('b');
    const { container } = render(<MemoryRouter><ReviewRailSlot reviews={[a, review('written', 0), b]} onReviewPress={sheet} /></MemoryRouter>);
    const tile = container.querySelector('[data-review-media-id="a-2"]');
    if (!tile) throw new Error('third media tile missing');
    fireEvent.click(tile);
    expect(sheet).not.toHaveBeenCalled();
    expect(calls.open).toHaveBeenCalledWith(expect.objectContaining({ index: 0, mediaId: 'a-2', originEl: tile, posterUrl: 'https://example.com/a-2.jpg', openedFrom: 'courses-latest-reviews', options: { readOnly: true, hasNextPage: false } }));
    const posts = calls.open.mock.calls[0]?.[0].posts;
    expect(posts.map((p: { id: string }) => p.id)).toEqual(['a', 'b']);
    expect(posts[0].mediaItems.map((m: { id: string }) => m.id)).toEqual(['a-0', 'a-1', 'a-2', 'a-3']);
    expect(calls.track).toHaveBeenCalledWith('review_photo_opened', { course_id: 'course', review_id: 'a', source: 'courses-latest-reviews' });
  });
  it('keeps text and written card taps on the review sheet', () => {
    const sheet = vi.fn();
    const { container } = render(<MemoryRouter><ReviewRailSlot reviews={[review('a'), review('written', 0)]} onReviewPress={sheet} /></MemoryRouter>);
    const text = container.querySelector('[data-review-course]');
    const written = container.querySelector('[data-review-written-card]');
    if (!text || !written) throw new Error('cards missing');
    fireEvent.click(text); fireEvent.click(written);
    expect(sheet.mock.calls.map(c => c[0].reviewId)).toEqual(['a', 'written']);
    expect(calls.open).not.toHaveBeenCalled();
  });
  it('carries dimensions with 1080 fallback and keeps zero engagement read-only shape', () => {
    const post = latestReviewFeedPost(review('a'));
    expect([post.mediaItems[0].width, post.mediaItems[0].height]).toEqual([600, 900]);
    expect([post.mediaItems[1].width, post.mediaItems[1].height]).toEqual([1080, 1080]);
    expect([post.likeCount, post.commentCount, post.shareCount, post.isLikedByMe, post.isFollowedByMe]).toEqual([0, 0, 0, false, false]);
  });
});