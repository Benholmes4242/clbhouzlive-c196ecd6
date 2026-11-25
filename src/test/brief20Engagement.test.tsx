import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { commentsKeys, commentsScope } from '@/lib/queryKeys';
import { renderHook } from '@testing-library/react';
import type { FeedPost } from '@/components/media-system/types/media';

const f = vi.hoisted(() => ({ toggles: [] as string[] }));
vi.mock('@/features/stories/useStoryEngagement', () => ({
  useStoryEngagement: () => ({ engagementFor: (id: string) => ({ likeCount: id === 'review-1' ? 4 : 0, commentCount: id === 'review-1' ? 2 : 0, viewerLiked: false }) }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({
  useContentReactions: () => ({ viewerId: 'viewer', unavailable: false, toggle: (type: string, id: string) => { f.toggles.push(`${type}:${id}`); } }),
}));
vi.mock('@tanstack/react-query', async (orig) => ({ ...(await orig<typeof import('@tanstack/react-query')>()), useQueryClient: () => ({ invalidateQueries: () => Promise.resolve() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({}) } }));

import { engagementTargetFor } from '@/lib/engagement/engagementTarget';
import { viewerActionPost } from '@/components/fullscreen-feed/viewerContent';
import { useViewerEngagement, reviewEngagementPost } from '@/components/fullscreen-feed/useViewerEngagement';

const base = { id: 'post-1', mediaItems: [], isReview: false, review: null, commentCount: 9, likeCount: 9 } as unknown as FeedPost;
const fetchedRow = (over: Record<string, unknown> = {}) => ({ id: 'post-1', userId: 'a', actorId: 'a', actorType: 'personal' as const, caption: '', createdAt: '', likeCount: 9, commentCount: 9, isLikedByMe: false, sourceReviewId: 'review-1', whsScoreId: null, ...over });

describe('Brief 20 A — one engagement target', () => {
  it('precedence is round > review > post', () => {
    expect(engagementTargetFor({ id: 'p', whsScoreId: 's', sourceReviewId: 'r' })).toEqual({ type: 'round', id: 's' });
    expect(engagementTargetFor({ id: 'p', sourceReviewId: 'r' })).toEqual({ type: 'review', id: 'r' });
    expect(engagementTargetFor({ id: 'p', review: { reviewId: 'r2' } })).toEqual({ type: 'review', id: 'r2' });
    expect(engagementTargetFor({ id: 'p', engagementTarget: { type: 'review', id: 'r3' } })).toEqual({ type: 'review', id: 'r3' });
    expect(engagementTargetFor({ id: 'p' })).toEqual({ type: 'post', id: 'p' });
    expect(engagementTargetFor({ id: 'p', sourceReviewId: 'r' }, { scoreId: 's' })).toEqual({ type: 'round', id: 's' });
  });

  it('a profile Videos row whose post has source_review_id resolves its comment sheet to the review', () => {
    const action = viewerActionPost(base, undefined, [fetchedRow()], true)!;
    const target = engagementTargetFor(action as never);
    expect(target).toEqual({ type: 'review', id: 'review-1' });
  });

  it('viewerActionPost on a member shot from a review post keeps the review target', () => {
    const shot = { ...base, id: 'shots:x', mediaItems: [{ id: 'm', type: 'image', url: '', memberShot: { sourcePostId: 'post-1' } }] } as unknown as FeedPost;
    const action = viewerActionPost(shot, shot.mediaItems[0], [fetchedRow()], true, true);
    expect(action?.engagementTarget).toEqual({ type: 'review', id: 'review-1' });
  });

  it('a round-sourced post stays a post action (round resolved by score id), never review', () => {
    const action = viewerActionPost(base, undefined, [fetchedRow({ whsScoreId: 'score-1' })], true)!;
    expect(action.engagementTarget).toBeUndefined();
    expect(engagementTargetFor(action as never)).toEqual({ type: 'round', id: 'score-1' });
  });

  it('a Clubhouse review card counts from the review engagement, not post.commentCount, and never likes the post', () => {
    const card = { ...base, isReview: true, review: { reviewId: 'review-1' } } as unknown as FeedPost;
    const handleLike = vi.fn();
    const { result } = renderHook(() => useViewerEngagement({
      posts: [card], handleLike, getActiveLikeState: () => ({ isLiked: false, count: 9 }),
      getCommentCount: () => 9, handleShare: () => {}, resolve: reviewEngagementPost,
    }));
    expect(result.current.getViewerCommentCount(card)).toBe(2);
    expect(result.current.getViewerLikeState(card).count).toBe(4);
    result.current.handleViewerLike(card);
    expect(handleLike).not.toHaveBeenCalled();
    expect(f.toggles).toEqual(['review:review-1']);
  });

  it('the viewer and the Clubhouse sheet open the same review thread (same comments key)', () => {
    const viewer = viewerActionPost(base, undefined, [fetchedRow()], true)!;
    const card = { ...base, isReview: true, review: { reviewId: 'review-1' } } as unknown as FeedPost;
    expect(engagementTargetFor(viewer as never)).toEqual(engagementTargetFor(card as never));
  });
  it('a review video opened from ProfileVideosTab and the same review\'s Clubhouse card open the identical comments query key', () => {
    const fromVideos = engagementTargetFor(viewerActionPost(base, undefined, [fetchedRow()], true)! as never);
    const fromCard = engagementTargetFor({ ...base, isReview: true, review: { reviewId: 'review-1' } } as never);
    const key = (t: { type: string; id: string }) => commentsKeys.pages(commentsScope(t.type, t.id, null));
    expect(key(fromVideos)).toEqual(key(fromCard));
    expect(key(fromVideos)).toEqual(['comments-v2', 'review:review-1:-', 'pages']);
  });
});
