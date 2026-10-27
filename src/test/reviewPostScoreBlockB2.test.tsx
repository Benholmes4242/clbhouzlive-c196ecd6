import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReviewPostCard } from '@/components/feed/ReviewPostCard';

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

const row = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-review-score-row]');
const figs = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-score-figure]')];
const cells = (c: HTMLElement) => [...c.querySelectorAll('[data-score-cell]')].map((n) => n.getAttribute('data-score-cell'));

describe('review post score row', () => {
  it('puts the score row below the subject, not inside it', () => {
    const { element, container } = card(9);
    expect(element('[data-review-subject]').querySelector('[data-review-score-row]')).toBeNull();
    expect(row(container)).toBeTruthy();
  });
  it('pads the row 0 14px 14px like the old block and centres it with gap 15', () => {
    const r = row(card(9).container)!;
    expect(r.style.padding).toBe('0px 14px 14px');
    expect(r.style.justifyContent).toBe('center');
    expect(r.style.gap).toBe('15px');
  });
  it('drops the verdict word, the two-column grid and the divider', () => {
    const { container } = card(9);
    expect(container.querySelector('[data-review-tier]')).toBeNull();
    expect(container.querySelector('[data-review-categories]')).toBeNull();
    expect(container.querySelector('[data-review-score-col]')).toBeNull();
    expect(container.querySelector('[data-review-score-block]')).toBeNull();
  });
  it('renders white 9.5 and 8.9 figures', () => {
    const { container } = card(9);
    const byCell = (k: string) => container.querySelector<HTMLElement>(`[data-score-cell="${k}"] [data-score-figure]`)!;
    expect(byCell('condition').textContent).toBe('9.5');
    expect(byCell('condition').style.color).toBe(rgb('#FFFFFF'));
    expect(byCell('design').textContent).toBe('8.9');
    expect(byCell('design').style.color).toBe(rgb('#FFFFFF'));
  });
  it('omits a missing category instead of drawing a dash', () => {
    const { container } = card(9);
    expect(cells(container)).toEqual(['overall', 'design', 'condition', 'facilities']);
    expect(container.textContent).not.toContain('\u2014');
  });
  it('renders categories alone when rating is absent', () => {
    expect(cells(card(null).container)).toEqual(['design', 'condition', 'facilities']);
  });
  it('renders only the overall when categories are absent', () => {
    const { container } = card(8, {});
    expect(cells(container)).toEqual(['overall']);
    expect(figs(container)[0].textContent).toBe('8.0');
  });
  it('renders no score row when both are absent', () => {
    expect(row(card(null, {}).container)).toBeNull();
  });
  it('keeps the full-review CTA as the way into the review', () => {
    const { element, onReadReview } = card(9);
    fireEvent.click(element('[data-review-cta]'));
    expect(onReadReview).toHaveBeenCalledTimes(1);
  });
});
