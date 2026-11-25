import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined, isFetched: true, isSuccess: true }) }));
vi.mock('@/components/posts/useReviewMedia', () => ({ useReviewMedia: () => ({ data: [], isFetched: true, isSuccess: true }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null, isFetched: true, isSuccess: true }) }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/components/explore-tab-new/courseled/RoundEngagementActions', () => ({ RoundEngagementActions: () => null }));
vi.mock('@/hooks/useSingleReviewContext', () => ({ useSingleReviewContext: () => ({ data: null }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: undefined }) }));
vi.mock('@/hooks/useBusinessClaimForCourse', () => ({ useBusinessClaimForCourse: () => ({ data: null }) }));
vi.mock('@/hooks/useReviewResponses', () => ({ useReviewResponses: () => ({ data: [] }), useSubmitReviewResponse: () => ({ mutate: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ stateFor: () => ({ mine: false }), toggle: vi.fn() }) }));
vi.mock('@/hooks/useMembersWhoPlayedCourse', () => ({ useMembersWhoPlayedCourse: () => ({ data: { members: [] } }) }));
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/ui/pull-to-refresh', () => ({ PullToRefreshContainer: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
import { FullscreenFeedOverlay } from '@/components/fullscreen-feed/FullscreenFeedOverlay';
import { ReviewBottomSheetPortal } from '@/components/posts/ReviewBottomSheetPortal';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { InviteSheetProvider } from '@/components/invite/InviteSheetProvider';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { reviewFeedPost } from '@/lib/reviews/reviewFeedPost';
import { VIEWER_ABOVE_SHEETS_Z } from '@/lib/zLayers';
import { resetOverlayLayersForTests } from '@/lib/overlayLayers';

afterEach(() => {
  // Unmount FIRST so the viewer's close path never schedules a timer past teardown.
  cleanup();
  useFullscreenFeedStore.setState({ isOpen: false });
  useReviewSheetStore.setState({ isOpen: false, payload: null });
  resetOverlayLayersForTests();
});

const reviewPost = reviewFeedPost({ reviewId: 'r1', userId: 'u1', displayName: 'Ann', courseId: 'c1', courseName: 'Course', rating: 8, text: 'Lovely',
  media: [{ id: 'm1', type: 'image', url: 'https://x/a.jpg', width: 10, height: 10 }] });
const payload = { user: { id: 'u1', name: 'Ann' }, courseId: 'c1', courseName: 'Course', rating: 8, reviewId: 'r1', reviewText: 'Lovely' };

const viewerZ = () => Number((document.querySelector('[data-fullscreen-review-chip]')!.closest('[style*="z-index: 12"]') as HTMLElement | null)?.style.zIndex
  ?? [...document.querySelectorAll<HTMLElement>('[style*="z-index"]')].map((e) => Number(e.style.zIndex)).find((z) => z >= VIEWER_ABOVE_SHEETS_Z));
const sheetPanelZ = () => Number(getComputedStyle(document.querySelector('[data-review-glass-card]') as HTMLElement).zIndex);

function mount(extra?: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={client}><InviteSheetProvider><FullscreenFeedOverlay /><ReviewBottomSheetPortal />{extra}</InviteSheetProvider></QueryClientProvider></MemoryRouter>);
}

describe('Brief 20 D — rendered: the REVIEW pill lifts the open review sheet above the lifted viewer', () => {
  it('review sheet → lifted viewer → REVIEW pill → sheet above → close → viewer on top', async () => {
    const view = mount();
    act(() => { useReviewSheetStore.getState().open(payload); });
    await waitFor(() => expect(document.querySelector('[data-review-glass-card]')).not.toBeNull(), { timeout: 2500 });
    act(() => { useFullscreenFeedStore.getState().open([reviewPost], 0, { zIndex: VIEWER_ABOVE_SHEETS_Z, syntheticPosts: true } as never); });
    const chip = await waitFor(() => { const c = document.querySelector('[data-fullscreen-review-chip]'); expect(c).not.toBeNull(); return c as HTMLElement; });
    const vz = viewerZ();
    expect(sheetPanelZ()).toBeLessThan(vz);
    fireEvent.click(chip);
    await waitFor(() => expect(sheetPanelZ()).toBeGreaterThan(vz));
    act(() => { useReviewSheetStore.getState().close(); });
    await waitFor(() => expect(document.querySelector("[data-review-glass-card]")).toBeNull());
    expect(viewerZ()).toBe(vz);
    act(() => { useFullscreenFeedStore.getState().close(); });
    view.unmount();
    await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  });

  it('comments opened from the lifted viewer render above it', async () => {
    function Comments() { const [open, setOpen] = React.useState(false); return <><button data-testid="oc" onClick={() => setOpen(true)} /><CommentsSheetV2 isOpen={open} onClose={() => setOpen(false)} targetType="review" targetId="r1" /></>; }
    const view = mount(<Comments />);
    act(() => { useFullscreenFeedStore.getState().open([reviewPost], 0, { zIndex: VIEWER_ABOVE_SHEETS_Z, syntheticPosts: true } as never); });
    await waitFor(() => expect(document.querySelector('[data-fullscreen-review-chip]')).not.toBeNull());
    const vz = viewerZ();
    fireEvent.click(view.getByTestId('oc'));
    const panel = await waitFor(() => { const p = document.querySelector('[data-comments-sheet]') as HTMLElement; expect(p).not.toBeNull(); return p; });
    expect(Number(getComputedStyle(panel).zIndex)).toBeGreaterThan(vz);
    act(() => { useFullscreenFeedStore.getState().close(); });
    view.unmount();
    await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  });
});
