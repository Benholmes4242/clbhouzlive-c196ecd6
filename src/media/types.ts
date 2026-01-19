/**
 * Media System Types
 * Unified type definitions for all media components
 */

import { ASPECT_RATIO_STRING, VIDEO_QUALITY } from './constants';

// ============================================
// CORE TYPES
// ============================================

/** Media content type */
export type MediaType = 'video' | 'image';

/** Aspect ratio preset or 'auto' for natural dimensions */
export type AspectRatio =
  | typeof ASPECT_RATIO_STRING[keyof typeof ASPECT_RATIO_STRING]
  | 'auto';

/** Video quality setting */
export type VideoQuality = 'auto' | keyof typeof VIDEO_QUALITY;

// ============================================
// SOURCE TYPES
// ============================================

/**
 * Unified media source object
 * Contains all possible URL variants for a media item
 */
export interface MediaSource {
  /** Cloudflare Stream UID (for videos) */
  streamId?: string;
  /** Direct HLS manifest URL */
  hlsUrl?: string;
  /** MP4 fallback URL */
  mp4Url?: string;
  /** Image URL (for images or video poster) */
  imageUrl?: string;
  /** Poster/thumbnail URL for videos */
  posterUrl?: string;
}

/**
 * Parse a media source from various input formats
 */
export interface MediaSourceInput {
  /** Raw URL (will be parsed to determine type) */
  url?: string;
  /** Explicit stream ID */
  streamId?: string;
  /** Explicit media type override */
  type?: MediaType;
}

// ============================================
// PLAYBACK STATE
// ============================================

/** Current playback state of a video */
export type PlaybackState =
  | 'idle'      // Initial state, not loaded
  | 'loading'   // Loading/buffering
  | 'ready'     // Loaded, ready to play
  | 'playing'   // Currently playing
  | 'paused'    // Paused by user or system
  | 'ended'     // Playback completed
  | 'error';    // Error occurred

/** Loading state for images */
export type LoadingState =
  | 'idle'      // Not started
  | 'loading'   // Currently loading
  | 'loaded'    // Successfully loaded
  | 'error';    // Failed to load

// ============================================
// MEDIA RUNTIME TYPES
// ============================================

/** Surface type for priority management */
export type MediaSurfaceType =
  | 'clubhouse'    // Main feed (highest priority)
  | 'fullscreen'   // Fullscreen viewer
  | 'hero'         // Hero/featured sections
  | 'grid';        // Thumbnail grids

/** Playback reason */
export type PlaybackReason =
  | 'autoplay'   // Automatic (scroll into view)
  | 'user'       // User initiated
  | 'resume';    // Resuming after interruption

/** Error classification */
export type MediaErrorType =
  | 'network'     // Network failure
  | 'decode'      // Decode/format error
  | 'hls'         // HLS-specific error
  | 'permission'  // Autoplay blocked
  | 'unknown';    // Unclassified error

/** Media error object */
export interface MediaError {
  type: MediaErrorType;
  message: string;
  recoverable: boolean;
  originalError?: Error;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

/** Controls configuration for video player */
export interface VideoControlsConfig {
  /** Show play/pause button */
  playPause?: boolean;
  /** Show mute/volume button */
  volume?: boolean;
  /** Show progress scrubber */
  scrubber?: boolean;
  /** Show fullscreen button */
  fullscreen?: boolean;
  /** Show quality selector */
  quality?: boolean;
  /** Show time display */
  time?: boolean;
  /** Auto-hide controls after delay (ms), 0 to disable */
  autoHide?: number;
}

/** Default controls configuration */
export const DEFAULT_CONTROLS_CONFIG: VideoControlsConfig = {
  playPause: true,
  volume: true,
  scrubber: true,
  fullscreen: false,
  quality: false,
  time: true,
  autoHide: 3000,
};

// ============================================
// THUMBNAIL TYPES
// ============================================

/** Thumbnail size preset */
export type ThumbnailSize = 'small' | 'medium' | 'large' | 'xlarge';

/** Thumbnail options */
export interface ThumbnailOptions {
  /** Size preset */
  size?: ThumbnailSize;
  /** Time offset in seconds (for video thumbnails) */
  time?: number;
  /** Fit mode */
  fit?: 'contain' | 'cover' | 'crop';
}

// ============================================
// UPLOAD TYPES
// ============================================

/** Upload status */
export type UploadStatus =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error';

/** Upload progress info */
export interface UploadProgress {
  /** Bytes uploaded */
  loaded: number;
  /** Total bytes */
  total: number;
  /** Percentage complete (0-100) */
  percent: number;
  /** Current status */
  status: UploadStatus;
  /** Status message */
  message?: string;
}

/** Upload result */
export interface UploadResult {
  /** Success flag */
  success: boolean;
  /** Resulting media source */
  source?: MediaSource;
  /** Error if failed */
  error?: MediaError;
}

// ============================================
// FULLSCREEN TYPES
// ============================================

/** Entry context for fullscreen viewer */
export type FullscreenContext =
  | 'discover'
  | 'watch'
  | 'profile'
  | 'search'
  | 'notification'
  | 'direct';

/** Fullscreen viewer state */
export interface FullscreenState {
  /** Whether viewer is open */
  isOpen: boolean;
  /** Current media ID */
  currentMediaId?: string;
  /** Entry context */
  context?: FullscreenContext;
  /** Index in media list */
  currentIndex?: number;
  /** Total items in list */
  totalItems?: number;
}

// ============================================
// EVENT CALLBACK TYPES
// ============================================

/** Video event callbacks */
export interface VideoEventCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: MediaError) => void;
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onCanPlay?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onStateChange?: (state: PlaybackState) => void;
  onQualityChange?: (quality: number) => void;
}

/** Image event callbacks */
export interface ImageEventCallbacks {
  onLoad?: () => void;
  onError?: (error: MediaError) => void;
  onLoadStart?: () => void;
}
