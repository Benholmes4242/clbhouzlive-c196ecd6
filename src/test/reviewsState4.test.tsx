import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SingleReview } from '@/components/courses/course-detail/reviews/SingleReview';
import CourseReviewsTab from '@/components/courses/course-detail/CourseReviewsTab';
import { calibrationFacts, isSingleReview, raterHistory, reviewPlayedMonth, type RaterContext } from '@/lib/reviews/singleReview';
import { reviewsCommunitySample } from '@/lib/reviews/communitySample';
import { fewReviewFacts, partitionKnownReviews } from '@/lib/reviews/fewReviews';
import { isFewReviews, isFiveToNineReviews } from '@/lib/reviews/sampleRules';
import type { CourseReview } from '@/hooks/useCourseReviews';

const fixture = vi.hoisted(() => ({ rows: [] as any[], known: [] as string[], user: undefined as { id: string } | undefined }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSingleReviewContext', () => ({ useSingleReviewContext: () => ({ data: null }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: fixture.user }) }));
vi.mock('@/hooks/useCourseReviewSample', () => ({ useCourseReviewSample: () => ({ data: fixture.rows, isSuccess: true, isError: false }) }));
vi.mock('@/hooks/useCourseReviews', () => ({ useCourseReviews: () => ({ data: fixture.rows, isSuccess: true, isLoading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/useBusinessClaimForCourse', () => ({ useBusinessClaimForCourse: () => ({ data: null }) }));
vi.mock('@/hooks/useReviewResponses', () => ({ useReviewResponses: () => ({ data: [] }), useSubmitReviewResponse: () => ({ mutate: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ stateFor: () => ({ mine: false }), toggle: vi.fn() }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: (select: any) => select({ open: vi.fn(), isOpen: false }) }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/ui/pull-to-refresh', () => ({ PullToRefreshContainer: ({ children }: any) => <>{children}</> }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

vi.mock('@/hooks/useMembersWhoPlayedCourse', () => ({ useMembersWhoPlayedCourse: () => ({ data: { members: fixture.known.map(user_id => ({ user_id, in_circle: true })) } }) }));

const row = (id: string, rating: number, scores = [rating, rating, rating, rating]): CourseReview => ({
  id, user_id: id, course_id: 'course', rating, design_score: scores[0], condition_score: scores[1], clubhouse_score: scores[2], facilities_score: scores[3],
  review: null, review_date: '2026-02-15', helpful_count: 0, unhelpful_count: 0, is_mock: false,
  user_profiles: { id, display_name: id === 'mark' ? 'Mark Eldridge' : id === 'thomas' ? 'Thomas Holmes' : id, username: id, profile_photo_url: null }, media: [],
});

const population = (count: number) => Array.from({ length: count }, (_, i) => row(`r${i}`, [9.5, 9.1, 8.8, 8.4, 8.3, 7.2, 8, 8, 8][i]));
function tab() {
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><CourseReviewsTab courseId="course" courseName="West Kent Golf Club" /></QueryClientProvider></MemoryRouter>);
}
const counts = (container: HTMLElement) => [...container.querySelectorAll('[data-tier-count]')].map(el => Number(el.textContent));
beforeEach(() => { fixture.rows = population(6); fixture.rows.push(row('viewer', 10)); fixture.user = { id: 'viewer' }; fixture.known = []; });
describe('REVIEWS_STATE_4', () => {
  it('seven including viewer has six tier counts, the same six people as the average', () => {
    const { container } = tab();
    expect(counts(container)).toEqual([2, 3, 1, 0, 0]);
    expect(counts(container).reduce((sum, n) => sum + n, 0)).toBe(6);
    expect(container.querySelector('[data-community-rater-count]')?.getAttribute('data-community-rater-count')).toBe('6');
    expect(container.querySelector('[data-community-score]')?.textContent).toBe('8.6');
    expect(reviewsCommunitySample(fixture.rows, 'viewer').ratingCount).toBe(6);
  });
  it('six total including viewer shows at five others', () => {
    fixture.rows = [...population(5), row('viewer', 10)];
    const { container } = tab();
    expect(container.querySelector('[data-distribution]')).not.toBeNull();
    expect(counts(container).reduce((sum, n) => sum + n, 0)).toBe(5);
  });
  it('five total including viewer hides at four others', () => {
    fixture.rows = [...population(4), row('viewer', 10)];
    const { container } = tab();
    expect(container.querySelector('[data-reviews-state="five-to-nine"]')).not.toBeNull();
    expect(container.querySelector('[data-distribution]')).toBeNull();
    expect(reviewsCommunitySample(fixture.rows, 'viewer').ratingCount).toBe(4);
  });
  it('five total without a viewer rating shows at five others', () => {
    fixture.rows = population(5);
    const { container } = tab();
    expect(container.querySelector('[data-distribution]')).not.toBeNull();
    expect(counts(container).reduce((sum, n) => sum + n, 0)).toBe(5);
    expect(container.querySelector('[data-viewer-delta]')).toBeNull();
  });
  it('all five rows exist and zero bands have genuinely empty tracks', () => {
    const { container } = tab();
    expect(container.querySelectorAll('[data-tier-count]')).toHaveLength(5);
    for (const tier of ['FAIR', 'POOR']) {
      expect(container.querySelector(`[data-tier-count="${tier}"]`)?.textContent).toBe('0');
      const fill = container.querySelector(`[data-tier-track="${tier}"] > div`) as HTMLElement | null;
      expect(fill?.style.width).toBe('0%');
    }
  });
  it('nine total keeps the four category bars on excluding means', () => {
    fixture.rows = [...population(8), row('viewer', 1, [1, 1, 1, 1])];
    const { container } = tab();
    const bands = fewReviewFacts(reviewsCommunitySample(fixture.rows, 'viewer'))!.bands;
    expect(bands).toHaveLength(4);
    expect(container.querySelectorAll('[data-category-bar]')).toHaveLength(4);
    for (const band of bands) {
      const cell = container.querySelector(`[data-category-bar="${band.key}"]`);
      expect(cell?.querySelector('[data-category-figure]')?.textContent).toBe(band.mean.toFixed(1));
    }
    expect(container.querySelectorAll('[data-low], [data-high], [data-mean], [data-played-season], [data-middle80], [data-split]')).toHaveLength(0);
  });
  it('State 4 boundary never reclassifies State 3 or ten total', () => {
    expect([4, 5, 9, 10].map(isFiveToNineReviews)).toEqual([false, true, true, false]);
    expect([2, 3, 4, 5].map(isFewReviews)).toEqual([true, true, true, false]);
  });
  it('shared person rows keep known people first and retain own review', () => {
    fixture.known = ['r5'];
    const { container } = tab();
    expect([...container.querySelectorAll('[data-reviews-state="five-to-nine"] [data-testid="review-row"]')].map(el => el.getAttribute('data-review-id'))).toEqual(['r5', 'r0', 'r1', 'r2', 'r3', 'r4']);
    expect(container.querySelector('[data-review-id="viewer"]')).not.toBeNull();
  });
});
