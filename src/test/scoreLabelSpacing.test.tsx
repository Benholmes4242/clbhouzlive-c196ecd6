/**
 * BRIEF_SCORE_LABEL_SPACING — the gap from a score figure to the word under it.
 *
 * Both halves of the bug were inherited line boxes, not margins: the category
 * label sat in a tall inherited box and the verdict button carried a 16px strut.
 * So these tests assert lineHeight 1 (the fix) alongside the 4px margin, and
 * assert the BUTTON carries the component's own font size — that is what stops
 * the strut coming back.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }),
}));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));

import { CategoryScores } from '@/components/courses/course-detail/CategoryScores';
import { ReviewVerdictLabel } from '@/components/shared/ReviewGhostScore';
import { ReviewPostCard } from '@/components/feed/ReviewPostCard';

const SCORES = { design: 8.9, condition: 8.3, clubhouse: 9.2, facilities: 7.4 };

describe('BRIEF_SCORE_LABEL_SPACING — category labels', () => {
  it('sits the grid4 label on its own line box, 4px under the figure', () => {
    const { container } = render(<CategoryScores scores={SCORES} />);
    const label = container.querySelector<HTMLElement>('[data-category="design"] > div:not([data-category-figure])');
    expect(label).not.toBeNull();
    expect(label!.style.lineHeight).toBe('1');
    expect(label!.style.marginTop).toBe('4px');
  });

  it('leaves the pairs layout untouched', () => {
    const { container } = render(<CategoryScores scores={SCORES} layout="pairs" />);
    const label = container.querySelector<HTMLElement>('[data-category="design"] > div');
    expect(label!.style.marginTop).toBe('');
    expect(label!.style.lineHeight).toBe('');
  });
});

describe('BRIEF_SCORE_LABEL_SPACING — verdict word', () => {
  it('gives the clickable button the label’s own size, so no inherited strut returns', () => {
    const { container } = render(<ReviewVerdictLabel rating={9} fontSize={9.5} onClick={vi.fn()} />);
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button!.style.fontSize).toBe('9.5px');
    expect(button!.style.lineHeight).toBe('1');
    expect(button!.style.display).toBe('block');
    const span = button!.querySelector('span') as HTMLElement;
    expect(span.style.lineHeight).toBe('1');
  });

  it('gives the bare label the same tight line box', () => {
    const { container } = render(<ReviewVerdictLabel rating={8.3} fontSize={9.5} />);
    const span = container.querySelector('span') as HTMLElement;
    expect(span.style.lineHeight).toBe('1');
  });
});

describe('BRIEF_SCORE_LABEL_SPACING — review post overall score', () => {
  const post = {
    id: 'p', userId: 'u', actorId: 'u', displayName: 'Member', avatarUrl: '',
    createdAt: new Date().toISOString(), caption: '', handicapIndex: null, courseRating: null,
    review: {
      reviewId: 'r', courseId: 'c', courseName: 'Course', courseImageUrl: null,
      rating: 9, reviewText: 'Words', breakdown: SCORES,
    },
  } as never;

  it('places the review post tier word at B2’s 6px gap', () => {
    const { container } = render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <ReviewPostCard
            post={post}
            articleRef={() => {}}
            onProfile={vi.fn()}
            onReadReview={vi.fn()}
            onPrefetch={vi.fn()}
            footer={null}
          />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    const tier = container.querySelector<HTMLElement>('[data-review-tier]');
    expect(tier).not.toBeNull();
    expect(tier?.style.marginTop).toBe('6px');
  });
});
