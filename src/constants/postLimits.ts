// Post creation limits and constants
// Single source of truth for all post-related limits

export const POST_LIMITS = {
  /** Maximum number of media items per post */
  MAX_MEDIA_COUNT: 10,
  /** Maximum caption length in characters */
  MAX_CAPTION_LENGTH: 2200,
  /** Maximum video file size in bytes (4GB) — comfortably under CF Stream's 30GB */
  MAX_VIDEO_SIZE_BYTES: 4 * 1024 * 1024 * 1024,
  MAX_VIDEO_SIZE_DISPLAY: '4GB',
  /** Maximum image file size in bytes (50MB) — generous for RAW/HEIC */
  MAX_IMAGE_SIZE_BYTES: 50 * 1024 * 1024,
  MAX_IMAGE_SIZE_DISPLAY: '50MB',
  /** Maximum video duration in seconds (1 hour) */
  MAX_VIDEO_DURATION_SECONDS: 3600,
  MAX_VIDEO_DURATION_DISPLAY: '1 hour',
  /** Auto-save interval in milliseconds (30 seconds) */
  AUTO_SAVE_INTERVAL_MS: 30000,
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
  'image/heif',
  'image/gif',
] as const;

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format duration to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  return `${(seconds / 3600).toFixed(1)} hours`;
}

/**
 * Validate a file against post limits
 * @param file - The file to validate
 * @param videoDuration - Optional video duration in seconds (for video files)
 * @returns Object with valid boolean and optional error message
 */
export function validateMediaFile(
  file: File, 
  videoDuration?: number
): { valid: boolean; error?: string } {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  
  // Check file type
  if (isVideo) {
    const allowedTypes: readonly string[] = ALLOWED_VIDEO_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Unsupported video format. Use MP4, MOV, or WebM.` 
      };
    }
    
    if (file.size > POST_LIMITS.MAX_VIDEO_SIZE_BYTES) {
      const sizeMB = formatBytes(file.size);
      return { 
        valid: false, 
        error: `Video too large (${sizeMB}). Maximum is ${POST_LIMITS.MAX_VIDEO_SIZE_DISPLAY}.` 
      };
    }
    
    if (videoDuration && videoDuration > POST_LIMITS.MAX_VIDEO_DURATION_SECONDS) {
      const durationStr = formatDuration(videoDuration);
      return { 
        valid: false, 
        error: `Video too long (${durationStr}). Maximum is ${POST_LIMITS.MAX_VIDEO_DURATION_DISPLAY}.` 
      };
    }
  } else if (isImage) {
    const allowedTypes: readonly string[] = ALLOWED_IMAGE_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Unsupported image format. Use JPEG, PNG, WebP, HEIC, or GIF.` 
      };
    }
    
    if (file.size > POST_LIMITS.MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = formatBytes(file.size);
      return { 
        valid: false, 
        error: `Image too large (${sizeMB}). Maximum is ${POST_LIMITS.MAX_IMAGE_SIZE_DISPLAY}.` 
      };
    }
  } else {
    return { 
      valid: false, 
      error: `Unsupported file type: ${file.type || 'unknown'}` 
    };
  }
  
  return { valid: true };
}
