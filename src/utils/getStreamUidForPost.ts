/**
 * getStreamUidForPost - Extract stream UID from a post's media
 * 
 * Used everywhere for consistent cache key generation.
 * Returns stream UID for video posts, or post ID for images.
 */

import { uidFromNode } from '@/utils/cloudflareStreamTransform';

export interface PostWithMedia {
  id: string;
  post_media?: { media_url?: string; media_type?: string }[];
  media?: { media_url?: string; media_type?: string }[];
  mediaUrl?: string;
  src?: string;
}

/**
 * Extract the stream UID for cache consistency
 * @param post - Post object with media array or direct URL
 * @returns Stream UID for videos, or post ID as fallback
 */
export function getStreamUidForPost(post: PostWithMedia): string {
  // Try post_media array first (most common)
  const mediaUrl = 
    post.post_media?.[0]?.media_url ||
    post.media?.[0]?.media_url ||
    post.mediaUrl ||
    post.src;
  
  if (mediaUrl) {
    const uid = uidFromNode({ src: mediaUrl });
    if (uid) return uid;
  }
  
  return post.id;
}

/**
 * Check if post has video media
 */
export function isVideoPost(post: PostWithMedia): boolean {
  const mediaType = 
    post.post_media?.[0]?.media_type ||
    post.media?.[0]?.media_type;
  
  return mediaType === 'video';
}
