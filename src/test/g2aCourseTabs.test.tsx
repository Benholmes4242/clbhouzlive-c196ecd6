import React from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: null }) }));
vi.mock('@/hooks/gam/useCourseMeta', () => ({ useCourseMeta: () => ({ data: null }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseTop100Standing', () => ({ useCourseTop100Standing: () => ({ data: null }) }));
vi.mock('@/components/courses/course-detail/useCourseRecordSummary', () => ({ useCourseRecordSummary: () => ({ courseRecordHolders: [] }) }));
vi.mock('@/components/courses/course-detail/about/useHeroReferenceLine', () => ({ useHeroReferenceLine: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/courses/course-detail/CourseAboutTab', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/CourseReviewsTab', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/CourseYouTab', () => ({ default: () => null }));
vi.mock('@/components/course-media-tab/CourseMediaTabNew', () => ({ default: () => null }));
vi.mock('@/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown', () => ({ CourseLegendsDrilldown: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/you/YourRoundsSheet', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/you/YourHolesSheet', () => ({ default: () => null }));

import GolfClubView from '@/components/golf-club/GolfClubView';
import { analyticsEvents } from '@/utils/analyticsEvents';

const nativeObserver = window.IntersectionObserver;
const observers = new Map<Element, IntersectionObserverCallback>();
let scroller: HTMLDivElement;
let unregister: () => void;
function node(selector: string) {
  const value = document.querySelector<HTMLElement>(selector);
  if (!value) throw new Error(`Missing ${selector}`);
  return value;
}
function Location() { return <output data-test-url>{useLocation().search}</output>; }
function mount(modal = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['course-detail', 'course-id'], { id: 'course-id', name: 'Hayling', country: 'England' });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/courses/course-id?keep=yes']}><GolfClubView courseId="course-id" isInModal={modal} /><Location /></MemoryRouter></QueryClientProvider>);
}
function rowPassed(bottom: number, intersecting = false) {
  const row = node('[data-course-review-tabs]');
  const callback = observers.get(row);
  if (!callback) throw new Error('Course row was not observed');
  act(() => callback([{ target: row, isIntersecting: intersecting, boundingClientRect: { bottom }, rootBounds: { top: 56 } } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
}
async function move(top: number) {
  scroller.scrollTop = top;
  await act(async () => { fireEvent.scroll(scroller); await new Promise(resolve => requestAnimationFrame(() => resolve(null))); });
}
beforeEach(() => {
  vi.clearAllMocks(); resetToExpanded(); observers.clear();
  scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller);
  unregister = registerNavScroller(scroller);
  window.IntersectionObserver = class {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; }
    observe(target: Element) { observers.set(target, this.callback); }
    unobserve(target: Element) { observers.delete(target); }
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});
afterEach(() => { cleanup(); unregister(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = nativeObserver; });

describe('G2A course page dock', () => {
  it('keeps standalone tabs in flow with no stuck marker or sticky scrim', () => {
    mount(); const row = node('[data-course-review-tabs]');
    expect(row).not.toHaveClass('sticky'); expect(row.style.top).toBe('');
    expect(row).not.toHaveAttribute('data-stuck');
    expect(document.querySelector('[data-sticky-safe-area-scrim]')).toBeNull();
  });
  it('shows only after the row passes the islands, while open', async () => {
    mount(); rowPassed(160, true); expect(node('[data-island-dock]')).toHaveAttribute('data-shown', 'false');
    rowPassed(1000); expect(node('[data-island-dock]')).toHaveAttribute('data-shown', 'false');
    rowPassed(55); expect(node('[data-island-dock]')).toHaveAttribute('data-shown', 'true');
    await move(160); expect(node('[data-island-dock]')).toHaveAttribute('data-shown', 'false');
    await move(140); expect(node('[data-island-dock]')).toHaveAttribute('data-shown', 'true');
  });
  it('keeps the hidden copy mounted inert and aria-hidden across folding', async () => {
    mount(); const copy = node('[data-course-controls="docked"]'); const dock = node('[data-island-dock]');
    expect(dock).toHaveAttribute('inert'); expect(dock).toHaveAttribute('aria-hidden', 'true'); expect(within(dock).queryByRole('tab')).toBeNull();
    rowPassed(55); expect(dock).not.toHaveAttribute('inert'); expect(dock).toHaveAttribute('aria-hidden', 'false');
    await move(160); expect(node('[data-course-controls="docked"]')).toBe(copy);
    expect(dock).toHaveAttribute('inert'); expect(dock).toHaveAttribute('aria-hidden', 'true');
  });
  it('docked and in-place selections share URL state and analytics without dropping other parameters', () => {
    mount(); rowPassed(55);
    fireEvent.click(within(node('[data-island-dock]')).getAllByRole('tab')[3]);
    expect(node('[data-test-url]').textContent).toBe('?keep=yes&tab=reviews');
    expect(within(node('[data-course-controls="in-place"]')).getAllByRole('tab')[3]).toHaveAttribute('aria-selected', 'true');
    expect(analyticsEvents.track).toHaveBeenLastCalledWith('course_tab_viewed', { course_id: 'course-id', tab: 'reviews' });
    fireEvent.click(within(node('[data-course-controls="in-place"]')).getAllByRole('tab')[0]);
    expect(node('[data-test-url]').textContent).toBe('?keep=yes');
    expect(within(node('[data-island-dock]')).getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
    expect(analyticsEvents.track).toHaveBeenLastCalledWith('course_tab_viewed', { course_id: 'course-id', tab: 'course' });
    expect(analyticsEvents.track).toHaveBeenCalledTimes(3);
  });
  it('retains the modal sticky row and no dock or URL tab writes', () => {
    mount(true); const row = node('[data-course-review-tabs]');
    expect(row).toHaveClass('sticky', 'bg-background'); expect(row.style.top).toBe('0px'); expect(row.style.zIndex).toBe('20');
    expect(row.style.paddingTop).toBe('env(safe-area-inset-top, 0px)');
    expect(document.querySelector('[data-island-dock]')).toBeNull();
    fireEvent.click(within(row).getAllByRole('tab')[3]); expect(node('[data-test-url]').textContent).toBe('?keep=yes');
    expect(analyticsEvents.track).toHaveBeenLastCalledWith('course_tab_viewed', { course_id: 'course-id', tab: 'reviews' });
  });
});