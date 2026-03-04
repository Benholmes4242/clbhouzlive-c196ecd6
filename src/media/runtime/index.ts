/**
 * MediaRuntime Module Exports
 */

export { MediaRuntime, useMediaRuntime } from './MediaRuntime';
export type {
  MediaSurface,
  PlaybackReason,
  ErrorType,
  MediaNode,
  UIState,
  UserIntent,
  RuntimeState,
  RuntimeTelemetry,
} from './MediaRuntime';

// Intent helpers
export {
  runtimeUserTap,
  runtimeUserMute,
  runtimeUserPause,
  runtimeUserScrub,
  runtimeSetModalOpen,
  runtimeClearOnFullscreenClose,
} from './runtimeIntent';
