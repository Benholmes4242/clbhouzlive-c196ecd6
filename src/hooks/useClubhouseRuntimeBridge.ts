/**
 * useClubhouseRuntimeBridge - Bridges Clubhouse snap-scroll to MediaRuntime
 * 
 * This hook routes all Clubhouse playback through MediaRuntime.
 * Clubhouse maintains its own snap-scroll and warm window logic,
 * but MediaRuntime is the single playback authority.
 * 
 * IMPORTANT: Never call video.play() or video.pause() directly.
 * All playback is controlled exclusively by MediaRuntime.
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
import { DEBUG_MEDIA } from '@/media/debug';

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
}

export function useClubhouseRuntimeBridge({
  posts,
  currentIndex,
  videoRefs,
  itemRefs,
}: UseClubhouseRuntimeBridgeOptions) {
  const prevCenterIdRef = useRef<string | null>(null);
  const registeredIdsRef = useRef<Set<string>>(new Set());
  const registeredElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const isScrollingRef = useRef(false);
  
  // Register videos that enter the window (center ± 3)
  // IMPROVEMENT #2: Increased from ±1 to ±3 for better preload coverage
  useEffect(() => {
    if (!posts.length) return;
    
    const windowRadius = 3;
    const start = Math.max(0, currentIndex - windowRadius);
    const end = Math.min(posts.length - 1, currentIndex + windowRadius);
    
    const shouldBeRegistered = new Set<string>();
    
    for (let i = start; i <= end; i++) {
      const post = posts[i];
      if (!post) continue;
      
      const videoEl = videoRefs.current[post.id];
      const cardEl = itemRefs.current[i];
      
      if (videoEl && cardEl) {
        shouldBeRegistered.add(post.id);
        
        const previousEl = registeredElementsRef.current.get(post.id);
        const elementChanged = previousEl && previousEl !== videoEl;
        
        // Re-register if element changed (carousel swap) or not yet registered
        if (!registeredIdsRef.current.has(post.id) || elementChanged) {
          if (elementChanged) {
            // Unregister old element first
            MediaRuntime.unregisterMedia(post.id);
          }
          
          MediaRuntime.registerMedia({
            id: post.id,
            element: videoEl,
            surface: 'clubhouse',
            sortIndex: i,
            observeTarget: cardEl,
          });
          registeredIdsRef.current.add(post.id);
          registeredElementsRef.current.set(post.id, videoEl);
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
  }, [posts, currentIndex, videoRefs, itemRefs]);
  
  // Feed snap index changes to runtime as candidate visibility
  // MediaRuntime is the single playback authority for Clubhouse.
  useEffect(() => {
    if (!posts.length) return;

    const currentPost = posts[currentIndex];
    const currentVideoEl = currentPost ? videoRefs.current[currentPost.id] : null;
    if (!currentPost || !currentVideoEl) {
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

    // ✅ Start playback through MediaRuntime (autoplay) once snap index updates.
    // IMPROVEMENT #1: Removed isScrollingRef guard - let MediaRuntime handle
    // playback immediately for faster autoplay (matches Friends tab behavior)
    MediaRuntime.requestPlay({
      id: centerId,
      surface: 'clubhouse',
      reason: 'autoplay',
    });
  }, [posts, currentIndex]);
  
  // Prewarm prev/next videos
  useEffect(() => {
    if (!posts.length) return;
    
    const prevPost = posts[currentIndex - 1];
    const nextPost = posts[currentIndex + 1];

    const hasVideo = (post?: ClubhousePost) =>
      !!post && (post.type === 'video' || post.media?.some((m) => m?.media_type === 'video'));

    if (hasVideo(prevPost)) {
      MediaRuntime.prewarmCandidate(prevPost!.id);
    }
    if (hasVideo(nextPost)) {
      MediaRuntime.prewarmCandidate(nextPost!.id);
    }
  }, [posts, currentIndex]);
  
  // Notify runtime of scroll state
  const setScrolling = useCallback((isScrolling: boolean) => {
    isScrollingRef.current = isScrolling;
    MediaRuntime.setUIState({ isScrolling });
    
    // On scroll settle, trigger playback
    if (!isScrolling && posts[currentIndex]) {
      const centerId = posts[currentIndex].id;
      const centerVideoEl = videoRefs.current[centerId];
      if (centerVideoEl) {
        MediaRuntime.setCandidateState(centerId, { visible: true, ratio: 1 });
      }
    }
  }, [posts, currentIndex]);
  
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
      surface: 'clubhouse',
      reason,
    });
  }, []);
  
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
