/**
 * HLSPoolManager - Global HLS Instance Pool for TikTok-level performance
 * 
 * This singleton manages pre-created HLS.js instances, allowing them to be
 * "promoted" from preloading to active playback without recreating the instance.
 * 
 * Architecture:
 * - Preloader creates HLS instances and registers them with the pool
 * - UnifiedVideoPlayer checks the pool before creating new instances
 * - Promoted instances retain their buffered data for instant playback
 * 
 * Performance gains:
 * - Eliminates duplicate HLS instance creation
 * - Preserves pre-buffered segments across component lifecycles
 * - Reduces CPU/memory pressure from redundant HLS.js initialization
 * 
 * FIX #9: Memory Pressure Cleanup
 * - Monitors performance.memory (Chrome) for low memory conditions
 * - Aggressively cleans up on visibilitychange (hidden)
 * - Reduces pool size under memory pressure
 */

import type HlsType from 'hls.js';
import { logVideoTelemetry } from '@/utils/videoTelemetry';
import { logPoolEvent } from '@/media/mobileVideoDebug';

type PoolRole = 'speculative' | 'handoff' | 'promoted';

interface PooledHLSInstance {
  hls: HlsType;
  url: string;
  created: number;
  preloadedByVideo: HTMLVideoElement | null;
  isPromoted: boolean;
  role: PoolRole;
  timeoutId?: NodeJS.Timeout;
  surface: 'feed' | 'fullscreen';
}

// Speculative sub-cap: guarantees room for handoff + promoted entries so a
// prefetch storm cannot starve the active/opening video.
const SPECULATIVE_SUBCAP = 8;
const SPECULATIVE_SUBCAP_LOW_MEMORY = 5;

// Pool configuration
const POOL_CONFIG = {
  maxInstances: 12,          // Max instances to keep in pool
  maxInstancesLowMemory: 8,  // was 4 — too small for prefetch-ahead (2) + scroll-back (2-3) + active (1)
  instanceTTL: 30000,        // 30s - auto-cleanup idle instances
  instanceTTLLowMemory: 10000, // FIX #9: 10s - faster cleanup under pressure
  promotionCooldown: 100,    // 100ms - prevent rapid detach/attach cycles
  memoryCheckInterval: 5000, // FIX #9: Check memory every 5s
  memoryThresholdPct: 85,    // FIX #9: Trigger cleanup at 85% heap usage
};

class HLSPoolManagerClass {
  private pool: Map<string, PooledHLSInstance> = new Map();
  private promotionTimestamps: Map<string, number> = new Map();
  private isLowMemory: boolean = false;
  private memoryCheckIntervalId?: NodeJS.Timeout;
  private visibilityHandler?: () => void;
  private stats = { registered: 0, demoted: 0, promoted: 0, missed: 0, currentPoolSize: 0 };

  constructor() {
    // FIX #9: Initialize memory monitoring and visibility handlers
    this.initMemoryMonitoring();
    this.initVisibilityHandler();
  }

  /**
   * FIX #9: Monitor memory usage and trigger cleanup when under pressure
   */
  private initMemoryMonitoring(): void {
    // Only works in Chrome with performance.memory
    if (typeof window === 'undefined') return;
    
    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (!memory) return;
      
      const usedPct = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      const wasLowMemory = this.isLowMemory;
      this.isLowMemory = usedPct >= POOL_CONFIG.memoryThresholdPct;
      
      if (this.isLowMemory && !wasLowMemory) {
        logVideoTelemetry('hls_pool_memory_pressure', { usedPct: Math.round(usedPct) });
        this.aggressiveCleanup();
      }
    };
    
    // Check periodically
    this.memoryCheckIntervalId = setInterval(checkMemory, POOL_CONFIG.memoryCheckInterval);
    
