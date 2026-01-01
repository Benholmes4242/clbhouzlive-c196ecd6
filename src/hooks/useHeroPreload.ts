/**
 * useHeroPreload - Preloads hero video manifest BEFORE component mounts
 * 
 * This hook solves the 2.2s delay where manifest preload only starts
 * when DiscoverHero mounts (which waits for data to arrive).
 * 
 * Instead, we start preloading immediately when content data arrives,
 * so the manifest is already fetched by the time Hero renders.
 */

import { useEffect, useRef } from 'react';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { logHeroPreloadManifest } from '@/utils/discoverTimeline';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import type { ExploreContentItem } from '@/components/explore/types';

const LANDSCAPE_THRESHOLD = 1.25;

/**
 * Find the first landscape video that would be used as the hero
 */
function findHeroCandidate(content: ExploreContentItem[] | null): ExploreContentItem | null {
  if (!content || content.length === 0) return null;
  
  return content.find(item => {
    if (item.type !== 'video') return false;
    
    // Check explicit aspect ratio
    if (item.aspectRatio && item.aspectRatio >= LANDSCAPE_THRESHOLD) {
      return true;
    }
    
    // Compute from dimensions
    if (item.width && item.height && item.height > 0) {
      const computedAspectRatio = item.width / item.height;
      return computedAspectRatio >= LANDSCAPE_THRESHOLD;
    }
    
    // Check landscape flag
    return item.landscapeSuitable === true;
  }) || null;
}

/**
 * Hook that preloads hero video manifest as soon as content arrives.
 * Call this in the parent component (DiscoverContent) so preloading
 * starts immediately when data is fetched, not when Hero mounts.
 */
export function useHeroPreload(content: ExploreContentItem[] | null): void {
  const preloadedIdRef = useRef<string | null>(null);
  const preloadStartedRef = useRef(false); // Prevent duplicate preloads from race conditions
  
  useEffect(() => {
    if (!content || content.length === 0) return;
    
    const heroCandidate = findHeroCandidate(content);
    if (!heroCandidate) return;
    
    // STRICT: Don't preload if already started for this ID
    if (preloadedIdRef.current === heroCandidate.id) {
      return; // Skip duplicate log removed for cleaner console
    }
    
    // Double-check with started flag to prevent race conditions
    if (preloadStartedRef.current && preloadedIdRef.current) {
      return; // Already started log removed for cleaner console
    }
    
    const mediaUrl = heroCandidate.media?.[0]?.media_url || heroCandidate.src;
    if (!mediaUrl) return;
    
    const uid = uidFromNode({ src: mediaUrl });
    if (!uid) return;
    
    // Mark BEFORE starting (prevent race conditions)
    preloadedIdRef.current = heroCandidate.id;
    preloadStartedRef.current = true;
    
    // Start preloading manifest immediately
    const hlsUrl = generateStreamHlsUrl(uid);
    
    console.log('[HeroPreload] Starting preload', {
      id: heroCandidate.id.slice(0, 8),
      uid: uid.slice(0, 8),
      timestamp: performance.now().toFixed(1),
    });
    
    logHeroPreloadManifest(heroCandidate.id);
    preloadHlsManifest(hlsUrl);
  }, [content]);
}
