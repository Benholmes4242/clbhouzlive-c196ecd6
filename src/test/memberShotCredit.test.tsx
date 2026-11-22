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
const scrubber = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: (props: { bottom: string }) => { scrubber.render(props); return null; } }));

const post: FeedPost = {
  id: 'shots:course:course', userId: '', actorId: '', actorType: 'personal', username: '',
  displayName: 'Royal Portrush', avatarUrl: '', caption: '', createdAt: '2026-06-02T09:00:00Z',
  isVerified: false, creatorRelation: 'none', likeCount: 0, commentCount: 0, shareCount: 0,
  isLikedByMe: false, isFollowedByMe: false, isReview: false, review: null,
  mediaItems: [
    { id: 'a', type: 'image', imageUrl: '/a.jpg', width: 100, height: 100, memberShot: { kicker: "Through members' eyes", title: 'Royal Portrush', credit: 'Thomas Holmes · Mar 2026', avatarUrl: '/thomas.jpg', memberName: 'Thomas Holmes' } },
    { id: 'b', type: 'image', imageUrl: '/b.jpg', width: 100, height: 100, memberShot: { kicker: 'The fifteenth', detail: 'Par 4 · 412 yards', title: 'Druids Glen', credit: 'Benjamin Holmes · Jun 2026', avatarUrl: '/ben.jpg', memberName: 'Benjamin Holmes' } },
    { id: 'c', type: 'image', imageUrl: '/c.jpg', width: 100, height: 100, memberShot: { kicker: 'The first', title: 'Royal Portrush', credit: 'Ed · Jul 2026', avatarUrl: null, memberName: 'Ed' } },
  ],
};

function mount(syntheticPosts: boolean, shownPost = post) {
  return render(<MemoryRouter><ImmersiveFullscreenChrome
    posts={[shownPost]} activeIndex={0} syntheticPosts={syntheticPosts} readOnly
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
  it('the canonical author row follows the active item and horizontal carousel position', () => {
    const view = mount(true);
    const author = () => view.container.querySelector('[data-fullscreen-member]');
    expect(author()?.querySelector('.pro-inline-text')).toHaveTextContent('Thomas Holmes');
    expect(author()?.querySelector('.fs-time')).toHaveTextContent('Mar 2026');
    expect(screen.queryByText("Through members' eyes")).toBeNull();
    expect(screen.getByAltText('Thomas Holmes')).toHaveAttribute('src', expect.stringContaining('thomas.jpg'));
    expect(view.container.querySelector('[data-fullscreen-hole-strip]')).toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(author()?.querySelector('.pro-inline-text')).toHaveTextContent('Benjamin Holmes');
    expect(author()?.querySelector('.fs-time')).toHaveTextContent('Jun 2026');
    expect(view.container.querySelector('[data-fullscreen-hole-strip]')).toBeNull();
    expect(view.container.querySelector('[data-fullscreen-stats] [data-stat="hole"] b')).toHaveTextContent('15th');
    expect(screen.getByAltText('Benjamin Holmes')).toHaveAttribute('src', expect.stringContaining('ben.jpg'));
    expect(screen.queryByAltText('Thomas Holmes')).toBeNull();
  });

  it('synthetic opens render the canonical stack with no old credit block, profile door or relative time', () => {
    const view = mount(true);
    expect(view.container.querySelector('[data-fullscreen-band]')).toBeNull();
    expect(view.container.querySelector('[data-member-shot-credit]')).toBeNull();
    expect(view.container.querySelector('[data-fullscreen-shade]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /profile/ })).toBeNull();
    const stack = view.container.querySelector('[data-fullscreen-stack]');
    expect(stack?.querySelector('[data-avatar-fallback]')).toHaveTextContent('T');
    expect(stack?.textContent).not.toMatch(/\b\d+(s|m|h|d|w|mo|y)\b/);
    expect(view.container.querySelector('[data-fullscreen-pills]')).toBeNull();
  });

  it('a missing avatar uses the active member initial, never the course initial', () => {
    const view = mount(true);
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(2));
    expect(view.container.querySelector('[data-avatar-fallback]')).toHaveTextContent('E');
    expect(view.container.querySelector('[data-fullscreen-member] .pro-inline-text')).toHaveTextContent('Ed');
    expect(view.container.querySelector('[data-fullscreen-member] .fs-time')).toHaveTextContent('Jul 2026');
  });

  it('real-post opens retain their footer, author row and relative time without the synthetic caption', () => {
    const view = mount(false);
    expect(view.container.querySelector('[data-fullscreen-shade]')).not.toBeNull();
    expect(screen.getByRole('button', { name: "View Royal Portrush's profile" })).toBeInTheDocument();
    expect(view.container.textContent).toMatch(/\d+[smhdw]/);
    expect(view.container.querySelector('[data-member-shot-credit]')).toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(view.container.querySelector('[data-member-shot-credit]')).toBeNull();
  });

  it('synthetic scrubber uses the canonical video row with time, full gutter (mute moved to the pill row)', () => {
    mount(true);
    expect(scrubber.render).toHaveBeenLastCalledWith(expect.objectContaining({ showTime: true, right: expect.any(String), left: expect.not.stringContaining('40px') }));
  });

  it('the canonical video row (left mute) appears only while the active item is a video', () => {
    const shownPost: FeedPost = { ...post, mediaItems: [post.mediaItems[0], { ...post.mediaItems[1], type: 'video', hlsUrl: '/video.m3u8' }] };
    const view = mount(true, shownPost);
    const row = () => view.container.querySelector('[data-fullscreen-video-row]');
    expect(row()).toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(row()?.querySelector('button[aria-label="Unmute"], button[aria-label="Mute"]')).not.toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(0));
    expect(row()).toBeNull();
  });
});
