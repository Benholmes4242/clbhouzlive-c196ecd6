// =============================================================================
// HLS BLOB CACHE - Explicit cache for prefetched video segments
// =============================================================================
// This replaces the unreliable browser HTTP cache approach with an explicit
// in-memory blob cache that HLS.js can consume directly.
// =============================================================================

interface CachedSegment {
  blob: Blob;
  blobUrl: string;
  size: number;
  timestamp: number;
}

interface CachedManifest {
  text: string;
  timestamp: number;
}

interface CacheEntry {
  manifest?: CachedManifest;
  segments: Map<string, CachedSegment>;
  ready: boolean;
  prefetchStartTime: number;
  prefetchEndTime?: number;
  // Callbacks waiting for this video to be ready
  readyCallbacks: Array<() => void>;
}

class HlsBlobCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize = 50; // Max number of videos to cache
  private maxCacheAge = 5 * 60 * 1000; // 5 minutes
  private totalBytesUsed = 0;
  private maxTotalBytes = 200 * 1024 * 1024; // 200MB max

  // ===========================================================================
  // PREFETCH API - Called by hlsPreload.ts
  // ===========================================================================

  /**
   * Store a prefetched manifest
   */
  storeManifest(videoId: string, hlsUrl: string, manifestText: string): void {
    const entry = this.getOrCreateEntry(videoId);
    entry.manifest = {
      text: manifestText,
      timestamp: Date.now(),
    };
    
    console.log(`[HlsBlobCache] Stored manifest for ${videoId.slice(0, 8)}`);
  }

  /**
   * Store a prefetched segment as a blob
   */
  async storeSegment(
    videoId: string, 
    segmentUrl: string, 
    response: Response
  ): Promise<void> {
    const entry = this.getOrCreateEntry(videoId);
    
    // Clone the response so we can read it
    const blob = await response.clone().blob();
    const blobUrl = URL.createObjectURL(blob);
    
    entry.segments.set(segmentUrl, {
      blob,
      blobUrl,
      size: blob.size,
      timestamp: Date.now(),
    });
    
    this.totalBytesUsed += blob.size;
    
    console.log(
      `[HlsBlobCache] Stored segment for ${videoId.slice(0, 8)} ` +
      `(${Math.round(blob.size / 1024)}KB, total: ${Math.round(this.totalBytesUsed / 1024 / 1024)}MB)`
    );
    
    // Evict old entries if we're over the limit
    this.evictIfNeeded();
  }

  /**
   * Mark a video as fully prefetched and ready
   */
  markReady(videoId: string): void {
    const entry = this.cache.get(videoId);
    if (entry) {
      entry.ready = true;
      entry.prefetchEndTime = Date.now();
      const elapsed = entry.prefetchEndTime - entry.prefetchStartTime;
      console.log(
        `[HlsBlobCache] ✅ ${videoId.slice(0, 8)} ready ` +
        `(${entry.segments.size} segments, ${elapsed}ms)`
      );
      
      // Notify all waiting callbacks
      for (const callback of entry.readyCallbacks) {
        try {
          callback();
        } catch {}
      }
      entry.readyCallbacks = [];
    }
  }

  // ===========================================================================
  // PLAYER API - Called by HLS.js loader or HLSPlayer
  // ===========================================================================

  /**
   * Check if a video has been prefetched and is ready
   */
  isReady(videoId: string): boolean {
    const entry = this.cache.get(videoId);
    return entry?.ready ?? false;
  }

  /**
   * Check if we have a cached manifest for this URL
   */
  hasManifest(videoId: string): boolean {
    return this.cache.get(videoId)?.manifest !== undefined;
  }

  /**
   * Get the cached manifest text
   */
  getManifest(videoId: string): string | null {
    return this.cache.get(videoId)?.manifest?.text ?? null;
  }

  /**
   * Check if we have a cached segment for this URL
   */
  hasSegment(videoId: string, segmentUrl: string): boolean {
    const entry = this.cache.get(videoId);
    if (!entry) {
      console.log(`[HlsBlobCache] hasSegment: NO ENTRY for video ${videoId.slice(0, 8)}`);
      return false;
    }
    
    // Try exact match first
    if (entry.segments.has(segmentUrl)) {
      return true;
    }
    
    // Try matching by segment filename (ignoring query params and base URL)
    // This handles cases where the manifest returns different URLs than what we stored
    const segmentFilename = segmentUrl.split('/').pop()?.split('?')[0];
    if (segmentFilename) {
      for (const storedUrl of entry.segments.keys()) {
        const storedFilename = storedUrl.split('/').pop()?.split('?')[0];
        if (storedFilename === segmentFilename) {
          console.log(
            `[HlsBlobCache] hasSegment: FUZZY MATCH ${segmentFilename} ` +
            `(stored: ${storedUrl.slice(-40)}, requested: ${segmentUrl.slice(-40)})`
          );
          return true;
        }
      }
    }
    
    // Debug: Log the URLs to help diagnose mismatches
    if (entry.segments.size > 0) {
      const storedUrls = Array.from(entry.segments.keys()).map(u => u.slice(-50));
      console.log(
        `[HlsBlobCache] hasSegment MISS for ${videoId.slice(0, 8)}: ` +
        `requested "${segmentUrl.slice(-50)}", stored: [${storedUrls.join(', ')}]`
      );
    }
    
    return false;
  }

  /**
   * Get a cached segment as a blob URL (for HLS.js to load)
   */
  getSegmentBlobUrl(videoId: string, segmentUrl: string): string | null {
    return this.cache.get(videoId)?.segments.get(segmentUrl)?.blobUrl ?? null;
  }

  /**
   * Get a cached segment as a Blob
   */
  getSegmentBlob(videoId: string, segmentUrl: string): Blob | null {
    const entry = this.cache.get(videoId);
    if (!entry) return null;
    
    // Try exact match first
    const exactMatch = entry.segments.get(segmentUrl);
    if (exactMatch) return exactMatch.blob;
    
    // Try matching by segment filename (ignoring query params and base URL)
    const segmentFilename = segmentUrl.split('/').pop()?.split('?')[0];
    if (segmentFilename) {
      for (const [storedUrl, segment] of entry.segments.entries()) {
        const storedFilename = storedUrl.split('/').pop()?.split('?')[0];
        if (storedFilename === segmentFilename) {
          return segment.blob;
        }
      }
    }
    
    return null;
  }

  /**
   * Get cache stats for a video (for debugging)
   */
  getStats(videoId: string): {
    ready: boolean;
    hasManifest: boolean;
    segmentCount: number;
    totalBytes: number;
    age: number;
  } | null {
    const entry = this.cache.get(videoId);
    if (!entry) return null;

    let totalBytes = 0;
    entry.segments.forEach(seg => totalBytes += seg.size);

    return {
      ready: entry.ready,
      hasManifest: !!entry.manifest,
      segmentCount: entry.segments.size,
      totalBytes,
      age: Date.now() - entry.prefetchStartTime,
    };
  }

  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================

  private getOrCreateEntry(videoId: string): CacheEntry {
    let entry = this.cache.get(videoId);
    if (!entry) {
      entry = {
        segments: new Map(),
        ready: false,
        prefetchStartTime: Date.now(),
        readyCallbacks: [],
      };
      this.cache.set(videoId, entry);
    }
    return entry;
  }

  // ===========================================================================
  // WAIT FOR PREFETCH API - Used by HLSPlayer to wait for prefetch completion
  // ===========================================================================

  /**
   * Check if prefetch is in progress for this video (entry exists but not ready)
   */
  hasEntry(videoId: string): boolean {
    return this.cache.has(videoId);
  }

  /**
   * Wait for a video to become ready (prefetch complete).
   * Returns immediately if already ready or no entry exists.
   * Times out after specified duration.
   * 
   * @param videoId - The stream UID to wait for
   * @param timeoutMs - Maximum time to wait (default 2000ms)
   * @returns Promise that resolves to true if ready, false if timed out or no entry
   */
  waitForReady(videoId: string, timeoutMs: number = 2000): Promise<boolean> {
    const entry = this.cache.get(videoId);
    
    // If no entry exists, prefetch isn't running - don't wait
    if (!entry) {
      console.log(`[HlsBlobCache] waitForReady: No entry for ${videoId.slice(0, 8)} - proceeding immediately`);
      return Promise.resolve(false);
    }
    
    // Already ready - return immediately
    if (entry.ready) {
      console.log(`[HlsBlobCache] waitForReady: ${videoId.slice(0, 8)} already ready`);
      return Promise.resolve(true);
    }
    
    // Prefetch in progress - wait for it
    console.log(`[HlsBlobCache] waitForReady: Waiting for ${videoId.slice(0, 8)} prefetch to complete...`);
    
    return new Promise((resolve) => {
      let resolved = false;
      
      // Timeout handler
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log(`[HlsBlobCache] waitForReady: TIMEOUT waiting for ${videoId.slice(0, 8)} after ${timeoutMs}ms`);
          resolve(false);
        }
      }, timeoutMs);
      
      // Callback when ready
      const onReady = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          console.log(`[HlsBlobCache] waitForReady: ${videoId.slice(0, 8)} became ready!`);
          resolve(true);
        }
      };
      
      entry.readyCallbacks.push(onReady);
    });
  }

  private evictIfNeeded(): void {
    // Evict by count
    if (this.cache.size > this.maxCacheSize) {
      this.evictOldest(this.cache.size - this.maxCacheSize);
    }

    // Evict by total size
    while (this.totalBytesUsed > this.maxTotalBytes && this.cache.size > 0) {
      this.evictOldest(1);
    }

    // Evict stale entries
    const now = Date.now();
    for (const [videoId, entry] of this.cache.entries()) {
      if (now - entry.prefetchStartTime > this.maxCacheAge) {
        this.evict(videoId);
      }
    }
  }

  private evictOldest(count: number): void {
    const sorted = Array.from(this.cache.entries())
      .sort((a, b) => a[1].prefetchStartTime - b[1].prefetchStartTime);

    for (let i = 0; i < count && i < sorted.length; i++) {
      this.evict(sorted[i][0]);
    }
  }

  private evict(videoId: string): void {
    const entry = this.cache.get(videoId);
    if (!entry) return;

    // Revoke all blob URLs to free memory
    entry.segments.forEach(segment => {
      URL.revokeObjectURL(segment.blobUrl);
      this.totalBytesUsed -= segment.size;
    });

    this.cache.delete(videoId);
    console.log(`[HlsBlobCache] Evicted ${videoId.slice(0, 8)}`);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    for (const videoId of this.cache.keys()) {
      this.evict(videoId);
    }
    console.log('[HlsBlobCache] Cache cleared');
  }

  /**
   * Get overall cache stats
   */
  getOverallStats(): {
    videoCount: number;
    readyCount: number;
    totalBytes: number;
    totalSegments: number;
  } {
    let readyCount = 0;
    let totalSegments = 0;

    this.cache.forEach(entry => {
      if (entry.ready) readyCount++;
      totalSegments += entry.segments.size;
    });

    return {
      videoCount: this.cache.size,
      readyCount,
      totalBytes: this.totalBytesUsed,
      totalSegments,
    };
  }
}

// Global singleton
export const hlsBlobCache = new HlsBlobCache();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).hlsBlobCache = hlsBlobCache;
}
