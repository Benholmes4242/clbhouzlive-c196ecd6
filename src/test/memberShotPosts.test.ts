/** BRIEF_MEMBER_SHOTS_SWIPE_ACROSS — the single-post horizontal
 * shot builders, and the syntheticPosts gates that keep synthetic post ids from
 * reaching post-keyed requests (impressions, scorecard lookup, video
 * progress). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

const h = vi.hoisted(() => ({
  upsert: vi.fn(() => Promise.resolve({ error: null })),
  from: vi.fn(),
  listener: null as null | ((s: { postId?: string | null; currentTime: number; duration: number; state: string }) => void),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => { h.from(...args); return { upsert: h.upsert }; } },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ session: { user: { id: 'member' } } }) }));
vi.mock('@/video/VideoEngine', () => ({
  VideoEngine: {
    subscribe: (_lane: string, cb: (s: { postId?: string | null; currentTime: number; duration: number; state: string }) => void) => { h.listener = cb; return () => {}; },
    snapshot: () => ({ postId: null, currentTime: 0, duration: 0, state: 'idle' }),
  },
}));

import { holeShotsToFeedPosts, coursePostsToShotPosts, latestHolesToFeedPosts, type MemberShotRow } from '@/lib/courseMedia/memberShotPosts';
import { useVideoProgressWriter } from '@/video/useVideoProgressWriter';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';

const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

const shotRow = (id: string, over: Partial<MemberShotRow> = {}): MemberShotRow => ({
  id, course_id: 'course-1', media_type: 'image', media_url: `/${id}.jpg`,
  poster_url: null, stream_id: null, duration_seconds: null,
  added_at: '2026-03-11T10:00:00Z', member_id: 'u1', member_name: 'Thomas Holmes', ...over,
});

describe('holeShotsToFeedPosts', () => {
  it('three rows give one horizontal post in order, with per-item member credit and the course set', () => {
    const posts = holeShotsToFeedPosts([shotRow('a'), shotRow('b', { member_name: 'Benjamin Holmes', added_at: '2026-06-02T09:00:00Z' }), shotRow('c')], 'Royal Portrush (Dunluce)', 'course-1', 14, '/course.jpg');
    expect(posts).toHaveLength(1);
    const post = posts[0];
    expect(post.id).toBe('shots:hole:course-1:14');
    expect(post.displayName).toBe('Royal Portrush (Dunluce) · The fourteenth');
    expect(post.avatarUrl).toBe('/course.jpg');
    expect(post.mediaItems.map(item => item.id)).toEqual(['a', 'b', 'c']);
    expect(post.mediaItems.map(item => item.memberShot?.credit)).toEqual(['Thomas Holmes · Mar 2026', 'Benjamin Holmes · Jun 2026', 'Thomas Holmes · Mar 2026']);
    expect(post.courseName).toBe('Royal Portrush (Dunluce)');
    expect(post.courseId).toBe('course-1');
    expect([post.likeCount, post.commentCount, post.shareCount]).toEqual([0, 0, 0]);
    expect(post.createdAt).toBe('2026-06-02T09:00:00Z');
    expect(post.actorType).toBe('personal');
    expect(post.caption).toBe('');
    expect(post.review).toBeNull();
    expect(post.isReview).toBe(false);
    expect(post.postType).toBeUndefined();
  });

  it('skips processing videos and keeps ready ones with their stream', () => {
    const streamId = 'a'.repeat(32);
    const posts = holeShotsToFeedPosts([
      shotRow('img'),
      shotRow('proc', { media_type: 'video', duration_seconds: null, stream_id: streamId }),
      shotRow('vid', { media_type: 'video', duration_seconds: 42, stream_id: streamId, poster_url: '/vid.jpg' }),
    ], 'Course', 'course-1', 7);
    expect(posts).toHaveLength(1);
    expect(posts[0].mediaItems.map(item => item.id)).toEqual(['img', 'vid']);
    expect(posts[0].mediaItems[1]).toMatchObject({ type: 'video', streamId, duration: 42, thumbnailUrl: '/vid.jpg' });
    expect(posts[0].mediaItems[1].hlsUrl).toContain(`/${streamId}/manifest/video.m3u8`);
  });
});

describe('coursePostsToShotPosts', () => {
  const item = (id: string, over: Record<string, unknown> = {}) => ({ id, type: 'image' as const, imageUrl: `/${id}.jpg`, width: 100, height: 100, ...over });
  const post = (id: string, mediaItems: ReturnType<typeof item>[], over: Record<string, unknown> = {}) => ({
    id, courseId: 'course-1', courseName: 'Course', displayName: 'Thomas Holmes', createdAt: '2026-03-11T10:00:00Z', userId: 'u1', mediaItems, ...over,
  }) as unknown as FeedPost;

  it('posts of 3 and 2 media give one horizontal post with five ordered items and per-item author credits', () => {
    const posts = coursePostsToShotPosts([
      post('p1', [item('m1'), item('m2'), item('m3')]),
      post('p2', [item('m4'), item('m5')], { displayName: 'St Andrews Links', createdAt: '2026-09-02T08:00:00Z', courseThumbnailImage: '/course.jpg' }),
    ]);
    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe('shots:course:course-1');
    expect(posts[0].displayName).toBe('Course');
    expect(posts[0].avatarUrl).toBe('/course.jpg');
    expect(posts[0].mediaItems.map(item => item.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    expect(posts[0].mediaItems.map(item => item.memberShot?.credit)).toEqual(['Thomas Holmes · Mar 2026', 'Thomas Holmes · Mar 2026', 'Thomas Holmes · Mar 2026', 'St Andrews Links · Sep 2026', 'St Andrews Links · Sep 2026']);
    expect(posts[0].createdAt).toBe('2026-09-02T08:00:00Z');
    expect(posts[0].review).toBeNull();
    expect(posts[0].caption).toBe('');
  });

  it('skips processing videos and videos with no playable source', () => {
    const posts = coursePostsToShotPosts([
      post('p1', [
        item('m1'),
        item('v1', { type: 'video', isProcessing: true, thumbnailUrl: '/v1.jpg' }),
        item('v2', { type: 'video', thumbnailUrl: '/v2.jpg' }),
        item('v3', { type: 'video', hlsUrl: 'https://stream/v3.m3u8', thumbnailUrl: '/v3.jpg' }),
      ]),
    ]);
    expect(posts).toHaveLength(1);
    expect(posts[0].mediaItems.map(item => item.id)).toEqual(['m1', 'v3']);
  });

  it('empty runs open nothing and missing credit parts never invent data', () => {
    expect(coursePostsToShotPosts([])).toEqual([]);
    expect(holeShotsToFeedPosts([])).toEqual([]);
    const posts = holeShotsToFeedPosts([shotRow('a', { member_name: null, added_at: null }), shotRow('b', { member_name: null, added_at: '2026-03-31T23:30:00-02:00' })], 'Course', 'course-1', 1);
    expect(posts[0].avatarUrl).toBe('');
    expect(posts[0].mediaItems.map(item => item.memberShot?.credit)).toEqual(['', 'Apr 2026']);
  });
});

describe('member-shot caption payloads', () => {
  it('hole captions use ordinal, short course, scored facts, added month and member avatar', () => {
    const [post] = holeShotsToFeedPosts([shotRow('a', { hole_no: 15, par: 4, yards: 412, member_name: 'Benjamin Holmes', member_avatar_url: '/ben.jpg', added_at: '2026-01-11T10:00:00Z' })], 'Druids Glen Golf Club', 'course-1', 15);
    expect(post.mediaItems[0].memberShot).toEqual({ kicker: 'The fifteenth', title: 'Druids Glen', detail: 'Par 4 · 412 yards', credit: 'Benjamin Holmes · Jan 2026', avatarUrl: '/ben.jpg', memberName: 'Benjamin Holmes' });
  });
  it('unscored captions keep the course variant alone; null yards are omitted', () => {
    const [post] = holeShotsToFeedPosts([shotRow('a', { par: null }), shotRow('b', { par: 4, yards: null })], 'Royal Portrush Golf Club (Dunluce)', 'course-1', 14);
    expect(post.mediaItems[0].memberShot?.title).toBe('Royal Portrush (Dunluce)');
    expect(post.mediaItems[1].memberShot?.title).toBe('Royal Portrush (Dunluce)');
    expect(post.mediaItems[0].memberShot?.detail).toBeUndefined();
    expect(post.mediaItems[1].memberShot?.detail).toBe('Par 4');
  });
  it('course captions retain the card name and source post member, month and avatar', () => {
    const source = { courseId: 'course-1', courseName: 'Druids Glen Golf Club', displayName: 'Thomas Holmes', createdAt: '2026-03-11T10:00:00Z', avatarUrl: '/thomas.jpg', mediaItems: [{ id: 'a', type: 'image', imageUrl: '/a.jpg', width: 100, height: 100 }] } as FeedPost;
    expect(coursePostsToShotPosts([source])[0].mediaItems[0].memberShot).toEqual({ kicker: "Through members' eyes", title: 'Druids Glen Golf Club', credit: 'Thomas Holmes · Mar 2026', avatarUrl: '/thomas.jpg', memberName: 'Thomas Holmes' });
  });
});

describe('syntheticPosts gates for synthetic post ids (BRIEF_SYNTHETIC_SHOT_GATES)', () => {
  it('the overlay never tracks impressions or looks up scorecards when syntheticPosts, keyed on syntheticPosts not readOnly', () => {
    const overlay = src('src/components/fullscreen-feed/FullscreenFeedOverlay.tsx');
    expect(overlay).toContain('if (!isOpen || !activePost?.id || syntheticPosts) return;');
    expect(overlay).toMatch(/activePostIdForScore && !syntheticPosts/);
    expect(overlay).not.toContain('if (!isOpen || !activePost?.id || readOnly) return;');
    expect(overlay).not.toMatch(/activePostIdForScore && !readOnly/);
  });

  it('the chrome never writes video progress when syntheticPosts, keyed on syntheticPosts not readOnly', () => {
    const chrome = src('src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx');
    expect(chrome).toContain('useVideoProgressWriter(syntheticPosts ? null : activePost)');
    expect(chrome).not.toContain('useVideoProgressWriter(readOnly ? null : activePost)');
  });

  it('synthetic fullscreen slides never mount the post_views tracker or post-keyed likers', () => {
    expect(src('src/components/feed/FeedSlide.tsx')).toContain('{!(isFullscreen && syntheticPosts) && <PostViewSentinel postId={post.id} />}');
    expect(src('src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx')).toContain('{!syntheticPosts && <div style={{ pointerEvents:');
  });

  it('the store sets syntheticPosts on open and resets it to false on close', () => {
    const store = useFullscreenFeedStore.getState();
    const post = { id: 'shot-1', mediaItems: [{ id: 'shot-1', type: 'image', imageUrl: '/s.jpg' }] } as unknown as FeedPost;
    store.open([post], 0, { readOnly: true, syntheticPosts: true });
    expect(useFullscreenFeedStore.getState().syntheticPosts).toBe(true);
    expect(useFullscreenFeedStore.getState().readOnly).toBe(true);
    useFullscreenFeedStore.getState().close();
    expect(useFullscreenFeedStore.getState().syntheticPosts).toBe(false);
    // A real-post readOnly open (Explore review tiles etc.) never sets it.
    useFullscreenFeedStore.getState().open([post], 0, { readOnly: true });
    expect(useFullscreenFeedStore.getState().syntheticPosts).toBe(false);
    useFullscreenFeedStore.getState().close();
  });

  it('a null post (the readOnly path) never subscribes or writes; a real video post writes on pause', () => {
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: cache }, children);
    const videoPost = { id: 'p1', mediaItems: [{ id: 'm1', type: 'video', hlsUrl: 'https://stream/m1.m3u8' }] } as unknown as FeedPost;

    // syntheticPosts path: null post — no subscription, no write.
    h.listener = null;
    const gated = renderHook(() => useVideoProgressWriter(null), { wrapper });
    expect(h.listener).toBeNull();
    expect(h.from).not.toHaveBeenCalled();
    gated.unmount();
    expect(h.upsert).not.toHaveBeenCalled();

    // syntheticPosts false path (readOnly or not): the post flows through and a pause writes progress.
    const live = renderHook(() => useVideoProgressWriter(videoPost), { wrapper });
    expect(h.listener).not.toBeNull();
    h.listener?.({ postId: 'p1', currentTime: 5, duration: 60, state: 'playing' });
    h.listener?.({ postId: 'p1', currentTime: 5, duration: 60, state: 'paused' });
    expect(h.from).toHaveBeenCalledWith('video_progress');
    expect(h.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'member', post_id: 'p1', last_position_seconds: 5 }),
      { onConflict: 'user_id,post_id' },
    );
    live.unmount();
  });
});


describe('latestHolesToFeedPosts', () => {
  it('carries ordered per-item course identity, avatar and scored detail across the rail', () => {
    const [post] = latestHolesToFeedPosts([
      shotRow('druids', { course_name: 'Druids Glen Golf Club', course_id: 'druids', hole_no: 15, par: 4, yards: 412, member_avatar_url: '/thomas.jpg' }),
      shotRow('sundridge', { course_name: 'Sundridge Park Golf Club', course_id: 'sundridge', hole_no: 2, par: 3, yards: null, member_name: null }),
    ]);
    expect(post).toMatchObject({ id: 'shots:latest-holes', displayName: 'Latest holes', courseId: '', courseName: '' });
    expect(post.mediaItems.map(item => item.id)).toEqual(['druids', 'sundridge']);
    expect(post.mediaItems[0].memberShot).toEqual({ kicker: 'The fifteenth', title: 'Druids Glen', detail: 'Par 4 · 412 yards', credit: 'Thomas Holmes · Mar 2026', avatarUrl: '/thomas.jpg', memberName: 'Thomas Holmes', courseId: 'druids', courseName: 'Druids Glen Golf Club' });
    expect(post.mediaItems[1].memberShot).toMatchObject({ kicker: 'The second', detail: 'Par 3', credit: 'Mar 2026', memberName: '', avatarUrl: null, courseId: 'sundridge', courseName: 'Sundridge Park Golf Club' });
  });
  it('skips null-duration videos without disturbing the remaining rail order', () => {
    const streamId = 'b'.repeat(32);
    const [post] = latestHolesToFeedPosts([shotRow('first'), shotRow('processing', { media_type: 'video', stream_id: streamId }), shotRow('ready', { media_type: 'video', stream_id: streamId, duration_seconds: 25 }), shotRow('last')]);
    expect(post.mediaItems.map(item => item.id)).toEqual(['first', 'ready', 'last']);
    expect(post.mediaItems[1]).toMatchObject({ type: 'video', streamId, duration: 25 });
    expect(latestHolesToFeedPosts([])).toEqual([]);
  });
});
