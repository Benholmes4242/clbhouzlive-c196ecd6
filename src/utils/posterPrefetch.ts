/**
 * Poster Image Prefetching Utility
 * 
 * Prefetches video poster/thumbnail images to browser cache
 * so they display instantly when cards scroll into view.
 * This eliminates the dark screen flash before video loads.
 * 
 * ROBUST FALLBACKS: Tries multiple thumbnail strategies when primary fails:
 * 1. Primary: time=1s (skip black intro frames)
 * 2. Fallback: time=0s (first frame)
 * 3. Final: fit=crop instead of fit=cover
 */

// Track which posters are already prefetched/prefetching
const prefetchedPosters = new Set<string>();
const prefetchingPosters = new Set<string>();
// Track failed posters to avoid using them
const failedPosters = new Set<string>();
// Track working poster URLs (may be different from original due to fallbacks)
const workingPosterUrls = new Map<string, string>();

/**
 * Check if a poster URL failed to load
 */
export const isPosterFailed = (posterUrl: string): boolean => {
  return failedPosters.has(posterUrl);
};

/**
 * Get a working poster URL for a Cloudflare UID
 * Returns the fallback URL if the original failed
 */
export const getWorkingPosterUrl = (cloudflareUid: string, originalUrl?: string): string | null => {
  // Check if we have a known working URL for this UID
  const working = workingPosterUrls.get(cloudflareUid);
  if (working) return working;
  
  // If original was already tried and failed, return null
  if (originalUrl && failedPosters.has(originalUrl)) {
    return null;
  }
  
  return originalUrl || null;
};

/**
 * Generate fallback poster URLs for a Cloudflare Stream video
 */
export const generatePosterFallbacks = (cloudflareUid: string, height = 800): string[] => {
  const baseUrl = `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${cloudflareUid}/thumbnails/thumbnail.jpg`;
  
  return [
    `${baseUrl}?time=1s&height=${height}&fit=crop`,    // Primary: 1s with crop
    `${baseUrl}?time=0s&height=${height}&fit=crop`,    // Fallback: first frame with crop
    `${baseUrl}?height=${height}&fit=crop`,             // No time param
    `${baseUrl}?time=1s&height=${Math.min(height, 400)}&fit=crop`, // Lower res
  ];
};

/**
 * Prefetch a single poster image with fallback support
 * Returns a promise that resolves when loaded or rejects on error
 */
export const prefetchPoster = (posterUrl: string): Promise<void> => {
  // Skip if already prefetched or currently prefetching
  if (prefetchedPosters.has(posterUrl) || prefetchingPosters.has(posterUrl)) {
    return Promise.resolve();
  }
  
  // Skip if already known to be failed
  if (failedPosters.has(posterUrl)) {
    return Promise.reject(new Error(`Poster previously failed: ${posterUrl}`));
  }
  
  prefetchingPosters.add(posterUrl);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      prefetchingPosters.delete(posterUrl);
      prefetchedPosters.add(posterUrl);
      resolve();
    };
    
    img.onerror = () => {
      prefetchingPosters.delete(posterUrl);
      // Mark as failed so we don't try to use it
      failedPosters.add(posterUrl);
      reject(new Error(`Failed to prefetch poster: ${posterUrl}`));
    };
    
    // Start the fetch
    img.src = posterUrl;
  });
};

/**
 * Prefetch poster with automatic fallback to alternatives
 * Tries each fallback URL until one succeeds
 */
export const prefetchPosterWithFallback = async (
  cloudflareUid: string,
  originalUrl?: string,
  height = 800
): Promise<string | null> => {
  // Generate fallback URLs
  const fallbackUrls = generatePosterFallbacks(cloudflareUid, height);
  
  // Add original URL to the front if provided and different
  const urlsToTry = originalUrl && !fallbackUrls.includes(originalUrl)
    ? [originalUrl, ...fallbackUrls]
    : fallbackUrls;
  
  // Try each URL in order
  for (const url of urlsToTry) {
    // Skip already-failed URLs
    if (failedPosters.has(url)) continue;
    
    // Skip already-prefetching URLs
    if (prefetchingPosters.has(url)) {
      // Wait for it to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      if (prefetchedPosters.has(url)) {
        workingPosterUrls.set(cloudflareUid, url);
        return url;
      }
      continue;
    }
    
    try {
      await prefetchPoster(url);
      // Success! Store the working URL
      workingPosterUrls.set(cloudflareUid, url);
      return url;
    } catch {
      // This URL failed, try next
      continue;
    }
  }
  
  // All URLs failed
  console.warn(`[posterPrefetch] All thumbnail URLs failed for ${cloudflareUid.slice(0, 8)}`);
  return null;
};

/**
 * Prefetch multiple poster images in parallel
 * Silently handles failures - doesn't throw
 */
export const prefetchPosters = async (posterUrls: string[]): Promise<void> => {
  const newUrls = posterUrls.filter(url => 
    url && !prefetchedPosters.has(url) && !prefetchingPosters.has(url) && !failedPosters.has(url)
  );
  
  if (newUrls.length === 0) return;
  
  // Fire all prefetches in parallel, don't wait for all to complete
  await Promise.allSettled(newUrls.map(url => prefetchPoster(url)));
};

/**
 * Check if a poster is already cached
 */
export const isPosterCached = (posterUrl: string): boolean => {
  return prefetchedPosters.has(posterUrl);
};

/**
 * Clear the prefetch cache (useful for memory management)
 */
export const clearPosterCache = (): void => {
  prefetchedPosters.clear();
  prefetchingPosters.clear();
  failedPosters.clear();
  workingPosterUrls.clear();
};

/**
 * Get prefetch stats for debugging
 */
export const getPosterPrefetchStats = () => ({
  cached: prefetchedPosters.size,
  inProgress: prefetchingPosters.size,
  failed: failedPosters.size,
  workingUrls: workingPosterUrls.size,
});
