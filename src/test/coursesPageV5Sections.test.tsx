/** BRIEF_COURSES_PAGE_V5 §6 — shell row, The regulars pill and Latest reviews card B. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
const listMock = vi.fn();
vi.mock('@/components/courses/useStatBrowse', () => ({ useStatBrowseList: (args: unknown) => listMock(args) }));
vi.mock('@/components/courses/browse/PhotoFigureCard', async (orig) => ({
  ...(await orig<typeof import('@/components/courses/browse/PhotoFigureCard')>()),
  PhotoFigureCard: ({ row, footer }: { row: { course_id: string }; footer?: React.ReactNode }) => <div data-tile={row.course_id}>{footer}</div>,
}));
vi.mock('@/components/skeletons/shellVocabulary', async (orig) => ({
  ...(await orig<typeof import('@/components/skeletons/shellVocabulary')>()),
  Bar: ({ style }: { style?: React.CSSProperties }) => <div data-bar="" data-w={String(style?.width ?? '')} data-h={String(style?.height ?? '')} data-r={String(style?.borderRadius ?? '')} />,
}));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: ({ size }: { size: number }) => <span data-face={String(size)} /> }));
vi.mock('@/components/shared/CourseNameLink', () => ({ CourseNameLink: ({ children, textProps }: { children: React.ReactNode; textProps?: Record<string, string> }) => <div {...textProps}>{children}</div> }));
vi.mock('@/components/mentions/MentionText', () => ({ MentionText: ({ text }: { text: string }) => <>{text}</> }));

import { WhoPlayingShell, LatestReviewsShell } from '@/components/courses/browse/sectionShells';
import { MEDIA_CARD_W, ReviewRailSlot, WRITTEN_CARD_W } from '@/components/courses/ReviewRailSlot';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

afterEach(() => { cleanup(); listMock.mockReset(); });
const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('V5 §2 shell row', () => {
  it('draws the tile row bars at 156 × 216, radius 16, 8px apart, with no sub line', () => {
    const { container } = wrap(<WhoPlayingShell />);
    const big = [...container.querySelectorAll('[data-bar][data-h="216"]')] as HTMLElement[];
    expect(big).toHaveLength(3);
    for (const b of big) expect([b.dataset.w, b.dataset.r]).toEqual(['156', '16']);
    expect((big[0].parentElement as HTMLElement).style.gap).toBe('8px');
  });
});

const review = (id: string, userId: string): LatestReview => ({
  reviewId: id, userId, courseId: 'c1', courseName: 'Vale do Lobo (Ocean)', reviewerName: 'Benjamin Holmes', reviewerUsername: null, reviewerAvatar: null,
  rating: 8.7, quote: 'Fantastic golf course.', at: '2026-11-10T10:00:00Z', media: [],
  courseCountry: 'Portugal', courseRegion: 'Algarve', courseSubCountry: 'Portugal',
  breakdown: { design: 9, conditions: 8.5, clubhouse: 8, facilities: 8.5 },
} as unknown as LatestReview);
const mediaReview = (id: string): LatestReview => ({
  ...review(id, 'a'), top100: true,
  media: [
    { id: 'm1', type: 'image', url: 'https://x/a.jpg', posterUrl: null, streamId: null, durationSeconds: null },
    { id: 'm2', type: 'video', url: 'https://x/b.mp4', posterUrl: 'https://x/b.jpg', streamId: null, durationSeconds: 42 },
    { id: 'm3', type: 'image', url: 'https://x/c.jpg', posterUrl: null, streamId: null, durationSeconds: null },
    { id: 'm4', type: 'image', url: 'https://x/d.jpg', posterUrl: null, streamId: null, durationSeconds: null },
  ],
} as unknown as LatestReview);

describe('LATEST_REVIEWS_MAGAZINE rails', () => {
  it('the written card is min(290px, 100vw-64px), radius 20, padding 16, on a 10px / 16px rail', () => {
    // jsdom drops min()/calc() widths, so the signed-off width is pinned at the exported constant.
    expect(WRITTEN_CARD_W).toBe('min(290px, calc(100vw - 64px))');
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a'), review('r2', 'b')]} onReviewPress={() => {}} />);
    const card = container.querySelector('[data-review-written-card]') as HTMLElement;
    expect([card.style.borderRadius, card.style.padding, card.style.background]).toEqual(['20px', '16px', 'rgb(22, 22, 27)']);
    const rail = card.parentElement as HTMLElement;
    expect([rail.style.gap, rail.style.padding]).toEqual(['10px', '0px 16px']);
  });
  it('the written card shows the score, place line, course, quote, four scores and the golfer', () => {
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a')]} onReviewPress={() => {}} />);
    expect(container.querySelector('[data-review-score]')!.textContent).toBe('8.7/10');
    expect(container.querySelector('[data-review-loc]')!.textContent).toBe('Algarve · Portugal');
    expect(container.querySelector('[data-review-course]')!.textContent).toBe('Vale do Lobo (Ocean)');
    expect(container.querySelector('[data-review-scores]')!.textContent).toContain('Design');
    expect(container.querySelector('[data-review-foot]')!.textContent).toContain('Benjamin Holmes');
    expect(container.querySelector('[data-review-stamp]')).toBeNull();
  });
  it('the media card is min(300px, 100vw-64px) with the mosaic, glass disc, TOP 100 stamp and +N on the third tile', () => {
    const { container } = wrap(<ReviewRailSlot reviews={[mediaReview('r1')]} onReviewPress={() => {}} />);
    const card = container.querySelector('[data-review-media-card]') as HTMLElement;
    expect(MEDIA_CARD_W).toBe('min(300px, calc(100vw - 64px))');
    expect(card.querySelector('[data-review-mosaic]')).not.toBeNull();
    expect(card.querySelector('[data-review-disc]')!.textContent).toBe('8.7/10');
    expect(card.querySelector('[data-review-stamp]')!.textContent).toBe('TOP 100');
    expect(card.querySelector('[data-review-more]')!.textContent).toBe('+1');
    expect(card.querySelector('[data-review-vid]')!.textContent).toContain('0:42');
  });
  it('a review appears once across the two rails, each under its label', () => {
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a'), mediaReview('r2')]} onReviewPress={() => {}} />);
    const labels = [...container.querySelectorAll('[data-review-rail-label]')].map((l) => l.textContent);
    expect(labels).toEqual(['WRITTEN REVIEWS']);
    expect(container.querySelectorAll('[data-review-media-card]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-review-written-card]')).toHaveLength(1);
  });
  it('an empty rail hides with its label', () => {
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a')]} onReviewPress={() => {}} />);
    const labels = [...container.querySelectorAll('[data-review-rail-label]')].map((l) => l.textContent);
    expect(labels).toEqual(['WRITTEN REVIEWS']);
    expect(container.querySelector('[data-review-media-card]')).toBeNull();
  });
  it('a tap still opens the review', () => {
    const press = vi.fn();
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a')]} onReviewPress={press} />);
    fireEvent.click(container.querySelector('[data-review-card]')!);
    expect(press).toHaveBeenCalledWith(expect.objectContaining({ reviewId: 'r1' }));
  });
  it('the shell draws both new card shapes', () => {
    const { container } = wrap(<LatestReviewsShell />);
    const cards = [...container.querySelectorAll('[data-review-shell-card]')] as HTMLElement[];
    expect(cards).toHaveLength(2);
    expect([cards[0].style.borderRadius, cards[1].style.borderRadius]).toEqual(['20px', '20px']);
  });
});
