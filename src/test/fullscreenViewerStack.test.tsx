/** FULL-SCREEN VIEWER signed-off stack: order and removals, mute placement,
 * REVIEW chip, narrow avatar, "Best", stat-row cases and constant height. */
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

function mount(post: FeedPost, opts: { onReviewTap?: () => void; golf?: boolean; figures?: { par: number | null; yards: number | null; members: number | null } | null } = {}) {
  return render(<MemoryRouter><ImmersiveFullscreenChrome
    posts={[post]} activeIndex={0}
    onClose={vi.fn()} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()}
    getLikeState={() => ({ isLiked: false, count: 2 })} getCommentCount={() => 0}
    getFollowState={() => false} onFollow={vi.fn()} onViewProfile={vi.fn()} onReviewTap={opts.onReviewTap ?? vi.fn()} isOwnPost={false}
    golfContext={opts.golf === false ? null : ctx} holeWalk={walk} courseFigures={opts.figures === undefined ? { par: 70, yards: 6616, members: 8.6 } : opts.figures}
    playedWith={[{ userId: 'u3', name: 'Thomas' }]}
  /></MemoryRouter>);
}
const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement | null;
const cellKeys = (c: HTMLElement) => [...c.querySelectorAll('[data-fullscreen-stats] [data-stat]')].map(n => n.getAttribute('data-stat'));

beforeEach(() => { personal.status = null; scrubber.render.mockClear(); useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null }); useClubhouseStore.setState({ isTournamentCardActive: false }); });
afterEach(() => { cleanup(); useFullscreenFeedStore.setState({ activePagerIdx: null }); });

describe('FULL-SCREEN VIEWER stack', () => {
  it('runs dots, pill row, member line, stat row in order with no caption, Full review, liked-by or score tile', () => {
    const { container } = mount(review);
    const stack = q(container, '[data-fullscreen-bottom-stack]')!;
    expect([...stack.children].map(n => [...n.attributes].find(a => a.name.startsWith('data-fullscreen'))?.name)).toEqual(
      ['data-fullscreen-dots', 'data-fullscreen-pill-row', 'data-fullscreen-member', 'data-fullscreen-stats']);
    for (const gone of ['[data-fullscreen-caption]', '[data-full-review]', '[data-liked-by-row]', '[data-likers]', '[data-review-score-strip]']) expect(q(container, gone)).toBeNull();
  });
  it('the pill lists played-with plus @mentions and the mute sits in the pill row, not the scrubber', () => {
    const { container } = mount(base);
    const row = q(container, '[data-fullscreen-pill-row]')!;
    expect(row.querySelector('[data-testid="played-with-chip"]')?.getAttribute('aria-label')).toBe('Played with: Thomas, Danny');
    expect(row.querySelector('[data-fullscreen-mute] button')).not.toBeNull();
    expect(q(container, '[data-fullscreen-video-row]')).toBeNull();
    expect(scrubber.render).toHaveBeenLastCalledWith(expect.objectContaining({ left: expect.not.stringContaining('40px') }));
  });
  it('a photo slide keeps the pill row with no mute', () => {
    const { container } = mount(base);
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(q(container, '[data-fullscreen-pill-row]')).not.toBeNull();
    expect(q(container, '[data-fullscreen-mute]')).toBeNull();
  });
  it('the REVIEW chip shows only on reviews, on the name line, and opens the review', () => {
    const onReviewTap = vi.fn();
    const { container } = mount(review, { onReviewTap });
    const chip = q(container, '[data-fullscreen-review-chip]')!;
    expect(chip.parentElement).toBe(q(container, '[data-fullscreen-member]'));
    expect(chip.textContent).toBe('REVIEW');
    fireEvent.click(chip);
    expect(onReviewTap).toHaveBeenCalledTimes(1);
    cleanup();
    expect(q(mount(base).container, '[data-fullscreen-review-chip]')).toBeNull();
  });
  it('hides the avatar below 340px', () => {
    const css = readFileSync('src/components/fullscreen-feed/fullscreen-stack.css', 'utf8');
    const narrow = css.slice(css.indexOf('@media (max-width: 339.98px)'));
    expect(narrow).toMatch(/\.fs-stack-member \[data-fs-avatar\] \{ display: none; \}/);
    expect(q(mount(base).container, '[data-fullscreen-member] [data-fs-avatar]')).not.toBeNull();
  });
  it('the viewer record reads "Best" with a capital B', () => {
    personal.status = { status: 'played' };
    const { container } = mount(base);
    expect(q(container, '[data-fullscreen-course-header]')?.textContent).toContain('Best 75');
    expect(q(container, '[data-fullscreen-course-header]')?.textContent).not.toContain('best 75');
  });
  it('the stat row keeps one height on every slide of a post and the stack anchor never moves', () => {
    const { container } = mount(base);
    const bottom = q(container, '[data-fullscreen-stack]')!.style.bottom;
    expect(cellKeys(container)).toEqual(['hole', 'par', 'yards', 'strokeIndex', 'field']);
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(cellKeys(container)).toEqual(['par', 'yards', 'members']);
    expect(q(container, '[data-fullscreen-stack]')!.style.bottom).toBe(bottom);
    expect(readFileSync('src/components/fullscreen-feed/fullscreen-stack.css', 'utf8')).toMatch(/\.fs-stats \{[^}]*height: 38px/);
  });
  it('a post with no course and no hole tags has no stat row on any slide', () => {
    const { container } = mount({ ...base, courseId: null, courseName: null } as unknown as FeedPost, { golf: false, figures: null });
    expect(q(container, '[data-fullscreen-stats]')).toBeNull();
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(q(container, '[data-fullscreen-stats]')).toBeNull();
  });
});

