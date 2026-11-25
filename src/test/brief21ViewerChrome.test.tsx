/** Brief 21 F — full-screen viewer chrome.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { statCells, postHasStatRow, kickerHoleNo } from '@/lib/fullscreen/statRow';
import { holeFacts } from '@/lib/courseMedia/holeFacts';
import type { FeedPost } from '@/components/media-system/types/media';

const personal = vi.hoisted(() => ({ status: null as null | { status: string } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: null }) }));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: () => ({ status: personal.status, isLoading: false }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: { your_rounds: 1, your_best: 75 }, isLoading: false }) }));
vi.mock('@/audio/useLaneAudioBlocked', () => ({ useLaneAudioBlocked: () => false }));
vi.mock('@/video/useVideoProgressWriter', () => ({ useVideoProgressWriter: () => {} }));
const scrubber = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: (props: { left: string }) => { scrubber.render(props); return null; } }));

const base = {
  id: 'p1', userId: 'u1', actorId: 'u1', actorType: 'personal', username: 'b',
  displayName: 'Benjamin Holmes', avatarUrl: '', caption: 'Lovely day with @[Danny](u:22222222-2222-4222-8222-222222222222)', createdAt: '2026-06-02T09:00:00Z',
  isVerified: false, creatorRelation: 'none', likeCount: 2, commentCount: 0, shareCount: 0,
  isLikedByMe: false, isFollowedByMe: false, isReview: false, review: null,
  courseId: 'c1', courseName: 'Woking Golf Club',
  mediaItems: [
    { id: 'a', type: 'video', videoUrl: '/a.mp4', width: 100, height: 100 },
    { id: 'b', type: 'image', imageUrl: '/b.jpg', width: 100, height: 100 },
  ],
} as unknown as FeedPost;
const review = { ...base, isReview: true, review: { reviewId: 'r', courseId: 'c1', courseName: 'Woking Golf Club', courseImageUrl: null, rating: 8.7, breakdown: { design: 8.7, conditions: 8.8, clubhouse: 8.7, facilities: 7 } } } as unknown as FeedPost;
const ctx = { courseId: 'c1', mediaHoles: [{ mediaId: 'a', displayOrder: 0, holeNo: 3 }] } as never;
const walk = { scored: true, holes: [{ hole_no: 3, par: 4, yards: 412, stroke_index: 4, avg_to_par: 0.7 }] } as never;

function mount(post: FeedPost, opts: { onReviewTap?: () => void; golf?: boolean; figures?: { par: number | null; yards: number | null; members: number | null } | null; people?: { userId: string; name: string }[] } = {}) {
  return render(<MemoryRouter><ImmersiveFullscreenChrome
    posts={[post]} activeIndex={0}
    onClose={vi.fn()} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()}
    getLikeState={() => ({ isLiked: false, count: 2 })} getCommentCount={() => 0}
    getFollowState={() => false} onFollow={vi.fn()} onViewProfile={vi.fn()} onReviewTap={opts.onReviewTap ?? vi.fn()} isOwnPost={false}
    golfContext={opts.golf === false ? null : ctx} holeWalk={walk} courseFigures={opts.figures === undefined ? { par: 70, yards: 6616, members: 8.6 } : opts.figures}
    playedWith={opts.people ?? []}
  /></MemoryRouter>);
}
const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement | null;
const cellKeys = (c: HTMLElement) => [...c.querySelectorAll('[data-fullscreen-stats] [data-stat]')].map(n => n.getAttribute('data-stat'));
import { FullscreenStatRow } from '@/components/fullscreen-feed/FullscreenBottomStack';
const plain = { ...base, caption: 'Lovely day' } as FeedPost;
beforeEach(() => { useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null }); useClubhouseStore.setState({ isTournamentCardActive: false }); });
afterEach(() => { cleanup(); useFullscreenFeedStore.setState({ activePagerIdx: null }); });
describe('Brief 21 F — viewer chrome', () => {
  it('a video slide has exactly one mute, outside the bottom stack; a photo has none', () => {
    const { container } = mount(plain, { people: [{ userId: 'u3', name: 'Thomas' }] });
    expect(container.querySelectorAll('[data-fullscreen-mute]')).toHaveLength(1);
    expect(q(container, '[data-fullscreen-bottom-stack] [data-fullscreen-mute]')).toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(container.querySelectorAll('[data-fullscreen-mute]')).toHaveLength(0);
  });
  it('no pill row without tagged people; the dots sit directly above the member line', () => {
    const { container } = mount(plain);
    expect(q(container, '[data-fullscreen-pill-row]')).toBeNull();
    expect(q(container, '[data-fullscreen-dots]')?.nextElementSibling).toHaveAttribute('data-fullscreen-member');
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(q(container, '[data-fullscreen-pill-row]')).toBeNull();
  });
  it('the dots are 12px above the member line when there is no pill row', () => {
    const css = readFileSync('src/components/fullscreen-feed/fullscreen-stack.css', 'utf8');
    expect(css).toContain('.fs-stack[data-no-pills] > .fs-stack-dots { margin-bottom: 12px; }');
    expect(document.querySelector('[data-fullscreen-bottom-stack]')).toBeNull();
    expect(css).toMatch(/\.fs-stack-dots \+ \.fs-stack-member[^{]*\{ margin-top: 0; \}/);
  });
  it('a two-cell stat row is centred as a group', () => {
    const { container } = render(<FullscreenStatRow cells={[{ key: 'par', value: '4' }, { key: 'yards', value: '412' }] as never} />);
    expect(q(container, '[data-fullscreen-stats]')).toHaveAttribute('data-few');
    const css = readFileSync('src/components/fullscreen-feed/fullscreen-stack.css', 'utf8');
    expect(css).toContain('.fs-stats[data-few] { justify-content: center; gap: 48px; }');
    cleanup();
    const three = render(<FullscreenStatRow cells={[{ key: 'par', value: '4' }, { key: 'yards', value: '412' }, { key: 'hole', value: '3rd' }] as never} />);
    expect(q(three.container, '[data-fullscreen-stats]')).not.toHaveAttribute('data-few');
  });
});
