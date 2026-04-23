/**
 * Profile Feed Adapter
 * 
 * Converts ActivityPost (Profile Activity) to normalized format
 * for the Unified Fullscreen Player.
 */

import { FeedAdapter, MediaItem, CreatorInfo, GolfCourseInfo, ExtractedReviewData } from '@/types/feed-adapter';
import { ActivityPost } from '@/components/profile/types/ActivityTypes';
import { getRatingTier } from '@/lib/ratingTier';

export const profileFeedAdapter: FeedAdapter<ActivityPost> = {
  getId: (item) => item.id,

  getMedia: (item) => {
    if (!item.post_media || item.post_media.length === 0) {
      return [];
    }

    return item.post_media.map((media) => ({
      id: media.id,
      media_type: media.media_type,
      media_url: media.media_url,
      poster_url: media.poster_url || undefined,
      width: media.width || undefined,
      height: media.height || undefined,
      aspect_ratio: media.aspect_ratio || undefined,
      studio_edits: media.studio_edits,
      filter_id: media.filter_id,
      duration: media.duration_seconds || undefined,
    }));
  },

  getCreator: (item) => {
    if (!item.user) {
      return {
        id: 'unknown',
        name: 'Unknown',
        type: 'personal',
      };
    }

    return {
      id: item.user.id,
      name: item.user.display_name || 'Unknown',
      username: item.user.username || undefined,
      avatar: item.user.profile_photo_url || undefined,
      type: 'personal',
    };
  },

  getLikes: (item) => item.likes || 0,

  getComments: (item) => item.comments || 0,

  getCaption: (item) => item.content || null,

  getCourse: (item) => {
    if (!item.course && !item.course_id) return null;
    
    if (item.course) {
      return {
        id: item.course.id,
        name: item.course.name,
        country: item.course.country,
        sub_country: item.course.sub_country,
        region: item.course.region,
      };
    }

    // Fallback: we have course_id but no course object
    return null;
  },

  getMusicTrack: () => null, // ActivityPost doesn't have music tracks

  getBadges: (item) => item.badges || [],

  getReviewData: (item) => {
    if (!item.isReview || !item.source_review_id) return null;
    
    const course = item.course;
    const rating = item.rating || 0;
    const tierLabel = getRatingTier(rating);
    
    return {
      courseId: course?.id || '',
      courseName: course?.name || 'Golf Course',
      courseLocation: course ? `${course.country || ''}, ${course.region || ''}`.replace(/^, |, $/g, '') : undefined,
      rating,
      tierLabel,
      sourceReviewId: item.source_review_id,
    };
  },

  getAchievementId: (item) => item.achievement_id ?? null,

  getCategories: (item) => item.categories || [],

  getCreatedAt: (item) => item.created_at,

  getType: (item) => {
    const firstMedia = item.post_media?.[0];
    return firstMedia?.media_type || 'image';
  },

  getDuration: (item) => {
    const firstMedia = item.post_media?.[0];
    return firstMedia?.duration_seconds || undefined;
  },
};
