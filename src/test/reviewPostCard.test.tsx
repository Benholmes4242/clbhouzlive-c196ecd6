import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { REVIEW_CARD_MAX_HEIGHT, againstCourse, joinClauses } from '@/components/feed/reviewPostCard';

const aggregate = { current: null as Record<string, number> | null };
vi.mock('@/hooks/useCourseRatingAggregates', () => ({
  useCourseRatingAggregates: () => ({ data: aggregate.current }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ children }: { children?: React.ReactNode }) => children,
}));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));

import { ReviewPostCard } from '@/components/feed/ReviewPostCard';

const toRgb = (c: string) => { const d = document.createElement('div'); d.style.color = c; return d.style.color; };

function card(rating: number, breakdown: Record<string, number | null>, text = 'Words') {
  const post = {
    id: 'p', userId: 'u', actorId: 'u', displayName: 'Member', avatarUrl: '', createdAt: new Date().toISOString(),
    caption: '', handicapIndex: null,
    review: { reviewId: 'r', courseId: 'c', courseName: 'Course', courseImageUrl: null, rating, reviewText: text, breakdown },
  } as never;
  return render(
    <MemoryRouter><QueryClientProvider client={new QueryClient()}>
      <ReviewPostCard post={post} articleRef={() => {}} surface={A.PANEL} onProfile={vi.fn()} onReadReview={vi.fn()} onPrefetch={vi.fn()} footer={null} />
    </QueryClientProvider></MemoryRouter>,
  ).container;
}
const all = { design: 9, conditions: 8.9, clubhouse: 7, facilities: 6 };

describe('review post — R.2 score colour', () => {
  it('9.0 renders green for the figure, the tier word and a category', () => {
    const c = card(9, all);
    expect((c.querySelector('[data-review-score]') as HTMLElement).style.color).toBe(toRgb(A.GREEN));
    expect((c.querySelector('[data-review-tier] span') as HTMLElement).style.color).toBe(toRgb(A.GREEN));
    const design = c.querySelector('[data-review-category="design"] [data-review-category-value]') as HTMLElement;
    expect(design.style.color).toBe(toRgb(A.GREEN));
  });
  it('8.9 renders muted for the figure, the tier word and a category', () => {
    const c = card(8.9, all);
    expect((c.querySelector('[data-review-score]') as HTMLElement).style.color).toBe(toRgb(A.MUTE));
    expect((c.querySelector('[data-review-tier] span') as HTMLElement).style.color).toBe(toRgb(A.MUTE));
    const cond = c.querySelector('[data-review-category="condition"] [data-review-category-value]') as HTMLElement;
    expect(cond.style.color).toBe(toRgb(A.MUTE));
  });
});

describe('review post — categories', () => {
  it('an unscored category shows an em dash with no track, and the grid keeps four columns', () => {
    const c = card(8, { ...all, clubhouse: null });
    const items = c.querySelectorAll('[data-review-category]');
    expect(items.length).toBe(4);
    expect((c.querySelector('[data-review-categories]') as HTMLElement).style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    const club = c.querySelector('[data-review-category="clubhouse"]')!;
    expect(club.querySelector('[data-review-category-value]')?.textContent).toBe('\u2014');
    expect(club.querySelector('[data-review-track]')).toBeNull();
  });
});

describe('review post — context line', () => {
  it('is absent when the review is the only one', () => {
    aggregate.current = { avg_overall_score: 7.1, review_count: 1 };
    expect(card(6.8, all).querySelector('[data-review-against]')).toBeNull();
    expect(againstCourse(6.8, 7.1, 1)).toBeNull();
    aggregate.current = null;
  });
  it('reads below / above / in line at one decimal', () => {
    expect(againstCourse(6.8, 7.1, 24)?.direction).toBe('below');
    expect(againstCourse(7.4, 7.1, 24)?.direction).toBe('above');
    expect(againstCourse(7.1, 7.06, 24)?.direction).toBe('inLine');
  });
});

describe('review post — body clamp', () => {
  it('clamps to two lines with the padding on the wrapper, not the clamped box', () => {
    const c = card(8, all, 'A long review. '.repeat(40));
    const body = c.querySelector('[data-review-body]') as HTMLElement;
    const wrap = c.querySelector('[data-review-body-wrap]') as HTMLElement;
    expect(body.style.webkitLineClamp).toBe('2');
    expect(body.style.overflow).toBe('hidden');
    expect(body.style.padding).toBe('');
    expect(wrap.style.padding).toBe('0px 14px 12px');
  });
});

describe('review post — R.1 fits between the islands', () => {
  it('max-height resolves from the two measured clearances, never a typed number', () => {
    expect(REVIEW_CARD_MAX_HEIGHT).toContain('var(--chrome-clearance');
    expect(REVIEW_CARD_MAX_HEIGHT).toContain('var(--nav-pill-h');
    expect(REVIEW_CARD_MAX_HEIGHT.startsWith('calc(100dvh - ')).toBe(true);
    expect(REVIEW_CARD_MAX_HEIGHT.endsWith(' - 16px)')).toBe(true);
  });
  it('joins only the true clauses with no stray separator', () => {
    expect(joinClauses([null, '1d'])).toBe('1d');
    expect(joinClauses(['Plays off 12', null, '1d'])).toBe('Plays off 12 \u00b7 1d');
  });
});
