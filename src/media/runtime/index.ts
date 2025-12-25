/**
 * MediaRuntime Module Exports
 * 
 * ==================================================================================
 * CRITICAL ARCHITECTURE NOTE: First-Video Autoplay on Clubhouse
 * ==================================================================================
 * The first video on Clubhouse MUST autoplay immediately when users land on the page.
 * 
 * This is achieved via TWO coordinated mechanisms:
 * 
 * 1. useVerticalFeedLogic.ts - Bootstrap protection
 *    - Sets autoplayMap[firstPostId]=true synchronously in useLayoutEffect
 *    - Protects first video from IntersectionObserver false-negatives for 2.5s
 *    - Uses bootstrapFirstAutoplayRef to force autoplay=true until user scrolls
 *    - Observers use scroll container as root (not null) to avoid WebView issues
 * 
 * 2. HLSPlayer.tsx - Autoplay retry
 *    - If autoplay effect fires before HLS source is loaded, video stays paused
 *    - Schedules one-shot retry on loadedmetadata/canplay events
 *    - Uses pendingAutoplayRetryRef to prevent duplicate retries
 * 
 * 3. ClubhouseVerticalGrid.tsx - First-card overrides
 *    - Forces eagerMount=true, shouldAttach=true, autoplay=true for index=0
 *    - Bypasses map lookups entirely for the first card on initial render
 * 
 * DO NOT MODIFY these patterns without thorough testing on:
 * - Fresh page load to /clubhouse
 * - Hard refresh on /clubhouse
 * - Navigation to /clubhouse from other pages
 * - iOS WebView (Capacitor)
 * - Android WebView (Capacitor)
 * ==================================================================================
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

// Clubhouse bridge hook
export { useClubhouseRuntimeBridge } from '@/hooks/useClubhouseRuntimeBridge';
