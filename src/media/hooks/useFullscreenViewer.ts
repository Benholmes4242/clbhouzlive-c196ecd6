/**
 * useFullscreenViewer - State management hook for fullscreen media viewer
 * 
 * Provides unified state for navigation, media display, and infinite scroll.
 * Uses context to share state with sub-components.
 * 
 * FIXES INCLUDED:
 * - Fix 2: Bootstrap logic for autoplay on open
 * - Fix 3: Active video ref for controls
 * - Fix 4C: Robust totalMediaInPost handling
 */

import { useState, useCallback, useRef, createContext, useContext, useMemo, useEffect } from 'react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

// ============ Types ============

export type FullscreenContext = 
  | 'discover' 
  | 'watch' 
  | 'profile' 
  | 'search' 
  | 'notification'
  | 'clubhouse'
  | 'course';

// Media item within a post (for carousel)
export interface FullscreenMediaItemMedia {
  id: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  streamId?: string;
  posterUrl?: string;
  aspectRatio?: number;
  studioEdits?: any;
}

export interface FullscreenMediaItem {
  id: string;
  postId: string;
  mediaIndex: number;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  streamId?: string;
  posterUrl?: string;
  aspectRatio?: number;
  duration?: number;
  width?: number;
  height?: number;
  studioEdits?: any;
  // Creator info
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorUsername: string;
  creatorHomeClub?: string;
  creatorHandicap?: number | string | null;
  // Post info
  caption?: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  // Course info (optional)
  courseId?: string;
  courseName?: string;
  courseCountry?: string;
  courseRegion?: string;
  // Review info (optional)
  isReview?: boolean;
  reviewRating?: number;
  reviewData?: any;
  // NEW: Full media array for carousel navigation
  allMedia?: FullscreenMediaItemMedia[];
  // Achievement post flag (non-editable)
  achievementId?: string | null;
}

export interface UseFullscreenViewerOptions {
  /** Initial media items */
  initialItems?: FullscreenMediaItem[];
  /** Context for analytics and behavior */
  context?: FullscreenContext;
  /** Callback to fetch more items */
  onFetchMore?: () => Promise<FullscreenMediaItem[]>;
  /** Callback when viewer closes */
  onClose?: () => void;
  /** Callback when index changes */
  onIndexChange?: (index: number) => void;
  /** Resume playback at this position (seconds) for the initial video */
  startAt?: number;
}

export interface UseFullscreenViewerReturn {
  // State
  isOpen: boolean;
  currentIndex: number;
  currentItem: FullscreenMediaItem | null;
  items: FullscreenMediaItem[];
  context: FullscreenContext;
  isLoading: boolean;
  hasMore: boolean;
  
  // FIX 2: Bootstrap state for autoplay
  isBootstrapping: boolean;
  
  // FIX 3: Active video ref for controls
  activeVideoRef: React.RefObject<HTMLVideoElement> | null;
  setActiveVideoRef: (ref: React.RefObject<HTMLVideoElement> | null) => void;
  
  // Resume position for initial video
  startAt?: number;
  
  // Navigation
  open: (index?: number, items?: FullscreenMediaItem[]) => void;
  close: () => void;
  goToIndex: (index: number) => void;
  goToNext: () => void;
  goToPrev: () => void;
  
  // Data
  setItems: (items: FullscreenMediaItem[]) => void;
  appendItems: (items: FullscreenMediaItem[]) => void;
  fetchMore: () => Promise<void>;
  
  // Media navigation (within a post)
  currentMediaIndex: number;
  totalMediaInPost: number;
  currentMediaItem: FullscreenMediaItemMedia | null;
  goToMedia: (index: number) => void;
  nextMedia: () => void;
  prevMedia: () => void;
  hasNextMedia: boolean;
  hasPrevMedia: boolean;
  
  // UI state
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  commentsOpen: boolean;
  setCommentsOpen: (open: boolean) => void;
}

// ============ Hook Implementation ============

