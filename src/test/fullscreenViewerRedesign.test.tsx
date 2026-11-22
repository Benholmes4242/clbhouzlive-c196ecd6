import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { BAND_PAD_TOP, COMMENT_BAR_H, COMMENT_BAR_FLOOR, BAND_H_CSS } from '@/lib/media/fullscreenBand';
import type { FeedPost } from '@/components/media-system/types/media';

const actor = vi.hoisted(() => ({ current: null as null | { id: string; type: string; name: string; avatarUrl: null } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: actor.current }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: { avg_overall_score: 9.1 } }) }));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: () => ({ status: null, isLoading: false }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: null, isLoading: false }) }));
vi.mock('@/audio/useLaneAudioBlocked', () => ({ useLaneAudioBlocked: () => false }));
vi.mock('@/video/useVideoProgressWriter', () => ({ useVideoProgressWriter: () => {} }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: () => null }));

const base: FeedPost = {
  id: 'p1', userId: 'u1', actorId: 'u1', actorType: 'personal', username: 'a',
  displayName: 'Andrew Yetzes', avatarUrl: '', caption: 'A good day out', createdAt: '2026-06-02T09:00:00Z',
  isVerified: false, creatorRelation: 'none', likeCount: 0, commentCount: 0, shareCount: 0,
  isLikedByMe: false, isFollowedByMe: false, isReview: false, review: null,
  courseId: 'c1', courseName: 'Real El Prat (Pink)', courseCountry: 'Spain', courseRating: 8.4,
  mediaItems: [{ id: 'a', type: 'image', imageUrl: '/a.jpg', width: 100, height: 100 }],
} as FeedPost;
const review = { ...base, isReview: true, caption: '', review: { reviewId: 'r', courseId: 'c1', courseName: 'Real El Prat (Pink)', courseImageUrl: null, rating: 8.3, breakdown: { design: 8.7, conditions: 7.8, clubhouse: 8.3, facilities: 8.8 } } } as unknown as FeedPost;
const video = { ...base, mediaItems: [{ id: 'v', type: 'video', videoUrl: '/v.mp4', width: 100, height: 100 }] } as unknown as FeedPost;
const shot = { ...base, mediaItems: [{ id: 's', type: 'image', imageUrl: '/s.jpg', width: 100, height: 100, memberShot: { kicker: 'The first', title: 'Course', credit: 'Ed', avatarUrl: null, memberName: 'Ed', courseId: 'c1', courseName: 'Course' } }] } as unknown as FeedPost;

function mount(post: FeedPost, opts: { readOnly?: boolean; synthetic?: boolean; liked?: boolean; onCompose?: () => void; onComment?: () => void; onReviewTap?: () => void } = {}) {
  return render(<MemoryRouter><ImmersiveFullscreenChrome
    posts={[post]} activeIndex={0} syntheticPosts={opts.synthetic} readOnly={opts.readOnly}
    onClose={vi.fn()} onLike={vi.fn()} onComment={opts.onComment ?? vi.fn()} onCompose={opts.onCompose} onShare={vi.fn()}
    onMore={vi.fn()} getLikeState={() => ({ isLiked: !!opts.liked, count: 3 })}
    getCommentCount={() => 2} getFollowState={() => false} onFollow={vi.fn()}
    onViewProfile={vi.fn()} onReviewTap={opts.onReviewTap ?? vi.fn()} isOwnPost={false}
  /></MemoryRouter>);
}

beforeEach(() => {
  actor.current = null;
  useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null });
  useClubhouseStore.setState({ isTournamentCardActive: false });
});
afterEach(() => { cleanup(); useFullscreenFeedStore.setState({ activePagerIdx: null }); });

