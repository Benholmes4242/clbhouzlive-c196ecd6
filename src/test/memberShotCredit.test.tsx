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
vi.mock('@/components/fullscreen-feed/FullscreenTopProgress', () => ({ FullscreenTopProgress: () => null, showsTopProgress: () => false }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: () => null }));

const post: FeedPost = {
  id: 'shots:course:course', userId: '', actorId: '', actorType: 'personal', username: '',
  displayName: 'Royal Portrush', avatarUrl: '', caption: '', createdAt: '2026-06-02T09:00:00Z',
  isVerified: false, creatorRelation: 'none', likeCount: 0, commentCount: 0, shareCount: 0,
  isLikedByMe: false, isFollowedByMe: false, isReview: false, review: null,
  mediaItems: [
    { id: 'a', type: 'image', imageUrl: '/a.jpg', width: 100, height: 100, memberShot: { kicker: "Through members' eyes", title: 'Royal Portrush', credit: 'Thomas Holmes · Mar 2026', avatarUrl: '/thomas.jpg', memberName: 'Thomas Holmes' } },
    { id: 'b', type: 'image', imageUrl: '/b.jpg', width: 100, height: 100, memberShot: { kicker: 'The fifteenth', title: 'Druids Glen · Par 4 · 412 yards', credit: 'Benjamin Holmes · Jun 2026', avatarUrl: '/ben.jpg', memberName: 'Benjamin Holmes' } },
    { id: 'c', type: 'image', imageUrl: '/c.jpg', width: 100, height: 100, memberShot: { kicker: 'The first', title: 'Royal Portrush', credit: 'Ed · Jul 2026', avatarUrl: null, memberName: 'Ed' } },
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

describe('member-shot caption in the real fullscreen chrome', () => {
  it('shows only the active item caption and follows horizontal carousel position', () => {
    mount(true);
    expect(screen.getByText('Thomas Holmes · Mar 2026')).toBeInTheDocument();
    expect(screen.queryByText('Benjamin Holmes · Jun 2026')).toBeNull();
    expect(screen.getByText("Through members' eyes")).toBeInTheDocument();
    expect(screen.getByAltText('Thomas Holmes')).toHaveAttribute('src', expect.stringContaining('thomas.jpg'));
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(screen.queryByText('Thomas Holmes · Mar 2026')).toBeNull();
    expect(screen.getByText('Benjamin Holmes · Jun 2026')).toBeInTheDocument();
    expect(screen.getByText('The fifteenth')).toBeInTheDocument();
    expect(screen.getByText('Druids Glen · Par 4 · 412 yards')).toBeInTheDocument();
    expect(screen.getByAltText('Benjamin Holmes')).toHaveAttribute('src', expect.stringContaining('ben.jpg'));
    expect(screen.queryByAltText('Thomas Holmes')).toBeNull();
  });

  it('synthetic opens render no reserved footer or old author row and no relative time', () => {
    const view = mount(true);
    expect(view.container.querySelector('[data-fullscreen-band]')).toBeNull();
    expect(screen.queryByRole('button', { name: /profile/ })).toBeNull();
    expect(view.container.querySelector('[data-member-shot-credit]')?.textContent).toBe("Through members' eyesRoyal PortrushThomas Holmes · Mar 2026");
  });

  it('a missing avatar uses the active member initial, never the course initial', () => {
    const view = mount(true);
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(2));
    expect(view.container.querySelector('[data-avatar-fallback]')).toHaveTextContent('E');
    expect(screen.getByText('Ed · Jul 2026')).toBeInTheDocument();
  });

  it('real-post opens retain their footer, author row and relative time without the synthetic caption', () => {
    const view = mount(false);
    expect(view.container.querySelector('[data-fullscreen-band]')).not.toBeNull();
    expect(screen.getByRole('button', { name: "View Royal Portrush's profile" })).toBeInTheDocument();
    expect(view.container.textContent).toMatch(/\d+[smhdw]/);
    expect(view.container.querySelector('[data-member-shot-credit]')).toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(view.container.querySelector('[data-member-shot-credit]')).toBeNull();
  });
});