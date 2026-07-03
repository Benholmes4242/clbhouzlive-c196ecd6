/**
 * MediaRuntime - STUBBED (video teardown Stage A)
 *
 * All methods are no-ops. Public API preserved so every import resolves.
 */

// ============ Types (unchanged) ============

export type MediaSurface =
  | 'grid' | 'fullscreen' | 'clubhouse' | 'hero' | 'videos' | 'watch'
  | 'profile' | 'explore-grid' | 'friends-feed' | 'miniplayer'
  | 'highlights' | 'course-highlights';
export type PlaybackReason = 'autoplay' | 'user' | 'resume';
export type ErrorType = 'transient' | 'hls_fatal' | 'decode_unsupported';

export interface MediaNode {
  id: string;
  videoElement: HTMLVideoElement;
  observeTarget: HTMLElement;
  surface: MediaSurface;
  sortIndex: number;
  visibilityRatio: number;
  isVisible: boolean;
  errorState: ErrorType | null;
  retryCount: number;
  lastError?: Error;
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
  activeMediaIds: Set<string>;
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

// ============ Stub singleton ============

class MediaRuntimeStub {
  private listeners = new Set<() => void>();

  registerMedia(_args: {
    id: string;
    element: HTMLVideoElement;
    surface: MediaSurface;
    sortIndex: number;
    observeTarget?: HTMLElement;
  }): void {}

  unregisterMedia(_id: string): void {}

  setCandidateState(_id: string, _state: { visible: boolean; ratio: number }): void {}

  async requestPlay(_args: { id: string; surface: MediaSurface; reason: PlaybackReason }): Promise<boolean> {
    return false;
  }

  requestPause(_args: { id: string; reason?: string }): void {}

  pauseAll(_exceptId?: string): void {}

  prewarmCandidate(_id: string): void {}

  setUIState(_state: Partial<UIState>): void {}

  trackIntent(_kind: 'tap' | 'mute' | 'pause' | 'scrub'): void {}

  reportBuffering(_id: string, _isBuffering: boolean): void {}

  setError(_id: string, _err: ErrorType, _e?: Error): void {}
  clearError(_id: string): void {}

  isPlaying(_id: string): boolean { return false; }
  getActiveId(): string | null { return null; }
  getActiveIds(): Set<string> { return new Set(); }
  getActiveSurface(): MediaSurface | null { return null; }
  getActiveReason(): PlaybackReason | null { return null; }
  getNode(_id: string): MediaNode | undefined { return undefined; }
  getTelemetryStats() {
    return {
      lastTtff: null as number | null,
      lastBufferingMs: null as number | null,
      isBuffering: false,
    };
  }
  getDebugInfo() {
    return {
      registrySize: 0,
      activeIds: [] as string[],
      primaryActiveId: null as string | null,
      activeMediaId: null as string | null,
      activeSurface: null as MediaSurface | null,
      warmPoolSize: 0,
      uiState: {
        isScrolling: false,
        isPanning: false,
        isPanelOpen: false,
        isModalOpen: false,
      } as UIState,
    };
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
}

export const MediaRuntime = new MediaRuntimeStub();

export function useMediaRuntime() {
  return MediaRuntime;
}
