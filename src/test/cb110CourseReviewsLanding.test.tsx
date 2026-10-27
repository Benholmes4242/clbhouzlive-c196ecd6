import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CourseReview } from '@/hooks/useCourseReviews';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import CourseReviewsRedirect from '@/pages/CourseReviewsRedirect';
import { __resetScrollerCache } from '@/lib/getScrollParent';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';

const fixture = vi.hoisted(() => ({ rows: [] as CourseReview[], loading: false }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: undefined }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/hooks/useSingleReviewContext', () => ({ useSingleReviewContext: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseReviewSample', () => ({ useCourseReviewSample: () => ({ data: fixture.rows, isSuccess: !fixture.loading, isError: false }) }));
vi.mock('@/hooks/useCourseReviews', () => ({ useCourseReviews: () => ({ data: fixture.loading ? undefined : fixture.rows, isSuccess: !fixture.loading, isLoading: fixture.loading, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/useBusinessClaimForCourse', () => ({ useBusinessClaimForCourse: () => ({ data: null }) }));
vi.mock('@/hooks/useReviewResponses', () => ({ useReviewResponses: () => ({ data: [] }), useSubmitReviewResponse: () => ({ mutate: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ stateFor: () => ({ mine: false }), toggle: vi.fn() }) }));
vi.mock('@/hooks/useMembersWhoPlayedCourse', () => ({ useMembersWhoPlayedCourse: () => ({ data: { members: [] } }) }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/ui/pull-to-refresh', () => ({ PullToRefreshContainer: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

const scroll = vi.fn();
const center = vi.fn();
const openSheet = vi.fn();
let root: HTMLDivElement;
function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}
function mount(url: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = () => <MemoryRouter initialEntries={[url]}><QueryClientProvider client={client}>
    <div data-course-detail><div data-course-review-tabs style={{ top: 47 }} />
      <CourseReviewsTab courseId="course" courseName="Course" /></div><LocationProbe />
  </QueryClientProvider></MemoryRouter>;
  return { ...render(tree(), { container: root }), tree };
}
beforeEach(() => {
  vi.useFakeTimers();
  fixture.loading = false;
  fixture.rows = Array.from({ length: 10 }, (_, i): CourseReview => ({
    id: `r${i}`, user_id: `u${i}`, course_id: 'course', rating: 8,
    design_score: 8, condition_score: 8, clubhouse_score: 8, facilities_score: 8,
    review: null, review_date: '2026-10-01', helpful_count: 0, unhelpful_count: 0, is_mock: false,
    user_profiles: { id: `u${i}`, display_name: `Golfer ${i}`, username: `golfer${i}`, profile_photo_url: null }, media: [],
  }));
  root = document.createElement('div'); root.id = 'root'; root.style.overflowY = 'auto'; root.scrollTop = 100;
  root.scrollTo = scroll; document.body.appendChild(root); __resetScrollerCache();
  scroll.mockClear(); center.mockClear(); openSheet.mockClear();
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: center });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const top = this.id === 'root' ? 10 : this.hasAttribute('data-review-id') ? 640 : this.hasAttribute('data-reviews-tab-top') ? 200 : 0;
    const height = this.hasAttribute('data-course-review-tabs') ? 44 : 100;
    return { top, bottom: top + height, height, left: 0, right: 400, width: 400, x: 0, y: top, toJSON: () => ({}) };
  });
  useReviewSheetStore.setState({ open: openSheet, isOpen: false, payload: null });
});
afterEach(() => { cleanup(); root.remove(); __resetScrollerCache(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('CB110 reviews-tab-top landing', () => {
  it.each([1, 3, 6, 10])('lands the Reviews tab top below sticky tabs for %i ratings and replaces at', (count) => {
    fixture.rows = fixture.rows.slice(0, count);
    mount('/courses/course?tab=reviews&at=reviews&keep=yes');
    expect(scroll).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(20));
    expect(scroll).toHaveBeenCalledExactlyOnceWith({ top: 199, left: 0, behavior: 'auto' });
    expect(screen.getByTestId('location').textContent).toBe('/courses/course?tab=reviews&keep=yes');
    expect(document.querySelector('.animate-soft-pulse')).toBeNull();
    expect(openSheet).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(100));
    expect(scroll).toHaveBeenCalledOnce();
  });
  it('waits for the tab content to render before scrolling and clearing at', () => {
    fixture.loading = true;
    const view = mount('/courses/course?tab=reviews&at=reviews');
    act(() => vi.advanceTimersByTime(100));
    expect(scroll).not.toHaveBeenCalled();
    expect(screen.getByTestId('location').textContent).toContain('at=reviews');
    fixture.loading = false; view.rerender(view.tree());
    act(() => vi.advanceTimersByTime(20));
    expect(scroll).toHaveBeenCalledExactlyOnceWith({ top: 199, left: 0, behavior: 'auto' });
    expect(screen.getByTestId('location').textContent).toBe('/courses/course?tab=reviews');
  });
  it('does not scroll for tab=reviews alone', () => {
    mount('/courses/course?tab=reviews');
    act(() => vi.advanceTimersByTime(20));
    expect(scroll).not.toHaveBeenCalled();
    expect(center).not.toHaveBeenCalled();
  });
  it('lands on the tab top when the course has no ratings and clears at', () => {
    fixture.rows = []; mount('/courses/course?tab=reviews&at=reviews');
    act(() => vi.advanceTimersByTime(20));
    expect(scroll).toHaveBeenCalledExactlyOnceWith({ top: 199, left: 0, behavior: 'auto' });
    expect(screen.getByTestId('location').textContent).toBe('/courses/course?tab=reviews');
  });
  it.each(['review', 'highlight'])('lets an explicit %s target take precedence over at', (param) => {
    mount(`/courses/course?tab=reviews&at=reviews&${param}=r5`);
    act(() => vi.advanceTimersByTime(20));
    expect(center).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
    expect(scroll).not.toHaveBeenCalled();
    expect(openSheet).toHaveBeenCalledTimes(param === 'review' ? 1 : 0);
    expect(screen.getByTestId('location').textContent).toBe('/courses/course?tab=reviews');
  });
});
describe('CB110 legacy redirect', () => {
  it.each(['', '?review=r7', '?highlight=r8'])('redirects the old reviews page and preserves its target (%s)', (search) => {
    render(<MemoryRouter initialEntries={[`/courses/course/reviews${search}`]}><Routes>
      <Route path="/courses/:courseId/reviews" element={<CourseReviewsRedirect />} />
      <Route path="/courses/:courseId" element={<LocationProbe />} />
    </Routes></MemoryRouter>, { container: root });
    const url = new URL(screen.getByTestId('location').textContent ?? '', 'https://example.test');
    expect(url.pathname).toBe('/courses/course');
    expect(url.searchParams.get('tab')).toBe('reviews');
    expect(url.searchParams.get('at')).toBe('reviews');
    for (const [key, value] of new URLSearchParams(search)) expect(url.searchParams.get(key)).toBe(value);
  });
});