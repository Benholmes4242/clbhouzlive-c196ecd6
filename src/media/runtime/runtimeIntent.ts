/**
 * Runtime Intent Helpers
 * 
 * Convenience functions for common user intent patterns.
 * Use these to ensure user actions always win over autoplay.
 */

import { MediaRuntime } from './MediaRuntime';
import { MEDIA_RUNTIME_V2 } from '@/config/featureFlags';

/**
 * Call when user taps a tile to open fullscreen.
 * Establishes user intent priority before navigation.
 */
export function runtimeUserTap(id: string): void {
  if (!MEDIA_RUNTIME_V2) return;
  
  MediaRuntime.trackIntent('tap');
  // Make this the winner immediately; grid autoplay must not compete.
  MediaRuntime.requestPlay({ id, surface: 'fullscreen', reason: 'user' });
}

/**
 * Call when user toggles mute.
 */
export function runtimeUserMute(): void {
  if (!MEDIA_RUNTIME_V2) return;
  
  MediaRuntime.trackIntent('mute');
}

/**
 * Call when user manually pauses playback.
 */
export function runtimeUserPause(id: string): void {
  if (!MEDIA_RUNTIME_V2) return;
  
  MediaRuntime.trackIntent('pause');
  MediaRuntime.requestPause({ id, reason: 'user' });
}

/**
 * Call when user scrubs/seeks.
 */
export function runtimeUserScrub(): void {
  if (!MEDIA_RUNTIME_V2) return;
  
  MediaRuntime.trackIntent('scrub');
}

/**
 * Call when fullscreen modal opens/closes.
 */
export function runtimeSetModalOpen(isOpen: boolean): void {
  if (!MEDIA_RUNTIME_V2) return;
  
  MediaRuntime.setUIState({ isModalOpen: isOpen });
}

/**
 * Call when fullscreen closes to ensure no ghost audio.
 */
export function runtimeClearOnFullscreenClose(): void {
  if (!MEDIA_RUNTIME_V2) return;
  
  MediaRuntime.pauseAll();
  MediaRuntime.setUIState({ isModalOpen: false });
}
