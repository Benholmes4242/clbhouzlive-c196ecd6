/**
 * useClubhouseReadyQueue - Tracks video ready state for Clubhouse feed
 * 
 * Similar to Profile page pattern:
 * - Tracks Cloudflare UIDs of videos
 * - Monitors prefetch completion via ReadyQueue
 * - Only signals "ready" when minimum videos are prefetched
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { extractCloudflareUid } from '@/utils/videoIdUtils';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { ExploreContentItem } from '@/components/explore/types';
import { getLastPrefetchedClubhouseIds } from '@/utils/clubhouseVideoPrefetch';
import { isPrefetchComplete } from '@/utils/hlsPreload';

// Minimum videos that must be ready before revealing feed
const MINIMUM_READY_COUNT = 3;

interface UseClubhouseReadyQueueResult {
  /** True when minimum videos are prefetched and ready to show */
  isFeedReady: boolean;
  /** Current count of ready videos */
  readyCount: number;
  /** Total videos being tracked */
  totalCount: number;
  /** Signal that a video's first frame rendered */
  markVideoReady: (cloudflareUid: string) => void;
  /** Debug info for logging */
  debugInfo: {
    hasItems: boolean;
    hasVideos: boolean;
    videosReady: boolean;
  };
}

export function useClubhouseReadyQueue(
  posts: ExploreContentItem[]
): UseClubhouseReadyQueueResult {
  const { readySet, markReady, initiatePrefetch } = useVideoReadyQueue();
  
  // Refs to prevent infinite loops
  const hasPrefetchedRef = useRef(false);
  const lastPrefetchCountRef = useRef(0);
  const prevReadyCountRef = useRef(0);
  
  // Extract Cloudflare UIDs from posts - uses ExploreContentItem shape
  const videoCloudflareUids = useMemo(() => {
    const uids: string[] = [];
    
    for (const post of posts) {
      // ExploreContentItem uses 'src' for the primary media URL and 'type' for media type
      if (post.type === 'video' && post.src) {
        const uid = extractCloudflareUid(post.src);
        if (uid) {
          uids.push(uid);
          continue;
        }
      }
      
      // Check media array as fallback
      if (post.media && post.media.length > 0) {
        for (const m of post.media) {
          if (m.media_type === 'video' && m.media_url) {
            const uid = extractCloudflareUid(m.media_url);
            if (uid) {
              uids.push(uid);
              break; // Only first video per post
            }
          }
        }
      }
    }
    
    return uids;
  }, [posts]);
  
  // Build video URL map for prefetch
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    
    for (const uid of videoCloudflareUids) {
      map.set(uid, generateStreamHlsUrl(uid));
    }
    
    return map;
  }, [videoCloudflareUids]);
  
  const videoUrlMapSize = videoUrlMap.size;
  
  // Debug log URL map creation (once)
  useEffect(() => {
    if (videoUrlMapSize > 0 && lastPrefetchCountRef.current !== videoUrlMapSize) {
      console.log('[ClubhouseReadyQueue] Video URL map created:', videoUrlMapSize, 'videos');
    }
  }, [videoUrlMapSize]);
  
  // Check for already-prefetched videos from navigation prefetch
  useEffect(() => {
    // Check videos from navigation prefetch
    const navPrefetched = getLastPrefetchedClubhouseIds();
    if (navPrefetched.length > 0) {
      console.log('[ClubhouseReadyQueue] Checking nav-prefetched videos:', navPrefetched.length);
      
      for (const uid of navPrefetched) {
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
    
    console.log('[ClubhouseReadyQueue] 🚀 Batch 0: prefetching', videoCloudflareUids.slice(0, 6));
    initiatePrefetch(videoCloudflareUids, 0, videoUrlMap);
    
    hasPrefetchedRef.current = true;
    lastPrefetchCountRef.current = videoUrlMapSize;
  }, [videoUrlMapSize, videoCloudflareUids.length]);
  
  // Calculate ready count
  const readyCount = useMemo(() => {
    let count = 0;
    for (const uid of videoCloudflareUids) {
      if (readySet.has(uid)) count++;
    }
    return count;
  }, [videoCloudflareUids, readySet]);
  
  // Log ready count changes (not in render path)
  useEffect(() => {
    if (videoCloudflareUids.length > 0 && readyCount !== prevReadyCountRef.current) {
      console.log('[ClubhouseReadyQueue] Ready count:', readyCount, '/', Math.min(MINIMUM_READY_COUNT, videoCloudflareUids.length));
      prevReadyCountRef.current = readyCount;
    }
  }, [readyCount, videoCloudflareUids.length]);
  
  // Determine if feed is ready
  const hasItems = posts.length > 0;
  const hasVideos = videoCloudflareUids.length > 0;
  const videosReady = readyCount >= Math.min(MINIMUM_READY_COUNT, videoCloudflareUids.length);
  
  // Ready conditions:
  // 1. No items yet → not ready (show skeleton)
  // 2. Items but no videos → ready immediately  
  // 3. Items with videos → wait for minimum ready count
  const isFeedReady = hasItems && (!hasVideos || videosReady);
  
  // Debug log when ready state changes
  useEffect(() => {
    if (hasItems && hasVideos) {
      console.log('[ClubhouseReadyQueue] isFeedReady:', isFeedReady, '| hasItems:', hasItems, '| hasVideos:', hasVideos, '| videosReady:', videosReady);
    }
  }, [isFeedReady, hasItems, hasVideos, videosReady]);
  
  // Callback for manual video ready marking
  const markVideoReady = useCallback((cloudflareUid: string) => {
    if (!readySet.has(cloudflareUid)) {
      markReady(cloudflareUid);
    }
  }, [readySet, markReady]);
  
  return {
    isFeedReady,
    readyCount,
    totalCount: videoCloudflareUids.length,
    markVideoReady,
    debugInfo: {
      hasItems,
      hasVideos,
      videosReady,
    },
  };
}
