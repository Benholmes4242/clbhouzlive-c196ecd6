/**
 * Poster Image Prefetching Utility
 * 
 * Prefetches video poster/thumbnail images to browser cache
 * so they display instantly when cards scroll into view.
 * This eliminates the dark screen flash before video loads.
 */

// Track which posters are already prefetched/prefetching
const prefetchedPosters = new Set<string>();
const prefetchingPosters = new Set<string>();
// Track failed posters to avoid using them
const failedPosters = new Set<string>();

/**
 * Check if a poster URL failed to load
 */
export const isPosterFailed = (posterUrl: string): boolean => {
  return failedPosters.has(posterUrl);
};

/**
 * Prefetch a single poster image
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
 * Prefetch multiple poster images in parallel
 * Silently handles failures - doesn't throw
 */
export const prefetchPosters = async (posterUrls: string[]): Promise<void> => {
  const newUrls = posterUrls.filter(url => 
    url && !prefetchedPosters.has(url) && !prefetchingPosters.has(url)
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
};

/**
 * Get prefetch stats for debugging
 */
export const getPosterPrefetchStats = () => ({
  cached: prefetchedPosters.size,
  inProgress: prefetchingPosters.size,
  failed: failedPosters.size,
});
