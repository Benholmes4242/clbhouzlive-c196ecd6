import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { A } from '@/features/courses/components/holes/analytical/tokens';

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

describe('review post — B2 score below the course', () => {
  it('the score figure is 24 / 800 / -0.045em', () => {
    const s = card(8.2).querySelector('[data-review-score]') as HTMLElement;
    expect(s.style.fontSize).toBe('24px');
    expect(s.style.fontWeight).toBe('800');
    expect(s.style.letterSpacing).toBe('-0.045em');
  });
  it('the score column is text-centred inside the centred score block', () => {
    const c = card(8.2);
    expect((c.querySelector('[data-review-score-col]') as HTMLElement).style.textAlign).toBe('center');
    expect((c.querySelector('[data-review-score-block]') as HTMLElement).style.alignItems).toBe('center');
  });
  it('the score colour follows the rating: green at 9.2, muted at 8.2', () => {
    expect((card(9.2).querySelector('[data-review-score]') as HTMLElement).style.color).toBe(toRgb(A.GREEN));
    expect((card(8.2).querySelector('[data-review-score]') as HTMLElement).style.color).toBe(toRgb(A.MUTE));
  });
});
