/**
 * HlsLoadQueue - Network priority queue for HLS video loading
 * 
 * Prevents network congestion by limiting concurrent HLS loads.
 * Without this, all grid videos try to load manifests and fragments
 * simultaneously, causing 8x slower load times (170ms -> 1400ms).
 * 
 * Strategy:
 * - Adaptive concurrent limit based on network conditions (1-3)
 * - Priority queue: hero video first, then by visibility order
 * - Stagger new loads with adaptive delay (50-300ms)
 * - onStart callback: timeout timers start when dequeued, not when queued
 */

// Debug logging
const DEBUG_HLS_QUEUE = true;
const logDebug = (event: string, data?: any) => {
  if (!DEBUG_HLS_QUEUE) return;
  const timestamp = performance.now().toFixed(2);
  console.log(`[${timestamp}ms] [HlsLoadQueue] ${event}`, data || '');
};

interface QueueItem {
  mediaId: string;
  priority: number; // Higher = more important
  loadFn: () => Promise<void> | void;
  onStart?: () => void; // Called when load actually begins (for timeout timers)
  resolve: () => void;
  reject: (error: Error) => void;
  queuedAt: number;
}

class HlsLoadQueueManager {
  private queue: QueueItem[] = [];
  private loading = new Set<string>();
  private maxConcurrent: number;
  private staggerDelayMs: number;
  private processing = false;
  
  // Initial load boost: allow more concurrent loads for first N videos
  private initialLoadCount = 0;
  private readonly INITIAL_BOOST_THRESHOLD = 6;
  private readonly INITIAL_BOOST_CONCURRENT = 4;
  
