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
  instanceTTL: 30000,        // 30s - auto-cleanup idle instances
  promotionCooldown: 100,    // 100ms - prevent rapid detach/attach cycles
};

class HLSPoolManagerClass {
  private pool: Map<string, PooledHLSInstance> = new Map();
  private promotionTimestamps: Map<string, number> = new Map();

  /**
   * Register a preloaded HLS instance with the pool
   */
  register(
    url: string, 
    hls: HlsType, 
    preloadVideo: HTMLVideoElement
  ): void {
    // Evict oldest if at capacity
    if (this.pool.size >= POOL_CONFIG.maxInstances) {
      this.evictOldest();
    }

    // Clear any existing entry for this URL
    this.cleanup(url);

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
      }, POOL_CONFIG.instanceTTL),
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
        
        // Set new TTL
        entry.timeoutId = setTimeout(() => {
          if (!this.pool.get(url)?.isPromoted) {
            this.cleanup(url);
          }
        }, POOL_CONFIG.instanceTTL);
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
}

// Global singleton
export const HLSPoolManager = new HLSPoolManagerClass();

// Export for type inference
export type { PooledHLSInstance };
