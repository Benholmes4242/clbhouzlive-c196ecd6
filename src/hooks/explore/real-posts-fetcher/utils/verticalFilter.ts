import { FEATURE_FLAGS, VERTICAL_MIN_AR, VERTICAL_MAX_AR } from '@/config/featureFlags';
import type { RawPostData, RawMediaData, VerticalFilterResult } from '../types';
import { CLUBHOUSE_MAX_DURATION } from '../constants';

/**
 * Get the primary video media from a post
 * Uses display_order, then created_at for sorting
 */
export function getPrimaryVideoMedia(post: RawPostData): RawMediaData | null {
  const mediaArray = post.post_media;
  if (!Array.isArray(mediaArray) || mediaArray.length === 0) return null;
  
  // Sort by display_order (nulls last), then created_at ascending
  const sorted = [...mediaArray].sort((a, b) => {
    const orderA = a.display_order ?? 999;
    const orderB = b.display_order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });
  
  // Return first video found
  return sorted.find(m => m.media_type === 'video') || null;
}

/**
 * Check if a post passes vertical-only criteria
 * Returns meta_pending for posts with valid duration but missing AR (allowed through)
 * Review posts bypass video-only requirement
 */
export function passesVerticalFilter(post: RawPostData): VerticalFilterResult {
  // Check if this is a review post - allow image-only review posts into Clubhouse
  const isReviewPost = !!post.source_review_id;
  
  if (isReviewPost) {
    // Review posts are allowed regardless of media type
    const hasPostMedia = post.post_media && post.post_media.length > 0;
    
    if (!hasPostMedia) {
      // Allow review posts with source_review_id through even without media
      if (post.source_review_id) {
        return { passes: true, reason: 'review_post_with_source' };
      }
      return { passes: false, reason: 'no_media' };
    }
    return { passes: true, reason: 'review_post' };
  }
  
  // Non-review posts: apply standard video-only criteria
  const primaryMedia = getPrimaryVideoMedia(post);
  
  if (!primaryMedia) {
    return { passes: false, reason: 'no_media' };
  }
  if (primaryMedia.media_type !== 'video') {
    return { passes: false, reason: 'not_video' };
  }
  
  // Duration check: must have duration and be under threshold
  if (typeof primaryMedia.duration_seconds !== 'number') {
    return { passes: false, reason: 'duration_missing' };
  }
  if (primaryMedia.duration_seconds >= CLUBHOUSE_MAX_DURATION) {
    return { passes: false, reason: 'duration_ge_120' };
  }
  
  // Vertical-only check (when enabled)
  if (FEATURE_FLAGS.CLUBHOUSE_VERTICAL_ONLY) {
    let { width, height, aspect_ratio } = primaryMedia;
    
    // Compute AR from width/height if aspect_ratio is null
    if (aspect_ratio == null && width != null && height != null && height > 0) {
      aspect_ratio = width / height;
    }
    
    // If AR still missing, allow through as "meta_pending" - playback still works
    if (aspect_ratio == null) {
      return { passes: true, reason: 'meta_pending' };
    }
    
    // Must be within vertical band
    if (aspect_ratio < VERTICAL_MIN_AR || aspect_ratio > VERTICAL_MAX_AR) {
      return { passes: false, reason: 'ar_outside_band' };
    }
  }
  
  return { passes: true };
}

/**
 * Check if media passes vertical-only criteria for Friends feed
 */
export function passesVerticalMediaFilter(
  primaryMedia: RawMediaData,
  isVerticalOnly: boolean
): boolean {
  if (!isVerticalOnly) return true;
  if (primaryMedia.media_type !== 'video') return true;
  
  const { width, height, aspect_ratio } = primaryMedia;
  
  // Must have metadata
  if (width == null || height == null || aspect_ratio == null) {
    return false;
  }
  
  // Must be within vertical band
  return aspect_ratio >= VERTICAL_MIN_AR && aspect_ratio <= VERTICAL_MAX_AR;
}
