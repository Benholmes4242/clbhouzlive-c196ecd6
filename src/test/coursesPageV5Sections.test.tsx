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

import { MostPlayedSection } from '@/components/courses/browse/MostPlayedSection';
import { WhoPlayingShell, LatestReviewsShell } from '@/components/courses/browse/sectionShells';
import { ReviewRailSlot } from '@/components/courses/ReviewRailSlot';
import { toAuthorRoundsMap } from '@/components/courses/reviewAuthorRounds';
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

describe('V5 §3 The regulars pill', () => {
  const row = (id: string, rounds: number, avg: number | null) => ({ course_id: id, course_name: id, rounds, members: 3, avg_to_par: avg, community_rating: 8, review_count: 1 });
  it('reads holes played (rounds × 18, thousands separators) with plays-to', () => {
    listMock.mockReturnValue({ rows: [row('a', 962, 12.1)], isLoading: false });
    const { container } = wrap(<MostPlayedSection />);
    expect(container.querySelector('[data-tile="a"]')!.textContent).toBe('17,316 holes played \u00B7 Plays to +12.1');
  });
  it('reads just the holes with no plays-to figure', () => {
    listMock.mockReturnValue({ rows: [row('b', 4, null)], isLoading: false });
    const { container } = wrap(<MostPlayedSection />);
    expect(container.querySelector('[data-tile="b"]')!.textContent).toBe('72 holes played');
  });
});

const review = (id: string, userId: string): LatestReview => ({
  reviewId: id, userId, courseId: 'c1', courseName: 'Vale do Lobo (Ocean)', reviewerName: 'Benjamin Holmes', reviewerUsername: null, reviewerAvatar: null,
  rating: 8.7, quote: 'Fantastic golf course.', at: '2026-11-10T10:00:00Z',
} as unknown as LatestReview);
const foot = (c: HTMLElement) => c.querySelector('[data-review-foot]')!.textContent;

describe('V5 §4 Latest reviews card B', () => {
  it('is a 260 × 216 borderless #16161B card, radius 16, padding 12, 8px apart on a 16px rail', () => {
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a'), review('r2', 'b')]} onReviewPress={() => {}} />);
    const card = container.querySelector('[data-review-card]') as HTMLElement;
    expect([card.style.width, card.style.height, card.style.borderRadius, card.style.padding, card.style.background]).toEqual(['260px', '216px', '16px', '12px', 'rgb(22, 22, 27)']);
    expect(card.style.border).toMatch(/^(0|0px|medium none|)$/);
    expect(card.style.flexDirection).toBe('column');
    const rail = card.parentElement as HTMLElement;
    expect([rail.style.gap, rail.style.padding]).toEqual(['8px', '0px 16px']);
  });
  it('orders kicker, 24px face and rating /10, course, quote, footer; no OUT OF 10 or stat block', () => {
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a')]} onReviewPress={() => {}} />);
    expect(container.querySelector('[data-review-kicker]')!.textContent).toBe('REVIEW');
    expect(container.querySelector('[data-face="24"]')).not.toBeNull();
    expect(container.querySelector('[data-review-score]')!.textContent).toBe('8.7/10');
    expect(container.querySelector('[data-review-rail-course]')!.textContent).toBe('Vale do Lobo (Ocean)');
    expect(container.querySelector('[data-review-played]')).toBeNull();
    expect(container.textContent).not.toMatch(/ROUNDS? HERE|THEIR BEST/);
    expect((container.querySelector('[data-review-foot]') as HTMLElement).style.marginTop).toBe('auto');
  });
  it('V6 §5 footer: name only even with rounds and best', () => {
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a')]} onReviewPress={() => {}} authorRounds={toAuthorRoundsMap([{ review_id: 'r1', rounds_here: 1, best_gross: 78, best_to_par: 6 }])} />);
    expect(foot(container)).toBe('Benjamin Holmes');
  });
  it('V6 §5 footer: name only with rounds and no best', () => {
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a')]} onReviewPress={() => {}} authorRounds={toAuthorRoundsMap([{ review_id: 'r1', rounds_here: 3, best_gross: null, best_to_par: null }])} />);
    expect(foot(container)).toBe('Benjamin Holmes');
  });
  it('footer: name only with no row', () => {
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a')]} onReviewPress={() => {}} authorRounds={new Map()} />);
    expect(foot(container)).toBe('Benjamin Holmes');
  });
  it("V6 §5 footer: the viewer's own review is name only too", () => {
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'me')]} onReviewPress={() => {}} viewerId="me" authorRounds={toAuthorRoundsMap([{ review_id: 'r1', rounds_here: 2, best_gross: 74, best_to_par: 2 }])} />);
    expect(foot(container)).toBe('Benjamin Holmes');
  });
  it('a tap still opens the review', () => {
    const press = vi.fn();
    const { container } = wrap(<ReviewRailSlot reviews={[review('r1', 'a')]} onReviewPress={press} />);
    fireEvent.click(container.querySelector('[data-review-card]')!);
    expect(press).toHaveBeenCalledWith(expect.objectContaining({ reviewId: 'r1' }));
  });
  it('the shell draws the same card size', () => {
    const { container } = wrap(<LatestReviewsShell />);
    const card = container.querySelector('[data-review-shell-card]') as HTMLElement;
    expect([card.style.width, card.style.height, card.style.borderRadius]).toEqual(['260px', '216px', '16px']);
  });
});
