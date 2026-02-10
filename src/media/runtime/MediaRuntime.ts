/**
 * MediaRuntime - Global Playback Authority
 * 
 * Single source of truth for all media playback decisions.
 * This is the ONLY place in the app allowed to actually play or pause media.
 * 
 * Rules (non-negotiable):
 * - reason: 'user' always wins over autoplay
 * - Fullscreen playback wins over grid playback
 * - Autoplay never steals playback from a user-initiated action
 * - Multiple videos CAN autoplay concurrently when visible in viewport
 */

import { safePlay } from '@/utils/safePlay';
import { DEBUG_MEDIA_RUNTIME, DEBUG_MEDIA_TELEMETRY } from '@/media/debug';
import { BlobUrlManager } from '@/hooks/useBlobUrlManager';
import { MOBILE_VIDEO_DEBUG, logRuntimeRequestPlay, logRuntimePlayResult, logGestureRetryQueued, logGestureRetryFired, logGestureRetrySkipped } from '@/media/mobileVideoDebug';

// ============ Types ============

export type MediaSurface = 'grid' | 'fullscreen' | 'clubhouse' | 'hero' | 'videos' | 'watch' | 'watch-shorts' | 'profile' | 'explore-grid' | 'friends-feed' | 'miniplayer' | 'highlights' | 'course-highlights';
export type PlaybackReason = 'autoplay' | 'user' | 'resume';
export type ErrorType = 'transient' | 'hls_fatal' | 'decode_unsupported';

export interface MediaNode {
  id: string;
  videoElement: HTMLVideoElement;
  observeTarget: HTMLElement; // Sentinel element for intersection
  surface: MediaSurface;
  sortIndex: number;
  
  // Runtime metadata
  visibilityRatio: number;
  isVisible: boolean;
  errorState: ErrorType | null;
  retryCount: number;
  lastError?: Error;
  
  // Generation token: incremented each time play is attempted, prevents stale callbacks
  playGeneration: number;
}

export interface UIState {
  isScrolling: boolean;
  isPanning: boolean;
  isPanelOpen: boolean;
  isModalOpen: boolean;
}

export interface UserIntent {
  lastTap: number;
  lastScrub: number;
  lastManualPause: number;
  lastMuteToggle: number;
}

export interface RuntimeState {
  // Multiple videos can be actively playing (for concurrent autoplay)
  activeMediaIds: Set<string>;
  // Primary active = most recent user-initiated or first in sort order
  primaryActiveId: string | null;
  activeSurface: MediaSurface | null;
  activeReason: PlaybackReason | null;
}

export interface RuntimeTelemetry {
  autoplayStart: (id: string, surface: MediaSurface) => void;
  autoplayStop: (id: string, reason: string) => void;
  timeToFirstFrame: (id: string, ms: number) => void;
  playFailure: (id: string, reason: string) => void;
  scrubUsed: (id: string) => void;
  fullscreenOpened: (id: string, fromSurface: MediaSurface) => void;
}

// ============ Constants ============

const MAX_WARM_PLAYERS = 2; // prev + next
const SCROLL_SETTLE_DELAY = 150; // Premium feel - not too twitchy on iOS
const MAX_PREWARM_CANDIDATES = 2; // Explicit limit for paused-video pool
const INTENT_SUPPRESS_DURATION = 2000; // 2s after user pause, suppress autoplay
const SCRUB_SUPPRESS_DURATION = 600; // 600ms after scrub, suppress autoplay switching
const BUFFERING_SUPPRESS_DURATION = 500; // 500ms grace for buffering videos
const MAX_RETRIES = 1;
const PLAY_RETRY_MAX = 3; // Max retries for requestPlay with backoff
const PLAY_RETRY_BASE_DELAY = 100; // Base delay for exponential backoff

// Autoplay hysteresis thresholds
// Incumbent video keeps playing until it drops below STOP_THRESHOLD
// New video only starts when it crosses START_THRESHOLD AND incumbent is below STOP_THRESHOLD
const AUTOPLAY_START_THRESHOLD = 0.4;  // 40% visible to start playing
const AUTOPLAY_STOP_THRESHOLD = 0.25;  // 25% visible to stop playing (incumbent priority)

// Memory management caps
const MAX_REGISTERED_MEDIA = 10; // Max videos to keep registered
// AUDIT FIX #4: CLEANUP_THRESHOLD now matches MAX_REGISTERED_MEDIA to prevent memory pressure
const CLEANUP_THRESHOLD = 10; // Trigger cleanup when registry reaches this size
// Concurrent video limits by surface
// Hero/fullscreen/clubhouse = exclusive (1), Grid/Watch/Profile = multi-play
const MAX_CONCURRENT_PER_SURFACE: Record<MediaSurface, number> = {
  'hero': 1,           // Only 1 hero video
  'grid': 4,           // Allow 4 visible grid videos to play
  'fullscreen': 1,     // Only 1 fullscreen
  'clubhouse': 1,      // Only 1 clubhouse (fullscreen feed)
  'videos': 1,         // Only 1 videos page video (YouTube-style long-form)
  'watch': 4,          // Allow 4 visible watch grid videos to play
  'watch-shorts': 2,   // Watch tab shorts grid - diagonal pattern (1 per visible row)
  'profile': 4,        // Allow 4 visible profile activity videos to play
  'explore-grid': 1,   // Explore discover grid - 1 video at a time in dense 2-column layout
  'friends-feed': 1,   // Friends feed - single column, 1 video at a time
  'miniplayer': 1,     // Global mini player - single persistent player
  'highlights': 1,     // Profile highlights carousel - 1 at a time
  'course-highlights': 1, // Course detail highlights carousel - 1 at a time
};
const MAX_CONCURRENT_FULLSCREEN = 1;  // Fullscreen/clubhouse: strict 1-at-a-time

