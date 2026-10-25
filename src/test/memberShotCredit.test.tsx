import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import type { FeedPost } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: null }) }));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: () => ({ status: null, isLoading: false }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: null, isLoading: false }) }));
vi.mock('@/audio/useLaneAudioBlocked', () => ({ useLaneAudioBlocked: () => false }));
vi.mock('@/video/useVideoProgressWriter', () => ({ useVideoProgressWriter: () => {} }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/components/fullscreen-feed/FullscreenTopProgress', () => ({ FullscreenTopProgress: () => null, showsTopProgress: () => false }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: () => null }));

const post: FeedPost = {
  id: 'shots:course:course', userId: '', actorId: '', actorType: 'personal', username: '',
  displayName: 'Royal Portrush', avatarUrl: '', caption: '', createdAt: '2026-06-02T09:00:00Z',
  isVerified: false, creatorRelation: 'none', likeCount: 0, commentCount: 0, shareCount: 0,
  isLikedByMe: false, isFollowedByMe: false, isReview: false, review: null,
  mediaItems: [
    { id: 'a', type: 'image', imageUrl: '/a.jpg', width: 100, height: 100, credit: 'Thomas Holmes · Mar 2026' },
    { id: 'b', type: 'image', imageUrl: '/b.jpg', width: 100, height: 100, credit: 'Benjamin Holmes · Jun 2026' },
    { id: 'c', type: 'image', imageUrl: '/c.jpg', width: 100, height: 100, credit: '' },
  ],
};

function mount(syntheticPosts: boolean) {
  return render(<MemoryRouter><ImmersiveFullscreenChrome
    posts={[post]} activeIndex={0} syntheticPosts={syntheticPosts} readOnly
    onClose={vi.fn()} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()}
    onMore={vi.fn()} getLikeState={() => ({ isLiked: false, count: 0 })}
    getCommentCount={() => 0} getFollowState={() => false} onFollow={vi.fn()}
    onViewProfile={vi.fn()} onReviewTap={vi.fn()} isOwnPost={false}
  /></MemoryRouter>);
}

beforeEach(() => {
  useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null });
  useClubhouseStore.setState({ isTournamentCardActive: false });
});
afterEach(() => { cleanup(); useFullscreenFeedStore.setState({ activePagerIdx: null }); });

describe('member-shot credit in the real fullscreen chrome', () => {
  it('shows only the active item credit and follows horizontal carousel position', () => {
    mount(true);
    expect(screen.getByText('Thomas Holmes · Mar 2026')).toBeInTheDocument();
    expect(screen.queryByText('Benjamin Holmes · Jun 2026')).toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(screen.queryByText('Thomas Holmes · Mar 2026')).toBeNull();
    expect(screen.getByText('Benjamin Holmes · Jun 2026')).toBeInTheDocument();
  });

  it('an empty active credit renders no credit line', () => {
    const view = mount(true);
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(2));
    expect(view.container.querySelector('[data-member-shot-credit]')).toBeNull();
  });

  it('real-post opens render no credit line even when media carries credits', () => {
    const view = mount(false);
    expect(view.container.querySelector('[data-member-shot-credit]')).toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(view.container.querySelector('[data-member-shot-credit]')).toBeNull();
  });
});