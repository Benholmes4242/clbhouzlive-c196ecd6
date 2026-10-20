import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CourseReview } from '@/hooks/useCourseReviews';

const fixture = vi.hoisted(() => ({ rows: [] as CourseReview[], loading: false, closeFullscreen: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/components/posts/useReviewMedia', () => ({ useReviewMedia: () => ({ data: [] }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null }) }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('@/components/explore-tab-new/courseled/RoundEngagementActions', () => ({ RoundEngagementActions: () => null }));
vi.mock('@/store/fullscreenFeedStore', () => ({ useFullscreenFeedStore: { getState: () => ({ isOpen: true, close: fixture.closeFullscreen }) } }));
vi.mock('@/hooks/useSingleReviewContext', () => ({ useSingleReviewContext: () => ({ data: null }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: undefined }) }));
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

import { ReviewBottomSheet } from '@/components/posts/ReviewBottomSheet';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';

const openSheet = vi.fn((payload) => useReviewSheetStore.setState({ isOpen: true, payload }));
const scroll = vi.fn();
const row = (id: string): CourseReview => ({
  id, user_id: id, course_id: 'course', rating: 8, design_score: 8, condition_score: 8, clubhouse_score: 8, facilities_score: 8,
  review: null, review_date: '2026-10-01', helpful_count: 0, unhelpful_count: 0, is_mock: false,
  user_profiles: { id, display_name: id, username: id, profile_photo_url: null }, media: [],
});
function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}
function tab(url: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = () => <MemoryRouter initialEntries={[url]}><QueryClientProvider client={client}><CourseReviewsTab courseId="course" courseName="Course" /><LocationProbe /></QueryClientProvider></MemoryRouter>;
  return { ...render(tree()), tree };
}
function target() { return document.querySelector('[data-review-id="r0"]'); }
function highlighted() { return target()?.classList.contains('animate-soft-pulse') ?? false; }

beforeEach(() => {
  vi.useFakeTimers();
  fixture.rows = Array.from({ length: 10 }, (_, i) => row(`r${i}`));
  fixture.loading = false;
  fixture.closeFullscreen.mockClear();
  openSheet.mockClear();
  scroll.mockClear();
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scroll });
  useReviewSheetStore.setState({ open: openSheet, isOpen: false, payload: null });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('review COURSE navigation', () => {
  it.each(['r0', undefined])('closes both overlays in order without a sheet-opening URL (id=%s)', (reviewId) => {
    const close = vi.fn();
    render(<MemoryRouter><ReviewBottomSheet isOpen onClose={close} user={{ id: 'member', name: 'Member' }} courseId="course" courseName="Course" rating={8} reviewId={reviewId} resolvedMedia={[]} resolvedReviewText="Review" /><LocationProbe /></MemoryRouter>);
    const footer = document.querySelector('[data-review-foot-actions]');
    const courseButton = footer?.querySelectorAll('button')[0];
    expect(courseButton).toBeDefined();
    if (!courseButton) throw new Error('Missing COURSE action');
    fireEvent.click(courseButton);
    expect(close).toHaveBeenCalledOnce();
    expect(fixture.closeFullscreen).toHaveBeenCalledOnce();
    expect(close.mock.invocationCallOrder[0]).toBeLessThan(fixture.closeFullscreen.mock.invocationCallOrder[0]);
    expect(screen.getByTestId('location').textContent).toBe(`/courses/course?tab=reviews${reviewId ? '&highlight=r0' : ''}`);
    expect(screen.getByTestId('location').textContent).not.toContain('review=');
  });
});

describe('highlight-only review links', () => {
  it.each([1, 3, 6, 10])('lands on the row for %i ratings without opening a sheet and clears after three seconds', (count) => {
    fixture.rows = fixture.rows.slice(0, count);
    tab('/courses/course?tab=reviews&highlight=r0');
    expect(highlighted()).toBe(true);
    expect(openSheet).not.toHaveBeenCalled();
    expect(screen.getByTestId('location').textContent).toBe('/courses/course?tab=reviews');
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
    act(() => vi.advanceTimersByTime(2999));
    expect(highlighted()).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(highlighted()).toBe(false);
    expect(openSheet).not.toHaveBeenCalled();
  });
  it('waits for loaded reviews before scrolling or starting the clock', () => {
    fixture.loading = true;
    const view = tab('/courses/course?tab=reviews&highlight=r0');
    act(() => vi.advanceTimersByTime(5000));
    expect(scroll).not.toHaveBeenCalled();
    fixture.loading = false;
    view.rerender(view.tree());
    expect(highlighted()).toBe(true);
    expect(scroll).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(3000));
    expect(highlighted()).toBe(false);
    expect(openSheet).not.toHaveBeenCalled();
  });
  it('clears an unknown id without scrolling or opening a sheet', () => {
    tab('/courses/course?tab=reviews&highlight=unknown');
    expect(highlighted()).toBe(false);
    expect(scroll).not.toHaveBeenCalled();
    expect(openSheet).not.toHaveBeenCalled();
    expect(screen.getByTestId('location').textContent).toBe('/courses/course?tab=reviews');
  });
});

describe('shared and notification review links', () => {
  it.each(['review', 'reviewId'])('still opens the sheet for %s and starts the highlight clock on dismissal', (param) => {
    tab(`/courses/course?tab=reviews&${param}=r0`);
    expect(openSheet).toHaveBeenCalledOnce();
    expect(openSheet).toHaveBeenCalledWith(expect.objectContaining({ reviewId: 'r0', courseId: 'course' }));
    expect(screen.getByTestId('location').textContent).toBe('/courses/course?tab=reviews');
    act(() => vi.advanceTimersByTime(4000));
    expect(highlighted()).toBe(true);
    act(() => useReviewSheetStore.getState().close());
    act(() => vi.advanceTimersByTime(3000));
    expect(highlighted()).toBe(false);
  });
});