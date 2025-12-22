/**
 * useClubhouseRuntimeBridge - Bridges Clubhouse snap-scroll to MediaRuntime
 * 
 * This hook allows Clubhouse to maintain its own snap-scroll and warm window logic
 * while routing all playback decisions through MediaRuntime.
 * 
 * The bridge:
 * - Registers visible Clubhouse videos into MediaRuntime
 * - Feeds snap index changes as candidate visibility states
 * - Routes UI scroll state to MediaRuntime
 * - Handles prewarm via MediaRuntime.prewarmCandidate
 * - Does NOT use IntersectionObserver (Clubhouse already knows the center)
 */

import { useEffect, useRef, useCallback } from 'react';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { runtimeUserTap } from '@/media/runtime/runtimeIntent';

interface ClubhousePost {
  id: string;
  type: string;
  media?: { media_type?: string }[];
}

interface UseClubhouseRuntimeBridgeOptions {
  posts: ClubhousePost[];
  currentIndex: number;
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement | null }>;
  itemRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement }>;
  enabled: boolean;
}

export function useClubhouseRuntimeBridge({
  posts,
  currentIndex,
  videoRefs,
  itemRefs,
  enabled,
}: UseClubhouseRuntimeBridgeOptions) {
  const prevCenterIdRef = useRef<string | null>(null);
  const registeredIdsRef = useRef<Set<string>>(new Set());
  const isScrollingRef = useRef(false);
  
  // Register videos that enter the window (center ± 1)
  useEffect(() => {
    if (!enabled || !posts.length) return;
    
    const windowRadius = 1;
    const start = Math.max(0, currentIndex - windowRadius);
    const end = Math.min(posts.length - 1, currentIndex + windowRadius);
    
    // Collect IDs that should be registered
    const shouldBeRegistered = new Set<string>();
    
    for (let i = start; i <= end; i++) {
      const post = posts[i];
      if (!post || post.type !== 'video') continue;
      
      const videoEl = videoRefs.current[post.id];
      const cardEl = itemRefs.current[i];
      
      if (videoEl && cardEl) {
        shouldBeRegistered.add(post.id);
        
        // Register if not already
        if (!registeredIdsRef.current.has(post.id)) {
          MediaRuntime.registerMedia({
            id: post.id,
            element: videoEl,
            surface: 'clubhouse',
            sortIndex: i,
            observeTarget: cardEl, // Use card wrapper, not video element
          });
          registeredIdsRef.current.add(post.id);
          
          if (import.meta.env.DEV) {
            console.log('[ClubhouseBridge] Registered:', post.id.slice(0, 8));
          }
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
      
      if (import.meta.env.DEV) {
        console.log('[ClubhouseBridge] Unregistered:', id.slice(0, 8));
      }
    });
  }, [enabled, posts, currentIndex, videoRefs, itemRefs]);
  
  // Feed snap index changes to the runtime as candidate visibility state
  useEffect(() => {
    if (!enabled || !posts.length) return;
    
    const currentPost = posts[currentIndex];
    if (!currentPost || currentPost.type !== 'video') {
      // If current post is not a video, clear any previous center
      if (prevCenterIdRef.current) {
        MediaRuntime.setCandidateState(prevCenterIdRef.current, { visible: false, ratio: 0 });
        prevCenterIdRef.current = null;
      }
      return;
    }
    
    const centerId = currentPost.id;
    const prevId = posts[currentIndex - 1]?.id;
    const nextId = posts[currentIndex + 1]?.id;
    
    // Mark centered item as 100% visible
    MediaRuntime.setCandidateState(centerId, { visible: true, ratio: 1 });
    
    // Mark prev/next as not visible (they're in warm window but not playable)
    if (prevId && prevId !== centerId) {
      MediaRuntime.setCandidateState(prevId, { visible: false, ratio: 0 });
    }
    if (nextId && nextId !== centerId) {
      MediaRuntime.setCandidateState(nextId, { visible: false, ratio: 0 });
    }
    
    // Clear old center if it changed
    if (prevCenterIdRef.current && prevCenterIdRef.current !== centerId) {
      MediaRuntime.setCandidateState(prevCenterIdRef.current, { visible: false, ratio: 0 });
    }
    
    prevCenterIdRef.current = centerId;
    
    // Request autoplay for center
    if (!isScrollingRef.current) {
      MediaRuntime.requestPlay({
        id: centerId,
        surface: 'clubhouse',
        reason: 'autoplay',
      });
    }
    
    if (import.meta.env.DEV) {
      console.log('[ClubhouseBridge] Center changed to:', centerId.slice(0, 8));
    }
  }, [enabled, posts, currentIndex]);
  
  // Prewarm prev/next videos
  useEffect(() => {
    if (!enabled || !posts.length) return;
    
    const prevPost = posts[currentIndex - 1];
    const nextPost = posts[currentIndex + 1];
    
    if (prevPost?.type === 'video') {
      MediaRuntime.prewarmCandidate(prevPost.id);
    }
    if (nextPost?.type === 'video') {
      MediaRuntime.prewarmCandidate(nextPost.id);
    }
  }, [enabled, posts, currentIndex]);
  
  // Notify runtime of scroll state
  const setScrolling = useCallback((isScrolling: boolean) => {
    if (!enabled) return;
    
    isScrollingRef.current = isScrolling;
    MediaRuntime.setUIState({ isScrolling });
    
    // On scroll settle, request recompute by triggering candidate evaluation
    if (!isScrolling && posts[currentIndex]?.type === 'video') {
      const centerId = posts[currentIndex].id;
      MediaRuntime.setCandidateState(centerId, { visible: true, ratio: 1 });
    }
  }, [enabled, posts, currentIndex]);
  
  // Handle user tap (for fullscreen handoff)
  const handleUserTap = useCallback((id: string) => {
    if (!enabled) return;
    
    runtimeUserTap(id);
    MediaRuntime.requestPlay({
      id,
      surface: 'fullscreen',
      reason: 'user',
    });
  }, [enabled]);
  
  // Pause specific video via runtime
  const requestPause = useCallback((id: string, reason: string) => {
    if (!enabled) return;
    
    MediaRuntime.requestPause({ id, reason });
  }, [enabled]);
  
  // Request play via runtime
  const requestPlay = useCallback((id: string, reason: 'autoplay' | 'user' | 'resume' = 'autoplay') => {
    if (!enabled) return;
    
    MediaRuntime.requestPlay({
      id,
      surface: 'clubhouse',
      reason,
    });
  }, [enabled]);
  
  // Cleanup on unmount
  useEffect(() => {
    if (!enabled) return;
    
    return () => {
      // Unregister all on unmount
      registeredIdsRef.current.forEach((id) => {
        MediaRuntime.unregisterMedia(id);
      });
      registeredIdsRef.current.clear();
      prevCenterIdRef.current = null;
    };
  }, [enabled]);
  
  return {
    setScrolling,
    handleUserTap,
    requestPause,
    requestPlay,
    enabled,
  };
}
