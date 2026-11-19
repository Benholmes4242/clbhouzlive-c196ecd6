import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
const f = vi.hoisted(() => ({ reads: [] as { table: string; ids: string[] }[], posts: [{ id: 'post-1', user_id: 'author', actor_id: 'author', actor_type: 'personal', content: 'Caption', created_at: '', like_count: 7, comment_count: 3 }], likes: [{ post_id: 'post-1', user_id: 'viewer', actor_type: 'business', actor_id: 'business-1' }], scores: [{ id: 'review-1', design_score: 9.6, condition_score: 9.1, clubhouse_score: 9.2, facilities_score: 8.6 }] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const q = { select: () => q, in: (_key: string, ids: string[]) => { f.reads.push({ table, ids }); return q; }, eq: () => q, then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: table === 'posts' ? f.posts : table === 'post_likes' ? f.likes : f.scores, error: null }).then(resolve) };
  return q;
} } }));
import { readViewerPosts, viewerPostIds, missingReviewScoreIds } from '@/components/fullscreen-feed/viewerContent';
import { useViewerContent } from '@/components/fullscreen-feed/useViewerContent';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { patchEngagement } from '@/lib/engagementCache';
import { reviewFeedPost } from '@/lib/reviews/reviewFeedPost';
const review = reviewFeedPost({ reviewId: 'review-1', userId: 'author', courseId: 'course', courseName: 'Sunningdale (Old)', rating: 9.1, media: [{ id: 'm', type: 'image', url: '/m.jpg' }], breakdown: null });
const shot = { ...review, id: 'shots:one', isReview: false, review: null, engagementTarget: undefined, mediaItems: [{ ...review.mediaItems[0], memberShot: { kicker: '', title: '', credit: '', memberName: '', avatarUrl: null, sourcePostId: 'post-1' } }] } as FeedPost;
afterEach(() => { cleanup(); f.reads.length = 0; useFullscreenFeedStore.setState({ isOpen: false, posts: [], restoreStack: [] }); });
describe('viewer batched content', () => {
  it('source-post counts and active-actor likes come from one batch, and the canonical cache patches them', async () => {
    expect(viewerPostIds([shot, shot])).toEqual(['post-1']);
    const rows = await readViewerPosts(viewerPostIds([shot]), 'viewer', { type: 'business', id: 'business-1' });
    expect(f.reads).toEqual([{ table: 'posts', ids: ['post-1'] }, { table: 'post_likes', ids: ['post-1'] }]);
    expect(rows[0]).toEqual(expect.objectContaining({ id: 'post-1', likeCount: 7, commentCount: 3, isLikedByMe: true }));
    const cache = new QueryClient();
    cache.setQueryData(['viewer-source-posts', 'viewer'], rows);
    patchEngagement(cache, 'post-1', { likeCountDelta: 1, isLikedByMe: true });
    expect(cache.getQueryData<typeof rows>(['viewer-source-posts', 'viewer'])?.[0].likeCount).toBe(8);
    const personal = await readViewerPosts(['post-1'], 'viewer', { type: 'personal', id: 'viewer' });
    expect(personal[0].isLikedByMe).toBe(false);
  });
  it('an open review with null breakdown hydrates all four scores in one batched read', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useFullscreenFeedStore.setState({ isOpen: true, posts: [review] });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
    renderHook(() => useViewerContent([review], true, 'viewer'), { wrapper });
    await waitFor(() => expect(useFullscreenFeedStore.getState().posts[0].review?.breakdown).toEqual({ design: 9.6, conditions: 9.1, clubhouse: 9.2, facilities: 8.6 }));
    expect(f.reads).toEqual([{ table: 'course_ratings', ids: ['review-1'] }]);
    expect(missingReviewScoreIds([review, review])).toEqual(['review-1']);
  });
  it('a standalone course photo has no post target or post batch', () => {
    const standalone = { ...shot, mediaItems: [{ ...shot.mediaItems[0], memberShot: { ...shot.mediaItems[0].memberShot, sourcePostId: null } }] } as FeedPost;
    expect(viewerPostIds([standalone])).toEqual([]);
    expect(missingReviewScoreIds([standalone])).toEqual([]);
  });
});