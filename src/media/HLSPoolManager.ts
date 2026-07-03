/**
 * HLSPoolManager - STUBBED (video teardown Stage A)
 *
 * All methods are no-ops. No hls.js instances ever created.
 * Public API preserved so imports resolve.
 */

export interface PooledHLSInstance {
  hls: any;
  url: string;
  created: number;
  preloadedByVideo: HTMLVideoElement | null;
  isPromoted: boolean;
  role: 'speculative' | 'handoff' | 'promoted';
  surface: 'feed' | 'fullscreen';
}

class HLSPoolManagerStub {
  register(
    _url: string,
    _hls: any,
    _preloadVideo: HTMLVideoElement,
    _surface: 'feed' | 'fullscreen' = 'feed',
    _role: 'speculative' | 'handoff' = 'speculative',
  ): boolean {
    return false;
  }

  has(_url: string): boolean { return false; }
  isPooled(_url: string): boolean { return false; }

  promote(_url: string, _targetVideo: HTMLVideoElement): any | null { return null; }
  demote(_url: string, _hls: any, _newPreloadVideo?: HTMLVideoElement): boolean { return false; }
  handOff(_url: string): boolean { return false; }
  pruneSurface(_surface: 'feed' | 'fullscreen', _keepUrls: Iterable<string>): number { return 0; }

  cleanup(_url: string): void {}
  cleanupAll(): void {}

  getStats() {
    return { registered: 0, demoted: 0, promoted: 0, missed: 0, currentPoolSize: 0 };
  }
  getDebugStats() {
    return { poolSize: 0, urls: [] as string[] };
  }
}

export const HLSPoolManager = new HLSPoolManagerStub();
