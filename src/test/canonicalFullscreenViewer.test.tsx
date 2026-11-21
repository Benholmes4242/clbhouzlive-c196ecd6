import React from 'react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost, FeedRpcRow } from '@/components/media-system/types/media';

const h = vi.hoisted(() => ({
  toggle: vi.fn(), engagement: new Map<string, { likeCount: number; commentCount: number; viewerLiked: boolean }>(),
  open: vi.fn(), clubMedia: [] as unknown[], reviewRows: [] as unknown[], scoreRead: vi.fn(),
  course: { id: 'c1', name: 'Royal Dornoch', country: 'Scotland', region: null, sub_country: 'Highlands' },
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: { avg_overall_score: 9.1 } }) }));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: () => ({ status: null, isLoading: false }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: null, isLoading: false }) }));
vi.mock('@/audio/useLaneAudioBlocked', () => ({ useLaneAudioBlocked: () => false }));
vi.mock('@/video/useVideoProgressWriter', () => ({ useVideoProgressWriter: () => {} }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: (p: { postId: string; source: string }) => <span data-likers={p.source} data-likers-id={p.postId} /> }));
const scrubber = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: (p: unknown) => { scrubber.render(p); return null; } }));
vi.mock('@/features/stories/useStoryEngagement', () => ({
  useStoryEngagement: () => ({ engagementFor: (id?: string | null) => (id && h.engagement.get(id)) || { likeCount: 0, commentCount: 0, viewerLiked: false }, isSettled: true }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({
  useContentReactions: () => ({ toggle: h.toggle, viewerId: 'viewer', unavailable: false, isSettled: true, stateFor: () => ({ count: 0, mine: false }) }),
}));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: h.open }));
vi.mock('@/hooks/useClubMedia', () => ({ useClubMedia: () => ({ data: h.clubMedia, isLoading: false }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => true }));
vi.mock('@/integrations/supabase/client', () => {
  const chain = (table: string) => {
    const q: Record<string, unknown> = {};
    q.select = () => q; q.eq = () => q;
    q.in = (_key: string, ids: string[]) => { if (table === 'course_ratings') h.scoreRead(ids); return Promise.resolve({ data: table === 'course_ratings' ? h.reviewRows : [], error: null }); };
    q.maybeSingle = () => Promise.resolve({ data: h.course, error: null });
    return q;
  };
  return { supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), getSession: () => Promise.resolve({ data: { session: null } }), getUser: () => Promise.resolve({ data: { user: null } }) }, from: chain, rpc: () => Promise.resolve({ data: [], error: null }), functions: { invoke: () => Promise.resolve({ data: { edges: [] }, error: null }) } } };
});

import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';
import { useViewerEngagement } from '@/components/fullscreen-feed/useViewerEngagement';
import { reviewFeedPost } from '@/lib/reviews/reviewFeedPost';
import AboutMediaStrip from '@/components/courses/course-detail/AboutMediaStrip';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { viewerActionPost } from '@/components/fullscreen-feed/viewerContent';
import { mapRowToFeedPost } from '@/components/media-system/utils/feedMapper';
import { useViewerContent } from '@/components/fullscreen-feed/useViewerContent';
import { openTagShot } from '@/components/course-media-tab/ShotTagCard';

const reviewPost = reviewFeedPost({
  reviewId: 'rev-1', userId: 'u1', displayName: 'Ben Holmes', text: 'Firm and fast.', createdAt: '2026-11-01T10:00:00Z',
  media: [{ id: 'm1', type: 'image', url: 'https://x/1.jpg' }], courseId: 'c1', courseName: 'Royal Dornoch', rating: 9,
  breakdown: { design: 9, conditions: 8, clubhouse: 7, facilities: 8 },
});
const realPost = { ...reviewPost, id: 'post-1', engagementTarget: undefined, isReview: false, review: null } as FeedPost;

