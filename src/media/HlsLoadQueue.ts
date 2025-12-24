/**
 * HlsLoadQueue - Network priority queue for HLS video loading
 * 
 * Prevents network congestion by limiting concurrent HLS loads.
 * Without this, all grid videos try to load manifests and fragments
 * simultaneously, causing 8x slower load times (170ms -> 1400ms).
 * 
 * Strategy:
 * - Max 3 concurrent HLS loads at once
 * - Priority queue: hero video first, then by visibility order
 * - Stagger new loads by 50ms to smooth network usage
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
  resolve: () => void;
  reject: (error: Error) => void;
}

class HlsLoadQueueManager {
  private queue: QueueItem[] = [];
  private loading = new Set<string>();
  private maxConcurrent = 3; // Max simultaneous HLS loads
  private staggerDelayMs = 50; // Delay between starting new loads
  private processing = false;
  
  /**
   * Request to load an HLS source. Returns a promise that resolves
   * when loading is allowed to start (may be queued).
   */
  request(
    mediaId: string, 
    priority: number,
    loadFn: () => Promise<void> | void
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
      this.queue.push({ mediaId, priority, loadFn, resolve, reject });
      this.sortQueue();
      
      logDebug('QUEUED', { 
        mediaId: mediaId.slice(0, 8), 
        priority, 
        queueLength: this.queue.length,
        currentlyLoading: this.loading.size,
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
        
        logDebug('STARTING', { 
          mediaId: item.mediaId.slice(0, 8), 
          priority: item.priority,
          concurrentLoads: this.loading.size,
        });
        
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
