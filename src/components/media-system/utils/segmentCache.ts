/**
 * SegmentCache — LRU blob cache for prefetched HLS segments.
 * Caps at 50MB to prevent memory bloat.
 */

interface CachedSegment {
  url: string;
  blob: Blob;
  size: number;
  cachedAt: number;
}

const MAX_CACHE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

class SegmentCache {
  private cache = new Map<string, CachedSegment>();
  private totalSize = 0;

  has(url: string): boolean {
    return this.cache.has(url);
  }

  get(url: string): Blob | null {
    return this.cache.get(url)?.blob ?? null;
  }

  set(url: string, blob: Blob): void {
    if (this.cache.has(url)) return;
    const size = blob.size;

    // Evict LRU entries if over budget
    while (this.totalSize + size > MAX_CACHE_SIZE_BYTES && this.cache.size > 0) {
      let oldestKey = '';
      let oldestTime = Infinity;
      this.cache.forEach((entry, key) => {
        if (entry.cachedAt < oldestTime) {
          oldestTime = entry.cachedAt;
          oldestKey = key;
        }
      });
      if (oldestKey) {
        const evicted = this.cache.get(oldestKey);
        if (evicted) this.totalSize -= evicted.size;
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(url, { url, blob, size, cachedAt: Date.now() });
    this.totalSize += size;
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  get sizeBytes(): number {
    return this.totalSize;
  }
}

export const segmentCache = new SegmentCache();
