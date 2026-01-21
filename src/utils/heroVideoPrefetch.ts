/**
 * Hero Video Prefetch Utility
 * 
 * Prefetches the Watch tab hero video AND first 6 grid videos HLS manifest 
 * and first segments before the user navigates to the tab, enabling near-instant playback.
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
const GRID_PREFETCH_COUNT = 6; // Number of grid videos to prefetch

/**
 * Prefetch the Watch hero video AND first grid videos HLS manifest and segments.
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
      console.log('[HeroPrefetch] Starting hero + grid video prefetch');
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
      
      // Extract hero stream ID
      let heroStreamId: string | null = null;
      if (heroData) {
        const mediaUrl = heroData.post_media?.[0]?.media_url;
        heroStreamId = extractCloudflareUid(mediaUrl || '');
        
        if (heroStreamId) {
          // Prefetch hero video (don't await - run in parallel with grid fetch)
          const hlsUrl = generateStreamHlsUrl(heroStreamId);
          console.log(`[HeroPrefetch] Prefetching hero: ${heroStreamId.slice(0, 8)}`);
          preloadHlsManifest(hlsUrl, heroStreamId);
        } else {
          console.log('[HeroPrefetch] Could not extract stream ID from:', mediaUrl?.slice(0, 50));
        }
      } else {
        console.log('[HeroPrefetch] No hero video found');
      }
      
      // Fetch first grid videos (newest shorts, excluding hero)
      const gridStreamIds = await prefetchGridVideos(heroStreamId);
      
      lastPrefetchedStreamId = heroStreamId;
      const elapsed = performance.now() - startTime;
      console.log(`[HeroPrefetch] ✅ Initiated prefetch for hero + ${gridStreamIds.length} grid videos in ${elapsed.toFixed(0)}ms`);
      
      return heroStreamId;
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
 * Prefetch first grid videos (newest shorts, excluding hero)
 */
async function prefetchGridVideos(heroStreamId: string | null): Promise<string[]> {
  try {
    // Fetch newest shorts that will appear in the grid
    const { data: gridData, error } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(GRID_PREFETCH_COUNT + 1); // +1 in case hero is in this list
    
    if (error) {
      console.log('[HeroPrefetch] Grid query error:', error.message);
      return [];
    }
    
    if (!gridData || gridData.length === 0) {
      console.log('[HeroPrefetch] No grid videos found');
      return [];
    }
    
    // Prefetch grid videos (excluding hero)
    const gridStreamIds: string[] = [];
    for (const post of gridData) {
      if (gridStreamIds.length >= GRID_PREFETCH_COUNT) break;
      
      const mediaUrl = post.post_media?.[0]?.media_url;
      const streamId = extractCloudflareUid(mediaUrl || '');
      
      // Skip if no stream ID or if it's the hero video
      if (!streamId || streamId === heroStreamId) continue;
      
      gridStreamIds.push(streamId);
      const hlsUrl = generateStreamHlsUrl(streamId);
      console.log(`[HeroPrefetch] Prefetching grid[${gridStreamIds.length - 1}]: ${streamId.slice(0, 8)}`);
      // Don't await - run all prefetches in parallel
      preloadHlsManifest(hlsUrl, streamId);
    }
    
    return gridStreamIds;
  } catch (err) {
    console.error('[HeroPrefetch] Grid prefetch failed:', err);
    return [];
  }
}

/**
 * Fetch hero candidate from database - matches useWatchHeroVideo query logic EXACTLY
 * 
 * IMPORTANT: This must stay in sync with useWatchHeroVideo's fetchMostLiked function
 * to ensure prefetch hits the same video that will be displayed.
 */
async function fetchHeroCandidate(
  since: Date | null, 
  label: string
): Promise<HeroCandidate | null> {
  // Use exact same query structure as useWatchHeroVideo - including limit(50) for filtering
  let query = supabase
    .from('posts')
    .select(`
      id,
      like_count,
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
    .limit(50); // Match useWatchHeroVideo's limit for consistent results
  
  if (since) {
    query = query.gte('created_at', since.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.log(`[HeroPrefetch] ${label} query error:`, error.message);
    return null;
  }
  
  // Filter for video posts client-side (match useWatchHeroVideo behavior)
  const videos = data?.filter(post =>
    (post as any).post_media?.some((m: any) => m.media_type === 'video')
  );
  
  if (!videos || videos.length === 0) {
    console.log(`[HeroPrefetch] ${label}: No results`);
    return null;
  }
  
  const topPost = videos[0];
  
  // Find video media (first video)
  const videoMedia = topPost.post_media?.find(
    (m) => m.media_type === 'video'
  );
  
  if (!videoMedia) {
    console.log(`[HeroPrefetch] ${label}: No video media found`);
    return null;
  }
  
  console.log(`[HeroPrefetch] ${label}: Found hero ${topPost.id?.slice(0, 8)} (likes: ${topPost.like_count})`);
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
  like_count: number | null;
  post_media?: Array<{ id: string; media_url: string; media_type: string }>;
}
