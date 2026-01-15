/**
 * UniversalMediaGrid Adapters
 * 
 * Convert from legacy types to UniversalMediaItem
 */

import { UniversalMediaItem, AR_LANDSCAPE_THRESHOLD, AR_PORTRAIT_THRESHOLD } from './types';
import { ExploreContentItem } from '@/components/explore/types';
import { ActivityGridItem } from '@/components/profile/ActivityGrid';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { resolveGolfCourse } from '@/utils/resolveGolfCourse';
import { generateStreamHlsUrl, generateStreamThumbnailUrl, generateStreamMp4Url } from '@/config/cloudflareStream';

// Import ActivityPost type inline to avoid circular dependencies
interface ActivityPostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  filter_id?: string | null;
  studio_edits?: any | null;
  aspect_ratio?: number | null;
  poster_url?: string | null;
  duration_seconds?: number | null;
}

interface ActivityPostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface ActivityPost {
  id: string;
  type: 'post' | 'share' | 'comment';
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
  created_at: string;
  course_id?: string | null;
  post_media: ActivityPostMedia[];
  post_tags: ActivityPostTag[];
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
}

/**
 * Determine orientation from aspect ratio
 */
function getOrientation(aspectRatio?: number): 'portrait' | 'landscape' | 'square' {
  if (!aspectRatio) return 'portrait'; // default
  if (aspectRatio >= AR_LANDSCAPE_THRESHOLD) return 'landscape';
  if (aspectRatio <= AR_PORTRAIT_THRESHOLD) return 'portrait';
  return 'square';
}

/**
 * Generate HLS URL from media source
 */
function getHlsUrl(src: string): string | undefined {
  const uid = uidFromNode({ src });
  return uid ? generateStreamHlsUrl(uid) : undefined;
}

/**
 * AUDIT FIX #2: Generate MP4 fallback URL from media source
 */
function getMp4FallbackUrl(src: string): string | undefined {
  const uid = uidFromNode({ src });
  return uid ? generateStreamMp4Url(uid) : undefined;
}

/**
 * Generate thumbnail URL from media source
 */
function getThumbnailUrl(src: string, explicitThumbnail?: string): string {
  if (explicitThumbnail) return explicitThumbnail;
  const uid = uidFromNode({ src });
  return uid 
    ? generateStreamThumbnailUrl(uid, { height: 600 })
    : src;
}

/**
 * Convert ExploreContentItem to UniversalMediaItem
 */
export function exploreItemToUniversal(item: ExploreContentItem, index: number): UniversalMediaItem {
  const mediaUrl = item.media?.[0]?.media_url || item.src;
  const aspectRatio = item.aspectRatio || (item.width && item.height ? item.width / item.height : undefined);
  const orientation = getOrientation(aspectRatio);
  
  return {
    id: item.id,
    postId: item.id,
    type: item.type === 'video' ? 'video' : 'image',
    
    // Media URLs
    url: mediaUrl,
    thumbnailUrl: getThumbnailUrl(mediaUrl, item.thumbnailSrc),
    playbackUrl: item.type === 'video' ? getHlsUrl(mediaUrl) : undefined,
    mp4FallbackUrl: item.type === 'video' ? getMp4FallbackUrl(mediaUrl) : undefined,
    
    // Dimensions
    mediaWidth: item.width,
    mediaHeight: item.height,
    aspectRatio,
    
    // Duration
    durationSeconds: item.durationSeconds,
    
    // Creator
    creator: item.user ? {
      id: item.user.id,
      name: item.user.name,
      username: item.user.username,
      avatar: item.user.avatar,
      verified: item.user.verified,
    } : undefined,
    
    // Engagement
    likes: item.likes,
    commentCount: item.comments,
    
    // Golf-specific
    golfCourseId: item.golfCourse?.id,
    courseName: item.golfCourse?.name,
    
    // Content flags
    isFeatured: item.isFeatured,
    
    // Multi-media
    additionalMediaCount: item.media && item.media.length > 1 ? item.media.length - 1 : undefined,
    
    // Computed
    sortIndex: index,
    orientation,
    tileVariant: orientation === 'landscape' ? 'landscape' : 'portrait',
  };
}

