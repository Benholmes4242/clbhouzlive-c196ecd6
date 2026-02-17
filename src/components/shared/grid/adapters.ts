// Adapters to convert data from existing types to UnifiedMediaItem

import { ExploreContentItem } from '@/components/explore/types';
import { ActivityPost } from '@/components/profile/types/ActivityTypes';
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
  
  // Build course location string for review overlay - format: Country, Region
  let courseLocation: string | undefined;
  if (item.golfCourse) {
    const country = item.golfCourse.country || '';
    const region = item.golfCourse.region || item.golfCourse.sub_country || '';
    if (country && region && country !== region) {
      courseLocation = `${country}, ${region}`;
    } else {
      courseLocation = country || region || undefined;
    }
  }
  
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
    
    // Studio edits (text overlays, etc.)
    studioEdits: item.media?.[0]?.studio_edits,
    
    // Filter ID
    filterId: item.media?.[0]?.filter_id ?? (item.media?.[0]?.studio_edits as any)?.filter ?? null,
    
    // Review post data for overlay display
    isReview: item.isReview ?? false,
    reviewRating: item.reviewRating ?? undefined,
    courseLocation,
    sourceReviewId: item.sourceReviewId,
  };
}

/**
 * Convert ActivityPost (Profile) to UnifiedMediaItem
 */
export function activityPostToUnified(post: ActivityPost, overallIndex: number): UnifiedMediaItem | null {
  const media = post.post_media;
  if (!media || media.length === 0) return null;

  const primaryMedia = media[0];
  
  // Use canonical resolver for golf course
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

  // Compute orientation from aspect ratio - prefer stored, fallback to computed from dimensions
  let aspectRatio = primaryMedia.aspect_ratio ?? undefined;
  if (!aspectRatio && (primaryMedia as any).width && (primaryMedia as any).height) {
    const w = (primaryMedia as any).width as number;
    const h = (primaryMedia as any).height as number;
    if (h > 0) {
      aspectRatio = w / h;
    }
  }
  const orientation = classifyOrientation(aspectRatio);

  // Build course location string for review overlay - format: Country, Region
  let courseLocation: string | undefined;
  const courseData = post.course || golfCourse;
  if (courseData) {
    const country = courseData.country || '';
    const region = courseData.region || courseData.sub_country || '';
    if (country && region && country !== region) {
      courseLocation = `${country}, ${region}`;
    } else {
      courseLocation = country || region || undefined;
    }
  }

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
    courseName: golfCourse?.name || post.course?.name || '',
    
    // Creator info
    creator: post.user ? {
      id: post.user.id,
      name: post.user.display_name || 'Unknown',
      username: post.user.username || undefined,
      avatar: post.user.profile_photo_url || undefined,
    } : undefined,
    
    sortIndex: overallIndex,
    
    // Autoplay: all videos are candidates for autoplay
    isAutoplayCandidate: isVideo,
    
    // Studio edits (text overlays, etc.)
    studioEdits: (primaryMedia as any).studio_edits,
    
    // Filter ID
    filterId: primaryMedia.filter_id ?? (primaryMedia.studio_edits as any)?.filter ?? null,
    
    // Achievement badges
    badges: post.badges,
    
    // Achievement post flag
    achievementId: post.achievement_id ?? null,
    
    // Review post data for overlay display
    isReview: post.isReview ?? false,
    reviewRating: post.rating,
    courseLocation,
    sourceReviewId: post.source_review_id,
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