  constructor() {
    this.maxConcurrent = this.getAdaptiveMaxConcurrent();
    this.staggerDelayMs = this.getAdaptiveStaggerDelay();
    
    // Listen for network changes to adapt limits dynamically
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', () => {
        this.maxConcurrent = this.getAdaptiveMaxConcurrent();
        this.staggerDelayMs = this.getAdaptiveStaggerDelay();
        logDebug('NETWORK_CHANGE', { 
          maxConcurrent: this.maxConcurrent, 
          staggerDelayMs: this.staggerDelayMs,
          effectiveType: connection.effectiveType 
        });
      });
    }
  }
  
  /**
   * Get adaptive max concurrent loads based on network quality.
   * Boosts concurrency for first 6 videos (what user sees immediately).
   */
  private getAdaptiveMaxConcurrent(): number {
    // Boost concurrency for first 6 videos (initial viewport)
    if (this.initialLoadCount < this.INITIAL_BOOST_THRESHOLD) {
      return this.INITIAL_BOOST_CONCURRENT;
    }
    
    // After initial load, use network-adaptive limits
    if (typeof navigator === 'undefined') return 2;
    const connection = (navigator as any).connection;
    
    if (!connection) return 2;
    
    switch (connection.effectiveType) {
      case '4g':
        return 3;
      case '3g':
        return 2;
      case '2g':
      case 'slow-2g':
        return 1;
      default:
        return 2;
    }
  }
  
  /**
   * Reset initial load counter (call when navigating away and back).
   */
  public resetInitialLoad(): void {
    this.initialLoadCount = 0;
    this.maxConcurrent = this.getAdaptiveMaxConcurrent();
    logDebug('RESET_INITIAL_LOAD', { maxConcurrent: this.maxConcurrent });
  }
  
  /**
   * Get adaptive stagger delay based on network quality.
   */
  private getAdaptiveStaggerDelay(): number {
    if (typeof navigator === 'undefined') return 100;
    const connection = (navigator as any).connection;
    
    if (!connection) return 100;
    
    switch (connection.effectiveType) {
      case '4g':
        return 50;
      case '3g':
        return 150;
      case '2g':
      case 'slow-2g':
        return 300;
      default:
        return 100;
    }
  }
  
  /**
   * Request to load an HLS source. Returns a promise that resolves
   * when loading is allowed to start (may be queued).
   * 
   * @param mediaId - Unique ID for this media
   * @param priority - Higher = more important
   * @param loadFn - Function that performs the actual HLS loading
   * @param onStart - Called when load actually begins (start timeout timers here!)
   */
  request(
    mediaId: string, 
    priority: number,
    loadFn: () => Promise<void> | void,
    onStart?: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loading
      if (this.loading.has(mediaId)) {
        logDebug('ALREADY_LOADING', { mediaId: mediaId.slice(0, 8) });
        resolve();
        return;
      }
      
      // Check if already in queue
      const existingIdx = this.queue.findIndex(item => item.mediaId === mediaId);
      if (existingIdx >= 0) {
        // Update priority if higher
        if (priority > this.queue[existingIdx].priority) {
          this.queue[existingIdx].priority = priority;
          this.sortQueue();
        }
        logDebug('ALREADY_QUEUED', { mediaId: mediaId.slice(0, 8), priority });
        resolve();
        return;
      }
      
      // Add to queue
      this.queue.push({ 
        mediaId, 
        priority, 
        loadFn, 
        onStart,
        resolve, 
        reject,
        queuedAt: Date.now()
      });
      this.sortQueue();
      
      logDebug('QUEUED', { 
        mediaId: mediaId.slice(0, 8), 
        priority, 
        queueLength: this.queue.length,
        currentlyLoading: this.loading.size,
        maxConcurrent: this.maxConcurrent,
      });
      
      // Process queue
      this.processQueue();
    });
  }
  
  /**
   * Notify that loading is complete for a media item.
   */
  complete(mediaId: string): void {
    if (this.loading.has(mediaId)) {
      this.loading.delete(mediaId);
      logDebug('COMPLETE', { 
        mediaId: mediaId.slice(0, 8), 
        stillLoading: this.loading.size,
        queued: this.queue.length,
      });
      
      // Process next in queue
      this.processQueue();
    }
  }
  
  /**
   * Cancel a pending load request.
   */
  cancel(mediaId: string): void {
    const idx = this.queue.findIndex(item => item.mediaId === mediaId);
    if (idx >= 0) {
      const item = this.queue.splice(idx, 1)[0];
      item.reject(new Error('Cancelled'));
      logDebug('CANCELLED', { mediaId: mediaId.slice(0, 8) });
    }
    
    // Also remove from loading set if currently loading
    this.loading.delete(mediaId);
  }
  
  /**
   * Clear all pending requests (e.g., on unmount).
   */
  clear(): void {
    logDebug('CLEAR', { queueLength: this.queue.length, loading: this.loading.size });
    this.queue.forEach(item => item.reject(new Error('Queue cleared')));
    this.queue = [];
    this.loading.clear();
  }
  
  /**
   * Get current queue stats for debugging.
   */
  getStats() {
    return {
      queued: this.queue.length,
      loading: this.loading.size,
      maxConcurrent: this.maxConcurrent,
      staggerDelayMs: this.staggerDelayMs,
    };
  }
  
  private sortQueue(): void {
    // Sort by priority (highest first)
    this.queue.sort((a, b) => b.priority - a.priority);
  }
  
  private async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.processing) return;
    this.processing = true;
    
    try {
      while (this.queue.length > 0 && this.loading.size < this.maxConcurrent) {
        const item = this.queue.shift();
        if (!item) break;
        
        // Add to loading set
        this.loading.add(item.mediaId);
        
        const waitTime = Date.now() - item.queuedAt;
        
        // Track initial load count for boost logic
        this.initialLoadCount++;
        const isBoostPhase = this.initialLoadCount <= this.INITIAL_BOOST_THRESHOLD;
        
        // Update max concurrent after boost phase ends
        if (this.initialLoadCount === this.INITIAL_BOOST_THRESHOLD) {
          this.maxConcurrent = this.getAdaptiveMaxConcurrent();
        }
        
        logDebug('STARTING', { 
          mediaId: item.mediaId.slice(0, 8), 
          priority: item.priority,
          concurrentLoads: this.loading.size,
          waitTimeMs: waitTime,
          initialLoadCount: this.initialLoadCount,
          boostPhase: isBoostPhase,
        });
        
        // CRITICAL: Call onStart callback BEFORE starting load
        // This is when timeout timers should be started, not when queued
        if (item.onStart) {
          try {
            item.onStart();
          } catch (e) {
            logDebug('ON_START_ERROR', { mediaId: item.mediaId.slice(0, 8), error: e });
          }
        }
        
        // Start loading (don't await - let it run in background)
        try {
          const result = item.loadFn();
          if (result instanceof Promise) {
            result.catch(err => {
              logDebug('LOAD_ERROR', { mediaId: item.mediaId.slice(0, 8), error: err.message });
            });
          }
          item.resolve();
        } catch (err) {
          logDebug('LOAD_SYNC_ERROR', { mediaId: item.mediaId.slice(0, 8) });
          item.reject(err as Error);
        }
        
        // Stagger delay between starting loads
        if (this.queue.length > 0 && this.loading.size < this.maxConcurrent) {
          await new Promise(resolve => setTimeout(resolve, this.staggerDelayMs));
        }
      }
    } finally {
      this.processing = false;
    }
  }
}

// Singleton instance
export const HlsLoadQueue = new HlsLoadQueueManager();
