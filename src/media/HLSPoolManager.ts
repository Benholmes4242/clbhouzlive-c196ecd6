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

interface PooledHLSInstance {
  hls: HlsType;
  url: string;
  created: number;
  preloadedByVideo: HTMLVideoElement | null;
  isPromoted: boolean;
  timeoutId?: NodeJS.Timeout;
}

// Pool configuration
const POOL_CONFIG = {
  maxInstances: 12,          // Max instances to keep in pool
  maxInstancesLowMemory: 4,  // FIX #9: Reduced pool size under memory pressure
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
   * Register a preloaded HLS instance with the pool
   */
  register(
    url: string, 
    hls: HlsType, 
    preloadVideo: HTMLVideoElement
  ): void {
    // FIX #9: Use dynamic max based on memory pressure
    const maxInstances = this.getMaxInstances();
    
    // Evict oldest if at capacity
    while (this.pool.size >= maxInstances) {
      this.evictOldest();
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
      timeoutId: setTimeout(() => {
        // Auto-cleanup if not promoted within TTL
        if (!this.pool.get(url)?.isPromoted) {
          logVideoTelemetry('hls_pool_expired', { url });
          this.cleanup(url);
        }
      }, ttl),
    };

    this.pool.set(url, entry);
    logVideoTelemetry('hls_pool_registered', { 
      url, 
      poolSize: this.pool.size 
    });
  }

  /**
   * Check if a preloaded HLS instance is available for promotion
   */
  has(url: string): boolean {
    const entry = this.pool.get(url);
    return !!entry && !entry.isPromoted;
  }

  /**
   * Get pool stats for debugging
   */
  getStats(): { poolSize: number; urls: string[] } {
    return {
      poolSize: this.pool.size,
      urls: Array.from(this.pool.keys()),
    };
  }

  /**
   * Promote a preloaded HLS instance to a new video element
   * Returns the HLS instance if successful, null otherwise
   */
  promote(url: string, targetVideo: HTMLVideoElement): HlsType | null {
    const entry = this.pool.get(url);
    
    if (!entry || entry.isPromoted) {
      logVideoTelemetry('hls_pool_miss', { url, reason: entry ? 'already_promoted' : 'not_found' });
      return null;
    }

    // Check cooldown to prevent rapid cycles
    const lastPromotion = this.promotionTimestamps.get(url) || 0;
    if (Date.now() - lastPromotion < POOL_CONFIG.promotionCooldown) {
      logVideoTelemetry('hls_pool_cooldown', { url });
      return null;
    }

    try {
      // Clear the TTL timeout
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }

      // Detach from preload video and attach to target
      entry.hls.detachMedia();
      entry.hls.attachMedia(targetVideo);
      
      // Mark as promoted
      entry.isPromoted = true;
      entry.preloadedByVideo = null;
      this.promotionTimestamps.set(url, Date.now());

      logVideoTelemetry('hls_pool_promoted', { 
        url, 
        bufferedSeconds: this.getBufferedSeconds(entry.hls, targetVideo),
      });

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
        entry.preloadedByVideo = newPreloadVideo || null;
        
        // FIX #9: Set new TTL based on current memory pressure
        const ttl = this.getTTL();
        entry.timeoutId = setTimeout(() => {
          if (!this.pool.get(url)?.isPromoted) {
            this.cleanup(url);
          }
        }, ttl);
      }

      logVideoTelemetry('hls_pool_demoted', { url });
      return true;
    } catch {
      this.cleanup(url);
      return false;
    }
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
   * Evict the oldest non-promoted instance
   */
  private evictOldest(): void {
    let oldestUrl: string | null = null;
    let oldestTime = Infinity;

    this.pool.forEach((entry, url) => {
      if (!entry.isPromoted && entry.created < oldestTime) {
        oldestTime = entry.created;
        oldestUrl = url;
      }
    });

    if (oldestUrl) {
      logVideoTelemetry('hls_pool_evicted', { url: oldestUrl });
      this.cleanup(oldestUrl);
    }
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
