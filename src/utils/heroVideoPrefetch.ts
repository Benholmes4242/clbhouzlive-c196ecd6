/**
 * Hero Video Prefetch Utility
 * 
 * Prefetches the Watch tab hero video HLS manifest and first segments
 * before the user navigates to the tab, enabling near-instant playback.
 * 
 * Uses the same query logic as useWatchHeroVideo to ensure consistency.
 */

import { supabase } from '@/integrations/supabase/client';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { extractCloudflareUid } from '@/utils/videoIdUtils';

let prefetchPromise: Promise<string | null> | null = null;
let lastPrefetchTime = 0;
let lastPrefetchedStreamId: string | null = null;
const PREFETCH_COOLDOWN_MS = 30000; // Don't re-prefetch within 30s

/**
 * Prefetch the Watch hero video HLS manifest and first segments.
 * Call this before navigating to Watch tab for instant playback.
 */
export async function prefetchHeroVideo(): Promise<string | null> {
  const now = Date.now();
  
  // Check cooldown
  if (now - lastPrefetchTime < PREFETCH_COOLDOWN_MS) {
    console.log('[HeroPrefetch] Skipped - within cooldown');
    return lastPrefetchedStreamId;
  }
  
  // Return existing promise if already in progress
  if (prefetchPromise) {
    console.log('[HeroPrefetch] Already in progress');
    return prefetchPromise;
  }
  
  lastPrefetchTime = now;
  
  prefetchPromise = (async () => {
    try {
      console.log('[HeroPrefetch] Starting hero video prefetch');
      const startTime = performance.now();
      
      // Try TODAY first (last 24 hours) - matches useWatchHeroVideo logic
      const todaySince = new Date();
      todaySince.setHours(todaySince.getHours() - 24);
      
      let heroData = await fetchHeroCandidate(todaySince, 'TODAY');
      
      // Fallback to WEEK if no TODAY results
      if (!heroData) {
        const weekSince = new Date();
        weekSince.setDate(weekSince.getDate() - 7);
        heroData = await fetchHeroCandidate(weekSince, 'WEEK');
      }
      
      // Fallback to MONTH if no WEEK results
      if (!heroData) {
        const monthSince = new Date();
        monthSince.setMonth(monthSince.getMonth() - 1);
        heroData = await fetchHeroCandidate(monthSince, 'MONTH');
      }
      
      // Final fallback: ALL TIME
      if (!heroData) {
        heroData = await fetchHeroCandidate(null, 'ALL_TIME');
      }
      
      if (!heroData) {
        console.log('[HeroPrefetch] No hero video found');
        return null;
      }
      
      // Extract stream ID from the media URL
      const mediaUrl = heroData.post_media?.[0]?.media_url;
      const streamId = extractCloudflareUid(mediaUrl || '');
      
      if (!streamId) {
        console.log('[HeroPrefetch] Could not extract stream ID from:', mediaUrl?.slice(0, 50));
        return null;
      }
      
      // Prefetch HLS manifest and segments
      const hlsUrl = generateStreamHlsUrl(streamId);
      await preloadHlsManifest(hlsUrl, streamId);
      
      lastPrefetchedStreamId = streamId;
      const elapsed = performance.now() - startTime;
      console.log(`[HeroPrefetch] ✅ Prefetched hero ${streamId.slice(0, 8)} in ${elapsed.toFixed(0)}ms`);
      
      return streamId;
    } catch (err) {
      console.error('[HeroPrefetch] Failed:', err);
      return null;
    } finally {
      prefetchPromise = null;
    }
  })();
  
  return prefetchPromise;
}

/**
 * Fetch hero candidate from database - matches useWatchHeroVideo query logic
 */
async function fetchHeroCandidate(
  since: Date | null, 
  label: string
): Promise<HeroCandidate | null> {
  // Use exact same query structure as useWatchHeroVideo
  let query = supabase
    .from('posts')
    .select(`
      id,
      post_media!inner (
        id,
        media_url,
        media_type
      )
    `)
    .eq('visibility', 'anyone')
    .eq('post_media.media_type', 'video')
    .order('like_count', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (since) {
    query = query.gte('created_at', since.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.log(`[HeroPrefetch] ${label} query error:`, error.message);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log(`[HeroPrefetch] ${label}: No results`);
    return null;
  }
  
  const topPost = data[0];
  
  // Find video media
  const videoMedia = topPost.post_media?.find(
    (m) => m.media_type === 'video'
  );
  
  if (!videoMedia) {
    console.log(`[HeroPrefetch] ${label}: No video media found`);
    return null;
  }
  
  console.log(`[HeroPrefetch] ${label}: Found hero ${topPost.id?.slice(0, 8)}`);
  return topPost as HeroCandidate;
}

/**
 * Get the last prefetched stream ID (useful for debugging)
 */
export function getLastPrefetchedHeroId(): string | null {
  return lastPrefetchedStreamId;
}

/**
 * Reset prefetch state (useful for testing)
 */
export function resetHeroPrefetch(): void {
  prefetchPromise = null;
  lastPrefetchTime = 0;
  lastPrefetchedStreamId = null;
}

// Types
interface HeroCandidate {
  id: string;
  post_media?: Array<{ id: string; media_url: string; media_type: string }>;
}
