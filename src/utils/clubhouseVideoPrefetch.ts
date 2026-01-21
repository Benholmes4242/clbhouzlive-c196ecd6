import { supabase } from '@/integrations/supabase/client';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { extractCloudflareUid } from '@/utils/videoIdUtils';

let prefetchPromise: Promise<string[] | null> | null = null;
let lastPrefetchTime = 0;
let lastPrefetchedIds: string[] = [];
const PREFETCH_COOLDOWN_MS = 30000; // 30 second cooldown
const CLUBHOUSE_PREFETCH_COUNT = 8; // Match AppPrefetchProvider count

/**
 * Prefetch Clubhouse feed videos (newest shorts <120s)
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
      console.log('[ClubhousePrefetch] Starting clubhouse video prefetch');
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
      
      // Prefetch all videos in parallel
      const prefetchedIds: string[] = [];
      
      for (const post of data) {
        const mediaUrl = post.post_media?.[0]?.media_url;
        const streamId = extractCloudflareUid(mediaUrl || '');
        
        if (streamId) {
          prefetchedIds.push(streamId);
          const hlsUrl = generateStreamHlsUrl(streamId);
          console.log(`[ClubhousePrefetch] Prefetching [${prefetchedIds.length - 1}]: ${streamId.slice(0, 8)}`);
          preloadHlsManifest(hlsUrl, streamId); // Don't await - parallel
        }
      }
      
      lastPrefetchedIds = prefetchedIds;
      const elapsed = performance.now() - startTime;
      console.log(`[ClubhousePrefetch] ✅ Initiated prefetch for ${prefetchedIds.length} videos in ${elapsed.toFixed(0)}ms`);
      
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