export function useFullscreenViewer(
  options: UseFullscreenViewerOptions = {}
): UseFullscreenViewerReturn {
  const { 
    initialItems = [], 
    context = 'discover', 
    onFetchMore, 
    onClose,
    onIndexChange,
    startAt,
  } = options;

  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItemsState] = useState<FullscreenMediaItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // FIX 2: Bootstrap state - signals when autoplay should begin
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const bootstrapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // FIX 3: Active video ref for controls
  const [activeVideoRef, setActiveVideoRef] = useState<React.RefObject<HTMLVideoElement> | null>(null);
  
  // Use global audio context instead of local state
  const { isGloballyMuted, setGlobalMute, markUserGestureUnmute } = useGlobalAudio();
  
  // UI state
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  // Refs
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  // Derived state
  const currentItem = items[currentIndex] || null;
  
  // FIX 4C: More robust totalMediaInPost calculation
  const totalMediaInPost = useMemo(() => {
    if (!currentItem) return 0;
    
    // Check allMedia array first
    const mediaArray = currentItem.allMedia;
    if (Array.isArray(mediaArray) && mediaArray.length > 0) {
      return mediaArray.length;
    }
    
    // Fallback: if item has media, count as 1
    return currentItem.mediaUrl ? 1 : 0;
  }, [currentItem]);

  // Reset media index when changing posts
  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [currentIndex]);

  // Get current media item for display
  const currentMediaItem = useMemo((): FullscreenMediaItemMedia | null => {
    if (!currentItem) return null;
    if (currentItem.allMedia?.length) {
      return currentItem.allMedia[currentMediaIndex] || currentItem.allMedia[0];
    }
    // Fallback to primary media if no allMedia array
    return {
      id: currentItem.id,
      mediaUrl: currentItem.mediaUrl,
      mediaType: currentItem.mediaType,
      streamId: currentItem.streamId,
      posterUrl: currentItem.posterUrl,
      aspectRatio: currentItem.aspectRatio,
      studioEdits: currentItem.studioEdits,
    };
  }, [currentItem, currentMediaIndex]);

  // FIX 2: Modified open() with bootstrap logic
  const open = useCallback((index = 0, newItems?: FullscreenMediaItem[]) => {
    if (newItems) {
      setItemsState(newItems);
    }
    setCurrentIndex(index);
    setCurrentMediaIndex(0);
    setIsOpen(true);
    
    // Bootstrap: Signal that we're initializing (block autoplay momentarily)
    setIsBootstrapping(true);
    
    // Clear any existing timeout
    if (bootstrapTimeoutRef.current) {
      clearTimeout(bootstrapTimeoutRef.current);
    }
    
    // After DOM renders, enable autoplay
    // Using double RAF for more reliable timing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bootstrapTimeoutRef.current = setTimeout(() => {
          setIsBootstrapping(false);
        }, 50);
      });
    });
  }, []);

  // Cleanup bootstrap timeout on unmount
  useEffect(() => {
    return () => {
      if (bootstrapTimeoutRef.current) {
        clearTimeout(bootstrapTimeoutRef.current);
      }
    };
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCommentsOpen(false);
    setActiveVideoRef(null);
    onCloseRef.current?.();
  }, []);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
      setCurrentMediaIndex(0);
      onIndexChangeRef.current?.(index);
    }
  }, [items.length]);

  const goToNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentMediaIndex(0);
      onIndexChangeRef.current?.(newIndex);
    }
  }, [currentIndex, items.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentMediaIndex(0);
      onIndexChangeRef.current?.(newIndex);
    }
  }, [currentIndex]);

  // Data methods
  const setItems = useCallback((newItems: FullscreenMediaItem[]) => {
    setItemsState(newItems);
  }, []);

  const appendItems = useCallback((newItems: FullscreenMediaItem[]) => {
    setItemsState(prev => [...prev, ...newItems]);
  }, []);

  const fetchMore = useCallback(async () => {
    if (isLoading || !hasMore || !onFetchMore) return;

    setIsLoading(true);
    try {
      const newItems = await onFetchMore();
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItemsState(prev => [...prev, ...newItems]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, onFetchMore]);

  // Media navigation within post
  const goToMedia = useCallback((index: number) => {
    if (index >= 0 && index < totalMediaInPost) {
      setCurrentMediaIndex(index);
    }
  }, [totalMediaInPost]);

  const nextMedia = useCallback(() => {
    if (currentMediaIndex < totalMediaInPost - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  }, [currentMediaIndex, totalMediaInPost]);

  const prevMedia = useCallback(() => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  }, [currentMediaIndex]);

  // Navigation availability flags
  const hasNextMedia = currentMediaIndex < totalMediaInPost - 1;
  const hasPrevMedia = currentMediaIndex > 0;

  // Audio toggle helper
  const toggleMute = useCallback(() => {
    if (isGloballyMuted) markUserGestureUnmute();
    setGlobalMute(!isGloballyMuted);
  }, [isGloballyMuted, setGlobalMute, markUserGestureUnmute]);

  return {
    isOpen,
    currentIndex,
    currentItem,
    items,
    context,
    isLoading,
    hasMore,
    isBootstrapping,
    activeVideoRef,
    setActiveVideoRef,
    startAt,
    open,
    close,
    goToIndex,
    goToNext,
    goToPrev,
    setItems,
    appendItems,
    fetchMore,
    currentMediaIndex,
    totalMediaInPost,
    currentMediaItem,
    goToMedia,
    nextMedia,
    prevMedia,
    hasNextMedia,
    hasPrevMedia,
    isMuted: isGloballyMuted,
    setMuted: setGlobalMute,
    toggleMute,
    commentsOpen,
    setCommentsOpen,
  };
}

// ============ Context ============

export const FullscreenViewerContext = createContext<UseFullscreenViewerReturn | null>(null);

export function useFullscreenViewerContext() {
  const context = useContext(FullscreenViewerContext);
  if (!context) {
    throw new Error('useFullscreenViewerContext must be used within FullscreenViewerProvider');
  }
  return context;
}

// Optional hook that doesn't throw
export function useFullscreenViewerOptional() {
  return useContext(FullscreenViewerContext);
}
