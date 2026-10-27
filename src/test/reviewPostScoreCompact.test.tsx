import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));

import { ReviewPostCard } from '@/components/feed/ReviewPostCard';

const toRgb = (c: string) => { const d = document.createElement('div'); d.style.color = c; return d.style.color; };
const post = (rating: number) => ({
  id: 'p', userId: 'u', actorId: 'u', displayName: 'Member', avatarUrl: '', createdAt: new Date().toISOString(),
  caption: '', handicapIndex: null, courseRating: null,
  review: { reviewId: 'r', courseId: 'c', courseName: 'Course', courseImageUrl: null, rating, reviewText: 'Words', breakdown: { design: 9 } },
}) as never;
const card = (rating: number) => render(
  <MemoryRouter><QueryClientProvider client={new QueryClient()}>
    <ReviewPostCard post={post(rating)} articleRef={() => {}} onProfile={vi.fn()} onReadReview={vi.fn()} onPrefetch={vi.fn()} footer={null} />
  </QueryClientProvider></MemoryRouter>,
).container;

describe('review post — score row below the course', () => {
  it('the overall figure is 26 / 700 with no negative tracking', () => {
    const s = card(8.2).querySelector('[data-score-cell="overall"] [data-score-figure]') as HTMLElement;
    expect(s.style.fontSize).toBe('26px');
    expect(s.style.fontWeight).toBe('700');
    expect(s.style.letterSpacing).toBe('');
  });
  it('the overall leads from the left edge of an auto 1fr grid, behind a hairline', () => {
    const c = card(8.2);
    const row = c.querySelector('[data-review-score-row]') as HTMLElement;
    expect(row.style.display).toBe('grid');
    expect(row.style.gridTemplateColumns).toBe('auto 1fr');
    expect(row.style.justifyContent).toBe('');
    expect(row.firstElementChild?.getAttribute('data-score-cell')).toBe('overall');
    expect((row.firstElementChild as HTMLElement).style.borderRight).toBe('1px solid rgba(255,255,255,0.10)');
  });
  it('the overall is white at 9.2 and 8.2', () => {
    expect((card(9.2).querySelector('[data-score-cell="overall"] [data-score-figure]') as HTMLElement).style.color).toBe(toRgb('#FFFFFF'));
    expect((card(8.2).querySelector('[data-score-cell="overall"] [data-score-figure]') as HTMLElement).style.color).toBe(toRgb('#FFFFFF'));
  });
});
