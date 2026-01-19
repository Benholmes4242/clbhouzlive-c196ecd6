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

// Legacy exports (will be removed after migration)
export { default as HLSPlayer } from './HLSPlayer';
export type { HLSPlayerProps, HLSPlayerRef } from './HLSPlayer';

export { default as MediaTile } from './MediaTile';
export type { MediaTileProps } from './MediaTile';

export { default as MediaFullscreenViewer } from './MediaFullscreenViewer';
export type { MediaFullscreenViewerProps, MediaFullscreenItem } from './MediaFullscreenViewer';

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

// Performance Audit (available in browser console as window.mediaAudit)
import '@/utils/performanceAudit';
