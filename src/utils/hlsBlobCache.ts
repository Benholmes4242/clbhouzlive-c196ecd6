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
  readyCallbacks: Array<() => void>;
}

class HlsBlobCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize = 50;
  private maxCacheAge = 5 * 60 * 1000; // 5 minutes
  private totalBytesUsed = 0;
  private maxTotalBytes = 200 * 1024 * 1024; // 200MB max

  storeManifest(videoId: string, hlsUrl: string, manifestText: string): void {
    const entry = this.getOrCreateEntry(videoId);
    entry.manifest = {
      text: manifestText,
      timestamp: Date.now(),
    };
  }

  async storeSegment(videoId: string, segmentUrl: string, response: Response): Promise<void> {
    const entry = this.getOrCreateEntry(videoId);
    const blob = await response.clone().blob();
    const blobUrl = URL.createObjectURL(blob);
    
    entry.segments.set(segmentUrl, {
      blob,
      blobUrl,
      size: blob.size,
      timestamp: Date.now(),
    });
    
    this.totalBytesUsed += blob.size;
    this.evictIfNeeded();
  }

  markReady(videoId: string): void {
    const entry = this.cache.get(videoId);
    if (entry) {
      entry.ready = true;
      entry.prefetchEndTime = Date.now();
      
      for (const callback of entry.readyCallbacks) {
        try { callback(); } catch {}
      }
      entry.readyCallbacks = [];
    }
  }

  isReady(videoId: string): boolean {
    return this.cache.get(videoId)?.ready ?? false;
  }

  /**
   * Check if a prefetch is in progress (entry exists but not ready yet)
   */
  isPending(videoId: string): boolean {
    const entry = this.cache.get(videoId);
    return entry !== undefined && !entry.ready;
  }

  hasManifest(videoId: string): boolean {
    return this.cache.get(videoId)?.manifest !== undefined;
  }

  getManifest(videoId: string): string | null {
    return this.cache.get(videoId)?.manifest?.text ?? null;
  }

  hasSegment(videoId: string, segmentUrl: string): boolean {
    const entry = this.cache.get(videoId);
    if (!entry) return false;
    
    if (entry.segments.has(segmentUrl)) return true;
    
    const segmentFilename = segmentUrl.split('/').pop()?.split('?')[0];
    if (segmentFilename) {
      for (const storedUrl of entry.segments.keys()) {
        const storedFilename = storedUrl.split('/').pop()?.split('?')[0];
        if (storedFilename === segmentFilename) return true;
      }
    }
    
    return false;
  }

  getSegmentBlobUrl(videoId: string, segmentUrl: string): string | null {
    return this.cache.get(videoId)?.segments.get(segmentUrl)?.blobUrl ?? null;
  }

  getSegmentBlob(videoId: string, segmentUrl: string): Blob | null {
    const entry = this.cache.get(videoId);
    if (!entry) return null;
    
    const exactMatch = entry.segments.get(segmentUrl);
    if (exactMatch) return exactMatch.blob;
    
    const segmentFilename = segmentUrl.split('/').pop()?.split('?')[0];
    if (segmentFilename) {
      for (const [storedUrl, segment] of entry.segments.entries()) {
        const storedFilename = storedUrl.split('/').pop()?.split('?')[0];
        if (storedFilename === segmentFilename) return segment.blob;
      }
    }
    
    return null;
  }

  getStats(videoId: string): { ready: boolean; hasManifest: boolean; segmentCount: number; totalBytes: number; age: number } | null {
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

  hasEntry(videoId: string): boolean {
    return this.cache.has(videoId);
  }

  waitForReady(videoId: string, timeoutMs: number = 2000): Promise<boolean> {
    const entry = this.cache.get(videoId);
    if (!entry) return Promise.resolve(false);
    if (entry.ready) return Promise.resolve(true);
    
    return new Promise((resolve) => {
      let resolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, timeoutMs);
      
      const onReady = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve(true);
        }
      };
      
      entry.readyCallbacks.push(onReady);
    });
  }

  private evictIfNeeded(): void {
    if (this.cache.size > this.maxCacheSize) {
      this.evictOldest(this.cache.size - this.maxCacheSize);
    }

    while (this.totalBytesUsed > this.maxTotalBytes && this.cache.size > 0) {
      this.evictOldest(1);
    }

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

    entry.segments.forEach(segment => {
      URL.revokeObjectURL(segment.blobUrl);
      this.totalBytesUsed -= segment.size;
    });

    this.cache.delete(videoId);
  }

  clear(): void {
    for (const videoId of this.cache.keys()) {
      this.evict(videoId);
    }
  }

  getOverallStats(): { videoCount: number; readyCount: number; totalBytes: number; totalSegments: number } {
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

export const hlsBlobCache = new HlsBlobCache();

if (typeof window !== 'undefined') {
  (window as any).hlsBlobCache = hlsBlobCache;
}