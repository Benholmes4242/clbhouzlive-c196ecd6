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
import { extractCloudflareUid, shortUid } from '@/utils/videoIdUtils';

interface ClubhousePost {
  id: string;
  type: string;
  video_url?: string | null;
  media?: { media_type?: string; media_url?: string | null }[];
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
  
  // Register videos that enter the window (center ± 1)
  useEffect(() => {
    if (!posts.length) return;
    
    const windowRadius = 1;
    const start = Math.max(0, currentIndex - windowRadius);
    const end = Math.min(posts.length - 1, currentIndex + windowRadius);
    
    const shouldBeRegistered = new Set<string>();
    
    for (let i = start; i <= end; i++) {
      const post = posts[i];
      if (!post) continue;
      
      const videoEl = videoRefs.current[post.id];
      const cardEl = itemRefs.current[i];
      
      if (videoEl && cardEl) {
        // Extract Cloudflare UID for consistent cache key matching
        const videoUrl = post.video_url || post.media?.find(m => m.media_type === 'video')?.media_url;
        const cloudflareUid = videoUrl ? extractCloudflareUid(videoUrl) : '';
        const registrationId = cloudflareUid || post.id;
        
        shouldBeRegistered.add(registrationId);
        
        const previousEl = registeredElementsRef.current.get(registrationId);
        const elementChanged = previousEl && previousEl !== videoEl;
        
        // Re-register if element changed (carousel swap) or not yet registered
        if (!registeredIdsRef.current.has(registrationId) || elementChanged) {
          if (elementChanged) {
            // Unregister old element first
            MediaRuntime.unregisterMedia(registrationId);
          }
          
          if (DEBUG_MEDIA) {
            console.log(`[RuntimeBridge] Registered ${shortUid(registrationId)} (post: ${post.id.slice(0, 8)})`);
          }
          
          MediaRuntime.registerMedia({
            id: registrationId,
            element: videoEl,
            surface: 'clubhouse',
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
  }, [posts, currentIndex, videoRefs, itemRefs]);
  
  // Feed snap index changes to runtime as candidate visibility
  // NOTE: Autoplay is now controlled via autoplayMap → HLSPlayer autoplay prop
  // We only update candidate state here for MediaRuntime tracking, NOT for playback control
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
    
    // Helper to get registration ID (Cloudflare UID) from post
    const getRegId = (post: ClubhousePost) => {
      const videoUrl = post.video_url || post.media?.find(m => m.media_type === 'video')?.media_url;
      return (videoUrl ? extractCloudflareUid(videoUrl) : '') || post.id;
    };
    
    const centerId = getRegId(currentPost);
    const prevPost = posts[currentIndex - 1];
    const nextPost = posts[currentIndex + 1];
    const prevId = prevPost ? getRegId(prevPost) : undefined;
    const nextId = nextPost ? getRegId(nextPost) : undefined;
    
    // Mark centered item as 100% visible (for MediaRuntime tracking only)
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
    
    // REMOVED: MediaRuntime.requestPlay() call
    // Playback is now controlled by autoplayMap → HLSPlayer autoplay prop
    // This eliminates the dual-control conflict
  }, [posts, currentIndex]);
  
  // Prewarm prev/next videos
  useEffect(() => {
    if (!posts.length) return;
    
    const prevPost = posts[currentIndex - 1];
    const nextPost = posts[currentIndex + 1];

    const hasVideo = (post?: ClubhousePost) =>
      !!post && (post.type === 'video' || post.media?.some((m) => m?.media_type === 'video'));

    const getRegId = (post: ClubhousePost) => {
      const videoUrl = post.video_url || post.media?.find(m => m.media_type === 'video')?.media_url;
      return (videoUrl ? extractCloudflareUid(videoUrl) : '') || post.id;
    };

    if (hasVideo(prevPost)) {
      MediaRuntime.prewarmCandidate(getRegId(prevPost!));
    }
    if (hasVideo(nextPost)) {
      MediaRuntime.prewarmCandidate(getRegId(nextPost!));
    }
  }, [posts, currentIndex]);
  
  // Notify runtime of scroll state
  const setScrolling = useCallback((isScrolling: boolean) => {
    isScrollingRef.current = isScrolling;
    MediaRuntime.setUIState({ isScrolling });
    
    // On scroll settle, trigger playback
    if (!isScrolling && posts[currentIndex]) {
      const currentPost = posts[currentIndex];
      const videoUrl = currentPost.video_url || currentPost.media?.find(m => m.media_type === 'video')?.media_url;
      const centerId = (videoUrl ? extractCloudflareUid(videoUrl) : '') || currentPost.id;
      const centerVideoEl = videoRefs.current[currentPost.id];
      if (centerVideoEl) {
        MediaRuntime.setCandidateState(centerId, { visible: true, ratio: 1 });
      }
    }
  }, [posts, currentIndex, videoRefs]);
  
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
