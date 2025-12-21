/**
 * Media System - Unified exports
 * 
 * Import all media components and hooks from this single entry point:
 * 
 * import { MediaSystemProvider, HLSPlayer, MediaTile, MediaFullscreenViewer, useMediaSystem, useMediaAutoplay, MediaRuntime, useMediaRuntime } from '@/media';
 */

// Provider
export { MediaSystemProvider, useMediaSystem, useMediaSystemSafe } from './MediaSystemProvider';
export type { MediaSystemContextType, MediaRegistration, MediaKind } from './MediaSystemProvider';

// Autoplay Hook
export { useMediaAutoplay } from './useMediaAutoplay';
export type { UseMediaAutoplayOptions, RegisterMediaFn, MediaAutoplayRegistration } from './useMediaAutoplay';

// Runtime (new global playback authority)
export { MediaRuntime, useMediaRuntime } from './runtime';
export type {
  MediaSurface,
  PlaybackReason,
  ErrorType,
  MediaNode,
  UIState,
  RuntimeTelemetry,
} from './runtime';

// Components
export { default as HLSPlayer } from './HLSPlayer';
export type { HLSPlayerProps, HLSPlayerRef } from './HLSPlayer';

export { default as MediaTile } from './MediaTile';
export type { MediaTileProps } from './MediaTile';

export { default as MediaFullscreenViewer } from './MediaFullscreenViewer';
export type { MediaFullscreenViewerProps, MediaFullscreenItem } from './MediaFullscreenViewer';
