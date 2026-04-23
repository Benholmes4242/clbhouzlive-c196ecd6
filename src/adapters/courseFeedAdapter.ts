/**
 * Course Feed Adapter
 * 
 * Converts course review media items to normalized format
 * for the Unified Fullscreen Player.
 * 
 * Used for Course Details page media tab and course-specific feeds.
 */

import { FeedAdapter, MediaItem, CreatorInfo, GolfCourseInfo, ExtractedReviewData } from '@/types/feed-adapter';
import { getRatingTier } from '@/lib/ratingTier';

/**
 * Course review media item structure from the database
 */
export interface CourseReviewMediaItem {
  id: string;
  media_type: 'video' | 'image';
  media_url: string;
  poster_url?: string | null;
  file_name?: string | null;
  width?: number | null;
  height?: number | null;
  aspect_ratio?: number | null;
  studio_edits?: any | null;
  filter_id?: string | null;
  duration_seconds?: number | null;
  created_at?: string;
  
  // Related review data
  review_id?: string;
  rating?: number;
  
  // Related course data
  course?: {
    id: string;
    name: string;
    country?: string;
    sub_country?: string | null;
    region?: string | null;
  };
  
  // Related user data
  user?: {
    id: string;
    display_name?: string | null;
    username?: string | null;
    profile_photo_url?: string | null;
  };
}

export const courseFeedAdapter: FeedAdapter<CourseReviewMediaItem> = {
  getId: (item) => item.id,

  getMedia: (item) => {
    return [{
      id: item.id,
      media_type: item.media_type,
      media_url: item.media_url,
      poster_url: item.poster_url || undefined,
      width: item.width || undefined,
      height: item.height || undefined,
      aspect_ratio: item.aspect_ratio || undefined,
      studio_edits: item.studio_edits,
      filter_id: item.filter_id,
      duration: item.duration_seconds || undefined,
    }];
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

  getLikes: () => 0, // Course media doesn't have likes in this context

  getComments: () => 0, // Course media doesn't have comments in this context

  getCaption: (item) => item.file_name || null,

  getCourse: (item) => {
    if (!item.course) return null;
    return {
      id: item.course.id,
      name: item.course.name,
      country: item.course.country,
      sub_country: item.course.sub_country,
      region: item.course.region,
    };
  },

  getMusicTrack: () => null, // Course media doesn't have music tracks

  getBadges: () => [], // Course media doesn't have badges

  getReviewData: (item) => {
    if (!item.review_id) return null;
    
    const course = item.course;
    const rating = item.rating || 0;
    const tierLabel = getRatingTier(rating);
    
    return {
      courseId: course?.id || '',
      courseName: course?.name || 'Golf Course',
      courseLocation: course ? `${course.country || ''}, ${course.region || ''}`.replace(/^, |, $/g, '') : undefined,
      rating,
      tierLabel,
      sourceReviewId: item.review_id,
    };
  },

  getCategories: () => [],

  getCreatedAt: (item) => item.created_at,

  getType: (item) => item.media_type,

  getDuration: (item) => item.duration_seconds || undefined,
};