/**
 * Convert array of ExploreContentItem to UniversalMediaItem[]
 */
export function exploreItemsToUniversal(items: ExploreContentItem[]): UniversalMediaItem[] {
  return items
    .filter(item => item.type !== 'cta') // Filter out CTAs
    .map((item, index) => exploreItemToUniversal(item, index));
}

/**
 * Convert ActivityGridItem to UniversalMediaItem
 */
export function activityItemToUniversal(
  item: ActivityGridItem & { _stackCount?: number; _stackName?: string }, 
  index: number
): UniversalMediaItem {
  return {
    id: item.id,
    postId: item.roundId || item.id,
    type: item.type,
    
    // Media URLs
    url: item.thumbnailUrl,
    thumbnailUrl: item.thumbnailUrl,
    playbackUrl: item.previewUrl,
    mp4FallbackUrl: item.type === 'video' ? getMp4FallbackUrl(item.thumbnailUrl) : undefined,
    
    // Computed
    sortIndex: index,
    orientation: item.layoutHint === 'wide' ? 'landscape' : item.layoutHint === 'tall' ? 'portrait' : 'square',
    tileVariant: 'portrait',
    
    // Stack info for grouped rounds (pass through as custom data)
    additionalMediaCount: item._stackCount ? item._stackCount - 1 : undefined,
    courseName: item._stackName || item.courseName,
  };
}

/**
 * Convert array of ActivityGridItem to UniversalMediaItem[]
 */
export function activityItemsToUniversal(
  items: (ActivityGridItem & { _stackCount?: number; _stackName?: string })[]
): UniversalMediaItem[] {
  return items.map((item, index) => activityItemToUniversal(item, index));
}

/**
 * Convert ActivityPost (Profile) to UniversalMediaItem
 */
export function activityPostToUniversal(post: ActivityPost, index: number): UniversalMediaItem | null {
  const media = post.post_media;
  if (!media || media.length === 0) return null;

  const primaryMedia = media[0];
  
  // Use canonical resolver
  const golfCourse = resolveGolfCourse(post);
  const isMilestone = post.content?.toLowerCase().includes('milestone') || 
    post.post_tags?.some(tag => tag.name?.toLowerCase().includes('achievement'));

  const isVideo = primaryMedia.media_type === 'video';
  const uid = isVideo ? uidFromNode({ src: primaryMedia.media_url }) : null;
  const playbackUrl = uid ? generateStreamHlsUrl(uid) : primaryMedia.media_url;
  const mp4FallbackUrl = uid ? generateStreamMp4Url(uid) : undefined;
  
  const thumbnailUrl = isVideo
    ? (primaryMedia.poster_url || getThumbnailUrl(primaryMedia.media_url))
    : primaryMedia.media_url;

  // Compute orientation from aspect ratio
  const aspectRatio = primaryMedia.aspect_ratio ?? undefined;
  const orientation = getOrientation(aspectRatio);

  return {
    id: primaryMedia.id,
    postId: post.id,
    type: primaryMedia.media_type,
    url: primaryMedia.media_url,
    thumbnailUrl,
    playbackUrl: isVideo ? playbackUrl : undefined,
    mp4FallbackUrl: isVideo ? mp4FallbackUrl : undefined,
    
    // Dimensions & orientation
    aspectRatio,
    orientation,
    
    // Display data
    durationSeconds: primaryMedia.duration_seconds,
    likes: post.likes,
    additionalMediaCount: media.length > 1 ? media.length - 1 : undefined,
    isMilestone,
    courseName: golfCourse?.name,
    golfCourseId: golfCourse?.id,
    
    // Creator info
    creator: post.user ? {
      id: post.user.id,
      name: post.user.display_name || 'Unknown',
      username: post.user.username || undefined,
      avatar: post.user.profile_photo_url || undefined,
    } : undefined,
    
    sortIndex: index,
    tileVariant: 'portrait',
  };
}

/**
 * Batch convert ActivityPost array
 */
export function activityPostsToUniversal(posts: ActivityPost[]): UniversalMediaItem[] {
  return posts
    .map((post, index) => activityPostToUniversal(post, index))
    .filter((item): item is UniversalMediaItem => item !== null);
}
