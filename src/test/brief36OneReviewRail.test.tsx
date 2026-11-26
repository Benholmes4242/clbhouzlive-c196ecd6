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

const review = (id: string, count: number, opts: Partial<LatestReview> = {}): LatestReview => ({
  reviewId: id, courseId: 'course', courseName: 'Course', courseImage: null, userId: 'member',
  reviewerName: 'Member', reviewerUsername: null, reviewerAvatar: null, rating: 8,
  quote: 'Review', at: '2026-11-18', mediaUrl: null, mediaType: null, posterUrl: null,
  courseCountry: null, courseRegion: null, courseSubCountry: null,
  breakdown: { design: 8, conditions: 7, clubhouse: 6, facilities: 9 },
  media: Array.from({ length: count }, (_, i) => ({ id: `${id}-${i}`, type: 'image', url: `https://example.com/${id}-${i}.jpg`, posterUrl: null, streamId: null, durationSeconds: null, width: null, height: null })),
  ...opts,
});
const mount = (reviews: LatestReview[]) => render(<MemoryRouter><ReviewRailSlot reviews={reviews} onReviewPress={vi.fn()} /></MemoryRouter>);
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Brief 36 one Latest reviews rail', () => {
  it('renders one rail of five cards in pool order with no WRITTEN REVIEWS label', () => {
    const { container, queryByText } = mount([review('m1', 2), review('w1', 0), review('m2', 1), review('w2', 0), review('m3', 3)]);
    const cards = [...container.querySelectorAll('[data-review-card]')];
    expect(cards).toHaveLength(5);
    expect(new Set(cards.map((c) => c.parentElement)).size).toBe(1);
    expect(cards.map((c) => (c.hasAttribute('data-review-written-card') ? 'w' : 'm'))).toEqual(['m', 'w', 'm', 'w', 'm']);
    expect(queryByText('WRITTEN REVIEWS')).toBeNull();
    expect(container.querySelector('[data-review-rail-label]')).toBeNull();
  });
  it('a written card has the blurred photo layer over the whole card, disc, name, clamped quote, scores and footer', () => {
    const { container } = mount([review('w', 0, { courseImage: 'https://example.com/course.jpg' })]);
    const card = container.querySelector('[data-review-written-card]') as HTMLElement;
    const layer = card.querySelector('[data-review-written-ambient="photo"]') as HTMLElement;
    expect(layer.style.filter).toBe('blur(36px) saturate(140%)');
    expect(layer.style.inset).toBe('-30px');
    expect(layer.style.backgroundImage).toContain('course.jpg');
    expect(card.querySelector('[data-review-disc]')).not.toBeNull();
    expect(card.querySelector('[data-review-course]')).not.toBeNull();
    expect(card.querySelector('[data-review-quote]')!.getAttribute('data-review-quote-lines')).toBe('9');
    expect(card.querySelector('[data-review-scores]')).not.toBeNull();
    expect(card.querySelector('[data-review-foot]')).not.toBeNull();
  });
  it('a written card without a course image renders the fallback layer', () => {
    const { container } = mount([review('w', 0)]);
    const layer = container.querySelector('[data-review-written-ambient]') as HTMLElement;
    expect(layer.getAttribute('data-review-written-ambient')).toBe('fallback');
    expect(layer.style.filter).toBe('blur(36px) saturate(140%)');
  });
  it('opening the second media review in a mixed rail passes media-only index 1', () => {
    const { container } = mount([review('w0', 0), review('m1', 2), review('w1', 0), review('m2', 2)]);
    fireEvent.click(container.querySelector('[data-review-media-id="m2-0"]') as HTMLElement);
    expect(calls.open).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
    expect(calls.open.mock.calls[0][0].posts).toHaveLength(2);
  });
  it('a review with neither media nor quote is not rendered', () => {
    const { container } = mount([review('m', 1), review('empty', 0, { quote: '  ' })]);
    expect(container.querySelectorAll('[data-review-card]')).toHaveLength(1);
  });
});
