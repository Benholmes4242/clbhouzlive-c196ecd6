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
    return this.cache.get(videoId)?.segments.has(segmentUrl) ?? false;
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
    return this.cache.get(videoId)?.segments.get(segmentUrl)?.blob ?? null;
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
      };
      this.cache.set(videoId, entry);
    }
    return entry;
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
