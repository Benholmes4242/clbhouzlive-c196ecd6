/**
 * Explore Moment Adapter
 * 
 * Converts ExploreMoment (from explore_moments view) to normalized format
 * for the Unified Fullscreen Player.
 */

import { FeedAdapter, MediaItem, CreatorInfo, GolfCourseInfo, MusicTrackInfo, ExtractedReviewData } from '@/types/feed-adapter';
import { ExploreMoment } from '@/hooks/useExploreMoments';

export const exploreMomentAdapter: FeedAdapter<ExploreMoment> = {
  getId: (item) => item.moment_id,

  getMedia: (item) => [{
    id: item.moment_id,
    media_type: item.media_type === 'video' ? 'video' : 'image',
    media_url: item.media_url,
    poster_url: item.thumbnail_url || undefined,
    aspect_ratio: item.aspect_ratio || undefined,
  }],

  getCreator: (item) => {
    // Use enriched creator data when available
    if (item.creator) {
      return {
        id: item.user_id,
        name: item.creator.display_name || item.creator.username || 'Golfer',
        username: item.creator.username || undefined,
        avatar: item.creator.profile_photo_url || undefined,
        type: 'personal',
      };
    }
    return {
      id: item.user_id,
      name: 'Golfer',
      type: 'personal',
    };
  },

  getLikes: () => 0, // Not available in explore_moments view

  getComments: () => 0, // Not available in explore_moments view

  getCaption: () => null, // Not available in explore_moments view

  getCourse: (item) => {
    // If course data is available (added by enrichment)
    if ((item as any).courseName) {
      return {
        id: item.course_id,
        name: (item as any).courseName,
        region: item.region_key || null,
      };
    }
    // Fallback: we have course_id but no course name
    if (item.course_id) {
      return {
        id: item.course_id,
        name: '', // Will be fetched by viewer if needed
      };
    }
    return null;
  },

  getMusicTrack: () => null, // Not available in explore_moments view

  getBadges: () => [],

  getReviewData: (item) => {
    if (item.source_type !== 'review') return null;
    
    // Basic review data from what we have
    return {
      courseId: item.course_id,
      courseName: (item as any).courseName || '',
      rating: 0, // Not available in this view
      tierLabel: '',
      sourceReviewId: item.source_id,
    };
  },

  getCategories: () => [],

  getCreatedAt: (item) => item.created_at,

  getType: (item) => item.media_type === 'video' ? 'video' : 'image',
};

export default exploreMomentAdapter;
