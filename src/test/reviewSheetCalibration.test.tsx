import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const stats = { current: null as null | { coursesRated: number; averageRating: number | null; memberSince: string | null } };
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: stats.current }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/components/posts/useReviewMedia', () => ({ useReviewMedia: () => ({ data: [] }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null }) }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('@/components/explore-tab-new/courseled/RoundEngagementActions', () => ({
  RoundEngagementActions: () => <span data-testid="engagement-pair" />,
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string, d?: unknown) => (typeof d === 'string' ? d : k) }) }));

import { ReviewBottomSheet, formatDeviation, playedAgo } from '@/components/posts/ReviewBottomSheet';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const FULL = { design: 8.8, conditions: 8.7, clubhouse: 8.4, facilities: 6.5 };
const AVGS = { avg_design_score: 8.6, avg_condition_score: 8.9, avg_clubhouse_score: 8.8, avg_facilities_score: 7.4 };

function sheet(opts: { count: number; avg?: number | null; breakdown?: Record<string, number | null>; reviewerAvg?: number | null }) {
  stats.current = opts.reviewerAvg === undefined ? null : { coursesRated: 5, averageRating: opts.reviewerAvg, memberSince: '2026' };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
      <ReviewBottomSheet
        isOpen
        onClose={() => {}}
        user={{ id: 'u1', name: 'mikem84' }}
        courseId="c1"
        courseName="Swinley Forest Golf Club"
        rating={8.3}
        reviewId="r1"
        reviewDate={new Date(Date.now() - 275 * 864e5).toISOString()}
        resolvedReviewText="Text."
        resolvedBreakdown={opts.breakdown ?? FULL}
        resolvedMedia={[]}
        resolvedAggregate={{ avg_overall_score: opts.avg === undefined ? 8.7 : opts.avg, review_count: opts.count, ...AVGS }}
        onToggleReaction={() => {}}
      />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

const q = (sel: string) => document.body.querySelectorAll(sel);

beforeEach(() => {
  document.body.innerHTML = '';
  vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: [], error: null, count: null, status: 200, statusText: 'OK' });
});
afterEach(() => vi.restoreAllMocks());

describe('calibration strip', () => {
  it('two cells with true-minus deviations when both figures exist', () => {
    sheet({ count: 3, reviewerAvg: 7.6 });
    const figs = Array.from(q('[data-review-calibration-figure]')).map((n) => n.textContent);
    expect(figs).toEqual(['+0.7', '\u22120.4']);
    expect(screen.getByText('mikem84 rates 7.6')).toBeTruthy();
    expect(screen.getByText('3 ratings, 8.7 average')).toBeTruthy();
  });

  it('em dash and explanation where one figure is missing', () => {
    sheet({ count: 1, reviewerAvg: 7.6 });
    const figs = Array.from(q('[data-review-calibration-figure]')).map((n) => n.textContent);
    expect(figs).toEqual(['+0.7', '\u2014']);
    expect(screen.getByText('First rating here')).toBeTruthy();
  });

  it('reviewer below three ratings explains it', () => {
    sheet({ count: 3, reviewerAvg: null });
    expect(screen.getByText('Too few reviews to average')).toBeTruthy();
  });

  it('does not render when neither figure exists', () => {
    sheet({ count: 2, reviewerAvg: null });
    expect(q('[data-review-calibration]').length).toBe(0);
  });

  it('figures are ink, never green or red', () => {
    sheet({ count: 3, reviewerAvg: 7.6 });
    q('[data-review-calibration-figure]').forEach((n) => {
      const c = (n as HTMLElement).style.color;
      expect(c).not.toBe('');
      const div = document.createElement('div');
      div.style.color = A.GREEN; expect(c).not.toBe(div.style.color);
      div.style.color = A.RED; expect(c).not.toBe(div.style.color);
    });
  });

  it('formatDeviation uses U+2212 and no hyphen', () => {
    expect(formatDeviation(-0.4)).toBe('\u22120.4');
    expect(formatDeviation(-0.4)).not.toContain('-');
    expect(formatDeviation(0.04)).toBe('0.0');
  });
});

describe('category ticks', () => {
  it('ticks and key line at three or more ratings', () => {
    sheet({ count: 3, reviewerAvg: 7.6 });
    expect(q('[data-review-subscore-tick]').length).toBe(4);
    expect(q('[data-review-subscore-key]').length).toBe(1);
  });
  it.each([1, 2])('no ticks and no key line at %i rating(s)', (n) => {
    sheet({ count: n, reviewerAvg: 7.6 });
    expect(q('[data-review-subscore-tick]').length).toBe(0);
    expect(q('[data-review-subscore-key]').length).toBe(0);
    expect(q('[data-review-subscore-track]').length).toBe(4);
  });
  it('a null category shows an em dash and no track', () => {
    sheet({ count: 3, reviewerAvg: 7.6, breakdown: { ...FULL, clubhouse: null } });
    const club = document.body.querySelector('[data-review-subscore="clubhouse"]')!;
    expect(club.textContent).toContain('\u2014');
    expect(club.querySelector('[data-review-subscore-track]')).toBeNull();
    expect(q('[data-review-subscore-track]').length).toBe(3);
  });
});

describe('reviewer line', () => {
  it('reads Reviewed n months ago and no avg', () => {
    sheet({ count: 3, reviewerAvg: 7.6 });
    expect(screen.getByText('Reviewed 9 months ago')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/avg \d/);
  });
  it('never falls back to a join year', () => {
    expect(playedAgo(null)).toBeNull();
  });
});

describe('see-all row and footer', () => {
  it('absent at one rating', () => {
    sheet({ count: 1, reviewerAvg: 7.6 });
    expect(q('[data-review-see-all]').length).toBe(0);
  });
  it('present at two', () => {
    sheet({ count: 2, reviewerAvg: 7.6 });
    expect(screen.getByText('See all 2 ratings of Swinley Forest Golf Club')).toBeTruthy();
  });
  it('share in the engagement row, foot has exactly two actions', () => {
    sheet({ count: 3, reviewerAvg: 7.6 });
    const eng = document.body.querySelector('[data-review-engagement]')!;
    expect(eng.querySelector('[data-review-share]')).not.toBeNull();
    const foot = document.body.querySelector('[data-review-foot-actions]')!;
    expect(foot.querySelectorAll('button').length).toBe(2);
    expect(foot.querySelector('[data-review-share]')).toBeNull();
    expect(foot.textContent).toContain('mikem84');
  });
});

import { buildReviewSheetPayload } from '@/components/posts/buildReviewSheetPayload';
describe('review sheet followup', () => {
  it('payload never treats the post date as the review date', () => {
    const p = buildReviewSheetPayload({ id: 'p', isReview: true, createdAt: '2026-01-01T00:00:00Z', review: { reviewId: 'r', courseId: 'c', courseName: 'X', courseImageUrl: null, rating: 8 } } as never);
    expect(p?.reviewDate).toBeUndefined();
    expect(p?.postDate).toBe('2026-01-01T00:00:00Z');
  });
});
