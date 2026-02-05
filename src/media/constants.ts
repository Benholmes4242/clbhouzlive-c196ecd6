/**
 * Media System Constants
 * Single source of truth for all media-related configuration
 */

// ============================================
// ASPECT RATIOS
// ============================================

/** Standard aspect ratio values as decimals */
export const ASPECT_RATIO = {
  /** Portrait video (3:4) - Instagram style */
  PORTRAIT: 3 / 4,         // 0.75
  /** Square (1:1) */
  SQUARE: 1,               // 1.0
  /** Standard landscape (16:9) */
  LANDSCAPE: 16 / 9,       // 1.777...
  /** Vertical/Shorts (9:16) */
  SHORTS: 9 / 16,          // 0.5625
  /** Wide cinematic (21:9) */
  CINEMATIC: 21 / 9,       // 2.333...
  /** Classic video (4:3) */
  CLASSIC: 4 / 3,          // 1.333...
} as const;

/** Aspect ratio as string for CSS/display */
export const ASPECT_RATIO_STRING = {
  PORTRAIT: '3:4',
  SQUARE: '1:1',
  LANDSCAPE: '16:9',
  SHORTS: '9:16',
  CINEMATIC: '21:9',
  CLASSIC: '4:3',
} as const;

// ============================================
// THUMBNAIL SIZES
// ============================================

/** Thumbnail size presets in pixels */
export const THUMBNAIL_SIZE = {
  /** Small thumbnails for lists/grids */
  SMALL: 150,
  /** Medium thumbnails for cards */
  MEDIUM: 300,
  /** Large thumbnails for featured/hero */
  LARGE: 600,
  /** Extra large for fullscreen previews */
  XLARGE: 1200,
} as const;

/** Default thumbnail time offset in seconds */
export const THUMBNAIL_DEFAULT_TIME = 1;

// ============================================
// VIDEO QUALITY
// ============================================

/** Video quality levels */
export const VIDEO_QUALITY = {
  LOW: 360,
  MEDIUM: 720,
  HIGH: 1080,
  UHD: 2160,
} as const;

/** Quality level labels for UI */
export const VIDEO_QUALITY_LABELS: Record<number, string> = {
  360: 'SD',
  720: 'HD',
  1080: 'FHD',
  2160: '4K',
};

// ============================================
// PLAYBACK CONFIGURATION
// ============================================

/** Intersection observer threshold for autoplay trigger */
export const AUTOPLAY_THRESHOLD = 0.5;

/** Minimum visible ratio to keep video playing */
export const MIN_VISIBLE_RATIO = 0.3;

/** Number of videos to prefetch ahead */
export const PREFETCH_COUNT = 3;

/** Time in ms to wait before autoplay after scroll stops */
export const AUTOPLAY_SCROLL_DEBOUNCE = 150;

/** Time in ms to wait after tab becomes visible before resuming */
export const TAB_VISIBLE_RESUME_DELAY = 100;

// ============================================
// MEDIA RUNTIME LIMITS
// ============================================

/** Maximum videos that can be registered with MediaRuntime */
export const MAX_REGISTERED_MEDIA = 10;

/** Maximum concurrent playing videos */
export const MAX_CONCURRENT_VIDEOS = 1;

/** Maximum videos to keep refs for in memory */
export const MAX_VIDEO_REFS = 20;

/** Distance (in items) before cleanup triggers */
export const CLEANUP_DISTANCE = 10;

// ============================================
// UPLOAD CONFIGURATION
// ============================================

/** Maximum file sizes in bytes */
export const MAX_FILE_SIZE = {
  /** Image max size: 50MB */
  IMAGE: 50 * 1024 * 1024,
  /** Video max size: 500MB */
  VIDEO: 500 * 1024 * 1024,
} as const;

/** Chunk size for chunked uploads (5MB) */
export const UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024;

/** Maximum retry attempts for failed uploads */
export const UPLOAD_MAX_RETRIES = 3;

/** Delay between retry attempts in ms */
export const UPLOAD_RETRY_DELAY = 1000;

/** Supported image MIME types */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
] as const;

/** Supported video MIME types */
export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
] as const;

// ============================================
// CLOUDFLARE CONFIGURATION
// ============================================

/** Cloudflare Stream customer subdomain */
export const CLOUDFLARE_STREAM_SUBDOMAIN = 'customer-4ah4gni80ytefpck.cloudflarestream.com';

/** Cloudflare Stream URL patterns */
export const CLOUDFLARE_STREAM_PATTERNS = {
  /** HLS manifest URL */
  HLS: (uid: string) => 
    `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${uid}/manifest/video.m3u8`,
  /** Thumbnail URL - no time param to avoid 400s on processing videos */
  THUMBNAIL: (uid: string) => 
    `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${uid}/thumbnails/thumbnail.jpg?fit=crop`,
  /** MP4 download URL */
  MP4: (uid: string) => 
    `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${uid}/downloads/default.mp4`,
  /** Embed URL */
  EMBED: (uid: string) => 
    `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${uid}/iframe`,
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================

/** Animation durations in milliseconds */
export const ANIMATION_DURATION = {
  /** Fast micro-interactions */
  FAST: 150,
  /** Normal transitions */
  NORMAL: 300,
  /** Slow/emphasized transitions */
  SLOW: 500,
  /** Page transitions */
  PAGE: 400,
} as const;

// ============================================
// Z-INDEX LAYERS
// ============================================

/** Z-index values for media components */
export const Z_INDEX = {
  /** Video controls overlay */
  CONTROLS: 10,
  /** Loading spinner */
  LOADING: 20,
  /** Fullscreen viewer */
  FULLSCREEN: 100,
  /** Fullscreen controls */
  FULLSCREEN_CONTROLS: 110,
  /** Comments overlay */
  COMMENTS: 120,
} as const;