// Surface priority (lower = higher priority)
const SURFACE_PRIORITY: Record<MediaSurface, number> = {
  'clubhouse': 1,      // Highest - fullscreen feed
  'fullscreen': 2,     // High - fullscreen modal
  'miniplayer': 3,     // Medium-high - persistent mini player
  'hero': 2,           // High - hero video must play before grid
  'grid': 4,           // Medium - grid videos
  'videos': 5,         // Medium-low - videos page (long-form)
  'watch': 4,          // Same as grid - Watch tab grid videos
  'watch-shorts': 4,   // Same as grid - Watch tab shorts grid
  'profile': 4,        // Same as grid - Profile activity videos
  'explore-grid': 4,   // Same as grid - Explore discover grid
  'friends-feed': 4,   // Same as grid - Friends feed
  'highlights': 5,     // Lower - carousel highlights
  'course-highlights': 5, // Lower - course highlights carousel
};

// ============ Singleton Runtime ============

class MediaRuntimeCore {
  private registry = new Map<string, MediaNode>();
  private state: RuntimeState = {
    activeMediaIds: new Set(),
    primaryActiveId: null,
    activeSurface: null,
    activeReason: null,
  };
  
  private uiState: UIState = {
    isScrolling: false,
    isPanning: false,
    isPanelOpen: false,
    isModalOpen: false,
  };
  
  private userIntent: UserIntent = {
    lastTap: 0,
    lastScrub: 0,
    lastManualPause: 0,
    lastMuteToggle: 0,
  };
  
  private warmPool = new Set<string>();
  private uiSettleTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingPlaybackUpdate = false;
  private bufferingSuppressUntil = 0; // Timestamp - don't switch away while buffering

  // ============ iOS WebView Autoplay Gesture Retry ============
  // In some iOS WebView contexts, autoplay can be blocked with NotAllowedError even when muted.
  // Crucially, retries from timers/effects don't help; the successful play() call must be
  // initiated from a real user gesture handler (touch/pointer/click).
  private gestureRetryIds = new Set<string>();
  private gestureRetryListenerAttached = false;

  private ensureGestureRetryListener(): void {
    if (this.gestureRetryListenerAttached) return;
    if (typeof window === 'undefined') return;

    const handler = this.handleUserGestureForRetry;

    // Capture + passive to avoid interfering with scroll performance.
    // IMPORTANT: Include 'scroll' and 'touchmove' as iOS treats these as valid user gestures
    window.addEventListener('touchstart', handler, { passive: true, capture: true });
    window.addEventListener('touchmove', handler, { passive: true, capture: true });
    window.addEventListener('pointerdown', handler, { passive: true, capture: true });
    window.addEventListener('click', handler, { passive: true, capture: true });
    window.addEventListener('scroll', handler, { passive: true, capture: true });

    this.gestureRetryListenerAttached = true;
  }

  private handleUserGestureForRetry = (): void => {
    if (this.gestureRetryIds.size === 0) return;

    const ids = Array.from(this.gestureRetryIds);
    this.gestureRetryIds.clear();

    for (const id of ids) {
      const node = this.registry.get(id);
      if (!node) {
        if (MOBILE_VIDEO_DEBUG) {
          logGestureRetrySkipped(id, 'node_not_found');
        }
        continue;
      }

      // Only retry if still plausibly the right candidate.
      if (!node.isVisible || node.visibilityRatio < AUTOPLAY_START_THRESHOLD) {
        if (MOBILE_VIDEO_DEBUG) {
          logGestureRetrySkipped(id, `not_visible (ratio=${node.visibilityRatio.toFixed(2)})`);
        }
        continue;
      }

      // Log that we're firing the retry
      if (MOBILE_VIDEO_DEBUG) {
        logGestureRetryFired(id, node.isVisible, node.visibilityRatio);
      }

      // Fire-and-forget: requestPlay() will attempt safePlay() which will call video.play().
      // This call chain begins inside the gesture event, which is the important part for iOS.
      void this.requestPlay({ id, surface: node.surface, reason: 'autoplay' });
    }
  };

  private scheduleGestureRetry(id: string): void {
    this.ensureGestureRetryListener();
    this.gestureRetryIds.add(id);
    
    // Log that we queued a retry
    if (MOBILE_VIDEO_DEBUG) {
      logGestureRetryQueued(id);
    }
  }
  
  // Telemetry hooks (optional)
  private telemetry: Partial<RuntimeTelemetry> = {};
  
  // Telemetry stats for HUD
  private telemetryStats = {
    lastTtff: null as number | null,
    lastBufferingMs: null as number | null,
    isBuffering: false,
    bufferingStartAt: 0,
    playRequestedAt: new Map<string, number>(),
    bufferingStartedAt: new Map<string, number>(),
  };
  
  // Listeners for state changes
  private listeners = new Set<() => void>();
  
  // ============ Registration ============
  
  registerMedia(args: {
    id: string;
    element: HTMLVideoElement;
    surface: MediaSurface;
    sortIndex: number;
    observeTarget?: HTMLElement;
  }): void {
    const { id, element, surface, sortIndex, observeTarget } = args;
    
    // Guard: Skip if already registered with same element
    const existing = this.registry.get(id);
    if (existing && existing.videoElement === element) {
      // Already registered with same element, skip
      return;
    }
    
    this.registry.set(id, {
      id,
      videoElement: element,
      observeTarget: observeTarget ?? element,
      surface,
      sortIndex,
      visibilityRatio: 0,
      isVisible: false,
      errorState: null,
      retryCount: 0,
      playGeneration: 0,
    });
    
    // Tag element for callbacks
    element.dataset.runtimeMediaId = id;
    
    // Only log on first registration (for debugging)
    if (DEBUG_MEDIA_RUNTIME && !existing) {
      console.log('[MediaRuntime] Registered:', id.slice(0, 8), surface);
    }
    
    // Memory management: cleanup distant videos when registry gets too large
    if (this.registry.size >= CLEANUP_THRESHOLD) {
      this.cleanupDistantMedia();
    }
  }
  
