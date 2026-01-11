/**
 * useUnifiedFullscreenLogic - Unified fullscreen player logic hook
 * 
 * Extracted from ClubhouseVerticalGrid and useVerticalFeedLogic.
 * Provides generic snap-scroll vertical feed logic with:
 * - Data normalization via adapter
 * - Landscape/portrait filter toggle
 * - Scroll state management
 * - MediaRuntime integration
 * - Keyboard navigation
 * - Infinite scroll
 * - Deep link support
 */

import { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { FeedAdapter, NormalizedItem } from '@/types/feed-adapter';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

// ============ Constants ============

const PORTRAIT_MIN_AR = 1.2; // Height/Width ratio threshold for portrait
const VIDEOS_TO_PRELOAD = 5; // Increased from 3 for smoother scrolling
const MIN_INDEX_CHANGE_INTERVAL = 80;
const SCROLL_SETTLE_DELAY = 150;

// ============ Types ============

export interface UnifiedFullscreenLogicOptions<T> {
  // Data
  items: T[];
  adapter: FeedAdapter<T>;
  
  // Navigation
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  
  // Infinite scroll
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  
  // Features
  allowLandscape?: boolean; // defaults to true (allow all orientations)
  focusItemId?: string; // Deep link support
  
  // Callbacks
  onClose?: () => void;
  onFirstFrameReady?: () => void;
  onScrollStateChange?: (isScrolling: boolean) => void;
}

export interface UnifiedFullscreenLogicReturn<T> {
  // Refs
  scrollViewRef: React.RefObject<HTMLDivElement>;
  itemRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement }>;
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement | null }>;
  
  // State
  currentIndex: number;
  visualIndex: number;
  isScrolling: boolean;
  
  // Navigation
  goToIndex: (index: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  
  // Media state
  shouldAttachMap: Record<string, boolean>;
  autoplayMap: Record<string, boolean>;
  
  // Handlers
  handleScroll: () => void;
  handleFirstFrameReady: () => void;
  registerItemRef: (index: number, element: HTMLDivElement | null) => void;
  registerVideoRef: (postId: string, element: HTMLVideoElement | null) => void;
  
  // Utilities
  isNearby: (index: number) => boolean;
  getNormalizedItems: () => NormalizedItem<T>[];
  getFilteredItems: () => NormalizedItem<T>[];
  getCurrentItem: () => NormalizedItem<T> | null;
}

// ============ Hook Implementation ============

