/**
 * Phase 1 Perf: Simple in-memory cache for map URLs to avoid duplicate generation
 */

interface MapUrlCacheEntry {
  url: string;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, MapUrlCacheEntry>();

export function getCachedMapUrl(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  // Check if cache entry is still valid
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return entry.url;
}

export function setCachedMapUrl(key: string, url: string): void {
  cache.set(key, {
    url,
    timestamp: Date.now()
  });
}

export function generateMapCacheKey(lat: number, lng: number, size: string, zoom: number, mapType?: string): string {
  return `${lat},${lng},${size},${zoom},${mapType || 'hybrid'}`;
}
