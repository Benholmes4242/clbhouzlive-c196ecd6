// Post creation limits and constants
// Single source of truth for all post-related limits

export const POST_LIMITS = {
  /** Maximum number of media items per post */
  MAX_MEDIA_COUNT: 10,
  /** Maximum caption length in characters */
  MAX_CAPTION_LENGTH: 2200,
  /** Maximum video file size in bytes (500MB) */
  MAX_VIDEO_SIZE_BYTES: 500 * 1024 * 1024,
  /** Maximum image file size in bytes (20MB) */
  MAX_IMAGE_SIZE_BYTES: 20 * 1024 * 1024,
  /** Auto-save interval in milliseconds (30 seconds) */
  AUTO_SAVE_INTERVAL_MS: 30000,
  /** Maximum number of categories per post */
  MAX_CATEGORIES: 5,
  /** Maximum number of badges per post */
  MAX_BADGES: 10,
  /** Maximum number of tags per post */
  MAX_TAGS: 20,
} as const;

/** Allowed video MIME types */
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

/**
 * Validate a file against post limits
 * @returns Object with valid boolean and optional error message
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const isVideo = file.type.startsWith('video/');
  const maxSize = isVideo ? POST_LIMITS.MAX_VIDEO_SIZE_BYTES : POST_LIMITS.MAX_IMAGE_SIZE_BYTES;
  
  // Check file size
  if (file.size > maxSize) {
    const sizeMB = Math.round(file.size / 1024 / 1024);
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return { 
      valid: false, 
      error: `File too large (${sizeMB}MB). Maximum is ${maxMB}MB.` 
    };
  }
  
  // Check format
  const allowedTypes: readonly string[] = isVideo 
    ? ALLOWED_VIDEO_TYPES 
    : ALLOWED_IMAGE_TYPES;
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Unsupported format: ${file.type}` 
    };
  }
  
  return { valid: true };
}
