/** BRIEF_CANONICAL_VIEWER_FOR_MEMBER_SHOTS §1, §5 — the shared one-post-per-
 * shot builders, and the readOnly gates that keep synthetic post ids from
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

import { holeShotsToFeedPosts, coursePostsToShotPosts, type MemberShotRow } from '@/lib/courseMedia/memberShotPosts';
import { useVideoProgressWriter } from '@/video/useVideoProgressWriter';
import type { FeedPost } from '@/components/media-system/types/media';

const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

const shotRow = (id: string, over: Partial<MemberShotRow> = {}): MemberShotRow => ({
  id, course_id: 'course-1', media_type: 'image', media_url: `/${id}.jpg`,
  poster_url: null, stream_id: null, duration_seconds: null,
  added_at: '2026-03-11T10:00:00Z', member_id: 'u1', member_name: 'Thomas Holmes', ...over,
});

describe('holeShotsToFeedPosts', () => {
  it('three rows give three single-media posts in order, credited to the member, with the course set', () => {
    const posts = holeShotsToFeedPosts([shotRow('a'), shotRow('b', { member_name: 'Benjamin Holmes' }), shotRow('c')], 'Royal Portrush (Dunluce)');
    expect(posts).toHaveLength(3);
    expect(posts.map(p => p.id)).toEqual(['a', 'b', 'c']);
    for (const post of posts) {
      expect(post.mediaItems).toHaveLength(1);
      expect(post.mediaItems[0].id).toBe(post.id);
      expect(post.courseName).toBe('Royal Portrush (Dunluce)');
      expect(post.courseId).toBe('course-1');
      expect(post.likeCount).toBe(0);
      expect(post.commentCount).toBe(0);
      expect(post.shareCount).toBe(0);
    }
    expect(posts[0].displayName).toBe('Thomas Holmes');
    expect(posts[1].displayName).toBe('Benjamin Holmes');
    expect(posts[0].createdAt).toBe('2026-03-11T10:00:00Z');
    expect(posts[0].userId).toBe('u1');
  });

  it('skips processing videos and keeps ready ones with their stream', () => {
    const streamId = 'a'.repeat(32);
    const posts = holeShotsToFeedPosts([
      shotRow('img'),
      shotRow('proc', { media_type: 'video', duration_seconds: null, stream_id: streamId }),
      shotRow('vid', { media_type: 'video', duration_seconds: 42, stream_id: streamId, poster_url: '/vid.jpg' }),
    ], 'Course');
    expect(posts.map(p => p.id)).toEqual(['img', 'vid']);
    expect(posts[1].mediaItems[0].type).toBe('video');
    expect(posts[1].mediaItems[0].hlsUrl).toContain(`/${streamId}/manifest/video.m3u8`);
  });
});

describe('coursePostsToShotPosts', () => {
  const item = (id: string, over: Record<string, unknown> = {}) => ({ id, type: 'image' as const, imageUrl: `/${id}.jpg`, width: 100, height: 100, ...over });
  const post = (id: string, mediaItems: ReturnType<typeof item>[], over: Record<string, unknown> = {}) => ({
    id, displayName: 'Thomas Holmes', createdAt: '2026-03-11T10:00:00Z', userId: 'u1', mediaItems, ...over,
  }) as unknown as FeedPost;

  it('posts of 3 and 2 media give 5 single-media posts with unique ids and the real post author', () => {
    const posts = coursePostsToShotPosts([
      post('p1', [item('m1'), item('m2'), item('m3')]),
      post('p2', [item('m4'), item('m5')], { displayName: 'St Andrews Links' }),
    ]);
    expect(posts).toHaveLength(5);
    expect(posts.map(p => p.id)).toEqual(['p1::m1', 'p1::m2', 'p1::m3', 'p2::m4', 'p2::m5']);
    expect(new Set(posts.map(p => p.id)).size).toBe(5);
    for (const p of posts) expect(p.mediaItems).toHaveLength(1);
    expect(posts[0].displayName).toBe('Thomas Holmes');
    expect(posts[0].createdAt).toBe('2026-03-11T10:00:00Z');
    expect(posts[4].displayName).toBe('St Andrews Links');
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
    expect(posts.map(p => p.id)).toEqual(['p1::m1', 'p1::v3']);
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

    // readOnly path: null post — no subscription, no write.
    h.listener = null;
    const gated = renderHook(() => useVideoProgressWriter(null), { wrapper });
    expect(h.listener).toBeNull();
    expect(h.from).not.toHaveBeenCalled();
    gated.unmount();
    expect(h.upsert).not.toHaveBeenCalled();

    // readOnly false path: the post flows through and a pause writes progress.
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
