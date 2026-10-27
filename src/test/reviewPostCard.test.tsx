import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { REVIEW_BODY_CLAMP, REVIEW_CARD_MAX_HEIGHT, REVIEW_COURSE_CLAMP, joinClauses } from '@/components/feed/reviewPostCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: { count?: number }) => (o?.count != null ? `${k}:${o.count}` : k), i18n: { language: 'en' } }),
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ children }: { children?: React.ReactNode }) => children,
}));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));

import { ReviewPostCard } from '@/components/feed/ReviewPostCard';

const toRgb = (c: string) => { const d = document.createElement('div'); d.style.color = c; return d.style.color; };

function makePost(rating: number, breakdown: Record<string, number | null>, text = 'Words', extra: Record<string, unknown> = {}) {
  return {
    id: 'p', userId: 'u', actorId: 'u', displayName: 'Member', avatarUrl: '', createdAt: new Date().toISOString(),
    caption: '', handicapIndex: null, courseRating: null,
    review: { reviewId: 'r', courseId: 'c', courseName: 'Course', courseImageUrl: null, rating, reviewText: text, breakdown },
    ...extra,
  } as never;
}
const tree = (post: never, _legacyCount?: number | null, extraProps: Record<string, unknown> = {}) => (
  <MemoryRouter><QueryClientProvider client={new QueryClient()}>
    <ReviewPostCard post={post} articleRef={() => {}} onProfile={vi.fn()} onReadReview={vi.fn()} onPrefetch={vi.fn()} footer={null} {...extraProps} />
  </QueryClientProvider></MemoryRouter>
);
function card(rating: number, breakdown: Record<string, number | null>, text = 'Words', extra: Record<string, unknown> = {}) {
  return render(tree(makePost(rating, breakdown, text, extra))).container;
}
const all = { design: 9, conditions: 8.9, clubhouse: 7, facilities: 6 };

describe('review post — R.2 score colour', () => {
  it('9.0 renders white for the overall and a category, with no tier word', () => {
    const c = card(9, all);
    expect((c.querySelector('[data-score-cell="overall"] [data-score-figure]') as HTMLElement).style.color).toBe(toRgb('#FFFFFF'));
    expect(c.querySelector('[data-review-tier]')).toBeNull();
    expect((c.querySelector('[data-score-cell="design"] [data-score-figure]') as HTMLElement).style.color).toBe(toRgb('#FFFFFF'));
  });
  it('8.9 renders white for the overall and a category, with no tier word', () => {
    const c = card(8.9, all);
    expect((c.querySelector('[data-score-cell="overall"] [data-score-figure]') as HTMLElement).style.color).toBe(toRgb('#FFFFFF'));
    expect(c.querySelector('[data-review-tier]')).toBeNull();
    expect((c.querySelector('[data-score-cell="condition"] [data-score-figure]') as HTMLElement).style.color).toBe(toRgb('#FFFFFF'));
  });
});

describe('review post — categories', () => {
  it('an unscored category drops its cell and the rest keep their order', () => {
    const c = card(8, { ...all, clubhouse: null });
    expect([...c.querySelectorAll('[data-score-cell]')].map((n) => n.getAttribute('data-score-cell')))
      .toEqual(['overall', 'design', 'condition', 'facilities']);
  });
});

describe('review post — body clamp', () => {
  it('clamps to two lines with the padding on the wrapper, not the clamped box', () => {
    const c = card(8, all, 'A long review. '.repeat(40));
    const body = c.querySelector('[data-review-body]') as HTMLElement;
    const wrap = c.querySelector('[data-review-body-wrap]') as HTMLElement;
    expect(REVIEW_BODY_CLAMP.WebkitLineClamp).toBe(2);
    expect(REVIEW_BODY_CLAMP).not.toHaveProperty('padding');
    expect(REVIEW_BODY_CLAMP).not.toHaveProperty('paddingBottom');
    expect(body.style.overflow).toBe('hidden');
    expect(body.style.padding).toBe('');
    expect(wrap.style.padding).toBe('0px 14px 6px');
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

describe('review post — meta line is the date only', () => {
  it('states neither the handicap index nor the courses-reviewed count, even when both are present', () => {
    const c = render(tree(makePost(8, all, 'Words', { handicapIndex: 12.4 }), 47)).container;
    const line = c.querySelector('[data-review-who-line]') as HTMLElement;
    expect(line.textContent).not.toContain('feed.reviewPost.hcp');
    expect(line.textContent).not.toContain('feed.reviewPost.coursesReviewed');
  });
});

describe('review post — one home', () => {
  it('draws a review whose course did not resolve, without course, score or context line', () => {
    const c = card(8, all, 'Words', { review: null, caption: 'Body text', courseRating: 7 });
    expect(c.querySelector('[data-review-post-card]')).toBeTruthy();
    expect(c.querySelector('[data-review-course]')).toBeNull();
    expect(c.querySelector('[data-review-score-row]')).toBeNull();
    expect(c.querySelector('[data-review-body]')?.textContent).toContain('Body text');
  });
});

describe('review post v2 — frame and affordances', () => {
  it('the CTA renders with and without review text and calls onReadReview', async () => {
    const { fireEvent } = await import('@testing-library/react');
    for (const text of ['Words', '']) {
      const onRead = vi.fn();
      const c = render(tree(makePost(8, all, text, { caption: '' }), null, { onReadReview: onRead })).container;
      const cta = c.querySelector('[data-review-cta]') as HTMLElement;
      expect(cta.textContent).toContain('feed.reviewPost.readFullReview');
      fireEvent.click(cta);
      expect(onRead).toHaveBeenCalledTimes(1);
      expect(!!c.querySelector('[data-review-body]')).toBe(text !== '');
    }
  });
  it('the course name clamps to two lines rather than nowrap', () => {
    const name = card(8, all).querySelector('[data-review-course]') as HTMLElement;
    expect(name.style.whiteSpace).toBe('');
    expect(name.style.overflow).toBe('hidden');
    expect(REVIEW_COURSE_CLAMP.WebkitLineClamp).toBe(2);
    expect(REVIEW_COURSE_CLAMP).not.toHaveProperty('whiteSpace');
  });
  it('the meta line reads like a normal post: owner menu, then the date, then the follow pill', () => {
    const c = render(tree(makePost(8, all), null, { followPill: <span data-pill />, ownerMenu: <span data-menu /> })).container;
    const line = c.querySelector('[data-review-who-line]') as HTMLElement;
    expect(c.querySelector('[data-review-identity-right]')).toBeNull();
    const kids = Array.from(line.children) as HTMLElement[];
    expect(kids[0].hasAttribute('data-menu')).toBe(true);
    expect(kids[kids.length - 1].hasAttribute('data-pill')).toBe(true);
  });
  it('the article carries no border and no radius; hairline only after the first post', () => {
    const first = render(tree(makePost(8, all), null, { feedIndex: 0 })).container.querySelector('[data-review-post-card]') as HTMLElement;
    expect(first.style.borderRadius).toBe('');
    expect(first.style.border).toBe('');
    expect(first.style.borderTop).toBe('');
    const later = render(tree(makePost(8, all), null, { feedIndex: 2 })).container.querySelector('[data-review-post-card]') as HTMLElement;
    expect(later.style.borderTop).toContain('1px solid');
    expect(later.style.borderRadius).toBe('');
  });
  it('the media carries no margin and no radius', () => {
    const c = render(tree(makePost(8, all), null, { media: <img alt="" /> })).container;
    const m = c.querySelector('[data-review-media]') as HTMLElement;
    expect(m.style.margin).toBe('');
    expect(m.style.borderRadius).toBe('');
  });
});
