import React from 'react';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CategoryBarGrid } from '@/components/shared/CategoryBarGrid';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const src = (file: string) => fs.readFileSync(resolve(process.cwd(), file), 'utf8');

const grid = (items: { key: string; label: string; value: number | null }[]) =>
  render(<CategoryBarGrid items={items} />);

describe('CategoryBarGrid (signed-off 2×2 category bars)', () => {
  it('prints the four categories in the fixed order whatever order they arrive in', () => {
    const { container } = grid([
      { key: 'facilities', label: 'Facilities', value: 8.4 },
      { key: 'clubhouse', label: 'Clubhouse', value: 8.9 },
      { key: 'condition', label: 'Condition', value: 8.6 },
      { key: 'design', label: 'Design', value: 8.1 },
    ]);
    const keys = [...container.querySelectorAll('[data-category-bar]')].map((el) => el.getAttribute('data-category-bar'));
    expect(keys).toEqual(['design', 'condition', 'clubhouse', 'facilities']);
  });

  it('shows unknown keys after the four, in arrival order', () => {
    const { container } = grid([
      { key: 'pace', label: 'Pace', value: 7 },
      { key: 'design', label: 'Design', value: 8.1 },
      { key: 'value', label: 'Value', value: 6 },
    ]);
    const keys = [...container.querySelectorAll('[data-category-bar]')].map((el) => el.getAttribute('data-category-bar'));
    expect(keys).toEqual(['design', 'pace', 'value']);
  });

  it('leaves out items whose value is null', () => {
    const { container } = grid([
      { key: 'design', label: 'Design', value: 8.1 },
      { key: 'condition', label: 'Condition', value: null },
      { key: 'clubhouse', label: 'Clubhouse', value: 8.9 },
    ]);
    const keys = [...container.querySelectorAll('[data-category-bar]')].map((el) => el.getAttribute('data-category-bar'));
    expect(keys).toEqual(['design', 'clubhouse']);
  });

  it('renders nothing when every value is null', () => {
    const { container } = grid([
      { key: 'design', label: 'Design', value: null },
      { key: 'condition', label: 'Condition', value: null },
    ]);
    expect(container.querySelector('[data-category-bar-grid]')).toBeNull();
  });

  it('fills the bar to value×10% (84% for 8.4) and clamps at 0% and 100%', () => {
    const { container } = grid([
      { key: 'design', label: 'Design', value: 8.4 },
      { key: 'condition', label: 'Condition', value: -2 },
      { key: 'clubhouse', label: 'Clubhouse', value: 12 },
    ]);
    const width = (key: string) =>
      (container.querySelector(`[data-category-bar="${key}"] [data-category-fill]`) as HTMLElement).style.width;
    expect(width('design')).toBe('84%');
    expect(width('condition')).toBe('0%');
    expect(width('clubhouse')).toBe('100%');
  });

  it('prints the fill and the figure in the same white, and the figure to one decimal', () => {
    const { container } = grid([{ key: 'design', label: 'Design', value: 10 }]);
    const cell = container.querySelector('[data-category-bar="design"]') as HTMLElement;
    const fill = cell.querySelector('[data-category-fill]') as HTMLElement;
    const figure = cell.querySelector('[data-category-figure]') as HTMLElement;
    expect(fill.style.background).toBe('rgb(248, 250, 252)');
    expect(figure.style.color).toBe('rgb(248, 250, 252)');
    expect(A.INK).toBe('#F8FAFC');
    expect(figure.textContent).toBe('10.0');
    expect(figure.style.fontVariantNumeric).toContain('tabular-nums');
  });

  it('never uses a tone function or negative letter-spacing', () => {
    const file = src('src/components/shared/CategoryBarGrid.tsx');
    expect(file).not.toContain('courseSubScoreTone');
    expect(file).not.toContain('categoryFillPercent');
    expect(file).not.toContain('letterSpacing');
  });

  it('the range caption is gone from FewReviews', () => {
    const file = src('src/components/courses/course-detail/reviews/FewReviews.tsx');
    expect(file).not.toContain('The bar is the range between the lowest and highest score');
    expect(file).not.toContain('<CategoryBands');
  });
});