    // Initial check
    checkMemory();
  }

  /**
   * FIX #9: Cleanup when page becomes hidden to free resources
   */
  private initVisibilityHandler(): void {
    if (typeof document === 'undefined') return;
    
    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        logVideoTelemetry('hls_pool_visibility_cleanup', { poolSize: this.pool.size });
        this.aggressiveCleanup();
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * FIX #9: Aggressive cleanup - evict all non-promoted instances
   */
  private aggressiveCleanup(): void {
    const toEvict: string[] = [];
    
    this.pool.forEach((entry, url) => {
      if (!entry.isPromoted) {
        toEvict.push(url);
      }
    });
    
    toEvict.forEach(url => this.cleanup(url));
    
    logVideoTelemetry('hls_pool_aggressive_cleanup', { 
      evicted: toEvict.length, 
      remaining: this.pool.size 
    });
  }

  /**
   * Get current max instances based on memory pressure
   */
  private getMaxInstances(): number {
    return this.isLowMemory ? POOL_CONFIG.maxInstancesLowMemory : POOL_CONFIG.maxInstances;
  }

  /**
   * Get current TTL based on memory pressure
   */
  private getTTL(): number {
    return this.isLowMemory ? POOL_CONFIG.instanceTTLLowMemory : POOL_CONFIG.instanceTTL;
  }

  /**
   * Register a preloaded HLS instance with the pool.
   * `role` orders eviction priority ('speculative' evicted first, 'handoff' only
   * if no speculative exists, 'promoted' never). Defaults to 'speculative' so
   * existing callers are unchanged. Returns true on success, false when the
   * pool is full-all-promoted (or speculative sub-cap is full with no
   * speculative to evict) — callers should fall back to a cold attach.
   */
  register(
    url: string,
    hls: HlsType,
    preloadVideo: HTMLVideoElement,
    surface: 'feed' | 'fullscreen' = 'feed',
    role: 'speculative' | 'handoff' = 'speculative',
  ): boolean {
    // GUARD: never clobber a promoted (live, on-screen) instance. If one exists
    // for this URL, destroy the INCOMING duplicate instead and bail. This is the
    // foot-gun behind the re-attach miss storm — registering over a live decoder
    // destroyed the active video. Strictly safer for all surfaces.
    const existing = this.pool.get(url);
    if (existing?.isPromoted) {
      try { hls.destroy(); } catch {}
      return false;
    }

    // FIX #9: Use dynamic max based on memory pressure
    const maxInstances = this.getMaxInstances();

    // Speculative sub-cap: reserve slots for handoff/promoted entries.
    if (role === 'speculative') {
      const subCap = this.isLowMemory ? SPECULATIVE_SUBCAP_LOW_MEMORY : SPECULATIVE_SUBCAP;
      let speculativeCount = 0;
      this.pool.forEach((e) => { if (e.role === 'speculative') speculativeCount++; });
      while (speculativeCount >= subCap) {
        const evicted = this.evictLowestPriority('speculative-only');
        if (!evicted) {
          logVideoTelemetry('hls_pool_full_speculative_subcap', { poolSize: this.pool.size });
          try { hls.destroy(); } catch {}
          return false;
        }
        speculativeCount--;
      }
    }

    // Evict lowest-priority (oldest speculative, then oldest handoff) if at capacity
    while (this.pool.size >= maxInstances) {
      const evicted = this.evictLowestPriority();
      if (!evicted) {
        // All entries are promoted — refuse rather than exceed the cap.
        logVideoTelemetry('hls_pool_full_all_promoted', { poolSize: this.pool.size });
        try { hls.destroy(); } catch {}
        return false;
      }
    }

    // Clear any existing entry for this URL
    this.cleanup(url);

    // FIX #9: Use dynamic TTL based on memory pressure
    const ttl = this.getTTL();

    const entry: PooledHLSInstance = {
      hls,
      url,
      created: Date.now(),
      preloadedByVideo: preloadVideo,
      isPromoted: false,
      role,
      surface,
      timeoutId: setTimeout(() => {
        // Auto-cleanup if not promoted within TTL
        if (!this.pool.get(url)?.isPromoted) {
          logVideoTelemetry('hls_pool_expired', { url });
          this.cleanup(url);
        }
      }, ttl),
    };

    this.pool.set(url, entry);
    this.stats.registered++;
    logPoolEvent('success', 'register', url, this.stats.registered, this.pool.size);
    logVideoTelemetry('hls_pool_registered', {
      url,
      poolSize: this.pool.size,
    });
    return true;
  }

  /**
   * Check if a preloaded HLS instance is available for promotion
   */
  has(url: string): boolean {
    const entry = this.pool.get(url);
    return !!entry && !entry.isPromoted;
  }

  /** True if the url has ANY pool entry (promoted or preloaded). Unlike has(),
   *  does not exclude promoted entries — used by teardown to demote-not-destroy. */
  isPooled(url: string): boolean {
    return this.pool.has(url);
  }

  /**
   * Get pool debug info (urls and size)
   */
  getDebugStats(): { poolSize: number; urls: string[] } {
    return {
      poolSize: this.pool.size,
      urls: Array.from(this.pool.keys()),
    };
  }

  /**
   * Get pool counter stats for Phase 1 verification
   */
  getStats() {
    return { ...this.stats, currentPoolSize: this.pool.size };
  }

  /**
   * Promote a preloaded HLS instance to a new video element
   * Returns the HLS instance if successful, null otherwise
   */
  promote(url: string, targetVideo: HTMLVideoElement, startPosition?: number): HlsType | null {
    const entry = this.pool.get(url);
    
    if (!entry || entry.isPromoted) {
      logVideoTelemetry('hls_pool_miss', { url, reason: entry ? 'already_promoted' : 'not_found' });
      this.stats.missed++;
      logPoolEvent('warning', 'miss', url, this.stats.missed, this.pool.size);
      return null;
    }

    // Check cooldown to prevent rapid cycles
    const lastPromotion = this.promotionTimestamps.get(url) || 0;
    if (Date.now() - lastPromotion < POOL_CONFIG.promotionCooldown) {
      logVideoTelemetry('hls_pool_cooldown', { url });
      this.stats.missed++;
      logPoolEvent('warning', 'miss', url, this.stats.missed, this.pool.size);
      return null;
    }

    try {
      // Safety guard: refuse to steal a live source from a still-mounted
      // DIFFERENT element. Normal feed paths are URL-keyed (one tile per URL),
      // so this only fires on pathological cross-element transfer.
      const prev = entry.preloadedByVideo;
      if (prev && prev !== targetVideo && prev.isConnected) {
        this.stats.missed++;
        logPoolEvent('warning', 'miss', url, this.stats.missed, this.pool.size);
        return null;
      }

      // Clear the TTL timeout
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }

      // FLIP continuity v3: thread startPosition BEFORE attachMedia so hls.js
      // fetches segments starting at s.t on the (re-)opened MediaSource,
      // instead of loading from 0 and stalling until the seek catches up.
      if (startPosition != null && startPosition > 0.05) {
        try { (entry.hls as any).config.startPosition = startPosition; } catch {}
      }

      // Detach from preload video and attach to target
      entry.hls.detachMedia();
      entry.hls.attachMedia(targetVideo);

      
      // Mark as promoted
      entry.isPromoted = true;
      entry.role = 'promoted';
      entry.preloadedByVideo = null;
      this.promotionTimestamps.set(url, Date.now());

      logVideoTelemetry('hls_pool_promoted', { 
        url, 
        bufferedSeconds: this.getBufferedSeconds(entry.hls, targetVideo),
      });

      this.stats.promoted++;
      logPoolEvent('success', 'promote', url, this.stats.promoted, this.pool.size);
      return entry.hls;
    } catch (error) {
      logVideoTelemetry('hls_pool_promotion_failed', { url, error: String(error) });
      this.cleanup(url);
      return null;
    }
  }

  /**
   * Return a promoted instance to the pool (e.g., when scrolling away)
   * This allows the instance to be reused if the user scrolls back
   */
  demote(url: string, hls: HlsType, newPreloadVideo?: HTMLVideoElement): boolean {
    try {
      // Stop loading but don't destroy
      hls.stopLoad();
      
      if (newPreloadVideo) {
        hls.attachMedia(newPreloadVideo);
      } else {
        hls.detachMedia();
      }

      // Update pool entry
      const entry = this.pool.get(url);
      if (entry) {
        entry.isPromoted = false;
        entry.role = 'speculative';
        entry.preloadedByVideo = newPreloadVideo || null;

        // Clear any existing TTL timer before assigning a new one — otherwise
        // repeated demotes orphan timers that fire later in unpredictable batches.
        if (entry.timeoutId) {
          clearTimeout(entry.timeoutId);
        }

        // FIX #9: Set new TTL based on current memory pressure
        const ttl = this.getTTL();
        entry.timeoutId = setTimeout(() => {
          if (!this.pool.get(url)?.isPromoted) {
            this.cleanup(url);
          }
        }, ttl);
      }

      this.stats.demoted++;
      logPoolEvent('success', 'demote', url, this.stats.demoted, this.pool.size);
      logVideoTelemetry('hls_pool_demoted', { url });
      return true;
    } catch {
      this.cleanup(url);
      return false;
    }
  }

  /**
   * Phase 3 tile→viewer transition. Detach the instance from the tile's video
   * element WITHOUT evicting the pool entry, so the viewer's next promote(url,
   * viewerEl) inherits buffered segments + bandwidth history. Idempotent; safe
   * to call even if the URL isn't pooled.
   */
  handOff(url: string): boolean {
    const entry = this.pool.get(url);
    if (!entry) return false;
    try {
      entry.hls.stopLoad();
      try { entry.hls.detachMedia(); } catch {}
      entry.isPromoted = false;
      entry.role = 'handoff';
      entry.preloadedByVideo = null;
      if (entry.timeoutId) clearTimeout(entry.timeoutId);
      const ttl = this.getTTL();
      entry.timeoutId = setTimeout(() => {
        if (!this.pool.get(url)?.isPromoted) this.cleanup(url);
      }, ttl);
      logPoolEvent('success', 'demote', url, this.stats.demoted, this.pool.size);
      return true;
    } catch {
      this.cleanup(url);
      return false;
    }
  }
  /**
   * Fullscreen-only pruning. Cleans any pool entry tagged with `surface` that is
   * NOT in keepUrls and NOT currently promoted. Entries of OTHER surfaces (e.g.
   * 'feed') are never touched — the surface filter short-circuits before any
   * eviction, so the locked feed cannot be pruned by this path.
   */
  pruneSurface(surface: 'feed' | 'fullscreen', keepUrls: Iterable<string>): number {
    const keep = new Set(keepUrls);
    const toEvict: string[] = [];
    this.pool.forEach((entry, url) => {
      if (entry.surface !== surface) return;
      if (entry.isPromoted) return;
      if (keep.has(url)) return;
      toEvict.push(url);
    });
    toEvict.forEach(url => this.cleanup(url));
    return toEvict.length;
  }


  /**
   * Cleanup a specific URL entry
   */
  cleanup(url: string): void {
    const entry = this.pool.get(url);
    if (!entry) return;

    if (entry.timeoutId) {
      clearTimeout(entry.timeoutId);
    }

    try {
      entry.hls.stopLoad();
      entry.hls.detachMedia();
      entry.hls.destroy();
    } catch {
      // Silently handle cleanup errors
    }

    this.pool.delete(url);
    this.promotionTimestamps.delete(url);
    logVideoTelemetry('hls_pool_cleaned', { url, remainingSize: this.pool.size });
  }

  /**
   * Cleanup all pool entries
   */
  cleanupAll(): void {
    this.pool.forEach((_, url) => this.cleanup(url));
    this.promotionTimestamps.clear();
  }

  /**
   * Evict the lowest-priority non-promoted instance.
   * Priority order (evicted first -> last): 'speculative' -> 'handoff'.
   * 'promoted' entries are NEVER evicted. Returns true if something was evicted.
   * `mode='speculative-only'` restricts eviction to speculative entries
   * (used by the speculative sub-cap enforcement).
   */
  private evictLowestPriority(mode: 'default' | 'speculative-only' = 'default'): boolean {
    let candidateUrl: string | null = null;
    let candidateRole: PoolRole | null = null;
    let candidateTime = Infinity;

    // Pass 1: oldest speculative
    this.pool.forEach((entry, url) => {
      if (entry.role !== 'speculative') return;
      if (entry.created < candidateTime) {
        candidateTime = entry.created;
        candidateUrl = url;
        candidateRole = 'speculative';
      }
    });

    // Pass 2: oldest handoff (only if no speculative exists)
    if (!candidateUrl && mode === 'default') {
      this.pool.forEach((entry, url) => {
        if (entry.role !== 'handoff') return;
        if (entry.isPromoted) return; // defensive
        if (entry.created < candidateTime) {
          candidateTime = entry.created;
          candidateUrl = url;
          candidateRole = 'handoff';
        }
      });
    }

    if (candidateUrl) {
      logVideoTelemetry('hls_pool_evicted', { url: candidateUrl, role: candidateRole });
      this.cleanup(candidateUrl);
      return true;
    }
    return false;
  }

  /**
   * Get buffered seconds for telemetry
   */
  private getBufferedSeconds(hls: HlsType, video: HTMLVideoElement): number {
    try {
      if (video.buffered.length > 0) {
        return video.buffered.end(video.buffered.length - 1);
      }
    } catch {
      // Ignore buffered access errors
    }
    return 0;
  }

  /**
   * KEEP-ALIVE: Suspend all active HLS instances when tab becomes inactive
   * Stops loading new segments but preserves buffer for instant resume
   */
  suspendAll(): void {
    let suspended = 0;
    this.pool.forEach((entry) => {
      if (entry.hls && entry.isPromoted) {
        entry.hls.stopLoad(); // Stop loading new segments but preserve buffer
        entry.isPromoted = false; // Demote to preloaded state
        entry.role = 'speculative';
        suspended++;
      }
    });
    
    logVideoTelemetry('hls_pool_suspended_all', { 
      suspended, 
      poolSize: this.pool.size 
    });
  }

  /**
   * KEEP-ALIVE: Resume a specific HLS instance when tab becomes active
   * Resumes loading from current position
   */
  resumeActive(videoUrl: string): void {
    const entry = this.pool.get(videoUrl);
    if (entry?.hls && !entry.isPromoted) {
      entry.hls.startLoad(-1); // Resume loading from current position
      entry.isPromoted = true;
      entry.role = 'promoted';
      
      
      logVideoTelemetry('hls_pool_resumed', { 
        url: videoUrl 
      });
    }
  }

  /**
   * FIX #9: Destroy the pool manager and cleanup all resources
   * Call this on app unmount if needed
   */
  destroy(): void {
    // Clear memory check interval
    if (this.memoryCheckIntervalId) {
      clearInterval(this.memoryCheckIntervalId);
      this.memoryCheckIntervalId = undefined;
    }
    
    // Remove visibility handler
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }
    
    // Cleanup all pool entries
    this.cleanupAll();
    
    logVideoTelemetry('hls_pool_destroyed', {});
  }
}

// Global singleton
export const HLSPoolManager = new HLSPoolManagerClass();

// Export for type inference
export type { PooledHLSInstance };
