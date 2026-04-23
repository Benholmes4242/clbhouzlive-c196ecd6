/**
 * Unified Media Item Adapter
 * 
 * Converts UnifiedMediaItem (used by WatchGridV2) to normalized format
 * for the Unified Fullscreen Player.
 * 
 * This adapter is useful when pages already have UnifiedMediaItem[] available
 * and don't need to go back to the original post format.
 */

import { FeedAdapter, MediaItem, CreatorInfo, GolfCourseInfo, ExtractedReviewData } from '@/types/feed-adapter';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import { getRatingTier } from '@/lib/ratingTier';

export const unifiedMediaItemAdapter: FeedAdapter<UnifiedMediaItem> = {
  getId: (item) => item.postId || item.id,

  getMedia: (item) => {
    // UnifiedMediaItem represents a single media, but we construct the expected format
    return [{
      id: item.id,
      media_type: item.type,
      media_url: item.url,
      poster_url: item.thumbnailUrl,
      width: item.mediaWidth,
      height: item.mediaHeight,
      aspect_ratio: item.aspectRatio,
      studio_edits: item.studioEdits,
      filter_id: item.filterId,
      duration: item.durationSeconds || undefined,
    }];
  },

  getCreator: (item) => {
    if (!item.creator) {
      return {
        id: 'unknown',
        name: 'Unknown',
        type: 'personal',
      };
    }

    return {
      id: item.creator.id,
      name: item.creator.name,
      username: item.creator.username,
      avatar: item.creator.avatar,
      verified: item.creator.verified,
      type: 'personal',
    };
  },

  getLikes: (item) => item.likes || 0,

  getComments: () => 0, // UnifiedMediaItem doesn't have comments count

  getCaption: () => null, // UnifiedMediaItem doesn't have caption

  getCourse: (item) => {
    if (!item.golfCourseId) return null;
    
    return {
      id: item.golfCourseId,
      name: item.courseName || 'Golf Course',
    };
  },

  getMusicTrack: () => null, // UnifiedMediaItem doesn't have music tracks

  getBadges: (item) => item.badges || [],

  getReviewData: (item) => {
    if (!item.isReview || !item.sourceReviewId) return null;
    
    const rating = item.reviewRating || 0;
    const tierLabel = getRatingTier(rating);
    
    return {
      courseId: item.golfCourseId || '',
      courseName: item.courseName || 'Golf Course',
      courseLocation: item.courseLocation,
      rating,
      tierLabel,
      sourceReviewId: item.sourceReviewId,
    };
  },

  getCategories: () => [], // UnifiedMediaItem doesn't have categories

  getCreatedAt: () => undefined, // UnifiedMediaItem doesn't have createdAt

  getType: (item) => item.type,

  getDuration: (item) => item.durationSeconds || undefined,
};
