/**
 * useVerticalFeedLogic - Snap-scroll vertical feed logic
 * 
 * Handles:
 * - Snap-scroll behavior with dual intersection observers
 * - Current index tracking
 * - Preload/prebuffer window management
 * - Scroll state management
 * - Keyboard navigation
 */

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';

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
  
  // Fast scroll debounce - prevent autoplay during rapid scrolling
  const scrollVelocityRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(performance.now());
  const isRapidScrollingRef = useRef(false);
  const VELOCITY_THRESHOLD = 2000; // pixels per second
  const SCROLL_SETTLE_DELAY = 150; // ms after rapid scroll stops
  
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

    // Bootstrap: keep first card autoplay true on initial landing.
    // Drop this once the user scrolls (or after a long safety timeout).
    bootstrapFirstAutoplayRef.current = true;
    if (bootstrapFirstAutoplayTimeoutRef.current) {
      window.clearTimeout(bootstrapFirstAutoplayTimeoutRef.current);
    }
    bootstrapFirstAutoplayTimeoutRef.current = window.setTimeout(() => {
      bootstrapFirstAutoplayRef.current = false;
      bootstrapFirstAutoplayTimeoutRef.current = null;
    }, 15000);

    // Also protect against early observer false negatives for a short window
    firstVideoProtectedUntilRef.current = Date.now() + 2500;

    // Set both maps synchronously
    setShouldAttachMap({ [firstPost.id]: true });
    setAutoplayMap({ [firstPost.id]: true });

    // Preload HLS manifest + first segments
    const mediaSrc = firstPost.media?.[0]?.media_url || firstPost.src;
    if (mediaSrc) {
      const uid = uidFromNode({ src: mediaSrc });
      if (uid) {
        preloadHlsManifest(generateStreamHlsUrl(uid));
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
        console.log('[VerticalFeed] Scrolled to initialIndex:', initialIndex);
        
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

          // FAST SCROLL DEBOUNCE: Don't autoplay during rapid scrolling
          // This prevents wasted resources and janky behavior during flick gestures
          if (isRapidScrollingRef.current) {
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

  // Scroll handler with velocity tracking for fast scroll debounce
  const handleScroll = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollTop = scrollViewRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    const now = performance.now();

    // Track scroll velocity for fast scroll debounce
    const deltaTime = now - lastScrollTimeRef.current;
    const deltaY = Math.abs(scrollTop - lastScrollYRef.current);
    
    if (deltaTime > 0) {
      scrollVelocityRef.current = (deltaY / deltaTime) * 1000; // px/s
    }
    
    lastScrollYRef.current = scrollTop;
    lastScrollTimeRef.current = now;
    
    // Detect rapid scrolling (velocity > threshold)
    const wasRapidScrolling = isRapidScrollingRef.current;
    isRapidScrollingRef.current = scrollVelocityRef.current > VELOCITY_THRESHOLD;

    // Any *meaningful* user scroll means we should stop forcing first-card autoplay.
    // (Some browsers fire an initial scroll event at scrollTop=0 on mount.)
    if (bootstrapFirstAutoplayRef.current && (newIndex !== 0 || scrollTop > 20)) {
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
      isRapidScrollingRef.current = false; // Also clear rapid scroll flag on settle
      scrollVelocityRef.current = 0;
      onScrollStateChange?.(false);
      MediaRuntime.setUIState({ isScrolling: false });
      
      // Re-trigger autoplay check after scroll settles (for fast scroll recovery)
      // Find the currently visible post and enable autoplay
      if (posts[newIndex]) {
        setAutoplayMap((m) => ({ ...m, [posts[newIndex].id]: true }));
      }
    }, SCROLL_SETTLE_DELAY);

    // Index update with hysteresis
    const indexChangeNow = Date.now();
    const MIN_INDEX_CHANGE_INTERVAL = 80;

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      if (indexChangeNow - lastIndexChangeTimeRef.current < MIN_INDEX_CHANGE_INTERVAL) return;

      lastIndexChangeTimeRef.current = indexChangeNow;
      setCurrentIndex(newIndex);
      onCurrentIndexChange?.(newIndex);

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
  }, [currentIndex, posts.length, hasMore, isLoadingMore, onLoadMore, onCurrentIndexChange, onScrollStateChange]);
  
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
  
  // INSTANT VIDEO: Adaptive preload count based on network connection
  // Increased counts for instant playback
  const getAdaptivePreloadCount = useCallback(() => {
    const connection = (navigator as any).connection;
    if (!connection) return 8; // INSTANT VIDEO: Increased default
    
    switch (connection.effectiveType) {
      case '4g': return 10; // INSTANT VIDEO: Increased from 5
      case '3g': return 6;  // INSTANT VIDEO: Increased from 3
      case '2g': return 3;  // INSTANT VIDEO: Increased from 2
      default: return 6;
    }
  }, []);
  
  // Preload videos based on network conditions
  const preloadVideos = useCallback((count: number, startFromIndex: number = currentIndex) => {
    for (let i = 1; i <= count; i++) {
      const nextIndex = startFromIndex + i;
      if (nextIndex >= posts.length) break;
      
      const nextPost = posts[nextIndex];
      if (!nextPost || nextPost.media?.[0]?.media_type !== 'video') continue;
      
      const src = nextPost.media[0]?.media_url;
      if (!src) continue;
      
      const uid = uidFromNode({ src });
      if (uid) {
        // Preload HLS manifest and first segments
        preloadHlsManifest(generateStreamHlsUrl(uid));
        
        // Also preload thumbnail for instant poster display
        const thumbnailUrl = generateStreamThumbnailUrl(uid, { height: 600 });
        const img = new Image();
        img.src = thumbnailUrl;
      }
    }
  }, [posts, currentIndex]);
  
  // Preload videos on index change (adaptive count)
  useEffect(() => {
    if (!posts.length) return;
    
    const preloadCount = getAdaptivePreloadCount();
    preloadVideos(preloadCount);
  }, [currentIndex, posts, getAdaptivePreloadCount, preloadVideos]);
  
  // Aggressive preload when user pauses - they might be reading comments/caption
  const isPausedRef = useRef(false);
  
  useEffect(() => {
    // Listen for pause events on current video to trigger aggressive preload
    const currentPost = posts[currentIndex];
    if (!currentPost) return;
    
    const handleVideoPause = () => {
      isPausedRef.current = true;
      // User paused - good time to preload more aggressively
      preloadVideos(3, currentIndex);
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
  };
}
