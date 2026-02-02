/**
 * Media System - Unified exports
 * 
 * Import all media components and hooks from this single entry point:
 * 
 * import { MediaSystemProvider, HLSPlayer, MediaTile, MediaFullscreenViewer, useMediaSystem, useMediaAutoplay, MediaRuntime, useMediaRuntime } from '@/media';
 */

// ============================================
// CONSTANTS
// ============================================
export * from './constants';

// ============================================
// TYPES
// ============================================
export * from './types';

// ============================================
// PROVIDER
// ============================================
export { MediaSystemProvider, useMediaSystem, useMediaSystemSafe } from './MediaSystemProvider';
export type { MediaSystemContextType, MediaRegistration, MediaKind } from './MediaSystemProvider';

// ============================================
// AUTOPLAY HOOK
// ============================================
export { useMediaAutoplay } from './useMediaAutoplay';
export type { UseMediaAutoplayOptions, RegisterMediaFn, MediaAutoplayRegistration } from './useMediaAutoplay';

// ============================================
// RUNTIME (global playback authority)
// ============================================
export { MediaRuntime, useMediaRuntime } from './runtime';
export {
  runtimeUserTap,
  runtimeUserMute,
  runtimeUserPause,
  runtimeUserScrub,
  runtimeSetModalOpen,
  runtimeClearOnFullscreenClose,
} from './runtime';
export type {
  MediaSurface,
  PlaybackReason,
  ErrorType,
  MediaNode,
  UIState,
  RuntimeTelemetry,
} from './runtime';

// ============================================
// THUMBNAIL UTILITIES
// ============================================

export {
  getThumbnailUrl,
  clearThumbnailCache,
  thumbnailPresets,
} from './utils/thumbnail';
export type { ThumbnailOptions, ThumbnailSize } from './utils/thumbnail';

// ============================================
// COMPONENTS
// ============================================

// UnifiedImage - THE image component for the entire app
export { UnifiedImage } from './components/UnifiedImage';
export type { UnifiedImageProps } from './components/UnifiedImage';
export { ImagePlaceholder } from './components/ImagePlaceholder';
export type { ImagePlaceholderProps } from './components/ImagePlaceholder';

// UnifiedVideoPlayer - THE video player for the entire app
export { UnifiedVideoPlayer } from './components/UnifiedVideoPlayer';
export type { UnifiedVideoPlayerProps, UnifiedVideoPlayerRef } from './components/UnifiedVideoPlayer';
export { VideoOverlay } from './components/VideoOverlay';
export type { VideoOverlayProps } from './components/VideoOverlay';
export { VideoControls } from './components/VideoControls';
export type { VideoControlsProps } from './components/VideoControls';

// MediaThumbnail - THE thumbnail component for the entire app
export { MediaThumbnail } from './components/MediaThumbnail';
export type { MediaThumbnailProps } from './components/MediaThumbnail';
export { ThumbnailSkeleton } from './components/ThumbnailSkeleton';
export type { ThumbnailSkeletonProps } from './components/ThumbnailSkeleton';

// ============================================
// GRID & GALLERY COMPONENTS (Phase 7)
// ============================================

// MediaGrid - Unified video/media grid component
export { MediaGrid } from './components/MediaGrid';
export type { MediaGridProps, MediaGridItem, ResponsiveColumns } from './components/MediaGrid';

// MediaGallery - Unified image gallery with lightbox
export { MediaGallery } from './components/MediaGallery';
export type { MediaGalleryProps, GalleryImage } from './components/MediaGallery';

// Lightbox - Fullscreen image viewer
export { Lightbox } from './components/Lightbox';
export type { LightboxProps, LightboxImage } from './components/Lightbox';

// Legacy exports (will be removed after migration)
export { default as HLSPlayer } from './HLSPlayer';
export type { HLSPlayerProps, HLSPlayerRef } from './HLSPlayer';

export { default as MediaTile } from './MediaTile';
export type { MediaTileProps } from './MediaTile';

export { default as MediaFullscreenViewer } from './MediaFullscreenViewer';
export type { MediaFullscreenViewerProps, MediaFullscreenItem } from './MediaFullscreenViewer';

// ============================================
// NEW FULLSCREEN VIEWER (Phase 5)
// ============================================
export { 
  FullscreenMediaViewer,
  FullscreenNavigation,
  FullscreenMediaItem,
  SingleMediaDisplay,
  MediaCarousel,
  FullscreenOverlay,
  CreatorInfo,
  ActionRail,
  CaptionDisplay,
  FullscreenControls,
  FullscreenComments,
} from './fullscreen';
export type { FullscreenMediaViewerProps } from './fullscreen';

export { 
  useFullscreenViewer, 
  useFullscreenViewerContext,
  useFullscreenViewerOptional,
  FullscreenViewerContext,
} from './hooks/useFullscreenViewer';
export type { 
  FullscreenMediaItem as FullscreenMediaItemType,
  UseFullscreenViewerOptions,
  UseFullscreenViewerReturn,
  FullscreenContext as FullscreenViewerContextType,
} from './hooks/useFullscreenViewer';

export { 
  useSwipeNavigation, 
  useVerticalSwipe, 
  useHorizontalSwipe,
} from './hooks/useSwipeNavigation';
export type { 
  SwipeNavigationOptions, 
  SwipeNavigationReturn,
} from './hooks/useSwipeNavigation';

// Fullscreen adapters
export { adaptItemsToFullscreen, createFetchMoreAdapter } from './fullscreenAdapters';

// ============================================
// UPLOAD HOOK (Phase 6)
// ============================================
export { useMediaUpload } from './hooks/useMediaUpload';
export type { 
  UseMediaUploadReturn,
  UploadMediaStatus,
  MediaUploadProgress,
  MediaUploadResult,
  MediaUploadError,
  MediaUploadOptions,
  R2BucketType,
} from './hooks/useMediaUpload';

// ============================================
// DEBUG
// ============================================
export {
  DEBUG_MEDIA,
  DEBUG_HLS_PLAYER,
  DEBUG_MEDIA_RUNTIME,
  DEBUG_SAFE_PLAY,
  FORCE_HLS_JS
} from './debug';

// Performance Audit - lazy loaded to avoid blocking tree-shaking
// Access via window.mediaAudit after calling initMediaAudit()
export const initMediaAudit = async () => {
  await import('@/utils/performanceAudit');
};