describe('FULLSCREEN_VIEWER_REDESIGN', () => {
  it('(a) neither a real post nor a course photo header has a rating chip', () => {
    mount(base);
    expect(screen.queryByRole('button', { name: /^clbhouz rating/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open Real El Prat (Pink)' })).toBeInTheDocument();
    cleanup();
    mount(shot, { synthetic: true, readOnly: true });
    expect(screen.queryByRole('button', { name: /^clbhouz rating/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open Course' })).toBeInTheDocument();
  });

  it('(b) pills run like, comment, share, more; liked is white', () => {
    const v = mount(base, { liked: true });
    const pills = [...v.container.querySelectorAll('[data-fullscreen-pills] [data-pill]')].map(p => p.getAttribute('data-pill'));
    expect(pills).toEqual(['like', 'comment', 'share', 'more']);
    expect((v.container.querySelector('[data-pill="like"]') as HTMLElement).style.color).toBe('rgb(255, 255, 255)');
    cleanup();
    const u = mount(base);
    expect((u.container.querySelector('[data-pill="like"]') as HTMLElement).style.color).not.toBe('rgb(255, 255, 255)');
  });

  it('(b) readOnly renders no pills but keeps mute on a video', () => {
    const v = mount(video, { readOnly: true });
    expect(v.container.querySelector('[data-fullscreen-pills]')).toBeNull();
    expect(screen.getByRole('button', { name: /^(Mute|Unmute)$/ })).toBeInTheDocument();
  });

  it('(c) no solid band; the shade ignores pointers', () => {
    const v = mount(base);
    expect(v.container.querySelector('[data-fullscreen-band]')).toBeNull();
    const shade = v.container.querySelector('[data-fullscreen-shade]') as HTMLElement;
    expect(shade).not.toBeNull();
    expect(shade.style.pointerEvents).toBe('none');
  });

  it('(d) dots render only for 2+ items and follow the active slide', () => {
    const single = mount(base);
    expect(single.container.querySelector('[data-fullscreen-dots]')).toBeNull();
    cleanup();
    const three = { ...base, mediaItems: [0, 1, 2].map(i => ({ id: `m${i}`, type: 'image', imageUrl: `/${i}.jpg`, width: 1, height: 1 })) } as unknown as FeedPost;
    const v = mount(three);
    const active = () => [...v.container.querySelectorAll('[data-fullscreen-dots] > span')].findIndex(d => d.hasAttribute('data-dot-active'));
    expect(v.container.querySelectorAll('[data-fullscreen-dots] > span')).toHaveLength(3);
    expect(active()).toBe(0);
    act(() => useFullscreenFeedStore.getState().setActivePagerIdx(2));
    expect(active()).toBe(2);
  });

  it('(e) the review score tile is gone; the review scores print in the stat row', () => {
    const v = mount(review);
    expect(v.container.querySelector('[data-review-score-strip]')).toBeNull();
    expect([...v.container.querySelectorAll('[data-fullscreen-stats] [data-stat]')].map(c => c.getAttribute('data-stat'))).toEqual(['overall', 'design', 'condition', 'clubhouse', 'facilities']);
  });

  it('(f) a review opens its full review from the REVIEW chip; no caption or Full review line', () => {
    const onReviewTap = vi.fn();
    const v = mount({ ...review, caption: 'Lovely greens' } as FeedPost, { onReviewTap });
    expect(v.container.querySelector('[data-fullscreen-caption]')).toBeNull();
    expect(v.container.querySelector('[data-full-review]')).toBeNull();
    const chip = v.container.querySelector('[data-fullscreen-review-chip]') as HTMLElement;
    expect(chip.closest('[data-fullscreen-member]')).not.toBeNull();
    fireEvent.click(chip);
    expect(onReviewTap).toHaveBeenCalledTimes(1);
  });


  it('(g) the comment pill opens the composer when signed in, otherwise the comments', () => {
    actor.current = { id: 'me', type: 'personal', name: 'Me', avatarUrl: null };
    const onCompose = vi.fn(); const onComment = vi.fn();
    const v = mount(base, { onCompose, onComment });
    fireEvent.click(v.container.querySelector('[data-pill="comment"]')!);
    expect(onCompose).toHaveBeenCalledTimes(1);
    expect(onComment).not.toHaveBeenCalled();
    cleanup();
    actor.current = null;
    const w = mount(base, { onCompose, onComment });
    fireEvent.click(w.container.querySelector('[data-pill="comment"]')!);
    expect(onComment).toHaveBeenCalledTimes(1);
  });

  it('(h) the chrome holds no text field', () => {
    for (const p of [base, review, video]) {
      const v = mount(p);
      const root = v.container.querySelector('[data-immersive-chrome]')!;
      expect(root.querySelector('input, textarea, [contenteditable]')).toBeNull();
      cleanup();
    }
  });

  it('(i) fullscreenBand constants are unchanged', () => {
    expect([BAND_PAD_TOP, COMMENT_BAR_H, COMMENT_BAR_FLOOR]).toEqual([12, 44, 16]);
    expect(BAND_H_CSS).toBe('calc(12px + 44px + max(16px, env(safe-area-inset-bottom, 0px)))');
    expect(readFileSync('src/lib/media/fullscreenBand.ts', 'utf8')).toContain('BAND_PAD_TOP + COMMENT_BAR_H + Math.max(COMMENT_BAR_FLOOR, safeBottom)');
  });
});
