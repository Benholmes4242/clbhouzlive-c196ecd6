/** FULL-SCREEN VIEWER rulings: Follow/FOLLOWING on the member line and the
 * constant attached-round pill. */
import React, { useState } from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { getGuestCardRequest } from '@/features/guest/guestGateStore';
import type { FeedPost } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: undefined }) }));
vi.mock('@/features/guest/guestConfig', async (orig) => ({ ...(await orig<Record<string, unknown>>()), GUEST_BROWSING_ENABLED: true }));
const guest = vi.hoisted(() => ({ on: false }));
vi.mock('@/features/guest/useIsGuest', async (orig) => ({ ...(await orig<Record<string, unknown>>()), useIsGuest: () => guest.on }));
const analytics = vi.hoisted(() => ({ shown: vi.fn() }));
vi.mock('@/features/guest/guestAnalytics', async (orig) => ({ ...(await orig<Record<string, unknown>>()), trackGuestGateShown: analytics.shown }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: null }) }));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: () => ({ status: null, isLoading: false }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: null, isLoading: false }) }));
vi.mock('@/audio/useLaneAudioBlocked', () => ({ useLaneAudioBlocked: () => false }));
vi.mock('@/video/useVideoProgressWriter', () => ({ useVideoProgressWriter: () => {} }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: () => null }));

const review = {
  id: 'p1', userId: 'u1', actorId: 'u1', actorType: 'personal', username: 'b',
  displayName: 'Benjamin Holmes', avatarUrl: '', caption: '', createdAt: '2026-06-02T09:00:00Z',
  isVerified: false, creatorRelation: 'none', likeCount: 0, commentCount: 0, shareCount: 0,
  isLikedByMe: false, isFollowedByMe: false, isReview: true, homeClub: 'Woking Golf Club', handicap: 4.2,
  review: { reviewId: 'r', courseId: 'c1', courseName: 'Woking', courseImageUrl: null, rating: 8, breakdown: { design: 8, conditions: 8, clubhouse: 8, facilities: 8 } },
  courseId: 'c1', courseName: 'Woking',
  mediaItems: [{ id: 'a', type: 'image', imageUrl: '/a.jpg', width: 100, height: 100 }, { id: 'b', type: 'image', imageUrl: '/b.jpg', width: 100, height: 100 }],
} as unknown as FeedPost;
const round = { postId: 'p1', courseId: 'c1', holeNo: null, shotTags: [], mediaHoles: [], roundScoreId: 'sc1', roundGross: 74, roundPar: 72, roundPlayDate: null, roundHoles: 18 } as never;

function Harness({ post = review, own = false, start = false, golf = null as never, onOpen = vi.fn(), onFollowSpy = vi.fn() }) {
  const [f, setF] = useState(start);
  return <MemoryRouter><ImmersiveFullscreenChrome
    posts={[post]} activeIndex={0} onClose={onOpen} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()}
    getLikeState={() => ({ isLiked: false, count: 0 })} getCommentCount={() => 0}
    getFollowState={() => f} onFollow={(p, now) => { onFollowSpy(p, now); setF(!now); }} onViewProfile={onOpen} onReviewTap={onOpen} isOwnPost={own}
    golfContext={golf} onOpenScorecard={onOpen} holeWalk={null} courseFigures={null}
  /></MemoryRouter>;
}
const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement | null;

beforeEach(() => { useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null }); useClubhouseStore.setState({ isTournamentCardActive: false }); });
afterEach(() => { guest.on = false; analytics.shown.mockClear(); cleanup(); useFullscreenFeedStore.setState({ activePagerIdx: null }); });

describe('FULL-SCREEN VIEWER follow', () => {
  it('Follow shows only when not following and not own post', () => {
    const a = render(<Harness />);
    expect(q(a.container, '[data-fullscreen-member] [data-fullscreen-follow]')).not.toBeNull();
    cleanup();
    const b = render(<Harness own />);
    expect(q(b.container, '[data-fullscreen-follow]')).toBeNull();
    expect(q(b.container, '[data-fullscreen-following]')).toBeNull();
  });
  it('tapping Follow follows and switches to FOLLOWING without opening anything', () => {
    const onOpen = vi.fn(); const spy = vi.fn();
    const { container } = render(<Harness onOpen={onOpen} onFollowSpy={spy} />);
    fireEvent.click(q(container, '[data-fullscreen-follow]')!);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }), false);
    expect(onOpen).not.toHaveBeenCalled();
    expect(q(container, '[data-fullscreen-follow]')).toBeNull();
    expect(q(container, '[data-fullscreen-following]')).not.toBeNull();
  });
  it('FOLLOWING shows, untappable, when already following', () => {
    const { container } = render(<Harness start />);
    const el = q(container, '[data-fullscreen-following]')!;
    expect(el.tagName).toBe('SPAN');
    expect(el.closest('button')).toBeNull();
  });
  it('no handicap or home club in the member line', () => {
    const { container } = render(<Harness />);
    const line = q(container, '[data-fullscreen-member]')!.textContent ?? '';
    expect(line).not.toContain('Woking Golf Club');
    expect(line).not.toContain('4.2');
  });
  it('round pill sits after the member line and stays on every slide', () => {
    const { container } = render(<Harness golf={round} />);
    const pillAt = () => { const m = q(container, '[data-fullscreen-member]')!; return m.nextElementSibling?.querySelector('button') ?? null; };
    expect(pillAt()).not.toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(pillAt()).not.toBeNull();
  });
  it('a business author follows through the same onFollow → handleFollow path as the removed button', () => {
    const spy = vi.fn();
    const biz = { ...review, isReview: false, actorType: 'business', actorId: 'b1' } as unknown as FeedPost;
    const { container } = render(<Harness post={biz} onFollowSpy={spy} />);
    fireEvent.click(q(container, '[data-fullscreen-follow]')!);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ actorType: 'business', actorId: 'b1' }), false);
    const overlay = readFileSync('src/components/fullscreen-feed/FullscreenFeedOverlay.tsx', 'utf8');
    expect(overlay).toContain('onFollow={(post, followedNow) => handleFollow({ ...post, isFollowedByMe: followedNow })}');
  });
  it('a guest tap opens the join card with the action trigger and does not follow', () => {
    guest.on = true; const spy = vi.fn();
    const { container } = render(<Harness onFollowSpy={spy} />);
    fireEvent.click(q(container, '[data-fullscreen-follow]')!);
    expect(spy).not.toHaveBeenCalled();
    expect(getGuestCardRequest()).toEqual(expect.objectContaining({ kind: 'action', action: 'follow' }));
    expect(analytics.shown).toHaveBeenCalledWith(expect.objectContaining({ trigger: 'action', action: 'follow' }));
    expect(q(container, '[data-fullscreen-following]')).toBeNull();
  });
  it('at narrow widths only the name ellipsises; time, Follow and REVIEW never shrink', () => {
    const css = readFileSync('src/components/fullscreen-feed/fullscreen-stack.css', 'utf8');
    const rule = (sel: string) => css.split('\n').find(l => l.startsWith(`.fs-stack-member ${sel} {`)) ?? '';
    expect(rule('.fs-name')).toMatch(/text-overflow: ellipsis/);
    expect(rule('.fs-name')).toMatch(/min-width: 0/);
    for (const s of ['.fs-time', '.fs-follow', '.fs-following']) { expect(rule(s)).toMatch(/flex: none/); expect(rule(s)).toMatch(/white-space: nowrap/); }
    expect(css).toMatch(/\.fs-review-chip[^}]*flex: none|flex: none[^}]*\.fs-review-chip/s);
  });
});