export function useUnifiedFullscreenLogic<T>({
  items,
  adapter,
  initialIndex = 0,
  onIndexChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  allowLandscape = true,
  focusItemId,
  onClose,
  onFirstFrameReady,
  onScrollStateChange,
}: UnifiedFullscreenLogicOptions<T>): UnifiedFullscreenLogicReturn<T> {
  
  // ==================================================================================
  // STEP 1: Data Normalization Layer
  // ==================================================================================
  
  const normalizedItems = useMemo((): NormalizedItem<T>[] => {
    return items.map(item => ({
      id: adapter.getId(item),
      media: adapter.getMedia(item),
      creator: adapter.getCreator(item),
      likes: adapter.getLikes(item),
      comments: adapter.getComments(item),
      caption: adapter.getCaption(item),
      course: adapter.getCourse(item),
      musicTrack: adapter.getMusicTrack(item),
      badges: adapter.getBadges(item),
      reviewData: adapter.getReviewData(item),
      isReview: adapter.getReviewData(item) !== null,
      categories: adapter.getCategories?.(item) || [],
      createdAt: adapter.getCreatedAt?.(item),
      originalItem: item,
    }));
  }, [items, adapter]);

  // ==================================================================================
  // STEP 2: Landscape Filter Toggle
  // ==================================================================================
  
  const isPortrait = useCallback((media?: { width?: number; height?: number; aspect_ratio?: number }) => {
    if (!media) return false;
    if (media.width && media.height) return media.height / media.width >= PORTRAIT_MIN_AR;
    if (media.aspect_ratio) return 1 / media.aspect_ratio >= PORTRAIT_MIN_AR;
    return false;
  }, []);
  
  const filteredItems = useMemo((): NormalizedItem<T>[] => {
    // If allowLandscape is true (default), return all items
    if (allowLandscape) {
      return normalizedItems;
    }
    
    // Portrait-only mode (legacy Clubhouse behavior)
    return normalizedItems.filter(item => {
      // Review posts bypass portrait check
      if (item.isReview) return true;
      
      const media = item.media[0];
      if (!media) return false;
      
      return isPortrait({
        width: media.width,
        height: media.height,
        aspect_ratio: media.aspect_ratio,
      });
    });
  }, [normalizedItems, allowLandscape, isPortrait]);

  // ==================================================================================
  // STEP 3: Calculate Initial Index (with focusItemId support)
  // ==================================================================================
  
  const computedInitialIndex = useMemo(() => {
    if (focusItemId && filteredItems.length > 0) {
      const idx = filteredItems.findIndex(item => item.id === focusItemId);
      if (idx !== -1) return idx;
    }
    return Math.min(initialIndex, Math.max(0, filteredItems.length - 1));
  }, [focusItemId, filteredItems, initialIndex]);

  // ==================================================================================
  // STEP 4: Refs and State
  // ==================================================================================
  
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  
  const [currentIndex, setCurrentIndex] = useState(computedInitialIndex);
  const [visualIndex, setVisualIndex] = useState(computedInitialIndex);
  const [shouldAttachMap, setShouldAttachMap] = useState<Record<string, boolean>>({});
  const [autoplayMap, setAutoplayMap] = useState<Record<string, boolean>>({});
  
  // Refs for observers and scroll state
  const nearObserverRef = useRef<IntersectionObserver | null>(null);
  const playObserverRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);
  const scrollSettleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastIndexChangeTimeRef = useRef(0);
  const visualIndexTimeoutRef = useRef<number | null>(null);
  const hasPreloadedFirst = useRef(false);
  const firstFrameReadyFiredRef = useRef(false);
  
  // Bootstrap first video autoplay
  const bootstrapFirstAutoplayRef = useRef(true);
  const bootstrapFirstAutoplayTimeoutRef = useRef<number | null>(null);
  const firstVideoProtectedUntilRef = useRef<number>(0);
  const firstPostIdRef = useRef<string | null>(null);
  
  // Track if we've scrolled to initial index
  const hasScrolledToInitialRef = useRef(false);

  // ==================================================================================
  // STEP 5: First Video Bootstrap (Critical for autoplay on initial load)
  // ==================================================================================
  
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current || !filteredItems.length) return;
    
    // CRITICAL FIX: Use computedInitialIndex instead of always targeting index 0
    // This ensures the correct video starts playing when opening fullscreen from any position
    const targetIndex = computedInitialIndex;
    const targetItem = filteredItems[targetIndex];
    if (!targetItem) return;
    
    const targetMedia = targetItem.media[0];
    if (!targetMedia || targetMedia.media_type !== 'video') {
      // Still mark as preloaded but skip video-specific setup
      hasPreloadedFirst.current = true;
      return;
    }
    
    hasPreloadedFirst.current = true;
    firstPostIdRef.current = targetItem.id;
    
    // Bootstrap: keep initial card autoplay true on initial landing
    bootstrapFirstAutoplayRef.current = true;
    if (bootstrapFirstAutoplayTimeoutRef.current) {
      window.clearTimeout(bootstrapFirstAutoplayTimeoutRef.current);
    }
    bootstrapFirstAutoplayTimeoutRef.current = window.setTimeout(() => {
      bootstrapFirstAutoplayRef.current = false;
      bootstrapFirstAutoplayTimeoutRef.current = null;
    }, 15000);
    
    // Protect against early observer false negatives
    firstVideoProtectedUntilRef.current = Date.now() + 2500;
    
    // Set both maps synchronously for the TARGET item (not always index 0)
    setShouldAttachMap({ [targetItem.id]: true });
    setAutoplayMap({ [targetItem.id]: true });
    
    // Preload HLS manifest for target video
    const mediaSrc = targetMedia.media_url;
    if (mediaSrc) {
      const uid = uidFromNode({ src: mediaSrc });
      if (uid) {
        preloadHlsManifest(generateStreamHlsUrl(uid));
      }
    }
  }, [filteredItems, computedInitialIndex]);

  // ==================================================================================
  // STEP 6: Scroll to Initial Index (for deep linking)
  // ==================================================================================
  
  // Scroll to initial index (for non-zero start positions)
  // This runs AFTER the first video bootstrap, so maps are already set
  useEffect(() => {
    // Skip if already scrolled or no items
    if (hasScrolledToInitialRef.current || !filteredItems.length) return;
    if (!scrollViewRef.current) return;
    
    // CRITICAL FIX: Always mark as scrolled (even for index 0) to prevent re-runs
    hasScrolledToInitialRef.current = true;
    
    // Only actually scroll if index is non-zero
    if (computedInitialIndex === 0) return;
    
    requestAnimationFrame(() => {
      const itemHeight = window.innerHeight;
      const targetScrollTop = computedInitialIndex * itemHeight;
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ top: targetScrollTop, behavior: 'instant' });
        
        // Maps already set in bootstrap effect, but ensure they're updated
        const targetItem = filteredItems[computedInitialIndex];
        if (targetItem) {
          setShouldAttachMap(m => ({ ...m, [targetItem.id]: true }));
          setAutoplayMap(m => ({ ...m, [targetItem.id]: true }));
        }
      }
    });
  }, [computedInitialIndex, filteredItems]);

  // ==================================================================================
  // STEP 7: Dual Intersection Observers
  // ==================================================================================
  
  useEffect(() => {
    if (!filteredItems.length) {
      nearObserverRef.current?.disconnect();
      playObserverRef.current?.disconnect();
      return;
    }
    
    // Prebuffer observer (wider margin)
    const nearObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('data-postid');
          if (!id) return;
          setShouldAttachMap((m) => ({ ...m, [id]: e.isIntersecting || e.intersectionRatio > 0 }));
        });
      },
      { root: null, rootMargin: '500px 0px 500px 0px', threshold: 0 }
    );

    // Autoplay observer (center detection)
    const playObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('data-postid');
          if (!id) return;

          const isFirstVideo = id === firstPostIdRef.current;

          // Hard bootstrap: force first card to be autoplay=true
          if (isFirstVideo && bootstrapFirstAutoplayRef.current) {
            setAutoplayMap((m) => (m[id] ? m : { ...m, [id]: true }));
            return;
          }

          // Protect first video from being set to false during early mount
          const isProtected = isFirstVideo && Date.now() < firstVideoProtectedUntilRef.current;
          const shouldAutoplay = e.intersectionRatio >= 0.5;

          // Don't override user-initiated playback
          const activeReason = MediaRuntime.getActiveReason();
          const primaryActiveId = MediaRuntime.getPrimaryActiveId();
          const isUserPlaying = activeReason === 'user' && primaryActiveId === id;

          if (!isUserPlaying && (shouldAutoplay || !isProtected)) {
            setAutoplayMap((m) => ({ ...m, [id]: shouldAutoplay }));
          }
        });
      },
      { root: null, threshold: [0.0, 0.5, 1.0] }
    );

    nearObserverRef.current = nearObserver;
    playObserverRef.current = playObserver;

    return () => {
      nearObserver.disconnect();
      playObserver.disconnect();
    };
  }, [filteredItems]);

  // ==================================================================================
  // STEP 8: Scroll Handler
  // ==================================================================================
  
  const handleScroll = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollTop = scrollViewRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    // Stop forcing first-card autoplay on meaningful scroll
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
      onScrollStateChange?.(false);
      MediaRuntime.setUIState({ isScrolling: false });
    }, SCROLL_SETTLE_DELAY);

    // Index update with hysteresis
    const now = Date.now();
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredItems.length) {
      if (now - lastIndexChangeTimeRef.current < MIN_INDEX_CHANGE_INTERVAL) return;

      lastIndexChangeTimeRef.current = now;
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex);

      // Visual index with slight delay for smooth HUD
      if (visualIndexTimeoutRef.current) {
        window.clearTimeout(visualIndexTimeoutRef.current);
      }
      visualIndexTimeoutRef.current = window.setTimeout(() => {
        setVisualIndex(newIndex);
      }, 40);
    }

    // Load more check
    if (newIndex >= filteredItems.length - 3 && hasMore && !isLoadingMore) {
      onLoadMore?.();
    }
  }, [currentIndex, filteredItems.length, hasMore, isLoadingMore, onLoadMore, onIndexChange, onScrollStateChange]);

  // ==================================================================================
  // STEP 9: Keyboard Navigation
  // ==================================================================================
  
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
            onIndexChange?.(newIndex);
            scrollViewRef.current.scrollTo({ top: newIndex * itemHeight, behavior: 'smooth' });
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < filteredItems.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            onIndexChange?.(newIndex);
            scrollViewRef.current.scrollTo({ top: newIndex * itemHeight, behavior: 'smooth' });
            
            if (newIndex >= filteredItems.length - 3 && hasMore && !isLoadingMore) {
              onLoadMore?.();
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, filteredItems.length, hasMore, isLoadingMore, onLoadMore, onIndexChange, onClose]);

  // ==================================================================================
  // STEP 10: Preload Next Videos
  // ==================================================================================
  
  useEffect(() => {
    if (!filteredItems.length) return;
    
    for (let i = 1; i <= VIDEOS_TO_PRELOAD; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex >= filteredItems.length) break;
      
      const nextItem = filteredItems[nextIndex];
      const nextMedia = nextItem?.media[0];
      if (!nextMedia || nextMedia.media_type !== 'video') continue;
      
      const src = nextMedia.media_url;
      if (!src) continue;
      
      const uid = uidFromNode({ src });
      if (uid) {
        preloadHlsManifest(generateStreamHlsUrl(uid));
      }
    }
  }, [currentIndex, filteredItems]);

  // ==================================================================================
  // STEP 11: Navigation Functions
  // ==================================================================================
  
  const goToIndex = useCallback((index: number) => {
    if (!scrollViewRef.current || index < 0 || index >= filteredItems.length) return;
    
    const itemHeight = window.innerHeight;
    setCurrentIndex(index);
    onIndexChange?.(index);
    scrollViewRef.current.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
  }, [filteredItems.length, onIndexChange]);
  
  const goToNext = useCallback(() => {
    if (currentIndex < filteredItems.length - 1) {
      goToIndex(currentIndex + 1);
    }
  }, [currentIndex, filteredItems.length, goToIndex]);
  
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    }
  }, [currentIndex, goToIndex]);

  // ==================================================================================
  // STEP 12: Utility Functions
  // ==================================================================================
  
  const handleFirstFrameReady = useCallback(() => {
    if (firstFrameReadyFiredRef.current) return;
    firstFrameReadyFiredRef.current = true;
    onFirstFrameReady?.();
  }, [onFirstFrameReady]);
  
  const registerItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current[index] = el;
      nearObserverRef.current?.observe(el);
      playObserverRef.current?.observe(el);
    }
  }, []);
  
  const registerVideoRef = useCallback((postId: string, el: HTMLVideoElement | null) => {
    videoRefs.current[postId] = el;
  }, []);
  
  const isNearby = useCallback((index: number) => {
    return Math.abs(index - currentIndex) <= 1;
  }, [currentIndex]);
  
  const getNormalizedItems = useCallback(() => normalizedItems, [normalizedItems]);
  const getFilteredItems = useCallback(() => filteredItems, [filteredItems]);
  const getCurrentItem = useCallback(() => filteredItems[currentIndex] || null, [filteredItems, currentIndex]);

  // ==================================================================================
  // STEP 13: Cleanup
  // ==================================================================================
  
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
    };
  }, []);

  // ==================================================================================
  // Return
  // ==================================================================================
  
  return {
    // Refs
    scrollViewRef,
    itemRefs,
    videoRefs,
    
    // State
    currentIndex,
    visualIndex,
    isScrolling: isScrollingRef.current,
    
    // Navigation
    goToIndex,
    goToNext,
    goToPrevious,
    
    // Media state
    shouldAttachMap,
    autoplayMap,
    
    // Handlers
    handleScroll,
    handleFirstFrameReady,
    registerItemRef,
    registerVideoRef,
    
    // Utilities
    isNearby,
    getNormalizedItems,
    getFilteredItems,
    getCurrentItem,
  };
}
