/**
 * useWatchReadyQueue - Tracks video ready state for Watch tab
 * 
 * Tracks both Hero video and Shorts grid readiness:
 * - Hero ready = 1 video prefetched
 * - Grid ready = 3+ videos prefetched
 * - isFeedReady = heroReady && gridReady
 * 
 * Similar pattern to Clubhouse ready queue.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { extractCloudflareUid } from '@/utils/videoIdUtils';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { WatchShort } from '@/hooks/useWatchShorts';
import { HeroVideo } from '@/hooks/useWatchHeroVideo';
import { getLastPrefetchedHeroId, getLastPrefetchedGridIds } from '@/utils/heroVideoPrefetch';
import { isPrefetchComplete } from '@/utils/hlsPreload';

// Minimum grid videos that must be ready before revealing feed
const MINIMUM_GRID_READY_COUNT = 3;

interface UseWatchReadyQueueResult {
  /** True when both hero AND grid are ready */
  isFeedReady: boolean;
  /** True when hero video is ready */
  isHeroReady: boolean;
  /** True when minimum grid videos are ready */
  isGridReady: boolean;
  /** Count of ready grid videos */
  gridReadyCount: number;
  /** Total grid videos being tracked */
  gridTotalCount: number;
  /** Debug info for logging */
  debugInfo: {
    hasHero: boolean;
    hasGridItems: boolean;
    heroReady: boolean;
    gridVideosReady: boolean;
  };
}

export function useWatchReadyQueue(
  heroVideo: HeroVideo | null,
  shorts: WatchShort[]
): UseWatchReadyQueueResult {
  const { readySet, markReady, initiatePrefetch } = useVideoReadyQueue();
  
  // Refs to prevent infinite loops
  const hasPrefetchedRef = useRef(false);
  const lastPrefetchCountRef = useRef(0);
  const prevHeroReadyRef = useRef(false);
  const prevGridReadyCountRef = useRef(0);
  
  // Extract hero Cloudflare UID from media URL
  const heroCloudflareUid = useMemo(() => {
    if (!heroVideo?.media?.[0]?.media_url) return null;
    return extractCloudflareUid(heroVideo.media[0].media_url);
  }, [heroVideo?.media]);
  
  // Extract grid Cloudflare UIDs from shorts (first 6 for ready-gating)
  const gridCloudflareUids = useMemo(() => {
    const uids: string[] = [];
    
    for (const short of shorts.slice(0, 6)) {
      if (short.media?.[0]?.media_url) {
        const uid = extractCloudflareUid(short.media[0].media_url);
        if (uid) {
          uids.push(uid);
        }
      }
    }
    
    return uids;
  }, [shorts]);
  
  // Build video URL map for prefetch
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    
    // Add hero
    if (heroCloudflareUid) {
      map.set(heroCloudflareUid, generateStreamHlsUrl(heroCloudflareUid));
    }
    
    // Add grid videos
    for (const uid of gridCloudflareUids) {
      map.set(uid, generateStreamHlsUrl(uid));
    }
    
    return map;
  }, [heroCloudflareUid, gridCloudflareUids]);
  
  const videoUrlMapSize = videoUrlMap.size;
  
  // Check for already-prefetched videos from navigation prefetch
  useEffect(() => {
    // Check hero from nav prefetch
    const navHeroId = getLastPrefetchedHeroId();
    if (navHeroId && isPrefetchComplete(navHeroId) && !readySet.has(navHeroId)) {
      console.log('[WatchReadyQueue] Marking nav-prefetched hero ready:', navHeroId.slice(0, 8));
      markReady(navHeroId);
    }
    
    // Check grid videos from nav prefetch
    const navGridIds = getLastPrefetchedGridIds();
    if (navGridIds.length > 0) {
      for (const uid of navGridIds) {
        if (isPrefetchComplete(uid) && !readySet.has(uid)) {
          markReady(uid);
        }
      }
    }
  }, [readySet, markReady]);
  
  // Trigger prefetch when we have videos to prefetch
  useEffect(() => {
    if (videoUrlMapSize === 0) return;
    if (hasPrefetchedRef.current && lastPrefetchCountRef.current === videoUrlMapSize) return;
    
    // Build ordered list: hero first, then grid
    const allUids: string[] = [];
    if (heroCloudflareUid) allUids.push(heroCloudflareUid);
    allUids.push(...gridCloudflareUids);
    
    console.log('[WatchReadyQueue] 🚀 Initiating prefetch for', allUids.length, 'videos');
    console.log('[WatchReadyQueue] Hero:', heroCloudflareUid?.slice(0, 8), '| Grid:', gridCloudflareUids.slice(0, 3).map(u => u.slice(0, 8)));
    
    initiatePrefetch(allUids, 0, videoUrlMap);
    
    hasPrefetchedRef.current = true;
    lastPrefetchCountRef.current = videoUrlMapSize;
  }, [videoUrlMapSize, heroCloudflareUid, gridCloudflareUids.length]);
  
  // Check hero ready
  const isHeroReady = useMemo(() => {
    if (!heroCloudflareUid) return false;
    return readySet.has(heroCloudflareUid);
  }, [heroCloudflareUid, readySet]);
  
  // Calculate grid ready count
  const gridReadyCount = useMemo(() => {
    let count = 0;
    for (const uid of gridCloudflareUids) {
      if (readySet.has(uid)) count++;
    }
    return count;
  }, [gridCloudflareUids, readySet]);
  
  // Determine if sections are ready
  const hasHero = Boolean(heroCloudflareUid);
  const hasGridItems = gridCloudflareUids.length > 0;
  const heroReady = !hasHero || isHeroReady;
  const gridVideosReady = gridReadyCount >= Math.min(MINIMUM_GRID_READY_COUNT, gridCloudflareUids.length);
  
  // Grid is ready if:
  // 1. No grid items → ready immediately
  // 2. Has grid items → wait for minimum ready count
  const isGridReady = !hasGridItems || gridVideosReady;
  
  // Feed is ready when BOTH hero AND grid are ready
  const isFeedReady = heroReady && isGridReady;
  
  // Debug logging for hero ready state changes
  useEffect(() => {
    if (hasHero && isHeroReady !== prevHeroReadyRef.current) {
      console.log('[WatchReadyQueue] Hero ready:', isHeroReady, '| uid:', heroCloudflareUid?.slice(0, 8));
      prevHeroReadyRef.current = isHeroReady;
    }
  }, [isHeroReady, hasHero, heroCloudflareUid]);
  
  // Debug logging for grid ready count changes
  useEffect(() => {
    if (hasGridItems && gridReadyCount !== prevGridReadyCountRef.current) {
      console.log('[WatchReadyQueue] Grid ready count:', gridReadyCount, '/', Math.min(MINIMUM_GRID_READY_COUNT, gridCloudflareUids.length));
      prevGridReadyCountRef.current = gridReadyCount;
    }
  }, [gridReadyCount, hasGridItems, gridCloudflareUids.length]);
  
  // Debug logging for overall feed ready state
  useEffect(() => {
    if (hasHero || hasGridItems) {
      console.log('[WatchReadyQueue] isFeedReady:', isFeedReady, '| heroReady:', heroReady, '| gridReady:', isGridReady);
    }
  }, [isFeedReady, heroReady, isGridReady, hasHero, hasGridItems]);
  
  return {
    isFeedReady,
    isHeroReady,
    isGridReady,
    gridReadyCount,
    gridTotalCount: gridCloudflareUids.length,
    debugInfo: {
      hasHero,
      hasGridItems,
      heroReady,
      gridVideosReady,
    },
  };
}
