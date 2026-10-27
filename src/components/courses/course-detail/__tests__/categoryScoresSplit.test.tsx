import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { CategoryScores } from '../CategoryScores';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const scores = { design: 9, condition: 8.7, clubhouse: 9.1, facilities: 8.4 };
const empty = { design: null, condition: null, clubhouse: null, facilities: null };
const normalizedColor = (color: string) => {
  const span = document.createElement('span');
  span.style.color = color;
  return span.style.color;
};

describe('CategoryScores split', () => {
  it('renders the lead, divider and four figures in canonical category order', () => {
    const { container, getByTestId } = render(<CategoryScores scores={scores} layout="split" lead={<span data-testid="lead">10.0</span>} marginTop={12} />);
    const wrapper = getByTestId('lead').parentElement;
    expect(wrapper?.style.borderRightWidth).toBe('1px');
    expect(wrapper?.style.borderRightStyle).toBe('solid');
    expect(wrapper?.style.borderRightColor.replace(/\s/g, '')).toBe(normalizedColor(A.TRACK).replace(/\s/g, ''));
    expect(wrapper?.style.paddingRight).toBe('14px');
    expect(Array.from(container.querySelectorAll('[data-category]')).map((cell) => cell.getAttribute('data-category'))).toEqual(['design', 'condition', 'clubhouse', 'facilities']);
    expect(container.querySelectorAll('[data-category-figure]')).toHaveLength(4);
    const root = container.querySelector<HTMLElement>('[data-category-scores]');
    expect(root?.style.marginTop).toBe('12px');
    expect(root?.style.gap).toBe('14px');
  });

  it('uses white at 9.0 and 8.7', () => {
    const { container } = render(<CategoryScores scores={scores} layout="split" />);
    expect(container.querySelector<HTMLElement>('[data-category-score="9.0"]')?.style.color).toBe(normalizedColor(A.INK));
    expect(container.querySelector<HTMLElement>('[data-category-score="8.7"]')?.style.color).toBe(normalizedColor(A.INK));
  });

  it('keeps a lead alone without a divider or grid when all categories are absent', () => {
    const { container, getByTestId } = render(<CategoryScores scores={empty} layout="split" lead={<span data-testid="lead">8.4</span>} />);
    const wrapper = getByTestId('lead').parentElement;
    expect(wrapper?.style.borderRight).toBe('');
    expect(wrapper?.style.paddingRight).toBe('');
    expect(container.querySelectorAll('[data-category]')).toHaveLength(0);
    expect(Array.from(container.querySelectorAll<HTMLElement>('div')).some((element) => element.style.display === 'grid')).toBe(false);
  });

  it('renders nothing with no lead and no categories', () => {
    const { container } = render(<CategoryScores scores={empty} layout="split" />);
    expect(container.childElementCount).toBe(0);
  });

  it.each([['grid4', '16px'], ['pairs', '15px']] as const)('preserves %s figure sizes and ignores split-only lead', (layout, size) => {
    const { container } = render(<CategoryScores scores={scores} layout={layout} lead={<span data-testid="unused" />} />);
    expect(container.querySelector('[data-testid="unused"]')).toBeNull();
    const figures = Array.from(container.querySelectorAll<HTMLElement>('[data-category-figure]'));
    expect(figures).toHaveLength(4);
    for (const figure of figures) expect(figure.style.fontSize).toBe(size);
  });
});