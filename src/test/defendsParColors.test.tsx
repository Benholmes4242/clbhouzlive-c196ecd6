/** Hardest-hole and hardest-par-type colouring on the Course tab: red like the
 *  club profile's How it plays, green kept for the easiest hole. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import DefendsPar from '@/components/courses/course-detail/about/DefendsPar';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const mocks = vi.hoisted(() => ({ data: null as unknown }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ data: mocks.data }) }));
vi.mock('@/components/courses/course-detail/about/AllHolesSheet', () => ({ default: () => null }));

const hole = (n: number, avg: number, par: number, si: number | null = n): CourseHole =>
  ({ hole_no: n, par, yards: null, stroke_index: si, rounds: 10, avg_to_par: avg, avg_gross: 4 + avg, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0 } });

const HOLES = [
  hole(1, 0.8, 3), hole(2, 0.8, 3), hole(3, 0.8, 3), hole(4, 1.2, 3),
  hole(5, 0.2, 4), hole(6, 0.2, 4), hole(7, -0.2, 4), hole(8, 0.2, 4), hole(9, 0.2, 4),
];

const norm = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

const renderDefends = () =>
  render(<MemoryRouter initialEntries={['/x']}><DefendsPar courseId="c1" courseName="C" /></MemoryRouter>).container;

afterEach(() => { cleanup(); mocks.data = null; });

describe('DefendsPar colours', () => {
  it('hardest hole is red, easiest stays green, neutral bars are untouched', () => {
    mocks.data = { available: true, total_rounds: 10, holes: HOLES };
    const c = renderDefends();
    const bar = (n: number) => c.querySelector<HTMLElement>(`[data-testid="defends-bar-${n}"]`);
    expect(bar(4)!.style.background).toBe(norm(A.RED));
    expect(bar(7)!.style.background).toBe(norm(A.GREEN));
    expect(bar(5)!.style.background).not.toBe(norm(A.RED));
    expect(bar(5)!.style.background).not.toBe(norm(A.GREEN));
    // Hole labels carry the same emphasis: hardest red, easiest green.
    const labels = Array.from(c.querySelectorAll<HTMLElement>('span')).filter((el) => ['4', '7'].includes(el.textContent ?? ''));
    expect(labels.map((el) => el.textContent).sort()).toEqual(['4', '7']);
    expect(labels.find((el) => el.textContent === '4')!.style.color).toBe(norm(A.RED));
    expect(labels.find((el) => el.textContent === '7')!.style.color).toBe(norm(A.GREEN));
  });

  it('the hardest par type dot and figure are red; the others keep ink', () => {
    mocks.data = { available: true, total_rounds: 10, holes: HOLES };
    const c = renderDefends();
    expect(c.querySelector<HTMLElement>('[data-testid="par-type-dot-3"]')!.style.background).toBe(norm(A.RED));
    expect(c.querySelector<HTMLElement>('[data-testid="par-type-figure-3"]')!.style.color).toBe(norm(A.RED));
    expect(c.querySelector<HTMLElement>('[data-testid="par-type-dot-4"]')!.style.background).toBe('rgba(248, 250, 252, 0.62)');
    expect(c.querySelector<HTMLElement>('[data-testid="par-type-figure-4"]')!.style.color).toBe(norm(A.INK));
  });
});
