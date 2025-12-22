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
 * - Only one video may be playing at any time globally
 */

import { safePlay } from '@/utils/safePlay';

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
  activeMediaId: string | null;
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
const SCROLL_SETTLE_DELAY = 150;
const INTENT_SUPPRESS_DURATION = 2000; // 2s after user pause, suppress autoplay
const SCRUB_SUPPRESS_DURATION = 600; // 600ms after scrub, suppress autoplay switching
const BUFFERING_SUPPRESS_DURATION = 500; // 500ms grace for buffering videos
const MAX_RETRIES = 1;

// ============ Singleton Runtime ============

class MediaRuntimeCore {
  private registry = new Map<string, MediaNode>();
  private state: RuntimeState = {
    activeMediaId: null,
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
    });
    
    // Tag element for callbacks
    element.dataset.runtimeMediaId = id;
    
    if (import.meta.env.DEV) {
      console.log('[MediaRuntime] Registered:', id.slice(0, 8), surface);
    }
  }
  
  unregisterMedia(id: string): void {
    const node = this.registry.get(id);
    if (node) {
      // Clean up warm pool
      this.warmPool.delete(id);
      
      // If this was the active media, clear state
      if (this.state.activeMediaId === id) {
        this.state.activeMediaId = null;
        this.state.activeSurface = null;
        this.state.activeReason = null;
      }
      
      this.registry.delete(id);
      
      if (import.meta.env.DEV) {
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
    const { id, surface, reason } = args;
    const node = this.registry.get(id);
    
    if (!node) {
      console.warn('[MediaRuntime] requestPlay: No node for', id);
      return false;
    }
    
    // DEV-only invariant: detect double-play attempts
    if (import.meta.env.DEV) {
      if (this.state.activeMediaId && this.state.activeMediaId !== id) {
        const activeNode = this.registry.get(this.state.activeMediaId);
        if (activeNode && !activeNode.videoElement.paused) {
          console.warn(
            '[MediaRuntime] ⚠️ INVARIANT: Attempting to play', id.slice(0, 8),
            'while', this.state.activeMediaId.slice(0, 8), 'is still playing.',
            'This should not happen - check for stray .play() calls.'
          );
        }
      }
    }
    
    // Check intent suppression for autoplay
    if (reason === 'autoplay' && this.shouldSuppressAutoplay()) {
      if (import.meta.env.DEV) {
        console.log('[MediaRuntime] Autoplay suppressed due to recent user action');
      }
      return false;
    }
    
    // Priority check: user > resume > autoplay
    if (this.state.activeMediaId && this.state.activeMediaId !== id) {
      const currentReason = this.state.activeReason;
      
      // User-initiated playback wins over everything
      if (currentReason === 'user' && reason !== 'user') {
        if (import.meta.env.DEV) {
          console.log('[MediaRuntime] requestPlay blocked: user action active');
        }
        return false;
      }
      
      // Fullscreen wins over grid
      if (this.state.activeSurface === 'fullscreen' && surface === 'grid' && reason !== 'user') {
        if (import.meta.env.DEV) {
          console.log('[MediaRuntime] requestPlay blocked: fullscreen active');
        }
        return false;
      }
    }
    
    // Pause current before switching
    if (this.state.activeMediaId && this.state.activeMediaId !== id) {
      this.pauseInternal(this.state.activeMediaId);
    }
    
    // Attempt play
    const success = await safePlay(node.videoElement);
    
    if (success) {
      this.state.activeMediaId = id;
      this.state.activeSurface = surface;
      this.state.activeReason = reason;
      
      // Add to warm pool
      this.warmPool.add(id);
      this.enforceWarmPoolLimit();
      
      // Telemetry
      if (reason === 'autoplay') {
        this.telemetry.autoplayStart?.(id, surface);
      }
      
      this.notifyListeners();
      
      if (import.meta.env.DEV) {
        console.log('[MediaRuntime] Playing:', id.slice(0, 8), surface, reason);
      }
    } else {
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
    
    if (this.state.activeMediaId === id) {
      this.telemetry.autoplayStop?.(id, reason);
      this.state.activeMediaId = null;
      this.state.activeSurface = null;
      this.state.activeReason = null;
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
      if (this.state.activeMediaId) {
        this.telemetry.autoplayStop?.(this.state.activeMediaId, 'pauseAll');
      }
      this.state.activeMediaId = null;
      this.state.activeSurface = null;
      this.state.activeReason = null;
      this.notifyListeners();
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
    
    // Don't switch away from active video while it's buffering (grace period)
    if (Date.now() < this.bufferingSuppressUntil && this.state.activeMediaId) {
      const activeNode = this.registry.get(this.state.activeMediaId);
      if (activeNode?.isVisible) {
        return; // Keep current active, it's buffering
      }
    }
    
    // Get all visible candidates
    const candidates: MediaNode[] = [];
    
    this.registry.forEach((node) => {
      if (node.isVisible && !node.errorState) {
        candidates.push(node);
      }
    });
    
    // Sort by sortIndex (lower = higher priority)
    candidates.sort((a, b) => a.sortIndex - b.sortIndex);
    
    const bestCandidate = candidates[0];
    
    if (import.meta.env.DEV) {
      console.log('[MediaRuntime] evaluateBestCandidate', bestCandidate?.id?.slice(0, 8) ?? 'none', {
        candidateCount: candidates.length,
        currentActive: this.state.activeMediaId?.slice(0, 8) ?? 'none',
        currentReason: this.state.activeReason,
      });
    }
    
    if (bestCandidate) {
      // Don't switch if already playing this one
      if (this.state.activeMediaId === bestCandidate.id) return;
      
      // Don't steal from user action
      if (this.state.activeReason === 'user') return;
      
      // Request autoplay
      this.requestPlay({
        id: bestCandidate.id,
        surface: bestCandidate.surface,
        reason: 'autoplay',
      });
    } else if (this.state.activeMediaId && this.state.activeReason === 'autoplay') {
      // No visible candidates, pause current autoplay
      const activeNode = this.registry.get(this.state.activeMediaId);
      if (activeNode && !activeNode.isVisible) {
        this.requestPause({ id: this.state.activeMediaId, reason: 'no_visible' });
      }
    }
  }
  
  // ============ Warm Pool Management ============
  
  private enforceWarmPoolLimit(): void {
    if (this.warmPool.size <= MAX_WARM_PLAYERS + 1) return; // +1 for currently playing
    
    // Get all warm IDs except active
    const warmIds = Array.from(this.warmPool).filter(id => id !== this.state.activeMediaId);
    
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
        
        if (import.meta.env.DEV) {
          console.log('[MediaRuntime] Evicted from warm pool:', evictId.slice(0, 8));
        }
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
      
      if (import.meta.env.DEV) {
        console.log('[MediaRuntime] Prewarmed:', id.slice(0, 8));
      }
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
        this.telemetry.scrubUsed?.(this.state.activeMediaId ?? 'unknown');
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
    // Only suppress switching if this is the active autoplay video
    if (id === this.state.activeMediaId && this.state.activeReason === 'autoplay') {
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
    return this.state.activeMediaId;
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
    return this.state.activeMediaId === id;
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
      activeMediaId: this.state.activeMediaId,
      activeSurface: this.state.activeSurface,
      uiState: { ...this.uiState },
    };
  }
  
  getActiveReason(): PlaybackReason | null {
    return this.state.activeReason;
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
    
    if (import.meta.env.DEV) {
      console.log(`[MediaTelemetry] ttff ${id.slice(0, 8)} ${Math.round(ms)}ms`);
    }
  }
  
  recordBufferingStart(id: string): void {
    // Only track for active autoplay
    if (id !== this.state.activeMediaId) return;
    
    if (!this.telemetryStats.bufferingStartedAt.has(id)) {
      this.telemetryStats.bufferingStartedAt.set(id, performance.now());
      this.telemetryStats.isBuffering = true;
      
      if (import.meta.env.DEV) {
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
      
      if (import.meta.env.DEV) {
        console.log(`[MediaTelemetry] bufferingEnd ${id.slice(0, 8)} ${ms}ms`);
      }
    }
  }
  
  recordPlayFailure(id: string, reason: string): void {
    this.telemetry.playFailure?.(id, reason);
    
    if (import.meta.env.DEV) {
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