function chrome(post: FeedPost, opts: { synthetic?: boolean; readOnly?: boolean; confirmedSourcePostIds?: string[] } = {}) {
  return render(<MemoryRouter><ImmersiveFullscreenChrome
    posts={[post]} activeIndex={0} syntheticPosts={opts.synthetic} readOnly={opts.readOnly} confirmedSourcePostIds={opts.confirmedSourcePostIds}
    onClose={vi.fn()} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()}
    getLikeState={() => ({ isLiked: false, count: 1 })} getCommentCount={() => 0} getFollowState={() => false}
    onFollow={vi.fn()} onViewProfile={vi.fn()} onReviewTap={vi.fn()} isOwnPost={false} /></MemoryRouter>);
}

beforeEach(() => {
  useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null });
  useClubhouseStore.setState({ isTournamentCardActive: false });
  h.engagement.clear();
});
afterEach(() => { cleanup(); vi.clearAllMocks(); useFullscreenFeedStore.setState({ activePagerIdx: null }); });

describe('CANONICAL_FULLSCREEN_VIEWER part 1', () => {
  it('place shot actions and View post require a resolved source batch; unmatched shots share only', () => {
    const shot = { ...realPost, id: 'shots:place', courseId: 'c1', mediaItems: [{ ...realPost.mediaItems[0],
      memberShot: { kicker: 'The clubhouse', title: 'Course', credit: '', memberName: '', avatarUrl: null, courseId: 'c1', sourcePostId: 'post-9' } }] } as FeedPost;
    const rows = [{ id: 'post-9', userId: 'u1', actorId: 'u1', actorType: 'personal' as const,
      caption: '', createdAt: '', likeCount: 4, commentCount: 2, isLikedByMe: false }];
    const renderState = (resolved: boolean, returned: typeof rows) => <MemoryRouter><ImmersiveFullscreenChrome
      posts={[shot]} activeIndex={0} syntheticPosts confirmedSourcePostIds={resolved ? returned.map(row => row.id) : []}
      onClose={vi.fn()} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()}
      getLikeState={() => ({ isLiked: false, count: 0 })} getCommentCount={() => 0} getFollowState={() => false}
      onFollow={vi.fn()} onViewProfile={vi.fn()} onReviewTap={vi.fn()} isOwnPost={false} /></MemoryRouter>;
    const view = render(renderState(false, []));
    const pills = () => [...view.container.querySelectorAll('[data-pill]')].map(p => p.getAttribute('data-pill'));
    expect(viewerActionPost(shot, shot.mediaItems[0], rows, false)).toBeNull();
    expect(screen.queryByRole('button', { name: 'View post' })).toBeNull();
    expect(pills()).toEqual(['share']);
    view.rerender(renderState(true, rows));
    expect(viewerActionPost(shot, shot.mediaItems[0], rows, true)?.id).toBe('post-9');
    expect(screen.queryByRole('button', { name: 'View post' })).toBeNull();
    expect(pills()).toEqual(['like', 'comment', 'share', 'more']);
    view.rerender(renderState(true, []));
    expect(viewerActionPost(shot, shot.mediaItems[0], [], true)).toBeNull();
    expect(screen.queryByRole('button', { name: 'View post' })).toBeNull();
    expect(pills()).toEqual(['share']);
    view.rerender(renderState(false, rows));
    expect(screen.queryByRole('button', { name: 'View post' })).toBeNull();
    expect(pills()).toEqual(['share']);
  });
  it('untagged Tag previews have no pills; standalone course photos share a valid Media URL only', () => {
    openTagShot({ url: '/untagged.jpg', mediaType: 'image' }, document.createElement('button'));
    const args = h.open.mock.calls.at(-1)?.[0];
    expect(args?.options).toEqual({ syntheticPosts: true });
    const preview = args?.posts[0] as FeedPost;
    expect(preview.mediaItems[0].memberShot?.sourcePostId).toBeFalsy();
    expect(preview.courseId).toBeFalsy();
    const view = chrome(preview, { synthetic: true });
    expect(view.container.querySelector('[data-fullscreen-pills]')).toBeNull();
    view.unmount();
    const coursePhoto = { ...preview, courseId: 'course-1' };
    const share = vi.fn().mockResolvedValue(undefined);
    const original = Object.getOwnPropertyDescriptor(navigator, 'share');
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    try {
      const courseView = chrome(coursePhoto, { synthetic: true });
      expect([...courseView.container.querySelectorAll('[data-pill]')].map(p => p.getAttribute('data-pill'))).toEqual(['share']);
      fireEvent.click(screen.getByRole('button', { name: 'Share' }));
      expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining('/courses/course-1?tab=media&shot=') }));
    } finally {
      if (original) Object.defineProperty(navigator, 'share', original);
      else Reflect.deleteProperty(navigator, 'share');
    }
  });
  it('a course-media RPC review without score columns reads its review once and renders all five figures', async () => {
    const post = mapRowToFeedPost({ post_id: 'post-score', user_id: 'author', source_review_id: 'review-score',
      media_id: 'score-media', media_type: 'image', media_url: '/score.jpg', course_id: 'course',
      course_name: 'Sunningdale (Old)', review_rating: 9.1 } as unknown as FeedRpcRow);
    h.reviewRows = [{ id: 'review-score', design_score: 9.6, condition_score: 9.1, clubhouse_score: 9.2, facilities_score: 8.6 }];
    useFullscreenFeedStore.setState({ isOpen: true, posts: [post] });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
    renderHook(() => useViewerContent([post], true), { wrapper });
    await waitFor(() => expect(useFullscreenFeedStore.getState().posts[0].review?.breakdown?.design).toBe(9.6));
    expect(h.scoreRead).toHaveBeenCalledExactlyOnceWith(['review-score']);
    const view = chrome(useFullscreenFeedStore.getState().posts[0]);
    const row = view.container.querySelector('[data-review-score-strip] [data-review-score-row]');
    expect(row?.getAttribute('data-variant')).toBe('card');
    expect([...row?.querySelectorAll('[data-score-figure]') ?? []].map(el => el.textContent)).toEqual(['9.1', '9.6', '9.1', '9.2', '8.6']);
  });
  it('a resolved unmatched post has no pills and double-tap cannot call a like', () => {
    const missing = { ...realPost, id: 'phantom-media' };
    const target = viewerActionPost(missing, missing.mediaItems[0], [], true);
    expect(target).toBeNull();
    expect(viewerActionPost(missing, missing.mediaItems[0], [], false)?.id).toBe('phantom-media');
    const like = vi.fn();
    const doubleTap = () => { if (target) like(target); };
    doubleTap();
    expect(like).not.toHaveBeenCalled();
    const view = render(<MemoryRouter><ImmersiveFullscreenChrome
      posts={[missing]} activeIndex={0} actionsUnavailable onClose={vi.fn()} onLike={like}
      onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()} getLikeState={() => ({ isLiked: false, count: 0 })}
      getCommentCount={() => 0} getFollowState={() => false} onFollow={vi.fn()}
      onViewProfile={vi.fn()} onReviewTap={vi.fn()} isOwnPost={false} /></MemoryRouter>);
    expect(view.container.querySelector('[data-fullscreen-pills]')).toBeNull();
  });
  it('a source-post course photo shows all four action pills', () => {
    const shot = { ...realPost, id: 'shots:source', mediaItems: [{ ...realPost.mediaItems[0], memberShot: { kicker: '', title: 'Royal Dornoch', credit: '', memberName: 'Ben', avatarUrl: null, sourcePostId: 'post-1' } }] } as FeedPost;
    const view = chrome(shot, { synthetic: true, confirmedSourcePostIds: ['post-1'] });
    expect([...view.container.querySelectorAll('[data-pill]')].map(p => p.getAttribute('data-pill'))).toEqual(['like', 'comment', 'share', 'more']);
  });
  it('the review score strip uses the full-width card row and its divider', () => {
    const view = chrome(reviewPost);
    const row = view.container.querySelector('[data-review-score-strip] [data-review-score-row]');
    expect(row?.getAttribute('data-variant')).toBe('card');
    expect(row?.querySelector('[data-score-divider]')).not.toBeNull();
    expect(row?.querySelectorAll('[data-score-figure]')).toHaveLength(5);
  });
  it('no application viewer open passes readOnly', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (full.startsWith(join('src', 'test'))) continue;
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(name) && !/\.(test|spec)\./.test(name) && /readOnly:\s*true/.test(readFileSync(full, 'utf8'))) offenders.push(full);
      }
    };
    walk('src');
    expect(offenders).toEqual([]);
  });
  it('(a) review opens carry engagementTarget review, open interactive, and show the pills (no More)', () => {
    expect(reviewPost.engagementTarget).toEqual({ type: 'review', id: 'rev-1' });
    const view = chrome(reviewPost);
    const pills = [...view.container.querySelectorAll('[data-fullscreen-pills] [data-pill]')].map(p => p.getAttribute('data-pill'));
    expect(pills).toEqual(['like', 'comment', 'share']);
    expect(view.container.querySelector('[data-likers="review"]')?.getAttribute('data-likers-id')).toBe('rev-1');
    for (const file of ['src/components/courses/ReviewRailSlot.tsx', 'src/components/courses/course-detail/CourseReviewsTab.tsx', 'src/components/posts/ReviewBottomSheet.tsx', 'src/components/courses/course-detail/AboutMediaStrip.tsx']) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/reviewFeedPost\(/);
      expect(src).not.toMatch(/options:\s*\{\s*readOnly:\s*true/);
    }
  });

  it('(b) liking a review toggles content reactions (review, id) and never the post like', () => {
    h.engagement.set('rev-1', { likeCount: 4, commentCount: 2, viewerLiked: false });
    const handleLike = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useViewerEngagement({
      posts: [reviewPost, realPost], handleLike, getActiveLikeState: () => ({ isLiked: false, count: 99 }),
      getCommentCount: () => 77, handleShare: vi.fn(),
    }), { wrapper });
    expect(result.current.getViewerLikeState(reviewPost)).toEqual({ isLiked: false, count: 4 });
    act(() => result.current.handleViewerLike(reviewPost));
    expect(h.toggle).toHaveBeenCalledWith('review', 'rev-1', expect.any(Function));
    expect(handleLike).not.toHaveBeenCalled();
    expect(result.current.getViewerLikeState(reviewPost)).toEqual({ isLiked: true, count: 5 });
    act(() => result.current.handleViewerLike(realPost));
    expect(handleLike).toHaveBeenCalledWith(realPost);
    expect(h.toggle).toHaveBeenCalledTimes(1);
  });

  it('(c) the comment pill target for a review post is the review', () => {
    h.engagement.set('rev-1', { likeCount: 0, commentCount: 3, viewerLiked: false });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useViewerEngagement({
      posts: [reviewPost], handleLike: vi.fn(), getActiveLikeState: () => ({ isLiked: false, count: 0 }),
      getCommentCount: () => 0, handleShare: vi.fn(),
    }), { wrapper });
    expect(result.current.commentTargetFor(reviewPost)).toEqual({ type: 'review', id: 'rev-1' });
    expect(result.current.commentTargetFor(realPost)).toBeNull();
    expect(result.current.getViewerCommentCount(reviewPost)).toBe(3);
    const overlay = readFileSync('src/components/fullscreen-feed/FullscreenFeedOverlay.tsx', 'utf8');
    expect(overlay).toMatch(/commentReviewId = commentTargetFor\(activePost\)\?\.id/);
    expect(overlay).toMatch(/targetType=\{commentScoreId \? "round" : commentReviewId \? "review" : "post"\}/);
  });

  it('(d) About Photos review parents carry the course name and review scores; post parents are interactive with the header', async () => {
    h.clubMedia = [
      { id: 'rm1', source: 'review', sourceId: 'rev-9', type: 'image', url: 'https://x/r.jpg', author: { id: 'u9', displayName: 'Ed' } },
      { id: 'pm1', source: 'post', sourceId: 'post-9', type: 'image', url: 'https://x/p.jpg', author: { id: 'u8', displayName: 'Al' } },
      { id: 'pm2', source: 'post', sourceId: 'post-8', type: 'image', url: 'https://x/q.jpg', author: { id: 'u8', displayName: 'Al' } },
    ];
    h.reviewRows = [{
      id: 'rev-9', course_id: 'c1', user_id: 'u9', rating: 8.5, review: 'Wonderful links.', created_at: '2026-10-01T00:00:00Z',
      design_score: 9, condition_score: 8, clubhouse_score: 7, facilities_score: 8,
      user_profiles: { id: 'u9', username: 'ed', display_name: 'Ed', profile_photo_url: null },
      course: { id: 'c1', name: 'Royal Dornoch', country: 'Scotland', region: null, sub_country: 'Highlands', thumbnail_image: null },
      course_review_media: [{ id: 'rm1', media_type: 'image', media_url: 'https://x/r.jpg', poster_url: null, stream_id: null, is_cover: true, duration_seconds: null, created_at: null, width: null, height: null }],
    }];
    const { container } = render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><AboutMediaStrip clubId="c1" onSeeAllClick={vi.fn()} /></MemoryRouter></QueryClientProvider>);
    const firstTile = () => container.querySelector('button') as HTMLButtonElement;
    await waitFor(() => {
      fireEvent.click(firstTile());
      const posts = h.open.mock.calls.at(-1)?.[0].posts as FeedPost[];
      expect(posts[0].review?.rating).toBe(8.5);
    });
    const args = h.open.mock.calls.at(-1)?.[0];
    const [rev, post] = args.posts as FeedPost[];
    expect(args.options).toEqual({ hasNextPage: false });
    expect(rev.engagementTarget).toEqual({ type: 'review', id: 'rev-9' });
    expect(rev.review).toEqual(expect.objectContaining({ courseName: 'Royal Dornoch', breakdown: { design: 9, conditions: 8, clubhouse: 7, facilities: 8 } }));
    expect('readOnly' in post).toBe(false);
    const postView = chrome(post);
    expect([...postView.container.querySelectorAll('[data-fullscreen-pills] [data-pill]')].map(p => p.getAttribute('data-pill'))).toEqual(['like', 'comment', 'share', 'more']);
    expect(post.courseName).toBe('Royal Dornoch');
    expect(post.engagementTarget).toBeUndefined();
  });

  it('(e) a course-photo open renders the canonical top bar, member author row, hole strip and video row', () => {
    const shot = {
      ...realPost, id: 'shots:hole:c1:4', caption: '', mediaItems: [{
        id: 's1', type: 'video', hlsUrl: '/v.m3u8', width: 100, height: 100,
        memberShot: { kicker: 'The fourth', title: 'Royal Dornoch', detail: 'Par 4 · 303 yards', credit: 'Ed Smith · Sep 2026', avatarUrl: null, memberName: 'Ed Smith', courseId: 'c1', courseName: 'Royal Dornoch' },
      }],
    } as FeedPost;
    const view = chrome(shot, { synthetic: true });
    expect(view.container.querySelector('[data-fullscreen-back-circle]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Open Royal Dornoch' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^clbhouz rating/ })).toBeNull();
    expect(view.container.querySelector('[data-fullscreen-shot-author] .pro-inline-text')).toHaveTextContent('Ed Smith');
    expect(view.container.querySelector('[data-fullscreen-shot-date]')).toHaveTextContent('Sep 2026');
    const strip = view.container.querySelector('[data-fullscreen-hole-strip]');
    expect(strip).toHaveTextContent('The fourth');
    expect(strip).toHaveTextContent('Par 4 · 303 yards');
    expect(view.container.textContent).not.toContain("Through members' eyes");
    expect(view.container.querySelector('[data-fullscreen-video-row]')).not.toBeNull();
    expect(scrubber.render).toHaveBeenLastCalledWith(expect.objectContaining({ showTime: true }));
    expect([...view.container.querySelectorAll('[data-fullscreen-pills] [data-pill]')].map(p => p.getAttribute('data-pill'))).toEqual(['share']);
  });

  it('(f) no app file imports latestReviewFeedPost or MemberShotCredit', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (full.startsWith(join('src', 'test'))) continue;
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(tsx?|css)$/.test(name) && /latestReviewFeedPost|MemberShotCredit/.test(readFileSync(full, 'utf8'))) offenders.push(full);
      }
    };
    walk('src');
    expect(offenders).toEqual([]);
  });
});
