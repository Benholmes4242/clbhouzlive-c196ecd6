import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { coursePostsToShotPosts } from '@/lib/courseMedia/memberShotPosts';
import type { FeedPost } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: (id?: string) => { courses.rating(id); return { data: { avg_overall_score: id === 'druids' ? 8.6 : 9.1 } }; } }));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: (id?: string) => { courses.personal(id); return { status: { status: 'played' }, isLoading: false }; } }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: (id?: string, live?: boolean) => { courses.stats(id, live); return { data: { your_rounds: id === 'druids' ? 1 : 2, your_best: id === 'druids' ? 79 : 75 }, isLoading: false }; } }));
vi.mock('@/audio/useLaneAudioBlocked', () => ({ useLaneAudioBlocked: () => false }));
vi.mock('@/video/useVideoProgressWriter', () => ({ useVideoProgressWriter: () => {} }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/components/fullscreen-feed/FullscreenTopProgress', () => ({ FullscreenTopProgress: () => null, showsTopProgress: () => false }));
const scrubber = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: (props: { bottom: string }) => { scrubber.render(props); return null; } }));

const courses = vi.hoisted(() => ({ personal: vi.fn(), stats: vi.fn(), rating: vi.fn() }));
const post: FeedPost = {
  id: 'shots:latest-holes', userId: '', actorId: '', actorType: 'personal', username: '',
  displayName: 'Latest holes', avatarUrl: '', caption: '', createdAt: '2026-06-02T09:00:00Z',
  isVerified: false, creatorRelation: 'none', likeCount: 0, commentCount: 0, shareCount: 0,
  isLikedByMe: false, isFollowedByMe: false, isReview: false, review: null,
  courseId: 'fallback', courseName: 'Fallback course', courseCountry: 'Fallback location', courseRating: 6,
  mediaItems: [
    { id: 'a', type: 'image', imageUrl: '/a.jpg', width: 100, height: 100, memberShot: { kicker: 'The fifteenth', title: 'Druids Glen', detail: 'Par 4 · 412 yards', credit: 'Thomas Holmes · Mar 2026', avatarUrl: null, memberName: 'Thomas Holmes', courseId: 'druids', courseName: 'Druids Glen Golf Club' } },
    { id: 'b', type: 'image', imageUrl: '/b.jpg', width: 100, height: 100, memberShot: { kicker: 'The second', title: 'Sundridge', credit: 'Ed · Jun 2026', avatarUrl: null, memberName: 'Ed', courseId: 'sundridge', courseName: 'Sundridge Park Golf Club' } },
  ],
};
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
function mount(syntheticPosts: boolean, shownPost = post, golfCourse?: { id: string; name: string }) {
  return render(<MemoryRouter><Location /><ImmersiveFullscreenChrome
    posts={[shownPost]} activeIndex={0} syntheticPosts={syntheticPosts} readOnly golfCourse={golfCourse}
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

describe('Latest holes active-shot caption and course header', () => {
  it('detail renders only when present and disappears as the active shot changes', () => {
    const view = mount(true);
    expect(view.container.querySelector('.member-shot-detail')).toHaveTextContent('Par 4 · 412 yards');
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(view.container.querySelector('.member-shot-detail')).toBeNull();
  });
  it('empty detail is omitted', () => {
    const view = mount(true, { ...post, mediaItems: [{ ...post.mediaItems[0], memberShot: { ...post.mediaItems[0].memberShot, kicker: 'The first', title: 'Course', credit: '', avatarUrl: null, memberName: '', detail: '' } }] });
    expect(view.container.querySelector('.member-shot-detail')).toBeNull();
  });
  it('all member-shot titles use one-line ellipsis with a shrinking text column', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/fullscreen-feed/member-shot-credit.css'), 'utf8');
    expect(css).toMatch(/\.member-shot-text\s*\{[^}]*flex: 1;[^}]*min-width: 0;/);
    expect(css).toMatch(/\.member-shot-title\s*\{[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis;/);
    expect(css).not.toContain('-webkit-line-clamp');
  });
  it('Latest from the courses caption keeps its title alone without detail', () => {
    const [course] = coursePostsToShotPosts([{ ...post, courseName: 'Royal Portrush Golf Club (Dunluce)' }]);
    const view = mount(true, course);
    expect(view.container.querySelector('.member-shot-title')).toHaveTextContent('Royal Portrush Golf Club (Dunluce)');
    expect(view.container.querySelector('.member-shot-detail')).toBeNull();
  });
  it('header, record, rating and course navigation follow horizontal active-shot changes', () => {
    const view = mount(true);
    expect(screen.getByRole('button', { name: 'Open Druids Glen Golf Club' })).toBeInTheDocument();
    expect(courses.personal).toHaveBeenLastCalledWith('druids');
    expect(courses.stats).toHaveBeenLastCalledWith('druids', true);
    expect(courses.rating).toHaveBeenLastCalledWith('druids');
    expect(view.container.textContent).toContain('79');
    expect(screen.getByRole('button', { name: 'clbhouz rating 8.6' })).toBeInTheDocument();
    expect(view.container.textContent).not.toContain('Fallback location');
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(1));
    expect(screen.queryByRole('button', { name: 'Open Druids Glen Golf Club' })).toBeNull();
    const header = screen.getByRole('button', { name: 'Open Sundridge Park Golf Club' });
    expect(courses.personal).toHaveBeenLastCalledWith('sundridge');
    expect(courses.stats).toHaveBeenLastCalledWith('sundridge', true);
    expect(courses.rating).toHaveBeenLastCalledWith('sundridge');
    expect(view.container.textContent).toContain('75');
    expect(screen.getByRole('button', { name: 'clbhouz rating 9.1' })).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.getByTestId('location')).toHaveTextContent('/courses/sundridge');
  });
  it.each([false, true])('legacy review/golfCourse/post precedence remains when no eligible override (synthetic %s)', synthetic => {
    const shown = synthetic ? { ...post, mediaItems: post.mediaItems.map(item => ({ ...item, memberShot: item.memberShot ? { ...item.memberShot, courseId: undefined } : undefined })) } : post;
    const reviewed = { ...shown, review: { reviewId: 'r', courseId: 'review', courseName: 'Review course', courseImageUrl: null, rating: 8 } };
    mount(synthetic, reviewed, { id: 'golf', name: 'Golf course' });
    expect(screen.getByRole('button', { name: 'Open Review course' })).toBeInTheDocument();
    expect(courses.personal).toHaveBeenLastCalledWith('review');
    expect(courses.stats).toHaveBeenLastCalledWith('review', true);
    fireEvent.click(screen.getByRole('button', { name: 'Open Review course' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/courses/review');
    cleanup();
    mount(synthetic, shown, { id: 'golf', name: 'Golf course' });
    expect(screen.getByRole('button', { name: 'Open Golf course' })).toBeInTheDocument();
    expect(courses.personal).toHaveBeenLastCalledWith('golf');
    cleanup();
    mount(synthetic, shown);
    expect(screen.getByRole('button', { name: 'Open Fallback course' })).toBeInTheDocument();
    expect(courses.personal).toHaveBeenLastCalledWith('fallback');
  });
});
