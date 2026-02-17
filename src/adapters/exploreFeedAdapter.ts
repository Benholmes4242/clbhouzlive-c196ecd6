/**
 * Explore Feed Adapter
 * 
 * Converts ExploreContentItem (Watch/Discover) to normalized format
 * for the Unified Fullscreen Player.
 */

import { FeedAdapter, MediaItem, CreatorInfo, GolfCourseInfo, MusicTrackInfo, ExtractedReviewData } from '@/types/feed-adapter';
import { ExploreContentItem } from '@/components/explore/types';

export const exploreFeedAdapter: FeedAdapter<ExploreContentItem> = {
  getId: (item) => item.id,

  getMedia: (item) => {
    // If item has media array, use that (multi-media posts)
    if (item.media && item.media.length > 0) {
      return item.media.map((m) => ({
        id: m.id,
        media_type: m.media_type,
        media_url: m.media_url,
        poster_url: item.thumbnailSrc,
        width: item.width,
        height: item.height,
        aspect_ratio: item.aspectRatio,
        studio_edits: m.studio_edits,
        filter_id: m.filter_id,
      }));
    }

    // Fallback: construct single media from item.src
    return [{
      id: item.id,
      media_type: item.type === 'video' ? 'video' : 'image',
      media_url: item.src,
      poster_url: item.thumbnailSrc,
      width: item.width,
      height: item.height,
      aspect_ratio: item.aspectRatio,
      duration: item.durationSeconds,
    }];
  },

  getCreator: (item) => {
    // Priority 1: Use unified creator field
    if (item.creator) {
      return {
        id: item.creator.id,
        name: item.creator.name,
        username: item.creator.username,
        avatar: item.creator.avatarUrl,
        verified: item.creator.verified,
        homeClub: item.creator.subtitle,
        handicap: item.creator.handicap,
        type: item.creator.type,
      };
    }

    // Priority 2: Legacy user field
    if (item.user) {
      return {
        id: item.user.id,
        name: item.user.name,
        username: item.user.username,
        avatar: item.user.avatar,
        verified: item.user.verified,
        homeClub: item.user.homeClub,
        handicap: item.user.handicap,
        type: 'personal',
      };
    }

    // Priority 3: Business posts
    if (item.business) {
      return {
        id: item.business.id,
        name: item.business.name,
        avatar: item.business.logoUrl,
        verified: item.business.isVerified,
        homeClub: item.business.location || item.business.category,
        type: 'business',
      };
    }

    // Default empty creator
    return {
      id: 'unknown',
      name: 'Unknown',
      type: 'personal',
    };
  },

  getLikes: (item) => item.likes || 0,

  getComments: (item) => item.comments || 0,

  getCaption: (item) => item.title || null,

  getCourse: (item) => {
    if (!item.golfCourse) return null;
    return {
      id: item.golfCourse.id,
      name: item.golfCourse.name,
      country: item.golfCourse.country,
      sub_country: item.golfCourse.sub_country,
      region: item.golfCourse.region,
    };
  },

  getMusicTrack: (item) => {
    if (!item.audioTrack) return null;
    return {
      title: item.audioTrack.title,
      artist: item.audioTrack.artist,
      isOriginal: item.audioTrack.isOriginal,
    };
  },

  getBadges: (item) => item.badges || [],

  getReviewData: (item) => {
    if (!item.isReview || !item.sourceReviewId) return null;
    
    const course = item.golfCourse;
    const rating = item.reviewRating || 0;
    const tierLabel = rating >= 9 ? 'OUTSTANDING' : rating >= 8 ? 'EXCELLENT' : rating >= 7 ? 'VERY GOOD' : rating >= 6 ? 'GOOD' : 'FAIR';
    
    return {
      courseId: course?.id || '',
      courseName: course?.name || 'Golf Course',
      courseLocation: course ? `${course.country || ''}, ${course.region || ''}`.replace(/^, |, $/g, '') : undefined,
      rating,
      tierLabel,
      sourceReviewId: item.sourceReviewId,
    };
  },

  getAchievementId: (item) => (item as any).achievement_id ?? null,

  getCategories: (item) => item.categories || [],

  getCreatedAt: (item) => item.createdAt,

  getType: (item) => item.type === 'video' ? 'video' : 'image',

  getDuration: (item) => item.durationSeconds,
};
