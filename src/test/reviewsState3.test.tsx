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
import { isFewReviews } from '@/lib/reviews/sampleRules';
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
const sundridge = [row('viewer', 8.4, [10, 10, 10, 10]), row('mark', 8.1, [7.9, 8.4, 8.7, 8.2]), row('thomas', 8.1, [8.2, 8.9, 9.5, 8.5])];
function tab() {
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><CourseReviewsTab courseId="course" courseName="Sundridge Park" /></QueryClientProvider></MemoryRouter>);
}
beforeEach(() => { fixture.rows = sundridge; fixture.user = { id: 'viewer' }; fixture.known = []; });
describe('REVIEWS_STATE_3', () => {
  it('Sundridge headline reads excluding 8.1 and delta +0.3 end to end', () => {
    const { container } = tab();
    expect(container.querySelector('[data-community-score]')?.textContent).toBe('8.1');
    expect(container.querySelector('[data-viewer-delta]')?.textContent).toContain('0.3 above');
    expect(container.querySelector('[data-community-headline]')?.textContent).toBe('8.1 from the other two');
    expect(container.querySelector('[data-individual-scores]')?.textContent).toBe('8.1 and 8.1');
    expect(container.querySelector('[data-community-headline]')?.textContent).not.toContain('8.2');
  });
  it('Sundridge caution uses two excluding people and zero spread, never inclusive three/0.3', () => {
    const community = reviewsCommunitySample(sundridge, 'viewer');
    expect(fewReviewFacts(community)).toMatchObject({ count: 2, spread: 0 });
    const { container } = tab();
    const caution = container.querySelector('[data-community-caution]');
    expect(caution?.getAttribute('data-community-count')).toBe('2');
    expect(caution?.getAttribute('data-community-spread')).toBe('0');
    expect(caution?.textContent).toBe('Two people agreeing is not the same as a course being an 8.1.');
  });
  it('positive spread uses only others and ending excluding mean', () => {
    const facts = fewReviewFacts(reviewsCommunitySample([row('viewer', 10), row('mark', 8), row('thomas', 8.4)], 'viewer'));
    expect(facts).toMatchObject({ count: 2, spread: 0.4, caution: 'They sit inside 0.4 of each other, but two people agreeing is not the same as a course being an 8.2.' });
  });
  for (const count of [2, 3, 4]) it(`no distribution at ${count} total ratings`, () => {
    fixture.user = undefined; fixture.rows = Array.from({ length: count }, (_, i) => row(String(i), 8));
    const { container } = tab();
    expect(container.querySelector('[data-reviews-state="few"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-distribution]')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/Exceptional|Excellent|Good|Fair|Poor/);
  });
  it('two total including viewer shows other rater panel and Your review without average/delta/bands/caution', () => {
    fixture.rows = [sundridge[0], sundridge[1]];
    const { container } = tab();
    const panel = container.querySelector('[data-reviews-state="few"] [data-testid="review-row"]');
    expect(panel?.getAttribute('data-review-id')).toBe('mark');
    expect(panel?.querySelector('[data-review-score]')?.textContent).toBe('8.1');
    expect(container.querySelectorAll('[data-community-score], [data-viewer-delta], [data-category-band], [data-community-caution]')).toHaveLength(0);
    expect(container.querySelector('[data-review-id="viewer"]')).not.toBeNull();
    expect(fewReviewFacts(reviewsCommunitySample(fixture.rows, 'viewer'))).toBeNull();
  });
  it('every category band is excluding min-to-max and excluding mean', () => {
    const { container } = tab();
    const expected = [['design', 7.9, 8.2, 8.05], ['condition', 8.4, 8.9, 8.65], ['clubhouse', 8.7, 9.5, 9.1], ['facilities', 8.2, 8.5, 8.35]];
    for (const [key, low, high, mean] of expected) {
      const band = container.querySelector(`[data-category-band="${key}"]`);
      expect(Number(band?.getAttribute('data-low'))).toBeCloseTo(Number(low));
      expect(Number(band?.getAttribute('data-high'))).toBeCloseTo(Number(high));
      expect(Number(band?.getAttribute('data-mean'))).toBeCloseTo(Number(mean));
    }
  });
  it('five ratings does not select State 3', () => {
    expect([0, 1, 2, 3, 4, 5].map(isFewReviews)).toEqual([false, false, true, true, true, false]);
    fixture.rows = Array.from({ length: 5 }, (_, i) => row(String(i), 8));
    const { container } = tab();
    expect(container.querySelector('[data-reviews-state="few"]')).toBeNull();
  });
  it('unrated viewer keeps entire sample and no delta', () => {
    fixture.user = { id: 'unrated' }; fixture.rows = [row('mark', 8.1), row('thomas', 8.1)];
    const { container } = tab();
    expect(container.querySelector('[data-community-headline]')?.textContent).toBe('8.1 from two golfers');
    expect(container.querySelector('[data-viewer-delta]')).toBeNull();
  });
  it('known visible people are first, stable inside groups, no unseen person added', () => {
    fixture.known = ['thomas', 'unseen'];
    expect(partitionKnownReviews([sundridge[1], sundridge[2]], new Set(fixture.known)).known.map(r => r.id)).toEqual(['thomas']);
    const { container } = tab();
    expect([...container.querySelectorAll('[data-reviews-state="few"] [data-testid="review-row"]')].map(node => node.getAttribute('data-review-id'))).toEqual(['thomas', 'mark']);
  });
  it('unknown played month stays absent on all other rows despite review dates', () => {
    const { container } = tab();
    expect(container.querySelectorAll('[data-played-season]')).toHaveLength(0);
  });
  it('meaningful category contrast identifies Design and Clubhouse and 0.8 gap', () => {
    const facts = fewReviewFacts(reviewsCommunitySample(sundridge, 'viewer'));
    expect(facts?.finding?.tightest.key).toBe('design');
    expect(facts?.finding?.widest.key).toBe('clubhouse');
    expect(facts?.finding?.widest.gap).toBe(0.8);
  });
  it('equal category spreads omit the finding', () => {
    expect(fewReviewFacts(reviewsCommunitySample([row('a', 8), row('b', 8)], undefined))?.finding).toBeNull();
  });
});
