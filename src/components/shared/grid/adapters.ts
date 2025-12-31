// Adapters to convert data from existing types to UnifiedMediaItem

import { ExploreContentItem } from '@/components/explore/types';
import { ActivityPost } from '@/components/profile/activity/types';
import { UnifiedMediaItem, ContentCategory, AR_LANDSCAPE_THRESHOLD } from './types';
import { getStreamPoster } from '@/utils/stream';
import { uidFromNode, generateHlsUrl } from '@/utils/cloudflareStreamTransform';
import { classifyOrientation } from './layoutUtils';
import { resolveGolfCourse } from '@/utils/resolveGolfCourse';

/**
 * Map content tags to ContentCategory
 */
function inferContentCategory(item: ExploreContentItem): ContentCategory | undefined {
  // Check landscapeSuitable flag (scenic content)
  if (item.landscapeSuitable) {
    return 'scenic';
  }
  
  // Could be extended to check tags, title keywords, etc.
  return undefined;
}

/**
 * Convert ExploreContentItem (Watch/Discover) to UnifiedMediaItem
 */
export function exploreItemToUnified(item: ExploreContentItem): UnifiedMediaItem {
  const isVideo = item.type === 'video';
  const uid = item.src ? uidFromNode({ src: item.src }) : null;
  const playbackUrl = uid ? generateHlsUrl(uid) : item.src;
  const thumbnailUrl = item.thumbnailSrc ?? (uid ? getStreamPoster(item.src, '0s', 720) : undefined);
  
  // Compute aspect ratio
  const aspectRatio = item.aspectRatio ?? (item.width && item.height ? item.width / item.height : undefined);
  const orientation = classifyOrientation(aspectRatio);
  
  // Infer content category
  const contentCategory = inferContentCategory(item);
  
  return {
    id: item.id,
    postId: item.id,
    type: item.type === 'video' ? 'video' : 'image',
    url: item.src,
    thumbnailUrl,
    playbackUrl: isVideo ? playbackUrl : undefined,
    
    // Dimensions & orientation
    mediaWidth: item.width,
    mediaHeight: item.height,
    aspectRatio,
    orientation,
    
    // Landscape eligibility flags
    isFeatured: item.isFeatured,
    contentCategory,
    golfCourseId: item.golfCourse?.id,
    
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
  
  // Use canonical resolver
  const golfCourse = resolveGolfCourse(post);
  const isMilestone = post.content?.toLowerCase().includes('milestone') || 
    post.post_tags?.some(tag => tag.name?.toLowerCase().includes('achievement'));

  const isVideo = primaryMedia.media_type === 'video';

  // Normalize Stream URLs
  const uid = isVideo ? uidFromNode({ src: primaryMedia.media_url, media_url: primaryMedia.media_url }) : null;
  const playbackUrl = uid ? generateHlsUrl(uid) : primaryMedia.media_url;
  
  const thumbnailUrl = isVideo
    ? (primaryMedia.poster_url || getStreamPoster(primaryMedia.media_url, '1s') || primaryMedia.media_url)
    : primaryMedia.media_url;

  // Compute orientation from aspect ratio
  const aspectRatio = primaryMedia.aspect_ratio ?? undefined;
  const orientation = classifyOrientation(aspectRatio);

  return {
    id: primaryMedia.id,
    postId: post.id,
    type: primaryMedia.media_type,
    url: primaryMedia.media_url,
    thumbnailUrl,
    playbackUrl: isVideo ? playbackUrl : undefined,
    
    // Dimensions & orientation
    aspectRatio,
    orientation,
    
    // Landscape eligibility - can be enhanced with more metadata
    isFeatured: false,
    contentCategory: undefined,
    golfCourseId: golfCourse?.id,
    
    // Display data
    durationSeconds: primaryMedia.duration_seconds,
    likes: post.likes,
    additionalMediaCount: media.length > 1 ? media.length - 1 : undefined,
    isMilestone,
    courseName: golfCourse?.name,
    
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