describe('stat row cells', () => {
  const full = holeFacts(walk, 3);
  it('hole slide: HOLE, PAR, YARDS, STROKE INDEX, FIELD LOSES', () => {
    expect(statCells({ holeNo: 3, facts: full })).toEqual([
      { key: 'hole', value: '3rd' }, { key: 'par', value: '4' }, { key: 'yards', value: '412' }, { key: 'strokeIndex', value: '4' }, { key: 'field', value: '+0.7' }]);
  });
  it('partial hole data prints only the cells that exist', () => {
    expect(statCells({ holeNo: 18, facts: holeFacts(null, 18) })).toEqual([{ key: 'hole', value: '18th' }]);
  });
  it('review untagged or place slide: the review’s own five scores', () => {
    expect(statCells({ holeNo: null, review: { overall: 8.7, design: 8.7, condition: 8.8, clubhouse: 8.7, facilities: 7 } }).map(c => `${c.key}:${c.value}`))
      .toEqual(['overall:8.7', 'design:8.7', 'condition:8.8', 'clubhouse:8.7', 'facilities:7.0']);
  });
  it('post untagged with a course: PAR, YARDS, MEMBERS; a below-floor rating omits MEMBERS', () => {
    expect(statCells({ holeNo: null, course: { par: 70, yards: 6616, members: 8.6 } })).toEqual([{ key: 'par', value: '70' }, { key: 'yards', value: '6,616' }, { key: 'members', value: '8.6' }]);
    expect(statCells({ holeNo: null, course: { par: 70, yards: 6616, members: null } }).map(c => c.key)).toEqual(['par', 'yards']);
    expect(readFileSync('src/components/fullscreen-feed/FullscreenFeedOverlay.tsx', 'utf8')).toMatch(/ratingRankable\(ctx\.community_rating, ctx\.rating_count\)/);
  });
  it('a post with no course and no hole tags has no row', () => {
    expect(postHasStatRow({ hasCourse: false, anyHoleTag: false, isReview: false })).toBe(false);
    expect(postHasStatRow({ hasCourse: true, anyHoleTag: false, isReview: false })).toBe(true);
  });
  it('course-photo kickers map back to their hole; place kickers do not', () => {
    expect(kickerHoleNo('The fourth')).toBe(4);
    expect(kickerHoleNo('The 21st')).toBe(21);
    expect(kickerHoleNo('Clubhouse')).toBeNull();
  });
});

describe('course Media viewer', () => {
  it('reads hole facts through the shared hook and renders the same stat row in place of the facts card', () => {
    const overlay = readFileSync('src/components/fullscreen-feed/FullscreenFeedOverlay.tsx', 'utf8');
    expect(overlay).toMatch(/useCourseHoleFacts\(statCourseId/);
    expect(overlay).toMatch(/<CourseGalleryChrome[\s\S]{0,400}holeWalk=\{viewerHoleFacts\.walk\}/);
    const gallery = readFileSync('src/components/fullscreen-feed/CourseGalleryChrome.tsx', 'utf8');
    expect(gallery).toContain('<FullscreenBottomStack');
    expect(gallery).toMatch(/statCells\(\{ holeNo: shot\.holeTag\.hole_no, facts \}\)/);
    expect(gallery).not.toContain('data-gallery-facts="hole"');
  });
});
