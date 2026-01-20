/**
 * useUnifiedRuntimeBridge - Bridges unified fullscreen player to MediaRuntime
 * 
 * Extracted from useClubhouseRuntimeBridge.
 * Routes all playback through MediaRuntime for consistent media control.
 * 
 * IMPORTANT: Never call video.play() or video.pause() directly.
 * All playback is controlled exclusively by MediaRuntime.
 */

import { useEffect, useRef, useCallback } from 'react';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { runtimeUserTap } from '@/media/runtime/runtimeIntent';
import { NormalizedItem } from '@/types/feed-adapter';
import { getCloudflareUidFromMedia } from '@/utils/videoIdUtils';

interface UseUnifiedRuntimeBridgeOptions<T> {
  items: NormalizedItem<T>[];
  currentIndex: number;
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement | null }>;
  itemRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement }>;
  surface?: 'fullscreen' | 'clubhouse' | 'grid';
}

export function useUnifiedRuntimeBridge<T>({
  items,
  currentIndex,
  videoRefs,
  itemRefs,
  surface = 'fullscreen',
}: UseUnifiedRuntimeBridgeOptions<T>) {
  const prevCenterIdRef = useRef<string | null>(null);
  const registeredIdsRef = useRef<Set<string>>(new Set());
  const registeredElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const isScrollingRef = useRef(false);
  
  // Register videos that enter the window (center ± 1)
  useEffect(() => {
    if (!items.length) return;
    
    const windowRadius = 1;
    const start = Math.max(0, currentIndex - windowRadius);
    const end = Math.min(items.length - 1, currentIndex + windowRadius);
    
    const shouldBeRegistered = new Set<string>();
    
    for (let i = start; i <= end; i++) {
      const item = items[i];
      if (!item) continue;
      
      // Only register videos
      const hasVideo = item.media.some(m => m.media_type === 'video');
      if (!hasVideo) continue;
      
      const videoEl = videoRefs.current[item.id];
      const cardEl = itemRefs.current[i];
      
      if (videoEl && cardEl) {
        // Extract Cloudflare UID for consistent cache key matching
        const cloudflareUid = getCloudflareUidFromMedia(item);
        const registrationId = cloudflareUid || item.id;
        
        shouldBeRegistered.add(registrationId);
        
        const previousEl = registeredElementsRef.current.get(registrationId);
        const elementChanged = previousEl && previousEl !== videoEl;
        
        // Re-register if element changed (carousel swap) or not yet registered
        if (!registeredIdsRef.current.has(registrationId) || elementChanged) {
          if (elementChanged) {
            MediaRuntime.unregisterMedia(registrationId);
          }
          
          MediaRuntime.registerMedia({
            id: registrationId,
            element: videoEl,
            surface,
            sortIndex: i,
            observeTarget: cardEl,
          });
          registeredIdsRef.current.add(registrationId);
          registeredElementsRef.current.set(registrationId, videoEl);
        }
      }
    }
    
    // Unregister videos that left the window
    const toUnregister: string[] = [];
    registeredIdsRef.current.forEach((id) => {
      if (!shouldBeRegistered.has(id)) {
        toUnregister.push(id);
      }
    });
    
    toUnregister.forEach((id) => {
      MediaRuntime.unregisterMedia(id);
      registeredIdsRef.current.delete(id);
      registeredElementsRef.current.delete(id);
    });
  }, [items, currentIndex, videoRefs, itemRefs, surface]);
  
  // Feed snap index changes to runtime as candidate visibility
  useEffect(() => {
    if (!items.length) return;
    
    const currentItem = items[currentIndex];
    const currentVideoEl = currentItem ? videoRefs.current[currentItem.id] : null;
    
    if (!currentItem || !currentVideoEl) {
      if (prevCenterIdRef.current) {
        MediaRuntime.setCandidateState(prevCenterIdRef.current, { visible: false, ratio: 0 });
        prevCenterIdRef.current = null;
      }
      return;
    }
    
    // Helper to get registration ID (Cloudflare UID) from item
    const getRegId = (item: NormalizedItem<T>) => {
      const uid = getCloudflareUidFromMedia(item);
      return uid || item.id;
    };
    
    const centerId = getRegId(currentItem);
    const prevItem = items[currentIndex - 1];
    const nextItem = items[currentIndex + 1];
    const prevId = prevItem ? getRegId(prevItem) : undefined;
    const nextId = nextItem ? getRegId(nextItem) : undefined;
    
    // Mark centered item as 100% visible
    MediaRuntime.setCandidateState(centerId, { visible: true, ratio: 1 });
    
    // Mark prev/next as not visible
    if (prevId && prevId !== centerId) {
      MediaRuntime.setCandidateState(prevId, { visible: false, ratio: 0 });
    }
    if (nextId && nextId !== centerId) {
      MediaRuntime.setCandidateState(nextId, { visible: false, ratio: 0 });
    }
    
    // Clear old center
    if (prevCenterIdRef.current && prevCenterIdRef.current !== centerId) {
      MediaRuntime.setCandidateState(prevCenterIdRef.current, { visible: false, ratio: 0 });
    }
    
    prevCenterIdRef.current = centerId;
  }, [items, currentIndex, videoRefs]);
  
  // Prewarm prev/next videos
  useEffect(() => {
    if (!items.length) return;
    
    const prevItem = items[currentIndex - 1];
    const nextItem = items[currentIndex + 1];

    const hasVideo = (item?: NormalizedItem<T>) =>
      !!item && item.media.some(m => m.media_type === 'video');
    
    const getRegId = (item: NormalizedItem<T>) => {
      const uid = getCloudflareUidFromMedia(item);
      return uid || item.id;
    };

    if (hasVideo(prevItem)) {
      MediaRuntime.prewarmCandidate(getRegId(prevItem!));
    }
    if (hasVideo(nextItem)) {
      MediaRuntime.prewarmCandidate(getRegId(nextItem!));
    }
  }, [items, currentIndex]);
  
  // Notify runtime of scroll state
  const setScrolling = useCallback((isScrolling: boolean) => {
    isScrollingRef.current = isScrolling;
    MediaRuntime.setUIState({ isScrolling });
    
    // On scroll settle, trigger playback
    if (!isScrolling && items[currentIndex]) {
      const currentItem = items[currentIndex];
      const centerId = getCloudflareUidFromMedia(currentItem) || currentItem.id;
      const centerVideoEl = videoRefs.current[currentItem.id];
      if (centerVideoEl) {
        MediaRuntime.setCandidateState(centerId, { visible: true, ratio: 1 });
      }
    }
  }, [items, currentIndex, videoRefs]);
  
  // Handle user tap (for fullscreen handoff)
  const handleUserTap = useCallback((id: string) => {
    runtimeUserTap(id);
    MediaRuntime.requestPlay({
      id,
      surface: 'fullscreen',
      reason: 'user',
    });
  }, []);
  
  // Pause via runtime
  const requestPause = useCallback((id: string, reason: string) => {
    MediaRuntime.requestPause({ id, reason });
  }, []);
  
  // Play via runtime
  const requestPlay = useCallback((id: string, reason: 'autoplay' | 'user' | 'resume' = 'autoplay') => {
    MediaRuntime.requestPlay({
      id,
      surface,
      reason,
    });
  }, [surface]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      registeredIdsRef.current.forEach((id) => {
        MediaRuntime.unregisterMedia(id);
      });
      registeredIdsRef.current.clear();
      prevCenterIdRef.current = null;
    };
  }, []);
  
  return {
    setScrolling,
    handleUserTap,
    requestPause,
    requestPlay,
  };
}
