/**
 * Feed Adapters - Unified Fullscreen Player
 * 
 * Registry of all feed adapters for different data sources.
 */

export { exploreFeedAdapter } from './exploreFeedAdapter';
export { exploreMomentAdapter } from './exploreMomentAdapter';
export { profileFeedAdapter } from './profileFeedAdapter';
export { courseFeedAdapter, type CourseReviewMediaItem } from './courseFeedAdapter';
export { unifiedMediaItemAdapter } from './unifiedMediaItemAdapter';

// Re-export types for convenience
export type { FeedAdapter, MediaItem, CreatorInfo, GolfCourseInfo, MusicTrackInfo, ExtractedReviewData, NormalizedItem } from '@/types/feed-adapter';