  /**
   * Cleanup distant media to cap memory usage
   * Removes videos furthest from current playback position
   * 
   * IMPORTANT: Hero and fullscreen surfaces are PROTECTED and never cleaned up.
   * These are critical surfaces that should persist regardless of distance.
   */
  private cleanupDistantMedia(): void {
    // PROTECTED_SURFACES: Never cleanup these - they're critical for UX
    // Added 'profile' to ensure profile activity videos persist during navigation
    const PROTECTED_SURFACES: Set<MediaSurface> = new Set(['hero', 'fullscreen', 'clubhouse', 'profile']);
    
    // Find the current sortIndex (from primary active or most visible)
    let currentSortIndex = 0;
    
    if (this.state.primaryActiveId) {
      const activeNode = this.registry.get(this.state.primaryActiveId);
      if (activeNode) {
        currentSortIndex = activeNode.sortIndex;
      }
    } else {
      // Find the most visible node
      let maxRatio = 0;
      this.registry.forEach((node) => {
        if (node.visibilityRatio > maxRatio) {
          maxRatio = node.visibilityRatio;
          currentSortIndex = node.sortIndex;
        }
      });
    }
    
    // Filter out protected surfaces before sorting
    const entries = Array.from(this.registry.entries()).filter(([_, node]) => {
      // Never cleanup protected surfaces
      if (PROTECTED_SURFACES.has(node.surface)) {
        return false;
      }
      return true;
    });
    
    // Sort entries by distance from current (furthest first)
    entries.sort((a, b) => {
      const distA = Math.abs(a[1].sortIndex - currentSortIndex);
      const distB = Math.abs(b[1].sortIndex - currentSortIndex);
      return distB - distA; // Furthest first
    });
    
    // Unregister videos beyond MAX_REGISTERED_MEDIA (only from non-protected pool)
    const toRemove = entries.slice(MAX_REGISTERED_MEDIA);
    
    if (toRemove.length > 0 && DEBUG_MEDIA_RUNTIME) {
      console.log(`[MediaRuntime] Cleaning up ${toRemove.length} distant videos (registry size: ${this.registry.size})`);
    }
    
    toRemove.forEach(([id]) => {
      // Only cleanup if not currently active
      if (!this.state.activeMediaIds.has(id)) {
        this.unregisterMedia(id);
      }
    });
  }
  
  unregisterMedia(id: string): void {
    const node = this.registry.get(id);
    if (node) {
      // Clean up warm pool
      this.warmPool.delete(id);
      
      // Remove from active set if present
      this.state.activeMediaIds.delete(id);
      if (this.state.primaryActiveId === id) {
        // Pick next primary from remaining active IDs
        const remaining = Array.from(this.state.activeMediaIds);
        this.state.primaryActiveId = remaining[0] ?? null;
        if (!this.state.primaryActiveId) {
          this.state.activeSurface = null;
          this.state.activeReason = null;
        }
      }
      
      this.registry.delete(id);
      
      if (DEBUG_MEDIA_RUNTIME) {
        console.log('[MediaRuntime] Unregistered:', id.slice(0, 8));
      }
    }
  }
  
  // ============ Candidate State (from Intersection Observer) ============
  
  setCandidateState(id: string, state: { visible: boolean; ratio: number }): void {
    const node = this.registry.get(id);
    if (!node) return;
    
    node.isVisible = state.visible;
    node.visibilityRatio = state.ratio;
    
    // Queue playback update if UI is settled
    this.queuePlaybackUpdate();
  }
  
  // ============ Playback Requests ============
  
