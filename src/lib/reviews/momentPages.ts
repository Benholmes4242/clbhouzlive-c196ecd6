/** Moment tiles retain media identity; viewer pages group by review identity in
 * first-seen order and use the canonical adapter, never media ids as targets. */
import type { CourseMoment } from '@/hooks/useUserCourseMoments';
import { reviewFeedPost, type ReviewFeedPostInput } from './reviewFeedPost';
import type { FeedPost } from '@/components/media-system/types/media';

export function momentPages(moments: readonly CourseMoment[], author: Pick<ReviewFeedPostInput, 'userId' | 'username' | 'displayName' | 'avatarUrl'>, courseId: string, courseName: string): FeedPost[] {
  const groups = new Map<string, CourseMoment[]>();
  for (const moment of moments) {
    if (moment.type !== 'review_media' || !moment.reviewId) continue;
    const group = groups.get(moment.reviewId) ?? [];
    group.push(moment);
    groups.set(moment.reviewId, group);
  }
  return [...groups.entries()].map(([reviewId, group]) => reviewFeedPost({
    ...author, courseId, courseName, reviewId, rating: null,
    ...group[0]?.reviewInput,
    media: [...group].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map(m => ({
      id: m.id, type: m.mediaType, url: m.mediaUrl, posterUrl: m.posterUrl,
    })),
  }));
}

export function momentPageIndex(posts: readonly FeedPost[], mediaId: string): number {
  return posts.findIndex(post => post.mediaItems.some(item => item.id === mediaId));
}