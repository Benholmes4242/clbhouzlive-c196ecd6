import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { chartCardSize, chartVisible, prosEligible, movementLabel, type TenChart, type ChartRow } from '@/components/courses/browse/clbhouzTenRules';
const state = vi.hoisted(() => ({ everyone: null as TenChart | null, pros: null as TenChart | null }));
vi.mock('@/components/courses/browse/useClbhouzTenChart', () => ({ useClbhouzTenChart: (cohort: string) => ({ data: cohort === 'everyone' ? state.everyone : state.pros, isPending: false, isError: false }) }));
import { ClbhouzTenSection } from '@/components/courses/browse/ClbhouzTenSection';
import { ClbhouzTenSheet } from '@/components/courses/browse/ClbhouzTenSheet';
import { SECTION_EYEBROW, SECTION_TITLE } from '@/lib/tokens/type';
function chart(count = 7, voters = 5): TenChart {
 return { week_start: '2026-11-23', cohort: 'everyone', everyone_voters: 20, pros_voters: voters, rows: Array.from({ length: count }, (_, i): ChartRow => ({ rank: i + 1, course_id: `course-${i}`, name: `Course ${i}`, region: 'Fife', sub_country: 'Scotland', country: 'GB', thumbnail_image: null, points: 20 - i, tens: 3, number_ones: 1, movement: null, delta: null, story: null, weeks_on_chart: 1, weeks_at_one: 0, best_rank: i + 1 })) };
}
beforeEach(() => {
 cleanup(); state.everyone = chart(); state.pros = chart(3);
 vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
 Element.prototype.scrollIntoView = vi.fn(); Element.prototype.scrollTo = vi.fn();
 vi.stubGlobal('matchMedia', () => ({ matches: true }));
});
describe('Brief 32 chart rules', () => {
 it('floors a 390 container to 264 × 322', () => { expect(chartCardSize(390)).toEqual({ width: 264, height: 322 }); });
 it('floors a 320 container to 213 × 259', () => { expect(chartCardSize(320)).toEqual({ width: 213, height: 259 }); });
 it('requires three Everyone rows', () => { expect(chartVisible(chart(2))).toBe(false); expect(chartVisible(chart(3))).toBe(true); });
 it('requires five Pros voters and three Pros rows', () => { expect(prosEligible(chart(7, 4), chart(3))).toBe(false); expect(prosEligible(chart(7, 5), chart(2))).toBe(false); expect(prosEligible(chart(7, 5), chart(3))).toBe(true); });
 it('maps every movement and omits first-week movement', () => {
  expect(movementLabel({ movement: 'up', delta: 3 })).toBe('▲3');
  expect(movementLabel({ movement: 'down', delta: -2 })).toBe('▼2');
  expect(movementLabel({ movement: 'same', delta: 0 })).toBe('NO CHANGE');
  expect(movementLabel({ movement: 'new', delta: null })).toBe('NEW');
  expect(movementLabel({ movement: 're', delta: null })).toBe('RE');
  expect(movementLabel({ movement: null, delta: null })).toBeNull();
 });
 it('renders no section below the Everyone threshold', () => { state.everyone = chart(2); const { container } = render(<MemoryRouter><ClbhouzTenSection /></MemoryRouter>); expect(container.querySelector('[data-clb-ten]')).toBeNull(); });
 it('renders no toggle at four voters and the toggle at five', () => { state.everyone = chart(7, 4); const view = render(<MemoryRouter><ClbhouzTenSection /></MemoryRouter>); expect(screen.queryByRole('button', { name: 'Pros' })).toBeNull(); state.everyone = chart(7, 5); view.rerender(<MemoryRouter><ClbhouzTenSection /></MemoryRouter>); expect(screen.getByRole('button', { name: 'Pros' })).toBeInTheDocument(); });
 it('uses seven cards and seven ticks and resets to one on cohort switch', () => {
  const { container } = render(<MemoryRouter><ClbhouzTenSection /></MemoryRouter>);
  expect(container.querySelectorAll('.clb-ten-card')).toHaveLength(7); expect(container.querySelectorAll('.clb-ten-tick')).toHaveLength(7);
  fireEvent.click(screen.getByRole('button', { name: 'Pros' })); expect(container.querySelectorAll('.clb-ten-card')).toHaveLength(3); expect(screen.getByRole('button', { name: 'Go to card 1' })).toHaveAttribute('aria-current', 'true');
 });
 it('consumes canonical heading roles without a week stamp', () => {
  const { container } = render(<MemoryRouter><ClbhouzTenSection /></MemoryRouter>);
  const eyebrow = container.querySelector('.clb-ten-eyebrow') as HTMLElement; const title = container.querySelector('h2') as HTMLElement;
  expect(eyebrow.style.fontSize).toBe(`${SECTION_EYEBROW.fontSize}px`); expect(title.style.fontSize).toBe(`${SECTION_TITLE.fontSize}px`);
  expect(container.textContent).not.toContain('2026-11-23');
 });
 it('marks exactly the requested course in the reusable sheet', () => {
  render(<MemoryRouter><ClbhouzTenSheet open cohort="everyone" highlightCourseId="course-3" onOpenChange={() => {}} /></MemoryRouter>);
  expect(document.querySelectorAll('[data-highlight=true]')).toHaveLength(1); expect(document.querySelector('[data-highlight=true]')).toHaveTextContent('Course 3');
 });
});
