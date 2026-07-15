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
  /** Maximum video duration in seconds (2 hours) */
  MAX_VIDEO_DURATION_SECONDS: 7200,
  MAX_VIDEO_DURATION_DISPLAY: '2 hours',
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

// NOTE: The previous `validateMediaFile` (singular) helper was removed — it
// had zero call sites and gave a false sense of protection. The live
// client-side guard for the post-v2 upload path lives in
// `src/features/post-v2/hooks/useStageComposer.ts` (see `addFiles`). The
// messaging path uses `validateMediaFiles` in `src/utils/media/pickMediaFiles.ts`.

