import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const fixture = vi.hoisted(() => ({ rows: [] as unknown[], loading: false, closeFullscreen: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/components/posts/useReviewMedia', () => ({ useReviewMedia: () => ({ data: [] }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null }) }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => <button type="button" data-testid="liked-by">Liked by</button> }));
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
import { useTapAnywhereDismiss } from '@/hooks/useTapAnywhereDismiss';
import { renderHook } from '@testing-library/react';

afterEach(cleanup);
Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true });
function sheet(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<MemoryRouter><QueryClientProvider client={client}><ReviewBottomSheet isOpen onClose={onClose} user={{ id: 'member', name: 'Member' }} courseId="course" courseName="Course" rating={8} reviewId="review-1" resolvedMedia={[]} resolvedReviewText="A long walk with a short putter" /></QueryClientProvider></MemoryRouter>);
  return onClose;
}

describe('Brief 20 E — review card tap anywhere to dismiss', () => {
  it('a tap on the review text closes the card', () => {
    const onClose = sheet();
    fireEvent.click(screen.getByText('A long walk with a short putter'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a tap on share, the author row or liked-by does its own action and does not close the card', () => {
    const onClose = sheet();
    fireEvent.click(screen.getByLabelText("View Member's profile"));
    const callsAfterProfile = onClose.mock.calls.length; // the profile action itself navigates and closes once
    fireEvent.click(screen.getByLabelText('Share this review'));
    fireEvent.click(screen.getByTestId('liked-by'));
    expect(onClose.mock.calls.length).toBe(callsAfterProfile);
  });

  it('a drag or scroll inside the card never closes it', () => {
    const onClose = sheet();
    const text = screen.getByText('A long walk with a short putter');
    fireEvent.touchStart(text, { touches: [{ clientX: 10, clientY: 160 }] });
    fireEvent.touchMove(text, { touches: [{ clientX: 10, clientY: 100 }] });
    fireEvent.touchEnd(text, { touches: [] });
    fireEvent.click(text);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('the shared hook closes on a plain card tap and skips interactive descendants only when asked', () => {
    const close = vi.fn();
    const { result } = renderHook(() => useTapAnywhereDismiss(close, { skipInteractive: true }));
    const card = document.createElement('div'); const btn = document.createElement('button'); card.appendChild(btn);
    const ev = (target: Element) => ({ stopPropagation: () => {}, target, currentTarget: card }) as unknown as React.MouseEvent<HTMLElement>;
    result.current.onCardClick(ev(btn));
    expect(close).not.toHaveBeenCalled();
    result.current.onCardClick(ev(card));
    expect(close).toHaveBeenCalledTimes(1);
  });
});
