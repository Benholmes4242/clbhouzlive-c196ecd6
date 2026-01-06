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

// ============ Types ============

export type MediaSurface = 'grid' | 'fullscreen' | 'clubhouse';
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
// Concurrent video limits by surface
// Limit grid videos to 3 for optimal CPU/memory performance across all devices
const MAX_CONCURRENT_GRID_VIDEOS = 3;
const MAX_CONCURRENT_FULLSCREEN = 1;  // Fullscreen/clubhouse: strict 1-at-a-time

// Surface priority (lower = higher priority)
const SURFACE_PRIORITY: Record<MediaSurface, number> = {
  'clubhouse': 1,      // Highest - fullscreen feed
  'fullscreen': 2,     // High - fullscreen modal
  'grid': 3,           // Medium - grid videos
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
    
    if (DEBUG_MEDIA_RUNTIME) {
      console.log('[MediaRuntime] Registered:', id.slice(0, 8), surface);
    }
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
    if (DEBUG_MEDIA_RUNTIME) {
      // Attach listener to detect unauthorized plays (one-time per node)
      if (node && !(node.videoElement as any).__runtimeGuarded) {
        (node.videoElement as any).__runtimeGuarded = true;
        node.videoElement.addEventListener('play', () => {
          if (!this.state.activeMediaIds.has(id)) {
            console.warn(
              '[MediaRuntime] ⚠️ UNAUTHORIZED PLAY: Video', id.slice(0, 8),
              'started playing but is not in activeMediaIds',
              '\nThis video bypassed MediaRuntime - find and remove the .play() call.',
              '\nStack:', new Error().stack
            );
          }
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
    
    // Block grid autoplay if fullscreen/clubhouse is active with user reason
    if ((this.state.activeSurface === 'fullscreen' || this.state.activeSurface === 'clubhouse') 
        && surface === 'grid' && reason !== 'user') {
      if (DEBUG_MEDIA_RUNTIME) {
        console.log('[MediaRuntime] requestPlay blocked: fullscreen/clubhouse active');
      }
      return false;
    }
    
    // When clubhouse/fullscreen starts, pause ALL grid videos (priority system)
    if ((surface === 'clubhouse' || surface === 'fullscreen') && reason !== 'autoplay') {
      const gridVideos = Array.from(this.state.activeMediaIds).filter(activeId => {
        const media = this.registry.get(activeId);
        return media?.surface === 'grid';
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
        
        if (success) {
          if (DEBUG_MEDIA_RUNTIME) {
            console.log(`[${performance.now().toFixed(2)}ms] [MediaRuntime] PLAY_SUCCESS`, {
              id: id.slice(0, 8),
              attempt,
              generation: thisGeneration
            });
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
    
    // Get all visible candidates
    const candidates: MediaNode[] = [];
    
    this.registry.forEach((node) => {
      if (node.isVisible && !node.errorState) {
        candidates.push(node);
      }
    });
    
    // Get IDs of visible candidates
    const visibleIds = new Set(candidates.map(c => c.id));
    
    
    // Grid video concurrency: allow up to MAX_CONCURRENT_GRID_VIDEOS (3)
    const gridVideosPlaying = Array.from(this.state.activeMediaIds).filter(id => {
      const media = this.registry.get(id);
      return media?.surface === 'grid';
    });
    
    // Separate candidates by surface
    const gridCandidates = candidates.filter(c => c.surface === 'grid');
    const otherCandidates = candidates.filter(c => c.surface !== 'grid');
    
    // Pause grid videos that are no longer visible
    for (const playingId of gridVideosPlaying) {
      const node = this.registry.get(playingId);
      if (node && !node.isVisible) {
        this.requestPause({ id: playingId, reason: 'scroll_away' });
      }
    }
    
    // Count currently playing visible grid videos
    const visibleGridPlaying = gridVideosPlaying.filter(id => {
      const node = this.registry.get(id);
      return node?.isVisible;
    });
    
    // For grid: allow up to MAX_CONCURRENT_GRID_VIDEOS to play
    if (gridCandidates.length > 0) {
      // Sort by visibility ratio (highest first) then sortIndex (lowest first)
      const sortedGridCandidates = [...gridCandidates].sort((a, b) => {
        // Primary: visibility ratio (higher is better)
        if (b.visibilityRatio !== a.visibilityRatio) {
          return b.visibilityRatio - a.visibilityRatio;
        }
        // Secondary: sortIndex (lower is higher priority)
        return a.sortIndex - b.sortIndex;
      });
      
      // Start playing visible candidates up to the limit
      for (const candidate of sortedGridCandidates) {
        const currentGridCount = Array.from(this.state.activeMediaIds).filter(id => {
          const media = this.registry.get(id);
          return media?.surface === 'grid';
        }).length;
        
        if (currentGridCount >= MAX_CONCURRENT_GRID_VIDEOS) {
          // At limit - need to pause lowest priority if new one is higher
          const activeGridNodes = Array.from(this.state.activeMediaIds)
            .map(id => this.registry.get(id))
            .filter((n): n is MediaNode => n?.surface === 'grid')
            .sort((a, b) => {
              // Sort by visibility (lower is lower priority)
              if (a.visibilityRatio !== b.visibilityRatio) {
                return a.visibilityRatio - b.visibilityRatio;
              }
              // Then by sortIndex (higher is lower priority)
              return b.sortIndex - a.sortIndex;
            });
          
          const lowestPriority = activeGridNodes[0];
          
          // Only swap if candidate has higher visibility
          if (lowestPriority && candidate.visibilityRatio > lowestPriority.visibilityRatio) {
            this.requestPause({ id: lowestPriority.id, reason: 'priority_swap' });
          } else {
            // Can't add more, skip this candidate
            continue;
          }
        }
        
        // Start playing if not already
        if (!this.state.activeMediaIds.has(candidate.id)) {
          this.requestPlay({
            id: candidate.id,
            surface: candidate.surface,
            reason: 'autoplay',
          });
        }
      }
      
    }
    
    // For non-grid surfaces (clubhouse, fullscreen), allow concurrent play
    for (const candidate of otherCandidates) {
      if (!this.state.activeMediaIds.has(candidate.id)) {
        this.requestPlay({
          id: candidate.id,
          surface: candidate.surface,
          reason: 'autoplay',
        });
      }
    }
    
    // Pause any active media that's no longer visible (for autoplay only)
    const toStop: string[] = [];
    this.state.activeMediaIds.forEach((activeId) => {
      if (!visibleIds.has(activeId)) {
        const node = this.registry.get(activeId);
        // Only auto-pause autoplay videos, not user-initiated
        if (node && !node.isVisible) {
          toStop.push(activeId);
        }
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
