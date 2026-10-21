import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { A, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { ReviewPostCard } from '@/components/feed/ReviewPostCard';
import { reviewLabelColor } from '@/components/shared/ReviewGhostScore';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));

const rgb = (color: string) => { const el = document.createElement('div'); el.style.color = color; return el.style.color; };
function card(rating: number | null, breakdown: Record<string, number | null> = { design: 8.9, conditions: 9.5, clubhouse: null, facilities: 9 }) {
  const onReadReview = vi.fn();
  const post = {
    id: 'p', userId: 'u', displayName: 'Member', avatarUrl: '', createdAt: new Date().toISOString(), caption: '',
    review: { reviewId: 'r', courseId: 'c', courseName: 'Course', courseImageUrl: null, rating, reviewText: '', breakdown },
  } as never;
  const { container } = render(<MemoryRouter><ReviewPostCard post={post} articleRef={() => {}} onProfile={vi.fn()} onReadReview={onReadReview} onPrefetch={vi.fn()} footer={null} /></MemoryRouter>);
  const element = (selector: string) => {
    const el = container.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`Missing ${selector}`);
    return el;
  };
  return { container, element, onReadReview };
}

describe('review post score block B2', () => {
  it('moves the overall out of the subject into the open block', () => {
    const { element } = card(9);
    expect(element('[data-review-subject]').querySelector('[data-review-score]')).toBeNull();
    expect(element('[data-review-score-block]').querySelector('[data-review-score]')).toBeTruthy();
  });
  it('renders the overall at 30 / 800 in its rating tone with a right divider', () => {
    const { element } = card(9);
    const score = element('[data-review-score]');
    expect(score.style.fontSize).toBe('30px');
    expect(score.style.fontWeight).toBe('800');
    expect(score.style.color).toBe(rgb(reviewLabelColor(9)));
    expect(element('[data-review-score-col]').style.borderRightWidth).toBe('1px');
    expect(element('[data-review-score-col]').style.borderRightStyle).toBe('solid');
    expect(element('[data-review-score-col]').style.borderRightColor).toBe(rgb(A.TRACK));
  });
  it('keeps a two-column grid with green 9.5 and muted 8.9 figures', () => {
    const { element } = card(9);
    expect(element('[data-review-categories]').style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(element('[data-category="condition"] [data-category-figure]').style.color).toBe(rgb(courseSubScoreTone(9.5)));
    expect(element('[data-category="design"] [data-category-figure]').style.color).toBe(rgb(courseSubScoreTone(8.9)));
  });
  it('keeps the missing category cell with a dim dash', () => {
    const { container, element } = card(9);
    expect(container.querySelectorAll('[data-category]')).toHaveLength(4);
    expect(element('[data-category="clubhouse"] [data-category-figure]').textContent).toBe('\u2014');
    expect(element('[data-category="clubhouse"] [data-category-figure]').style.color).toBe(rgb(A.DIM));
  });
  it('renders categories alone with no overall or divider when rating is absent', () => {
    const { container, element } = card(null);
    expect(container.querySelector('[data-review-score-col]')).toBeNull();
    expect(element('[data-review-categories]').style.flex).toBe('1');
    expect(element('[data-review-score-block]').style.borderRight).toBe('');
  });
  it('renders only the overall when categories are absent', () => {
    const { container } = card(8, {});
    expect(container.querySelector('[data-review-score]')).toBeTruthy();
    expect(container.querySelector('[data-review-categories]')).toBeNull();
  });
  it('renders no score block when both are absent', () => {
    expect(card(null, {}).container.querySelector('[data-review-score-block]')).toBeNull();
  });
  it('preserves verdict navigation and its accessible score label at 9px', () => {
    const { element, onReadReview } = card(9);
    const button = element('[data-review-tier] button');
    expect(button.getAttribute('aria-label')).toBe('9.0 Exceptional');
    expect(element('[data-review-tier] span').style.fontSize).toBe('9px');
    fireEvent.click(button);
    expect(onReadReview).toHaveBeenCalledTimes(1);
  });
});