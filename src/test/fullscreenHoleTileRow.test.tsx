import { readFileSync } from 'node:fs';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
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

const base: FeedPost = {
  id: 'shot:1', userId: '', actorId: '', actorType: 'personal', username: '',
  displayName: 'Woking', avatarUrl: '', caption: '', createdAt: '2026-06-02T09:00:00Z',
  isVerified: false, creatorRelation: 'none', likeCount: 0, commentCount: 0, shareCount: 0,
  isLikedByMe: false, isFollowedByMe: false, isReview: false, review: null,
  mediaItems: [],
};
function mount(kicker: string, detail?: string) {
  const post: FeedPost = { ...base, mediaItems: [{ id: 'a', type: 'image', imageUrl: '/a.jpg', width: 100, height: 100,
    memberShot: { kicker, detail, title: 'Woking', credit: 'Thomas Holmes · Mar 2026', avatarUrl: null, memberName: 'Thomas Holmes' } }] };
  return render(<MemoryRouter><ImmersiveFullscreenChrome posts={[post]} activeIndex={0} syntheticPosts readOnly
    onClose={vi.fn()} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()}
    getLikeState={() => ({ isLiked: false, count: 0 })} getCommentCount={() => 0}
    getFollowState={() => false} onFollow={vi.fn()} onViewProfile={vi.fn()} onReviewTap={vi.fn()} isOwnPost={false}
  /></MemoryRouter>);
}
beforeEach(() => {
  useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null });
  useClubhouseStore.setState({ isTournamentCardActive: false });
});
afterEach(() => { cleanup(); useFullscreenFeedStore.setState({ activePagerIdx: null }); });
describe('fullscreen hole tile row', () => {
  it('(a) places the hole tile last inside the shot author row', () => {
    const { container } = mount('The first', 'Par 4 · 269 yards');
    const author = container.querySelector('[data-fullscreen-shot-author]');
    const tile = container.querySelector('[data-fullscreen-hole-strip]');
    expect(tile).not.toBeNull();
    expect(tile?.parentElement).toBe(author);
    expect(author?.lastElementChild).toBe(tile);
    expect(author?.querySelector('.fullscreen-shot-name-hole')).not.toBeNull();
  });
  it('(b) keeps only the kicker when no detail is present', () => {
    const { container } = mount('The fourteenth');
    const tile = container.querySelector('[data-fullscreen-hole-strip]');
    expect(tile?.children).toHaveLength(1);
    expect(tile?.firstElementChild).toHaveClass('fullscreen-hole-tile-kicker');
    expect(tile?.querySelector('.fullscreen-hole-tile-detail')).toBeNull();
  });
  it('(c) omits the tile and retains the single-line name for a place shot', () => {
    const { container } = mount('Clubhouse');
    expect(container.querySelector('[data-fullscreen-hole-strip]')).toBeNull();
    expect(container.querySelector('[data-fullscreen-shot-author] .fullscreen-shot-name-single')).not.toBeNull();
    expect(container.querySelector('.fullscreen-shot-name-hole')).toBeNull();
  });
  it('(d) declares the narrow-phone padding and detail size in CSS', () => {
    const css = readFileSync(new URL('../components/fullscreen-feed/fullscreen-hole-tile.css', import.meta.url), 'utf8');
    expect(css).toContain('@media (max-width: 340px)');
    const narrow = css.slice(css.indexOf('@media (max-width: 340px)'));
    expect(narrow).toContain('.fullscreen-hole-tile { padding: 8px 11px 7px; }');
    expect(narrow).toContain('.fullscreen-hole-tile-detail { font-size: 14px; }');
    expect(narrow).toContain('.fullscreen-shot-author { gap: 10px; }');
  });
});
