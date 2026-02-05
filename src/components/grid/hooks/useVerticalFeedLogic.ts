/**
 * useVerticalFeedLogic - Snap-scroll vertical feed logic
 * 
 * Handles:
 * - Snap-scroll behavior with dual intersection observers
 * - Current index tracking
 * - Preload/prebuffer window management (FIX #3: Now adaptive)
 * - Scroll state management
 * - Keyboard navigation
 */

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { NetworkPriorityManager } from '@/utils/video/NetworkPriorityManager';
import { ManifestWarmer } from '@/utils/video/ManifestWarmer';
import { videoDebug } from '@/config/videoDebug';

const VIDEO_WINDOW_RADIUS = 2;

interface VerticalFeedPost {
  id: string;
  type: string;
  media?: { media_url?: string; media_type?: string }[];
  src?: string;
}

interface UseVerticalFeedLogicOptions {
  posts: VerticalFeedPost[];
  onCurrentIndexChange?: (index: number) => void;
  onScrollStateChange?: (isScrolling: boolean) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onFirstFrameReady?: () => void;
  /** Initial index to start at (for deep linking) */
  initialIndex?: number;
}

export function useVerticalFeedLogic({
  posts,
  onCurrentIndexChange,
  onScrollStateChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onFirstFrameReady,
  initialIndex = 0,
}: UseVerticalFeedLogicOptions) {
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [visualIndex, setVisualIndex] = useState(initialIndex);
  const [shouldAttachMap, setShouldAttachMap] = useState<Record<string, boolean>>({});
  const [autoplayMap, setAutoplayMap] = useState<Record<string, boolean>>({});
  
  // FIX #3: Adaptive prefetch based on network/scroll conditions
  const { config: prefetchConfig, onIndexChange: notifyPrefetchIndexChange } = useAdaptivePrefetch();
  
  // Refs for observers
  const nearRef = useRef<IntersectionObserver | null>(null);
  const playRef = useRef<IntersectionObserver | null>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  
  // Scroll state tracking
  const isScrollingRef = useRef(false);
  const scrollSettleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastIndexChangeTimeRef = useRef(0);
  const visualIndexTimeoutRef = useRef<number | null>(null);
  const hasPreloadedFirst = useRef(false);
  const firstFrameReadyFiredRef = useRef(false);
  
  // ==================================================================================
  // CRITICAL: First-video autoplay bootstrap for initial page landing
  // ==================================================================================
  // Problem: On initial Clubhouse page load, IntersectionObserver can fire with
  // intersectionRatio=0 before the first card is fully laid out, setting autoplayMap
  // to false and preventing autoplay until the user scrolls away and back.
  //
  // Solution: Force autoplayMap[firstPostId]=true on initial landing and protect it

  // from being set to false until the user actually scrolls. This ensures the first
  // video ALWAYS autoplays immediately when users land on the Clubhouse page.
  //
  // DO NOT REMOVE OR MODIFY without thorough testing on initial page load!
  // ==================================================================================
  const bootstrapFirstAutoplayRef = useRef(true);
  const bootstrapFirstAutoplayTimeoutRef = useRef<number | null>(null);

  // Protect first video autoplay from observer races
  const firstVideoProtectedUntilRef = useRef<number>(0);
  const firstPostIdRef = useRef<string | null>(null);
  
  // Preload first video immediately in layout phase
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current || !posts.length) return;

    const firstPost = posts[0];
    if (!firstPost || firstPost.type !== 'video') return;

    hasPreloadedFirst.current = true;
    firstPostIdRef.current = firstPost.id;

    // [Bootstrap Diagnostic] Protection started
    videoDebug('bootstrap', 'Protection started', { 
      timestamp: performance.now().toFixed(1),
      firstPostId: firstPost.id 
    });

    // Enter network priority mode - abort/defer non-critical requests
    NetworkPriorityManager.enterPriorityMode();

    // Bootstrap: keep first card autoplay true on initial landing.
    // Drop this once the user scrolls (or after a long safety timeout).
    bootstrapFirstAutoplayRef.current = true;
    if (bootstrapFirstAutoplayTimeoutRef.current) {
      window.clearTimeout(bootstrapFirstAutoplayTimeoutRef.current);
    }
    bootstrapFirstAutoplayTimeoutRef.current = window.setTimeout(() => {
      bootstrapFirstAutoplayRef.current = false;
      bootstrapFirstAutoplayTimeoutRef.current = null;
      // [Bootstrap Diagnostic] Timeout protection ended
      videoDebug('bootstrap', 'Protection ended', { 
        timestamp: performance.now().toFixed(1),
        reason: 'timeout-15s'
      });
    }, 15000);

    // Also protect against early observer false negatives for a short window
    firstVideoProtectedUntilRef.current = Date.now() + 2500;
    videoDebug('bootstrap', 'Observer protection window: 2.5s', { 
      protectedUntil: firstVideoProtectedUntilRef.current 
    });

    // Set both maps synchronously
    setShouldAttachMap({ [firstPost.id]: true });
    setAutoplayMap({ [firstPost.id]: true });
    videoDebug('bootstrap', 'Autoplay triggered for video', { 
      videoIndex: 0, 
      postId: firstPost.id,
      timestamp: performance.now().toFixed(1)
    });

    // Preload HLS manifest + first segments
    const mediaSrc = firstPost.media?.[0]?.media_url || firstPost.src;
    if (mediaSrc) {
      const uid = uidFromNode({ src: mediaSrc });
      if (uid) {
        const hlsUrl = generateStreamHlsUrl(uid);
        preloadHlsManifest(hlsUrl);
        
        // Cache for next cold start warming
        ManifestWarmer.cacheFirstVideoUrl(hlsUrl);
      }
    }
  }, [posts]);
  
  // Scroll to initial index on mount (for deep linking via focusPostId)
  const hasScrolledToInitialRef = useRef(false);
  useEffect(() => {
    if (hasScrolledToInitialRef.current || initialIndex === 0 || !posts.length) return;
    if (!scrollViewRef.current) return;
    
    // Wait for layout to stabilize
    requestAnimationFrame(() => {
      const itemHeight = window.innerHeight;
      const targetScrollTop = initialIndex * itemHeight;
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ top: targetScrollTop, behavior: 'instant' });
        hasScrolledToInitialRef.current = true;
        videoDebug('bootstrap', 'Scrolled to initialIndex', { initialIndex });
        
        // Update maps for the target post
        const targetPost = posts[initialIndex];
        if (targetPost) {
          setShouldAttachMap(m => ({ ...m, [targetPost.id]: true }));
          setAutoplayMap(m => ({ ...m, [targetPost.id]: true }));
        }
      }
    });
  }, [initialIndex, posts]);
  
  // Observer generation counter - increment when observers change so registerItemRef
  // knows to re-observe elements with the new observers
  const observerGenerationRef = useRef(0);
  const observedElementsRef = useRef<Set<HTMLDivElement>>(new Set());
  
  // Setup dual intersection observers
  useEffect(() => {
    if (!posts.length) {
      nearRef.current?.disconnect();
      playRef.current?.disconnect();
      return;
    }
    
    // Increment generation so registerItemRef knows observers changed
    observerGenerationRef.current++;
    
    // Helper: schedule attach with requestIdleCallback to prevent scroll jank
    const scheduleAttach = (id: string, shouldAttach: boolean) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          setShouldAttachMap((m) => ({ ...m, [id]: shouldAttach }));
        }, { timeout: 100 }); // 100ms deadline for responsiveness
      } else {
        // Fallback for Safari (no requestIdleCallback support)
        setTimeout(() => {
          setShouldAttachMap((m) => ({ ...m, [id]: shouldAttach }));
        }, 0);
      }
    };

    // Prebuffer observer (wider margin for Instagram-style prefetch ~4 screens)
    const nearObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('data-postid');
          if (!id) return;
          // Use idle callback for attach operations to prevent scroll jank
          scheduleAttach(id, e.isIntersecting || e.intersectionRatio > 0);
        });
      },
      { root: null, rootMargin: '2000px 0px 2000px 0px', threshold: 0 }
    );

    // Autoplay observer (center detection)
    // CRITICAL FIX: Use more granular thresholds to catch visibility changes more reliably
    // Previously [0.0, 0.5, 1.0] could miss the 50% threshold during fast scrolling
    const playObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('data-postid');
          if (!id) return;

          const isFirstVideo = id === firstPostIdRef.current;

          // Hard bootstrap: on initial landing, force the first card to be autoplay=true
          // regardless of transient IO ratios.
          if (isFirstVideo && bootstrapFirstAutoplayRef.current) {
            setAutoplayMap((m) => (m[id] ? m : { ...m, [id]: true }));
            return;
          }

          // Protect first video from being set to false during early mount/layout.
          const isProtected = isFirstVideo && Date.now() < firstVideoProtectedUntilRef.current;
          const shouldAutoplay = e.intersectionRatio >= 0.5;

          // Don't override user-initiated playback
          const activeReason = MediaRuntime.getActiveReason();
          const primaryActiveId = MediaRuntime.getPrimaryActiveId();
          const isUserPlaying = activeReason === 'user' && primaryActiveId === id;

          // Always allow true; only allow false when not protected AND not user-playing
          if (!isUserPlaying && (shouldAutoplay || !isProtected)) {
            setAutoplayMap((m) => ({ ...m, [id]: shouldAutoplay }));
          }
        });
      },
      // More granular thresholds for smoother detection during scroll
      { root: null, threshold: [0.0, 0.25, 0.4, 0.5, 0.6, 0.75, 1.0] }
    );

    nearRef.current = nearObserver;
    playRef.current = playObserver;
    
    // Re-observe all currently tracked elements with the new observers
    observedElementsRef.current.forEach((el) => {
      nearObserver.observe(el);
      playObserver.observe(el);
    });

    return () => {
      nearObserver.disconnect();
      playObserver.disconnect();
    };
  }, [posts]);

  // Scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollTop = scrollViewRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    // Any *meaningful* user scroll means we should stop forcing first-card autoplay.
    // (Some browsers fire an initial scroll event at scrollTop=0 on mount.)
    if (bootstrapFirstAutoplayRef.current && (newIndex !== 0 || scrollTop > 20)) {
      // [Bootstrap Diagnostic] Scroll ended protection
      videoDebug('bootstrap', 'Protection ended', { 
        timestamp: performance.now().toFixed(1),
        reason: 'user-scroll',
        scrollTop,
        newIndex
      });
      bootstrapFirstAutoplayRef.current = false;
      if (bootstrapFirstAutoplayTimeoutRef.current) {
        window.clearTimeout(bootstrapFirstAutoplayTimeoutRef.current);
        bootstrapFirstAutoplayTimeoutRef.current = null;
      }
    }

    // Notify scroll state
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      onScrollStateChange?.(true);
      MediaRuntime.setUIState({ isScrolling: true });
    }

    // Clear previous settle timeout
    if (scrollSettleTimeoutRef.current) {
      clearTimeout(scrollSettleTimeoutRef.current);
    }
    scrollSettleTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      onScrollStateChange?.(false);
      MediaRuntime.setUIState({ isScrolling: false });
    }, 150);

    // Index update with hysteresis
    const now = Date.now();
    const MIN_INDEX_CHANGE_INTERVAL = 80;

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      if (now - lastIndexChangeTimeRef.current < MIN_INDEX_CHANGE_INTERVAL) return;

      lastIndexChangeTimeRef.current = now;
      setCurrentIndex(newIndex);
      onCurrentIndexChange?.(newIndex);
      
      // FIX #5: Notify adaptive prefetch of index change for scroll velocity tracking
      // This updates the prefetch strategy based on scroll speed
      notifyPrefetchIndexChange();

      // Visual index with slight delay for smooth HUD
      if (visualIndexTimeoutRef.current) {
        window.clearTimeout(visualIndexTimeoutRef.current);
      }
      visualIndexTimeoutRef.current = window.setTimeout(() => {
        setVisualIndex(newIndex);
      }, 40);
    }

    // Load more check
    if (newIndex >= posts.length - 3 && hasMore && !isLoadingMore) {
      onLoadMore?.();
    }
  }, [currentIndex, posts.length, hasMore, isLoadingMore, onLoadMore, onCurrentIndexChange, onScrollStateChange, notifyPrefetchIndexChange]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollViewRef.current) return;
      
      const itemHeight = window.innerHeight;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            onCurrentIndexChange?.(newIndex);
            scrollViewRef.current.scrollTo({ top: newIndex * itemHeight, behavior: 'smooth' });
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < posts.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            onCurrentIndexChange?.(newIndex);
            scrollViewRef.current.scrollTo({ top: newIndex * itemHeight, behavior: 'smooth' });
            
            if (newIndex >= posts.length - 3 && hasMore && !isLoadingMore) {
              onLoadMore?.();
            }
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts.length, hasMore, isLoadingMore, onLoadMore, onCurrentIndexChange]);
  
  // FIX #3: Preload videos using adaptive prefetch config
  // Replaces old static getAdaptivePreloadCount with dynamic config
  const preloadVideos = useCallback((startFromIndex: number = currentIndex) => {
    const { prefetchAhead, prefetchBehind, preloadThumbnails, preloadManifests } = prefetchConfig;
    
    // Preload ahead
    for (let i = 1; i <= prefetchAhead; i++) {
      const nextIndex = startFromIndex + i;
      if (nextIndex >= posts.length) break;
      
      const nextPost = posts[nextIndex];
      if (!nextPost || nextPost.media?.[0]?.media_type !== 'video') continue;
      
      const src = nextPost.media[0]?.media_url;
      if (!src) continue;
      
      const uid = uidFromNode({ src });
      if (uid) {
        // Preload HLS manifest (if enabled)
        if (preloadManifests) {
          preloadHlsManifest(generateStreamHlsUrl(uid));
        }
        
        // Preload thumbnail (if enabled)
        if (preloadThumbnails) {
          const thumbnailUrl = generateStreamThumbnailUrl(uid, { height: 600 });
          const img = new Image();
          img.src = thumbnailUrl;
        }
      }
    }
    
    // Preload behind (for scroll-back)
    for (let i = 1; i <= prefetchBehind; i++) {
      const prevIndex = startFromIndex - i;
      if (prevIndex < 0) break;
      
      const prevPost = posts[prevIndex];
      if (!prevPost || prevPost.media?.[0]?.media_type !== 'video') continue;
      
      const src = prevPost.media[0]?.media_url;
      if (!src) continue;
      
      const uid = uidFromNode({ src });
      if (uid && preloadManifests) {
        preloadHlsManifest(generateStreamHlsUrl(uid));
      }
    }
  }, [posts, currentIndex, prefetchConfig]);
  
  // Preload videos on index change (FIX #3: notify adaptive system)
  useEffect(() => {
    if (!posts.length) return;
    
    // Notify adaptive prefetch of index change (tracks scroll velocity)
    notifyPrefetchIndexChange();
    
    // Preload with current adaptive config
    preloadVideos();
  }, [currentIndex, posts, notifyPrefetchIndexChange, preloadVideos]);
  
  // Aggressive preload when user pauses - they might be reading comments/caption
  const isPausedRef = useRef(false);
  
  useEffect(() => {
    // Listen for pause events on current video to trigger aggressive preload
    const currentPost = posts[currentIndex];
    if (!currentPost) return;
    
    const handleVideoPause = () => {
      isPausedRef.current = true;
      // User paused - good time to preload more aggressively (FIX #3: use current index)
      preloadVideos(currentIndex);
    };
    
    const handleVideoPlay = () => {
      isPausedRef.current = false;
    };
    
    // Get the video element for current index
    const videoEl = videoRefs.current[currentPost.id];
    if (videoEl) {
      videoEl.addEventListener('pause', handleVideoPause);
      videoEl.addEventListener('play', handleVideoPlay);
      
      return () => {
        videoEl.removeEventListener('pause', handleVideoPause);
        videoEl.removeEventListener('play', handleVideoPlay);
      };
    }
  }, [currentIndex, posts, preloadVideos]);
  
  // Signal first frame ready
  const handleFirstFrameReady = useCallback(() => {
    if (firstFrameReadyFiredRef.current) return;
    firstFrameReadyFiredRef.current = true;
    onFirstFrameReady?.();
  }, [onFirstFrameReady]);
  
  // Register item ref - observes the element with current observers
  // CRITICAL FIX: Track observed elements so we can re-observe when observers change
  const registerItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current[index] = el;
      
      // Track this element for re-observation when observers change
      observedElementsRef.current.add(el);
      
      // Observe with current observers (may be null on first render, but useEffect will re-observe)
      nearRef.current?.observe(el);
      playRef.current?.observe(el);
    }
  }, []);
  
  // Register video ref
  const registerVideoRef = useCallback((postId: string, el: HTMLVideoElement | null) => {
    videoRefs.current[postId] = el;
  }, []);
  
  // Check if item is nearby (for virtualization)
  const isNearby = useCallback((index: number) => {
    return Math.abs(index - currentIndex) <= 1;
  }, [currentIndex]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (visualIndexTimeoutRef.current) {
        window.clearTimeout(visualIndexTimeoutRef.current);
      }
      if (scrollSettleTimeoutRef.current) {
        clearTimeout(scrollSettleTimeoutRef.current);
      }
      if (bootstrapFirstAutoplayTimeoutRef.current) {
        window.clearTimeout(bootstrapFirstAutoplayTimeoutRef.current);
        bootstrapFirstAutoplayTimeoutRef.current = null;
      }
      // Clear tracked elements on unmount
      observedElementsRef.current.clear();
    };
  }, []);
  
  return {
    scrollViewRef,
    currentIndex,
    visualIndex,
    shouldAttachMap,
    autoplayMap,
    itemRefs,
    videoRefs,
    handleScroll,
    handleFirstFrameReady,
    registerItemRef,
    registerVideoRef,
    isNearby,
    isScrolling: isScrollingRef.current,
    // FIX #5: Expose prefetch config for consumers to use
    prefetchConfig,
  };
}
