import { supabase } from '@/integrations/supabase/client';
import { preloadHlsManifest, isPrefetchComplete } from '@/utils/hlsPreload';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { extractCloudflareUid } from '@/utils/videoIdUtils';

let prefetchPromise: Promise<string[] | null> | null = null;
let lastPrefetchTime = 0;
let lastPrefetchedIds: string[] = [];
const PREFETCH_COOLDOWN_MS = 15000; // 15 second cooldown (faster for instant video)
const CLUBHOUSE_PREFETCH_COUNT = 12; // Prefetch more for instant playback

// Track poster prefetch promises to avoid duplicate network requests
const posterPrefetchPromises = new Map<string, Promise<void>>();

/**
 * Prefetch a poster image
 */
async function prefetchPoster(streamId: string): Promise<void> {
  const posterUrl = generateStreamThumbnailUrl(streamId, { height: 800, fit: 'cover' });
  
  // Check if already prefetching
  const existing = posterPrefetchPromises.get(streamId);
  if (existing) return existing;
  
  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve anyway to not block
    img.src = posterUrl;
  });
  
  posterPrefetchPromises.set(streamId, promise);
  return promise;
}

/**
 * Prefetch Clubhouse feed videos (newest shorts <120s)
 * 
 * INSTANT VIDEO: Prefetches both HLS manifests+segments AND poster images
 * for truly instant playback with no loading states.
 * 
 * Call this on Home tab hover for instant page load
 */
export async function prefetchClubhouseVideos(): Promise<string[] | null> {
  const now = Date.now();
  
  if (now - lastPrefetchTime < PREFETCH_COOLDOWN_MS) {
    console.log('[ClubhousePrefetch] Skipped - within cooldown');
    return lastPrefetchedIds;
  }
  
  if (prefetchPromise) {
    console.log('[ClubhousePrefetch] Already in progress');
    return prefetchPromise;
  }
  
  lastPrefetchTime = now;
  
  prefetchPromise = (async () => {
    try {
      console.log('[ClubhousePrefetch] Starting instant video prefetch');
      const startTime = performance.now();
      
      // Query matches useInfiniteClubhouseShorts / fetchClubhouseExploreShorts
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          post_media!inner (
            id,
            media_url,
            media_type,
            duration_seconds
          )
        `)
        .eq('visibility', 'anyone')
        .eq('post_media.media_type', 'video')
        .lt('post_media.duration_seconds', 120) // Shorts only (<120s)
        .order('created_at', { ascending: false })
        .limit(CLUBHOUSE_PREFETCH_COUNT);
      
      if (error) {
        console.error('[ClubhousePrefetch] Query error:', error.message);
        return null;
      }
      
      if (!data || data.length === 0) {
        console.log('[ClubhousePrefetch] No videos found');
        return null;
      }
      
      // Prefetch all videos in parallel - HLS + posters
      const prefetchedIds: string[] = [];
      const prefetchPromises: Promise<void>[] = [];
      
      for (const post of data) {
        const mediaUrl = post.post_media?.[0]?.media_url;
        const streamId = extractCloudflareUid(mediaUrl || '');
        
        if (streamId) {
          prefetchedIds.push(streamId);
          
          // Skip if already prefetched
          if (!isPrefetchComplete(streamId)) {
            const hlsUrl = generateStreamHlsUrl(streamId);
            console.log(`[ClubhousePrefetch] Prefetching [${prefetchedIds.length - 1}]: ${streamId.slice(0, 8)}`);
            
            // Prefetch HLS (manifest + first 2 segments)
            prefetchPromises.push(preloadHlsManifest(hlsUrl, streamId));
          }
          
          // Always prefetch poster (fast, cached by browser)
          prefetchPromises.push(prefetchPoster(streamId));
        }
      }
      
      // Wait for first 6 videos to be fully prefetched (what user sees immediately)
      const criticalPromises = prefetchPromises.slice(0, 12); // 6 videos × 2 (HLS + poster)
      await Promise.allSettled(criticalPromises);
      
      lastPrefetchedIds = prefetchedIds;
      const elapsed = performance.now() - startTime;
      console.log(`[ClubhousePrefetch] ✅ Instant prefetch for ${prefetchedIds.length} videos in ${elapsed.toFixed(0)}ms`);
      
      return prefetchedIds;
    } catch (err) {
      console.error('[ClubhousePrefetch] Failed:', err);
      return null;
    } finally {
      prefetchPromise = null;
    }
  })();
  
  return prefetchPromise;
}

export function getLastPrefetchedClubhouseIds(): string[] {
  return lastPrefetchedIds;
}

export function resetClubhousePrefetch(): void {
  prefetchPromise = null;
  lastPrefetchTime = 0;
  lastPrefetchedIds = [];
}
