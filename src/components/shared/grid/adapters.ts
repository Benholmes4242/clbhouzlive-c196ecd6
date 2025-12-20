// Adapters to convert data from existing types to UnifiedMediaItem

import { ExploreContentItem } from '@/components/explore/types';
import { ActivityPost, ActivityMediaItem } from '@/components/profile/activity/types';
import { UnifiedMediaItem } from './types';
import { getStreamPoster } from '@/utils/stream';
import { uidFromNode, generateHlsUrl } from '@/utils/cloudflareStreamTransform';

// Minimum aspect ratio to consider content as landscape
const LANDSCAPE_AR_THRESHOLD = 1.5;

/**
 * Convert ExploreContentItem (Watch/Discover) to UnifiedMediaItem
 */
export function exploreItemToUnified(item: ExploreContentItem): UnifiedMediaItem {
  const isVideo = item.type === 'video';
  const uid = item.src ? uidFromNode({ src: item.src }) : null;
  const playbackUrl = uid ? generateHlsUrl(uid) : item.src;
  const thumbnailUrl = item.thumbnailSrc ?? (uid ? getStreamPoster(item.src, '0s', 720) : undefined);
  
  // Determine landscape eligibility
  const aspectRatio = item.aspectRatio ?? (item.width && item.height ? item.width / item.height : undefined);
  const isNativeLandscape = aspectRatio ? aspectRatio >= LANDSCAPE_AR_THRESHOLD : false;
  
  return {
    id: item.id,
    postId: item.id,
    type: item.type === 'video' ? 'video' : 'image',
    url: item.src,
    thumbnailUrl,
    playbackUrl: isVideo ? playbackUrl : undefined,
    
    // Orientation
    aspectRatio,
    orientation: isNativeLandscape ? 'landscape' : 'portrait',
    
    // Landscape eligibility flags
    isFeatured: item.isFeatured,
    isScenic: item.landscapeSuitable,
    isCinematic: false,
    
    // Display data
    durationSeconds: item.durationSeconds,
    likes: item.likes,
    courseName: item.golfCourse?.name,
    
    // Creator info
    creator: item.user ? {
      id: item.user.id,
      name: item.user.name,
      username: item.user.username,
      avatar: item.user.avatar,
      verified: item.user.verified,
    } : undefined,
  };
}

/**
 * Convert ActivityPost (Profile) to UnifiedMediaItem
 */
export function activityPostToUnified(post: ActivityPost, overallIndex: number): UnifiedMediaItem | null {
  const media = post.post_media;
  if (!media || media.length === 0) return null;

  const primaryMedia = media[0];
  const golfCourseTag = post.post_tags?.find(tag => tag.entity_type === 'golf_club');
  const isMilestone = post.content?.toLowerCase().includes('milestone') || 
    post.post_tags?.some(tag => tag.name?.toLowerCase().includes('achievement'));

  const isVideo = primaryMedia.media_type === 'video';

  // Normalize Stream URLs
  const uid = isVideo ? uidFromNode({ src: primaryMedia.media_url, media_url: primaryMedia.media_url }) : null;
  const playbackUrl = uid ? generateHlsUrl(uid) : primaryMedia.media_url;
  
  const thumbnailUrl = isVideo
    ? (primaryMedia.poster_url || getStreamPoster(primaryMedia.media_url, '1s') || primaryMedia.media_url)
    : primaryMedia.media_url;

  // Determine orientation from aspect ratio
  const aspectRatio = primaryMedia.aspect_ratio ?? undefined;
  const isNativeLandscape = aspectRatio ? aspectRatio >= LANDSCAPE_AR_THRESHOLD : false;

  return {
    id: primaryMedia.id,
    postId: post.id,
    type: primaryMedia.media_type,
    url: primaryMedia.media_url,
    thumbnailUrl,
    playbackUrl: isVideo ? playbackUrl : undefined,
    
    // Orientation
    aspectRatio,
    orientation: isNativeLandscape ? 'landscape' : 'portrait',
    
    // Landscape eligibility - can be enhanced with more metadata
    isFeatured: false,
    isScenic: false,
    isCinematic: false,
    
    // Display data
    durationSeconds: primaryMedia.duration_seconds,
    likes: post.likes,
    additionalMediaCount: media.length > 1 ? media.length - 1 : undefined,
    isMilestone,
    courseName: golfCourseTag?.name,
    
    // Creator info
    creator: post.user ? {
      id: post.user.id,
      name: post.user.display_name || 'Unknown',
      username: post.user.username || undefined,
      avatar: post.user.profile_photo_url || undefined,
    } : undefined,
    
    sortIndex: overallIndex,
  };
}

/**
 * Batch convert ExploreContentItem array
 */
export function exploreItemsToUnified(items: ExploreContentItem[]): UnifiedMediaItem[] {
  return items.map((item, index) => ({
    ...exploreItemToUnified(item),
    sortIndex: index,
  }));
}

/**
 * Batch convert ActivityPost array
 */
export function activityPostsToUnified(posts: ActivityPost[]): UnifiedMediaItem[] {
  return posts
    .map((post, index) => activityPostToUnified(post, index))
    .filter((item): item is UnifiedMediaItem => item !== null);
}
