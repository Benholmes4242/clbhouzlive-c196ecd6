import { videoDebug } from '@/config/videoDebug';

/**
 * ManifestWarmer - Prefetches the first video manifest during app initialization
 * 
 * On cold start, the typical sequence is:
 * 1. App shell loads
 * 2. Auth check
 * 3. Navigation to Clubhouse
 * 4. Feed data fetches
 * 5. First video manifest fetches
 * 6. First segment downloads
 * 7. Video plays
 * 
 * By caching the last-known first video URL and prefetching its manifest
 * during step 1-2 (before navigation), we can overlap step 5 with steps 2-4,
 * saving 100-200ms on cold start.
 * 
 * Caveat: If Cloudflare Stream URLs are pre-signed with short expiry,
 * the cached URL may be stale. We handle this gracefully by ignoring failures.
 */

const STORAGE_KEY = 'clbhouz_last_first_video_manifest';
const STORAGE_KEY_TIMESTAMP = 'clbhouz_last_first_video_timestamp';

// Max age for cached URL (24 hours) - adjust based on your URL expiry
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

class ManifestWarmerClass {
  private static instance: ManifestWarmerClass;
  private hasWarmed: boolean = false;
  private warmingPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): ManifestWarmerClass {
    if (!ManifestWarmerClass.instance) {
      ManifestWarmerClass.instance = new ManifestWarmerClass();
    }
    return ManifestWarmerClass.instance;
  }

  /**
   * Attempt to warm the manifest cache on app initialization
   * Call this as early as possible in your app bootstrap
   * 
   * This is fire-and-forget - failures are silently ignored
   */
  public warmOnStartup(): void {
    if (this.hasWarmed) return;
    this.hasWarmed = true;

    this.warmingPromise = this.doWarm();
  }

  private async doWarm(): Promise<void> {
    try {
      const cachedUrl = localStorage.getItem(STORAGE_KEY);
      const cachedTimestamp = localStorage.getItem(STORAGE_KEY_TIMESTAMP);

      if (!cachedUrl) {
        videoDebug('bootstrap', 'ManifestWarmer: No cached URL found');
        return;
      }

      // Check if cached URL is too old
      if (cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp, 10);
        if (age > MAX_CACHE_AGE_MS) {
          videoDebug('bootstrap', 'ManifestWarmer: Cached URL expired', { 
            ageHours: (age / (60 * 60 * 1000)).toFixed(1) 
          });
          this.clearCache();
          return;
        }
      }

      videoDebug('bootstrap', 'ManifestWarmer: Warming manifest', { url: cachedUrl });

      // Fire-and-forget fetch with low priority
      // The goal is just to get the manifest into browser HTTP cache
      const startTime = performance.now();
      
      const response = await fetch(cachedUrl, {
        method: 'GET',
        // Low priority - don't compete with critical resources
        // @ts-ignore - priority is a valid fetch option in modern browsers
        priority: 'low',
        // Allow browser to use cached response
        cache: 'default',
      });

      if (response.ok) {
        const elapsed = performance.now() - startTime;
        videoDebug('bootstrap', 'ManifestWarmer: Manifest warmed successfully', { 
          elapsed: elapsed.toFixed(0) + 'ms' 
        });
      } else {
        // URL may have expired - clear cache
        videoDebug('bootstrap', 'ManifestWarmer: Manifest fetch failed', { 
          status: response.status 
        });
        this.clearCache();
      }
    } catch (error) {
      // Network error or URL expired - clear cache silently
      videoDebug('bootstrap', 'ManifestWarmer: Warming failed', { error });
      this.clearCache();
    }
  }

  /**
   * Store the first video URL for next cold start
   * Call this after successfully loading the first video on Clubhouse
   */
  public cacheFirstVideoUrl(manifestUrl: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, manifestUrl);
      localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
      videoDebug('bootstrap', 'ManifestWarmer: Cached first video URL', { url: manifestUrl });
    } catch {
      // localStorage may be full or disabled - ignore
    }
  }

  /**
   * Clear the cached URL (call on logout or when URL is known to be invalid)
   */
  public clearCache(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY_TIMESTAMP);
    } catch {
      // Ignore
    }
  }

  /**
   * Wait for warming to complete (useful if you want to sequence operations)
   */
  public async waitForWarm(): Promise<void> {
    if (this.warmingPromise) {
      await this.warmingPromise;
    }
  }
}

export const ManifestWarmer = ManifestWarmerClass.getInstance();
