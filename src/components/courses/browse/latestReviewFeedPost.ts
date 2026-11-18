import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import type { FeedPost } from '@/components/media-system/types/media';

/** Latest rail adapter mirrors CourseReviewsTab's FeedPost shape without changing
 * that tab. Zero/false engagement is SAFE ONLY with readOnly:true; real engagement
 * must be wired before any caller enables interactive posting actions. */
export function latestReviewFeedPost(r: LatestReview): FeedPost {
  return {
    id: r.reviewId, userId: r.userId ?? '', actorType: 'personal', actorId: r.userId ?? '',
    username: r.reviewerUsername || '', displayName: r.reviewerName || 'Golfer',
    avatarUrl: r.reviewerAvatar || '', isVerified: false, creatorRelation: 'none',
    caption: r.quote || '', createdAt: r.at || new Date().toISOString(),
    mediaItems: (r.media ?? []).map(m => ({
      id: m.id, type: m.type, hlsUrl: m.type === 'video' ? m.url : undefined,
      imageUrl: m.type === 'image' ? m.url : undefined, thumbnailUrl: m.posterUrl || undefined,
      width: m.width || 1080, height: m.height || 1080,
    })),
    likeCount: 0, commentCount: 0, shareCount: 0, isLikedByMe: false, isFollowedByMe: false, tags: [],
    isReview: true, courseId: r.courseId, courseName: r.courseName,
    review: {
      reviewId: r.reviewId, courseId: r.courseId, courseName: r.courseName,
      courseImageUrl: r.courseImage, rating: r.rating, courseCountry: r.courseCountry,
      courseRegion: r.courseRegion, courseSubCountry: r.courseSubCountry,
      reviewText: r.quote || null, breakdown: r.breakdown,
    },
  };
}