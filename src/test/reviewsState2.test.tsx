import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SingleReview } from '@/components/courses/course-detail/reviews/SingleReview';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import { calibrationFacts, isSingleReview, raterHistory, reviewPlayedMonth, type RaterContext } from '@/lib/reviews/singleReview';
import type { CourseReview } from '@/hooks/useCourseReviews';

const fixture = vi.hoisted(() => ({ rows: [] as any[], user: undefined as { id: string } | undefined }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSingleReviewContext', () => ({ useSingleReviewContext: () => ({ data: null }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: fixture.user }) }));
vi.mock('@/hooks/useCourseReviewSample', () => ({ useCourseReviewSample: () => ({ data: fixture.rows, isSuccess: true, isError: false }) }));
vi.mock('@/hooks/useCourseReviews', () => ({ useCourseReviews: () => ({ data: fixture.rows, isSuccess: true, isLoading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: { course_id: 'course', avg_overall_score: 10, review_count: 1, text_review_count: 1 } }) }));
vi.mock('@/hooks/useBusinessClaimForCourse', () => ({ useBusinessClaimForCourse: () => ({ data: null }) }));
vi.mock('@/hooks/useReviewResponses', () => ({ useReviewResponses: () => ({ data: [] }), useSubmitReviewResponse: () => ({ mutate: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ stateFor: () => ({ mine: false }), toggle: vi.fn() }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: (select: any) => select({ open: vi.fn(), isOpen: false }) }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/ui/pull-to-refresh', () => ({ PullToRefreshContainer: ({ children }: any) => <>{children}</> }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

const review: CourseReview = {
  id: 'r', course_id: 'course', user_id: 'danny', rating: 10,
  design_score: 10, condition_score: 10, clubhouse_score: 10, facilities_score: 10,
  review: 'A breathtaking course.', review_date: '2026-02-15', helpful_count: 0, unhelpful_count: 0, is_mock: false,
  user_profiles: { id: 'danny', display_name: 'Danny Holmes', username: 'danny', profile_photo_url: null }, media: [],
};
const context: RaterContext = { handicap: 2, roundsHere: 2, coursesRated: 48, perfectTens: 4, gender: 'male' };
function single(row = review, facts: RaterContext | null = context, month?: number | null) {
  return render(<MemoryRouter><SingleReview totalRatings={1} review={row} context={facts} playedMonth={month} onMediaClick={vi.fn()} onAddYours={vi.fn()} /></MemoryRouter>);
}
function tab() {
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><CourseReviewsTab courseId="course" courseName="Course" /></QueryClientProvider></MemoryRouter>);
}
beforeEach(() => { fixture.rows = []; fixture.user = undefined; });

describe('REVIEWS_STATE_2', () => {
  it('only exactly one total rating selects this screen', () => {
    expect(isSingleReview(0)).toBe(false);
    expect(isSingleReview(1)).toBe(true);
    expect(isSingleReview(2)).toBe(false);
  });
  it('one-rating tab shows one community score beside its count, with no category bars or distribution', () => {
    fixture.rows = [review];
    const { container } = tab();
    expect(container.querySelector('[data-reviews-state="one"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-review-score]')).toHaveLength(1);
    expect(container.querySelectorAll('[role="progressbar"], [data-category-bar], [data-distribution]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-community-score]')).toHaveLength(1);
  });
  it('overall score has one prominent home on the rater row', () => {
    const { container } = single();
    const row = container.querySelector('[data-rater-row]');
    expect(row?.querySelector('[data-review-score]')?.textContent).toBe('10.0');
    expect(container.querySelectorAll('[data-review-score]')).toHaveLength(1);
  });
  it('zero tracked rounds omits the played-here clause', () => {
    const { container } = single(review, { ...context, roundsHere: 0 });
    expect(container.querySelector('[data-tracked-play]')).toBeNull();
    expect(container.querySelector('[data-rater-context]')?.textContent).not.toContain('0 times');
  });
  it('positive tracked rounds renders the real played-here count', () => {
    const { container } = single(review, { ...context, roundsHere: 3 });
    expect(container.querySelector('[data-tracked-play]')?.textContent).toContain('3 times');
  });
  it('perfect overall ten at the ten-course floor qualifies for calibration', () => {
    expect(calibrationFacts(review, { ...context, coursesRated: 10 })?.coursesRated).toBe(10);
  });
  it('nine rated courses does not qualify for calibration', () => {
    expect(calibrationFacts(review, { ...context, coursesRated: 9 })).toBeNull();
  });
  it('non-perfect overall score does not qualify for calibration', () => {
    const { container } = single({ ...review, rating: 9.9 });
    expect(container.querySelector('[data-review-calibration]')).toBeNull();
  });
  it('all four tens includes every-category fact using the same overall score', () => {
    const { container } = single();
    expect(calibrationFacts(review, context)?.everyCategory).toBe(true);
    expect(container.querySelector('[data-review-calibration]')?.textContent).toContain('10.0 on every category');
  });
  it('mixed sub-scores omit every-category clause but keep calibration', () => {
    const mixed = { ...review, design_score: 9.5 };
    const { container } = single(mixed);
    expect(calibrationFacts(mixed, context)?.everyCategory).toBe(false);
    expect(container.querySelector('[data-review-calibration]')?.textContent).not.toContain('on every category');
    expect(container.querySelector('[data-review-calibration]')?.textContent).toMatch(/^He has rated 48 courses and given 4 of them a ten/);
  });
  it('missing sub-score cannot claim every category was ten', () => {
    expect(calibrationFacts({ ...review, facilities_score: null }, context)?.everyCategory).toBe(false);
  });
  it('unknown played month omits season even when review_date exists', () => {
    const { container } = single(review, context, null);
    expect(reviewPlayedMonth(null)).toBeNull();
    expect(container.querySelector('[data-played-season]')).toBeNull();
  });
  it('known review-owned month renders February without reading review_date', () => {
    const { container } = single({ ...review, review_date: '2026-07-10' }, context, 2);
    expect(reviewPlayedMonth(2)).toBe('February');
    expect(container.querySelector('[data-played-season]')?.textContent).toBe('Played February');
  });
  it('two total ratings do not render State 2', () => {
    fixture.rows = [review, { ...review, id: 'r2', user_id: 'other' }];
    const { container } = tab();
    expect(container.querySelector('[data-reviews-state="one"]')).toBeNull();
  });
  it('viewer-only rating still renders State 2', () => {
    fixture.user = { id: 'danny' };
    fixture.rows = [review];
    const { container } = tab();
    expect(container.querySelector('[data-reviews-state="one"]')).not.toBeNull();
  });
  it('unknown history omits calibration rather than inventing counts', () => {
    const { container } = single(review, null);
    expect(container.querySelector('[data-review-calibration]')).toBeNull();
    expect(container.querySelector('[data-rater-context]')).toBeNull();
  });
  it('rater history counts distinct courses and exact tens', () => {
    expect(raterHistory([{ course_id: 'a', rating: 10 }, { course_id: 'a', rating: 10 }, { course_id: 'b', rating: 9.9 }])).toEqual({ coursesRated: 2, perfectTens: 1 });
  });
  it('Add yours calls supplied existing handler once', () => {
    const add = vi.fn();
    render(<MemoryRouter><SingleReview totalRatings={1} review={review} context={null} onMediaClick={vi.fn()} onAddYours={add} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Add yours' }));
    expect(add).toHaveBeenCalledTimes(1);
  });
  it('no middle-80 band or split section component exists in Reviews tree', () => {
    const sources = import.meta.glob('../components/courses/course-detail/reviews/**/*.tsx', { query: '?raw', import: 'default', eager: true });
    expect(Object.keys(sources).length).toBeGreaterThan(0);
    for (const source of Object.values(sources)) {
      expect(source).not.toMatch(/subScoreBandStatistic|showableSplitBands|middle-80|middle80|How it splits|how it splits/);
    }
  });
});