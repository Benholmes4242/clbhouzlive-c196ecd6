/**
 * Fullscreen viewer adapters - Bridge between old adapter pattern and new normalized format
 */

import { FeedAdapter } from '@/types/feed-adapter';
import { FullscreenMediaItem } from './hooks/useFullscreenViewer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

/**
 * Convert items using FeedAdapter to FullscreenMediaItem format
 */
export function adaptItemsToFullscreen<T>(
  items: T[],
  adapter: FeedAdapter<T>
): FullscreenMediaItem[] {
  return items.map((item, index) => {
    const id = adapter.getId(item);
    const media = adapter.getMedia(item);
    const creator = adapter.getCreator(item);
    const firstMedia = media[0];
    
    // Extract stream ID and generate poster
    const streamId = firstMedia?.media_url 
      ? uidFromNode({ src: firstMedia.media_url }) 
      : undefined;
    const posterUrl = streamId 
      ? generateStreamThumbnailUrl(streamId, { height: 720 })
      : firstMedia?.poster_url;

    return {
      id,
      postId: id,
      mediaIndex: 0,
      mediaUrl: firstMedia?.media_url || '',
      mediaType: (firstMedia?.media_type || 'image') as 'video' | 'image',
      streamId: streamId || undefined,
      posterUrl,
      aspectRatio: firstMedia?.aspect_ratio,
      width: firstMedia?.width,
      height: firstMedia?.height,
      studioEdits: (firstMedia as any)?.studio_edits,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorAvatar: creator.avatar,
      creatorUsername: creator.username,
      creatorHomeClub: creator.homeClub,
      creatorHandicap: creator.handicap,
      caption: adapter.getCaption(item),
      likeCount: adapter.getLikes(item),
      commentCount: adapter.getComments(item),
      isLiked: false, // Would need to be fetched separately
      isBookmarked: false, // Would need to be fetched separately
      courseId: adapter.getCourse(item)?.id,
      courseName: adapter.getCourse(item)?.name,
      courseCountry: adapter.getCourse(item)?.country,
      courseRegion: adapter.getCourse(item)?.region,
      isReview: adapter.getReviewData(item) !== null,
      reviewRating: adapter.getReviewData(item)?.rating,
      reviewData: adapter.getReviewData(item),
    };
  });
}

/**
 * Create an async adapter for infinite scroll
 */
export function createFetchMoreAdapter<T>(
  onLoadMore: (() => void) | undefined,
  getNewItems: () => T[],
  adapter: FeedAdapter<T>
): (() => Promise<FullscreenMediaItem[]>) | undefined {
  if (!onLoadMore) return undefined;
  
  return async () => {
    onLoadMore();
    // Wait a tick for new items to be added
    await new Promise(resolve => setTimeout(resolve, 100));
    const newItems = getNewItems();
    return adaptItemsToFullscreen(newItems, adapter);
  };
}
