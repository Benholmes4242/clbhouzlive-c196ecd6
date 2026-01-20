/**
 * useWatchRuntimeBridge - Bridges Watch grid to MediaRuntime
 * 
 * This hook routes all Watch tab video playback through MediaRuntime.
 * WatchShortsGrid maintains its own visibility tracking and prefetch logic,
 * but MediaRuntime is the single playback authority.
 * 
 * The bridge:
 * - Registers visible Watch videos into MediaRuntime
 * - Feeds visibility state from IntersectionObserver to MediaRuntime
 * - Routes autoplay candidates through MediaRuntime.requestPlay
 * - Ensures generation tracking and coordinated playback
 */

import { useEffect, useRef, useCallback } from 'react';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { DEBUG_MEDIA } from '@/media/debug';
import { extractCloudflareUid, shortUid } from '@/utils/videoIdUtils';
import { WatchShort } from '@/hooks/useWatchShorts';

interface UseWatchRuntimeBridgeOptions {
  shorts: WatchShort[];
  mountableIndices: Set<number>;
  visibleIndices: Set<number>;
  autoplayCandidateIndex: number | null;
  videoRefs: React.MutableRefObject<Map<string, HTMLVideoElement | null>>;
}

/**
 * Extracts the Cloudflare UID from a WatchShort's media URL
 */
function getStreamId(short: WatchShort): string {
  const mediaUrl = short.media?.[0]?.media_url;
  return mediaUrl ? (extractCloudflareUid(mediaUrl) || short.id) : short.id;
}

export function useWatchRuntimeBridge({
  shorts,
  mountableIndices,
  visibleIndices,
  autoplayCandidateIndex,
  videoRefs,
}: UseWatchRuntimeBridgeOptions) {
  const registeredIdsRef = useRef<Set<string>>(new Set());
  const registeredElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const lastAutoplayCandidateRef = useRef<string | null>(null);
  
  // Register/unregister videos based on mountable indices
  useEffect(() => {
    if (!shorts.length) return;
    
    const shouldBeRegistered = new Set<string>();
    
    // Register all mountable videos
    mountableIndices.forEach((index) => {
      const short = shorts[index];
      if (!short) return;
      
      const streamId = getStreamId(short);
      const videoEl = videoRefs.current.get(short.id);
      
      if (videoEl) {
        shouldBeRegistered.add(streamId);
        
        const previousEl = registeredElementsRef.current.get(streamId);
        const elementChanged = previousEl && previousEl !== videoEl;
        
        // Register if not yet registered or element changed
        if (!registeredIdsRef.current.has(streamId) || elementChanged) {
          if (elementChanged) {
            MediaRuntime.unregisterMedia(streamId);
          }
          
          if (DEBUG_MEDIA) {
            console.log(`[WatchRuntimeBridge] Registered ${shortUid(streamId)} (post: ${short.id.slice(0, 8)}, index: ${index})`);
          }
          
          MediaRuntime.registerMedia({
            id: streamId,
            element: videoEl,
            surface: 'watch',
            sortIndex: index,
            observeTarget: videoEl.parentElement || videoEl,
          });
          
          registeredIdsRef.current.add(streamId);
          registeredElementsRef.current.set(streamId, videoEl);
        }
      }
    });
    
    // Unregister videos that are no longer mountable
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
      
      if (DEBUG_MEDIA) {
        console.log(`[WatchRuntimeBridge] Unregistered ${shortUid(id)}`);
      }
    });
  }, [shorts, mountableIndices, videoRefs]);
  
  // Update visibility state for all visible videos
  useEffect(() => {
    if (!shorts.length) return;
    
    // Mark visible videos
    visibleIndices.forEach((index) => {
      const short = shorts[index];
      if (!short) return;
      
      const streamId = getStreamId(short);
      if (registeredIdsRef.current.has(streamId)) {
        MediaRuntime.setCandidateState(streamId, { visible: true, ratio: 0.6 });
      }
    });
    
    // Mark non-visible registered videos
    registeredIdsRef.current.forEach((id) => {
      const isVisible = Array.from(visibleIndices).some((idx) => {
        const short = shorts[idx];
        return short && getStreamId(short) === id;
      });
      
      if (!isVisible) {
        MediaRuntime.setCandidateState(id, { visible: false, ratio: 0 });
      }
    });
  }, [shorts, visibleIndices]);
  
  // Request play for autoplay candidate
  useEffect(() => {
    if (autoplayCandidateIndex === null || !shorts.length) {
      // Clear previous candidate
      if (lastAutoplayCandidateRef.current) {
        MediaRuntime.setCandidateState(lastAutoplayCandidateRef.current, { visible: false, ratio: 0 });
        lastAutoplayCandidateRef.current = null;
      }
      return;
    }
    
    const short = shorts[autoplayCandidateIndex];
    if (!short) return;
    
    const streamId = getStreamId(short);
    
    // Only request play if this is a new candidate
    if (lastAutoplayCandidateRef.current !== streamId) {
      // Clear previous candidate
      if (lastAutoplayCandidateRef.current) {
        MediaRuntime.setCandidateState(lastAutoplayCandidateRef.current, { visible: false, ratio: 0 });
      }
      
      lastAutoplayCandidateRef.current = streamId;
      
      // Wait for registration to complete, then request play
      const timeoutId = setTimeout(() => {
        if (registeredIdsRef.current.has(streamId)) {
          if (DEBUG_MEDIA) {
            console.log(`[WatchRuntimeBridge] Requesting play for ${shortUid(streamId)}`);
          }
          
          MediaRuntime.setCandidateState(streamId, { visible: true, ratio: 1 });
          MediaRuntime.requestPlay({
            id: streamId,
            surface: 'watch',
            reason: 'autoplay',
          });
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [shorts, autoplayCandidateIndex]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      registeredIdsRef.current.forEach((id) => {
        MediaRuntime.unregisterMedia(id);
      });
      registeredIdsRef.current.clear();
      registeredElementsRef.current.clear();
      lastAutoplayCandidateRef.current = null;
    };
  }, []);
  
  // Expose method to manually request play (for user tap)
  const requestPlay = useCallback((shortId: string) => {
    const short = shorts.find(s => s.id === shortId);
    if (!short) return;
    
    const streamId = getStreamId(short);
    MediaRuntime.requestPlay({
      id: streamId,
      surface: 'watch',
      reason: 'user',
    });
  }, [shorts]);
  
  return {
    requestPlay,
    getStreamId,
  };
}

export default useWatchRuntimeBridge;