  /**
   * Request playback for a media node.
   * 
   * IMPORTANT: This is the ONLY sanctioned way to play media in the app.
   * Never call video.play() directly outside of MediaRuntime/safePlay.
   */
  async requestPlay(args: {
    id: string;
    surface: MediaSurface;
    reason: PlaybackReason;
  }): Promise<boolean> {
    const startTime = performance.now();
    const { id, surface, reason } = args;
    const node = this.registry.get(id);
    
    // MOBILE VIDEO DEBUG: Log request play
    if (MOBILE_VIDEO_DEBUG) {
      logRuntimeRequestPlay(id, surface, reason, this.state.activeMediaIds.size);
    }
    
    if (DEBUG_MEDIA_RUNTIME) {
      console.log(`[${startTime.toFixed(2)}ms] [MediaRuntime] REQUEST_PLAY`, {
        id: id.slice(0, 8),
        surface,
        reason,
        currentActiveCount: this.state.activeMediaIds.size,
        isAlreadyActive: this.state.activeMediaIds.has(id),
        nodeExists: !!node,
        videoReadyState: node?.videoElement?.readyState,
        videoPaused: node?.videoElement?.paused
      });
    }
    
    if (!node) {
      console.warn('[MediaRuntime] requestPlay: No node for', id);
      return false;
    }
    
    // DEV-only invariant: detect unauthorized plays
    // STABILITY FIX: Only warn if the video ACTUALLY plays and isn't in our registry
    // This prevents false positives during race conditions where we add to activeMediaIds
    // right before calling play(), but the event fires at a slightly delayed time.
    if (DEBUG_MEDIA_RUNTIME) {
      // Attach listener to detect unauthorized plays (one-time per node)
      if (node && !(node.videoElement as any).__runtimeGuarded) {
        (node.videoElement as any).__runtimeGuarded = true;
        node.videoElement.addEventListener('play', () => {
          // Allow a small window for race condition between adding to activeMediaIds and play event
          // Also ignore if this is a stale/unmounted video element
          if (!node.videoElement.isConnected) return;
          
          // Use setTimeout to check after the current task completes
          // This allows requestPlay's add-to-activeMediaIds to complete
          setTimeout(() => {
            if (!this.state.activeMediaIds.has(id) && !node.videoElement.paused) {
              console.warn(
                '[MediaRuntime] ⚠️ UNAUTHORIZED PLAY: Video', id.slice(0, 8),
                'started playing but is not in activeMediaIds',
                '\nThis video bypassed MediaRuntime - find and remove the .play() call.'
              );
            }
          }, 0);
        });
      }
    }
    
    // Check intent suppression for autoplay
    if (reason === 'autoplay' && this.shouldSuppressAutoplay()) {
      if (DEBUG_MEDIA_RUNTIME) {
        console.log('[MediaRuntime] Autoplay suppressed due to recent user action');
      }
      return false;
    }
    
    // If already playing this one, skip
    if (this.state.activeMediaIds.has(id)) {
      if (DEBUG_MEDIA_RUNTIME) {
        console.log(`[${performance.now().toFixed(2)}ms] [MediaRuntime] ALREADY_PLAYING`, { id: id.slice(0, 8) });
      }
      return true;
    }
    
    // Priority check for user-initiated playback
    // For user actions, we respect exclusive playback (pause others)
    if (reason === 'user') {
      // User action: pause all others and take exclusive control
      this.state.activeMediaIds.forEach((activeId) => {
        if (activeId !== id) {
          this.pauseInternal(activeId);
        }
      });
      this.state.activeMediaIds.clear();
    }
    
    // Block grid/watch-shorts autoplay if fullscreen/clubhouse is active with user reason
    if ((this.state.activeSurface === 'fullscreen' || this.state.activeSurface === 'clubhouse') 
        && (surface === 'grid' || surface === 'watch-shorts') && reason !== 'user') {
      if (DEBUG_MEDIA_RUNTIME) {
        console.log('[MediaRuntime] requestPlay blocked: fullscreen/clubhouse active');
      }
      return false;
    }
    
    // When clubhouse/fullscreen starts, pause ALL grid/watch-shorts videos (priority system)
    if ((surface === 'clubhouse' || surface === 'fullscreen') && reason !== 'autoplay') {
      const gridVideos = Array.from(this.state.activeMediaIds).filter(activeId => {
        const media = this.registry.get(activeId);
        return media?.surface === 'grid' || media?.surface === 'watch-shorts';
      });
      
      for (const gridId of gridVideos) {
        this.pauseInternal(gridId);
        this.state.activeMediaIds.delete(gridId);
        this.telemetry.autoplayStop?.(gridId, 'priority_override');
      }
      
      if (DEBUG_MEDIA_RUNTIME && gridVideos.length > 0) {
        console.log('[MediaRuntime] Paused', gridVideos.length, 'grid videos for', surface);
      }
    }
    
    // ✅ FIX: Add to activeMediaIds BEFORE calling safePlay
    // This prevents the "UNAUTHORIZED PLAY" warning because the play event
    // listener checks activeMediaIds - it needs to be set before video.play() fires
    this.state.activeMediaIds.add(id);
    
    // Increment generation token for this play attempt
    // This allows us to detect if the candidate changed during async safePlay
    node.playGeneration++;
    const thisGeneration = node.playGeneration;
    
    // Attempt play with retry logic
    if (DEBUG_MEDIA_RUNTIME) {
      console.log(`[${performance.now().toFixed(2)}ms] [MediaRuntime] CALLING_SAFEPLAY`, { 
        id: id.slice(0, 8),
        readyState: node.videoElement.readyState,
        generation: thisGeneration
      });
    }
    
    // Retry loop with exponential backoff
    let success = false;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= PLAY_RETRY_MAX; attempt++) {
      try {
        if (DEBUG_MEDIA_RUNTIME && attempt > 1) {
          console.log(`[${performance.now().toFixed(2)}ms] [MediaRuntime] RETRY_ATTEMPT`, { 
            id: id.slice(0, 8),
            attempt,
            maxRetries: PLAY_RETRY_MAX
          });
        }
        
        // Create regeneration handler for blob URL failures
        const regenerateSource = async (mediaId: string) => {
          if (mediaId !== id) return;
          
          const currentNode = this.registry.get(id);
          if (!currentNode) return;
          
          const playerRef = (currentNode.videoElement as any).__hlsPlayerRef;
          if (playerRef?.detach && playerRef?.attach) {
            
            playerRef.detach();
            
            // Wait for cleanup to complete (requestAnimationFrame is too short for HLS.js async setup)
            await new Promise(resolve => setTimeout(resolve, 50));
            
            playerRef.attach();
            
            // Wait for HLS.js to start loading the new source
            // HLS.js setup is async and needs time to create MediaSource and load manifest
            await new Promise<void>((resolve) => {
              const video = currentNode.videoElement;
              
              // Wait for loadedmetadata or timeout
              const onLoadedMetadata = () => {
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                clearTimeout(timeout);
                resolve();
              };
              
              video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
              
              // Timeout after 3 seconds if no metadata loaded
              const timeout = setTimeout(() => {
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                
                resolve();
              }, 3000);
            });
          }
        };
        
        success = await safePlay(node.videoElement, {
          generation: thisGeneration,
          onRegenerateSource: regenerateSource,
        });

        // If autoplay is blocked by policy (iOS WebView), further timer-based retries are useless.
        // Queue a retry that runs inside the next real user gesture handler.
        if (!success && reason === 'autoplay') {
          const blockedByPolicy = node.videoElement.getAttribute('data-autoplay-blocked') === '1';
          if (blockedByPolicy) {
            this.scheduleGestureRetry(id);
            break;
          }
        }
        
        if (success) {
          // Clear autoplay-blocked marker on success
          node.videoElement.removeAttribute('data-autoplay-blocked');
          if (DEBUG_MEDIA_RUNTIME) {
            console.log(`[${performance.now().toFixed(2)}ms] [MediaRuntime] PLAY_SUCCESS`, { 
              id: id.slice(0, 8),
              attempt,
              generation: thisGeneration
            });
          }
          
          // MOBILE VIDEO DEBUG: Log play result
          if (MOBILE_VIDEO_DEBUG) {
            logRuntimePlayResult(id, true);
          }
          
          break; // Success - exit retry loop
        }
        
        // Play returned false but didn't throw - this is a soft failure
        if (attempt < PLAY_RETRY_MAX) {
          const delay = PLAY_RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
          if (DEBUG_MEDIA_RUNTIME) {
            console.log(`[MediaRuntime] RETRY_SCHEDULED`, { 
              id: id.slice(0, 8),
              attempt,
              delayMs: delay
            });
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error: any) {
        lastError = error;
        
        if (attempt === PLAY_RETRY_MAX) {
          if (DEBUG_MEDIA_RUNTIME) {
            console.log(`[${performance.now().toFixed(2)}ms] [MediaRuntime] PLAY_FAILED_FINAL`, { 
              id: id.slice(0, 8),
              attempt,
              error: error?.message
            });
          }
          
          // MOBILE VIDEO DEBUG: Log play failure
          if (MOBILE_VIDEO_DEBUG) {
            logRuntimePlayResult(id, false);
          }
          
          break;
        }
        
        // Calculate backoff delay: 100ms, 200ms, 400ms
        const delay = PLAY_RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
        if (DEBUG_MEDIA_RUNTIME) {
          console.log(`[MediaRuntime] RETRY_SCHEDULED_AFTER_ERROR`, { 
            id: id.slice(0, 8),
            attempt,
            delayMs: delay,
            error: error?.message
          });
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Check if generation changed during async play (stale candidate)
    const nodeAfter = this.registry.get(id);
    if (!nodeAfter || nodeAfter.playGeneration !== thisGeneration) {
      if (DEBUG_MEDIA_RUNTIME) {
        console.log(`[${performance.now().toFixed(2)}ms] [MediaRuntime] STALE_PLAY_IGNORED`, { 
          id: id.slice(0, 8),
          expectedGen: thisGeneration,
          currentGen: nodeAfter?.playGeneration 
        });
      }
      // Stale: candidate changed during play - don't update state
      // But pause this video since it's no longer the winner
      if (success) {
        node.videoElement.pause();
      }
      this.state.activeMediaIds.delete(id);
      return false;
    }
    
    if (success) {
      const endTime = performance.now();
      // Update primary active (first one or user-initiated)
      if (reason === 'user' || !this.state.primaryActiveId) {
        this.state.primaryActiveId = id;
      }
      this.state.activeSurface = surface;
      this.state.activeReason = reason;
      
      // Add to warm pool
      this.warmPool.add(id);
      this.enforceWarmPoolLimit();
      
      // Telemetry
      if (reason === 'autoplay') {
        this.telemetry.autoplayStart?.(id, surface);
      }
      
      // Clear blob URL failures on success
      BlobUrlManager.clearFailures(id);
      
      this.notifyListeners();
      
      if (DEBUG_MEDIA_RUNTIME) {
        console.log(`[${endTime.toFixed(2)}ms] [MediaRuntime] PLAY_SUCCESS`, {
          id: id.slice(0, 8),
          surface,
          reason,
          timeTaken: (endTime - startTime).toFixed(2) + 'ms',
          totalActive: this.state.activeMediaIds.size,
          generation: thisGeneration
        });
      }
    } else {
      // ✅ FIX: Remove from activeMediaIds if play failed
      this.state.activeMediaIds.delete(id);
      
      if (DEBUG_MEDIA_RUNTIME) {
        console.log(`[${performance.now().toFixed(2)}ms] [MediaRuntime] PLAY_FAILED`, { 
          id: id.slice(0, 8),
          error: lastError?.message
        });
      }
      this.telemetry.playFailure?.(id, 'blocked');
    }
    
    return success;
  }
  
  requestPause(args: { id: string; reason: string }): void {
    const { id, reason } = args;
    
    // Track user intent
    if (reason === 'user') {
      this.userIntent.lastManualPause = Date.now();
    }
    
    this.pauseInternal(id);
    
    if (this.state.activeMediaIds.has(id)) {
      this.telemetry.autoplayStop?.(id, reason);
      this.state.activeMediaIds.delete(id);
      
      // Update primary if this was it
      if (this.state.primaryActiveId === id) {
        const remaining = Array.from(this.state.activeMediaIds);
        this.state.primaryActiveId = remaining[0] ?? null;
      }
      
      // Clear surface/reason if no active media left
      if (this.state.activeMediaIds.size === 0) {
        this.state.activeSurface = null;
        this.state.activeReason = null;
      }
      this.notifyListeners();
    }
  }
  
  pauseAll(args?: { exceptId?: string }): void {
    const exceptId = args?.exceptId;
    
    this.registry.forEach((node, id) => {
      if (id !== exceptId && !node.videoElement.paused) {
        node.videoElement.pause();
      }
    });
    
    if (!exceptId) {
      // Stop all active media
      this.state.activeMediaIds.forEach((activeId) => {
        this.telemetry.autoplayStop?.(activeId, 'pauseAll');
      });
      this.state.activeMediaIds.clear();
      this.state.primaryActiveId = null;
      this.state.activeSurface = null;
      this.state.activeReason = null;
      this.notifyListeners();
    } else {
      // Remove all except the specified ID
      const toRemove = Array.from(this.state.activeMediaIds).filter(id => id !== exceptId);
      toRemove.forEach((activeId) => {
        this.telemetry.autoplayStop?.(activeId, 'pauseAll');
        this.state.activeMediaIds.delete(activeId);
      });
      if (this.state.primaryActiveId && this.state.primaryActiveId !== exceptId) {
        this.state.primaryActiveId = exceptId;
      }
    }
  }
  
  private pauseInternal(id: string): void {
    const node = this.registry.get(id);
    if (node && !node.videoElement.paused) {
      node.videoElement.pause();
    }
  }
  
  // ============ UI State Arbitration ============
  
  setUIState(state: Partial<UIState>): void {
    const wasActive = this.isUIActive();
    
    Object.assign(this.uiState, state);
    
    const isActive = this.isUIActive();
    
    if (wasActive !== isActive) {
      if (isActive) {
        // UI became active - freeze playback
        this.pauseAll();
        if (this.uiSettleTimeout) {
          clearTimeout(this.uiSettleTimeout);
          this.uiSettleTimeout = null;
        }
      } else {
        // UI settled - debounce before re-evaluating
        if (this.uiSettleTimeout) {
          clearTimeout(this.uiSettleTimeout);
        }
        this.uiSettleTimeout = setTimeout(() => {
          this.uiSettleTimeout = null;
          this.evaluateBestCandidate();
        }, SCROLL_SETTLE_DELAY);
      }
    }
  }
  
  private isUIActive(): boolean {
    return (
      this.uiState.isScrolling ||
      this.uiState.isPanning ||
      this.uiState.isPanelOpen ||
      this.uiState.isModalOpen
    );
  }
  
  // ============ Automatic Playback Evaluation ============
  
  private queuePlaybackUpdate(): void {
    if (this.pendingPlaybackUpdate) return;
    if (this.isUIActive()) return;
    
    this.pendingPlaybackUpdate = true;
    
    // Use microtask to batch updates
    queueMicrotask(() => {
      this.pendingPlaybackUpdate = false;
      this.evaluateBestCandidate();
    });
  }
  
  private evaluateBestCandidate(): void {
    if (this.isUIActive()) return;
    
    // Don't evaluate during user-initiated playback
    if (this.state.activeReason === 'user') return;
    
    // Get all visible candidates (above start threshold)
    const candidates: MediaNode[] = [];
    
    this.registry.forEach((node) => {
      if (node.isVisible && !node.errorState && node.visibilityRatio >= AUTOPLAY_START_THRESHOLD) {
        candidates.push(node);
      }
    });
    
    if (DEBUG_MEDIA_RUNTIME && candidates.length > 0) {
      console.log('[MediaRuntime] 🔍 evaluateBestCandidate:', {
        registrySize: this.registry.size,
        candidateCount: candidates.length,
        candidates: candidates.map(c => ({
          id: c.id.slice(0, 8),
          surface: c.surface,
          ratio: c.visibilityRatio.toFixed(2),
        })),
      });
    }
    
    // Get IDs of visible candidates
    const visibleIds = new Set(candidates.map(c => c.id));
    
    // Process each surface type with incumbent priority
    // Dynamically derive from MAX_CONCURRENT_PER_SURFACE to prevent missing-surface bugs
    const surfaceTypes = Object.keys(MAX_CONCURRENT_PER_SURFACE) as MediaSurface[];
    
    for (const surface of surfaceTypes) {
      const surfaceCandidates = candidates.filter(c => c.surface === surface);
      const maxConcurrent = MAX_CONCURRENT_PER_SURFACE[surface];
      
      // Get currently playing videos on this surface
      const playingOnSurface = Array.from(this.state.activeMediaIds).filter(id => {
        const media = this.registry.get(id);
        return media?.surface === surface;
      });
      
      // INCUMBENT PRIORITY: Check if incumbents are still above stop threshold
      // If so, they retain priority and shouldn't be swapped out
      const incumbentsToKeep: string[] = [];
      const incumbentsToPause: string[] = [];
      
      for (const playingId of playingOnSurface) {
        const node = this.registry.get(playingId);
        if (!node) {
          incumbentsToPause.push(playingId);
          continue;
        }
        
        // Incumbent stays if still above STOP threshold
        if (node.visibilityRatio >= AUTOPLAY_STOP_THRESHOLD) {
          incumbentsToKeep.push(playingId);
          if (DEBUG_MEDIA_RUNTIME) {
            console.log('[MediaRuntime] Incumbent retained:', playingId.slice(0, 8), 
              `ratio=${node.visibilityRatio.toFixed(2)} >= stop=${AUTOPLAY_STOP_THRESHOLD}`);
          }
        } else {
          // Incumbent dropped below stop threshold - eligible to be replaced
          incumbentsToPause.push(playingId);
          if (DEBUG_MEDIA_RUNTIME) {
            console.log('[MediaRuntime] Incumbent released:', playingId.slice(0, 8), 
              `ratio=${node.visibilityRatio.toFixed(2)} < stop=${AUTOPLAY_STOP_THRESHOLD}`);
          }
        }
      }
      
      // Pause incumbents that dropped below threshold
      for (const id of incumbentsToPause) {
        this.requestPause({ id, reason: 'below_stop_threshold' });
      }
      
      // Calculate available slots after keeping incumbents
      const availableSlots = maxConcurrent - incumbentsToKeep.length;
      
      if (availableSlots <= 0) {
        // No slots available - incumbents are holding position
        continue;
      }
      
      // Sort candidates by visibility ratio (highest first) then sortIndex (lowest first)
      // Exclude incumbents we're already keeping
      const sortedCandidates = surfaceCandidates
        .filter(c => !incumbentsToKeep.includes(c.id))
        .sort((a, b) => {
          if (b.visibilityRatio !== a.visibilityRatio) {
            return b.visibilityRatio - a.visibilityRatio;
          }
          return a.sortIndex - b.sortIndex;
        });
      
      // Start playing top candidates up to available slots
      let slotsUsed = 0;
      for (const candidate of sortedCandidates) {
        if (slotsUsed >= availableSlots) break;
        
        if (!this.state.activeMediaIds.has(candidate.id)) {
          this.requestPlay({
            id: candidate.id,
            surface: candidate.surface,
            reason: 'autoplay',
          });
          slotsUsed++;
        }
      }
    }
    
    // Pause any active media that's completely invisible (ratio = 0 or not in registry)
    const toStop: string[] = [];
    this.state.activeMediaIds.forEach((activeId) => {
      const node = this.registry.get(activeId);
      // Only auto-pause if truly invisible (below stop threshold handled above)
      if (!node || node.visibilityRatio < AUTOPLAY_STOP_THRESHOLD) {
        toStop.push(activeId);
      }
    });
    
    for (const id of toStop) {
      this.requestPause({ id, reason: 'no_visible' });
    }
  }
  
  
  // ============ Warm Pool Management ============
  
  private enforceWarmPoolLimit(): void {
    if (this.warmPool.size <= MAX_WARM_PLAYERS + 1) return; // +1 for currently playing
    
    // Get all warm IDs except active ones
    const warmIds = Array.from(this.warmPool).filter(id => !this.state.activeMediaIds.has(id));
    
    // Sort by visibility ratio (detach least visible first)
    warmIds.sort((a, b) => {
      const nodeA = this.registry.get(a);
      const nodeB = this.registry.get(b);
      return (nodeA?.visibilityRatio ?? 0) - (nodeB?.visibilityRatio ?? 0);
    });
    
    // Evict until within limit
    while (this.warmPool.size > MAX_WARM_PLAYERS + 1 && warmIds.length > 0) {
      const evictId = warmIds.shift();
      if (evictId) {
        const node = this.registry.get(evictId);
        if (node) {
          const playerRef = (node.videoElement as any).__hlsPlayerRef;
          playerRef?.detach?.();
        }
        this.warmPool.delete(evictId);
        
      }
    }
  }
  
  prewarmCandidate(id: string): void {
    const node = this.registry.get(id);
    if (!node) return;
    
    if (this.warmPool.size >= MAX_WARM_PLAYERS + 1) {
      this.enforceWarmPoolLimit();
    }
    
    const playerRef = (node.videoElement as any).__hlsPlayerRef;
    if (playerRef && !playerRef.isAttached?.()) {
      playerRef.attach?.();
      this.warmPool.add(id);
      
    }
  }
  
  // ============ Error Handling ============
  
  setError(id: string, type: ErrorType, error?: Error): void {
    const node = this.registry.get(id);
    if (!node) return;
    
    node.errorState = type;
    node.lastError = error;
    
    // Handle based on error type
    switch (type) {
      case 'transient':
        // Auto-retry once
        if (node.retryCount < MAX_RETRIES) {
          node.retryCount++;
          setTimeout(() => {
            node.errorState = null;
            const playerRef = (node.videoElement as any).__hlsPlayerRef;
            playerRef?.attach?.();
            this.queuePlaybackUpdate();
          }, 1000);
        }
        break;
        
      case 'hls_fatal':
        // Destroy and recreate once
        if (node.retryCount < MAX_RETRIES) {
          node.retryCount++;
          const playerRef = (node.videoElement as any).__hlsPlayerRef;
          playerRef?.detach?.();
          setTimeout(() => {
            node.errorState = null;
            playerRef?.attach?.();
            this.queuePlaybackUpdate();
          }, 500);
        }
        break;
        
      case 'decode_unsupported':
        // Fallback to poster, no retry
        // Error state remains, UI should show poster + retry button
        break;
    }
    
    this.telemetry.playFailure?.(id, type);
  }
  
  clearError(id: string): void {
    const node = this.registry.get(id);
    if (node) {
      node.errorState = null;
      node.retryCount = 0;
    }
  }
  
  // ============ Intent Tracking ============
  
  trackIntent(action: 'tap' | 'scrub' | 'pause' | 'mute' | 'buffer'): void {
    const now = Date.now();
    
    switch (action) {
      case 'tap':
        this.userIntent.lastTap = now;
        break;
      case 'scrub':
        this.userIntent.lastScrub = now;
        this.telemetry.scrubUsed?.(this.state.primaryActiveId ?? 'unknown');
        break;
        break;
      case 'pause':
        this.userIntent.lastManualPause = now;
        break;
      case 'mute':
        this.userIntent.lastMuteToggle = now;
        break;
      case 'buffer':
        // Give buffering videos grace period before switching away
        this.bufferingSuppressUntil = now + BUFFERING_SUPPRESS_DURATION;
        break;
    }
  }
  
  /**
   * Report that active media is buffering - suppress autoplay switching briefly
   * Only applies to active autoplay (not user-initiated playback)
   */
  reportBuffering(id: string): void {
    // Only suppress switching if this is an active autoplay video
    if (this.state.activeMediaIds.has(id) && this.state.activeReason === 'autoplay') {
      this.bufferingSuppressUntil = Date.now() + BUFFERING_SUPPRESS_DURATION;
    }
  }
  
  private shouldSuppressAutoplay(): boolean {
    const now = Date.now();
    // Suppress autoplay after manual pause or recent scrub
    return (
      now - this.userIntent.lastManualPause < INTENT_SUPPRESS_DURATION ||
      now - this.userIntent.lastScrub < SCRUB_SUPPRESS_DURATION
    );
  }
  
  // ============ State Queries ============
  
  getActiveId(): string | null {
    // Return primary for backwards compatibility
    return this.state.primaryActiveId;
  }
  
  getActiveIds(): Set<string> {
    return new Set(this.state.activeMediaIds);
  }
  
  getActiveSurface(): MediaSurface | null {
    return this.state.activeSurface;
  }
  
  getNode(id: string): MediaNode | undefined {
    return this.registry.get(id);
  }
  
  getRegistrySize(): number {
    return this.registry.size;
  }
  
  getWarmPoolSize(): number {
    return this.warmPool.size;
  }
  
  isPlaying(id: string): boolean {
    return this.state.activeMediaIds.has(id);
  }
  
  // ============ Telemetry ============
  
  setTelemetry(hooks: Partial<RuntimeTelemetry>): void {
    this.telemetry = hooks;
  }
  
  // ============ Listeners ============
  
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
  
  // ============ Debug ============
  
  getDebugInfo(): {
    registrySize: number;
    warmPoolSize: number;
    activeMediaId: string | null;
    activeSurface: MediaSurface | null;
    uiState: UIState;
  } {
    return {
      registrySize: this.registry.size,
      warmPoolSize: this.warmPool.size,
      activeMediaId: this.state.primaryActiveId,
      activeSurface: this.state.activeSurface,
      uiState: { ...this.uiState },
    };
  }
  
  getActiveReason(): PlaybackReason | null {
    return this.state.activeReason;
  }
  
  getPrimaryActiveId(): string | null {
    return this.state.primaryActiveId;
  }
  
  // ============ Telemetry Stats ============
  
  getTelemetryStats(): {
    lastTtff: number | null;
    lastBufferingMs: number | null;
    isBuffering: boolean;
  } {
    return {
      lastTtff: this.telemetryStats.lastTtff,
      lastBufferingMs: this.telemetryStats.lastBufferingMs,
      isBuffering: this.telemetryStats.isBuffering,
    };
  }
  
  recordTtff(id: string, ms: number): void {
    this.telemetryStats.lastTtff = Math.round(ms);
    this.telemetry.timeToFirstFrame?.(id, ms);
    // Removed verbose ttff log - slow TTFF warnings are in videoPerformance.ts
  }
  
  recordBufferingStart(id: string): void {
    // Only track for active media
    if (!this.state.activeMediaIds.has(id)) return;
    
    if (!this.telemetryStats.bufferingStartedAt.has(id)) {
      this.telemetryStats.bufferingStartedAt.set(id, performance.now());
      this.telemetryStats.isBuffering = true;
      
      if (DEBUG_MEDIA_TELEMETRY) {
        console.log(`[MediaTelemetry] bufferingStart ${id.slice(0, 8)}`);
      }
    }
  }
  
  recordBufferingEnd(id: string): void {
    const startTime = this.telemetryStats.bufferingStartedAt.get(id);
    if (startTime) {
      const ms = Math.round(performance.now() - startTime);
      this.telemetryStats.lastBufferingMs = ms;
      this.telemetryStats.bufferingStartedAt.delete(id);
      this.telemetryStats.isBuffering = false;
      
      if (DEBUG_MEDIA_TELEMETRY) {
        console.log(`[MediaTelemetry] bufferingEnd ${id.slice(0, 8)} ${ms}ms`);
      }
    }
  }
  
  recordPlayFailure(id: string, reason: string): void {
    this.telemetry.playFailure?.(id, reason);
    
    if (DEBUG_MEDIA_TELEMETRY) {
      console.log(`[MediaTelemetry] playFailure ${id.slice(0, 8)} ${reason}`);
    }
  }
  
  setPlayRequestedAt(id: string): void {
    this.telemetryStats.playRequestedAt.set(id, performance.now());
  }
  
  getPlayRequestedAt(id: string): number | undefined {
    return this.telemetryStats.playRequestedAt.get(id);
  }
  
  clearPlayRequestedAt(id: string): void {
    this.telemetryStats.playRequestedAt.delete(id);
  }
}

// ============ Singleton Export ============

export const MediaRuntime = new MediaRuntimeCore();

// ============ React Hook ============

import { useSyncExternalStore, useCallback } from 'react';

export function useMediaRuntime() {
  const getSnapshot = useCallback(() => ({
    activeId: MediaRuntime.getActiveId(),
    activeSurface: MediaRuntime.getActiveSurface(),
  }), []);
  
  const state = useSyncExternalStore(
    MediaRuntime.subscribe.bind(MediaRuntime),
    getSnapshot
  );
  
  return {
    ...state,
    registerMedia: MediaRuntime.registerMedia.bind(MediaRuntime),
    unregisterMedia: MediaRuntime.unregisterMedia.bind(MediaRuntime),
    setCandidateState: MediaRuntime.setCandidateState.bind(MediaRuntime),
    requestPlay: MediaRuntime.requestPlay.bind(MediaRuntime),
    requestPause: MediaRuntime.requestPause.bind(MediaRuntime),
    pauseAll: MediaRuntime.pauseAll.bind(MediaRuntime),
    setUIState: MediaRuntime.setUIState.bind(MediaRuntime),
    setError: MediaRuntime.setError.bind(MediaRuntime),
    clearError: MediaRuntime.clearError.bind(MediaRuntime),
    trackIntent: MediaRuntime.trackIntent.bind(MediaRuntime),
    prewarmCandidate: MediaRuntime.prewarmCandidate.bind(MediaRuntime),
    isPlaying: MediaRuntime.isPlaying.bind(MediaRuntime),
    getNode: MediaRuntime.getNode.bind(MediaRuntime),
    reportBuffering: MediaRuntime.reportBuffering.bind(MediaRuntime),
  };
}
