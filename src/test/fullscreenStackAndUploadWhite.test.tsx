import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { FeedPost } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/usePostLikers', () => ({ usePostLikers: () => ({ likers: [], isLoading: true }), likerFirstNames: () => [] }));
vi.mock('@/components/likes/LikesSheet', () => ({ LikesSheet: () => null }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
vi.mock('@/features/pro-verification/ProOrVerifiedMark', () => ({ ProOrVerifiedMark: () => null }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: () => ({ status: null, isLoading: false }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: null, isLoading: false }) }));
vi.mock('@/video/useVideoProgressWriter', () => ({ useVideoProgressWriter: () => {} }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: () => null }));

import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';

afterEach(cleanup);
const post: FeedPost = {
  id: 'post-1', userId: 'author', actorId: 'author', actorType: 'personal',
  username: 'author', displayName: 'Author', avatarUrl: '', isVerified: false,
  creatorRelation: 'none', caption: 'A round together', createdAt: '2026-11-20T12:00:00Z',
  mediaItems: [{ id: 'photo-1', type: 'image', url: '/photo.jpg' }],
  likeCount: 0, commentCount: 0, shareCount: 0, isLikedByMe: false,
  isFollowedByMe: false, isReview: false, review: null,
};
function chrome(item: FeedPost, count: number) {
  return render(<MemoryRouter><ImmersiveFullscreenChrome posts={[item]} activeIndex={0}
    onClose={vi.fn()} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()}
    getLikeState={() => ({ isLiked: false, count })} getCommentCount={() => 0}
    getFollowState={() => false} onFollow={vi.fn()} onViewProfile={vi.fn()} onReviewTap={vi.fn()} isOwnPost
  /></MemoryRouter>);
}

describe('fullscreen stack and white review upload progress', () => {
  it('(a) a zero-like review has no reserve and Full review is the last stack child', () => {
    const view = chrome({ ...post, isReview: true, review: { rating: 8, courseId: 'course-1', courseName: 'Course' } }, 0);
    expect(view.container.querySelector('[data-liked-by-reserve]')).toBeNull();
    expect(view.container.querySelector('[data-liked-by-row]')).toBeNull();
    const stack = view.container.querySelector('[data-fullscreen-stack]');
    const fullReview = view.container.querySelector('[data-full-review]');
    expect(fullReview).not.toBeNull();
    expect(stack?.lastElementChild).toBe(fullReview);
  });
  it('(b) a post with three likes keeps the real LikedByRow while avatars load', () => {
    const view = chrome(post, 3);
    expect(view.container.querySelector('[data-liked-by-row]')).not.toBeNull();
    const source = readFileSync('src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx', 'utf8');
    expect(source).toContain('reserve={likeState.count > 0}');
  });
  it('(c) the white fill token owns both upload progress fills and retires amber', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/--review-upload-fill:\s*#F8FAFC;/);
    expect(css).toMatch(/\.review-upload-ring-fill\s*\{\s*stroke:var\(--review-upload-fill\);\s*\}/);
    expect(css).toMatch(/\.review-upload-batch-track > div\s*\{\s*height:100%;\s*background:var\(--review-upload-fill\);\s*\}/);
    expect(css).not.toContain('--review-upload-amber');
  });
});