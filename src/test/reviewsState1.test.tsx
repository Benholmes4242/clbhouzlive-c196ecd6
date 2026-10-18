import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import { NobodyHasRated } from '@/components/courses/course-detail/reviews/NobodyHasRated';
import { reviewsCourseState } from '@/lib/reviews/sampleRules';
import { REVIEWS_CATALOGUE_SNAPSHOT, reviewsCatalogueWithoutReview } from '@/lib/reviews/catalogueSnapshot';

const fixture = vi.hoisted(() => ({ rows: [] as any[], user: undefined as { id: string } | undefined }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: fixture.user }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/hooks/useCourseReviewSample', () => ({ useCourseReviewSample: () => ({ data: fixture.rows, isSuccess: true, isError: false }) }));
vi.mock('@/hooks/useCourseReviews', () => ({ useCourseReviews: () => ({ data: fixture.rows, isSuccess: true, isLoading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/useBusinessClaimForCourse', () => ({ useBusinessClaimForCourse: () => ({ data: null }) }));
vi.mock('@/hooks/useReviewResponses', () => ({ useReviewResponses: () => ({ data: [] }), useSubmitReviewResponse: () => ({ mutate: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ stateFor: () => ({ mine: false }), toggle: vi.fn() }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: (select: any) => select({ open: vi.fn(), isOpen: false }) }));
vi.mock('@/components/courses/course-detail/reviews/reviewFlatBits', () => ({ FlatReviewRow: () => <article data-testid="review-row" />, FlatAction: ({ label }: any) => <span>{label}</span> }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/ui/pull-to-refresh', () => ({ PullToRefreshContainer: ({ children }: any) => <>{children}</> }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

function renderTab() {
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <CourseReviewsTab courseId="augusta" courseName="Augusta Country Club" />
  </QueryClientProvider></MemoryRouter>);
}
beforeEach(() => { fixture.rows = []; fixture.user = undefined; });
describe('REVIEWS_STATE_1', () => {
  it('zero total ratings selects invitation and one does not', () => {
    expect(reviewsCourseState(0)).toBe('none');
    expect(reviewsCourseState(1)).toBe('rated');
  });
  it('full zero-rating tab has no score, distribution, sub-score rows or sample line', () => {
    const { container } = renderTab();
    expect(screen.getByRole('heading', { name: 'You would be the first' })).toBeInTheDocument();
    expect(container.textContent).toContain('No member has reviewed Augusta Country Club.');
    expect(container.textContent).toContain('You do not need a tracked round here to write one.');
    expect(container.textContent).not.toMatch(/Community|What they scored|Exceptional|Excellent|Sample|ratings|Level|above|below/);
    expect(container.querySelector('article')).toBeNull();
    expect(container.querySelector('[aria-busy]')).toBeNull();
  });
  it('one-rating course does not render empty invitation', () => {
    fixture.rows = [{ id: 'a', user_id: 'a', rating: 8, design_score: 8, condition_score: 8, clubhouse_score: 8, facilities_score: 8 }];
    renderTab();
    expect(screen.queryByRole('heading', { name: 'You would be the first' })).not.toBeInTheDocument();
    expect(screen.getByTestId('review-row')).toBeInTheDocument();
  });
  it('viewer-only rating is not a zero-rating course after exclusion', () => {
    fixture.user = { id: 'viewer' };
    fixture.rows = [{ id: 'r', user_id: 'viewer', rating: 8, design_score: 8, condition_score: 8, clubhouse_score: 8, facilities_score: 8 }];
    renderTab();
    expect(screen.queryByRole('heading', { name: 'You would be the first' })).not.toBeInTheDocument();
    expect(screen.getByTestId('review-row')).toBeInTheDocument();
  });
  it('stores two catalogue figures and derives without-review from their difference', () => {
    expect(REVIEWS_CATALOGUE_SNAPSHOT).toEqual({ total: 23292, rated: 0, asOf: '2026-10-18', pending: true });
    expect(Object.values(REVIEWS_CATALOGUE_SNAPSHOT).filter((value) => typeof value === 'number')).toEqual([23292, 0]);
    expect(reviewsCatalogueWithoutReview()).toBe(REVIEWS_CATALOGUE_SNAPSHOT.total - REVIEWS_CATALOGUE_SNAPSHOT.rated);
    render(<NobodyHasRated totalRatings={0} courseName="Augusta Country Club" onWriteFirst={vi.fn()} />);
    expect(screen.getByText(/23,292 of the 23,292 courses/)).toBeInTheDocument();
  });
  it('first-review CTA calls existing handler once', () => {
    const write = vi.fn();
    render(<NobodyHasRated totalRatings={0} courseName="Augusta Country Club" onWriteFirst={write} />);
    fireEvent.click(screen.getByRole('button', { name: 'Write the first' }));
    expect(write).toHaveBeenCalledTimes(1);
  });
});