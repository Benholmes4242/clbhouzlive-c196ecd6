/**
 * useFullscreenViewer - State management hook for fullscreen media viewer
 * 
 * Provides unified state for navigation, media display, and infinite scroll.
 * Uses context to share state with sub-components.
 */

import { useState, useCallback, useRef, createContext, useContext, useMemo } from 'react';

// ============ Types ============

export type FullscreenContext = 
  | 'discover' 
  | 'watch' 
  | 'profile' 
  | 'search' 
  | 'notification'
  | 'clubhouse'
  | 'course';

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
  creatorHandicap?: number | null;
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
  goToMedia: (index: number) => void;
  nextMedia: () => void;
  prevMedia: () => void;
  
  // UI state
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
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
  } = options;

  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItemsState] = useState<FullscreenMediaItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // UI state
  const [isMuted, setMuted] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  // Refs
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  // Derived state
  const currentItem = items[currentIndex] || null;
  
  // Calculate total media in current post (for multi-media posts)
  const totalMediaInPost = useMemo(() => {
    if (!currentItem) return 0;
    // For now, assume single media per item
    // This can be extended when MediaCarousel is integrated
    return 1;
  }, [currentItem]);

  // Navigation methods
  const open = useCallback((index = 0, newItems?: FullscreenMediaItem[]) => {
    if (newItems) {
      setItemsState(newItems);
    }
    setCurrentIndex(index);
    setCurrentMediaIndex(0);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCommentsOpen(false);
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

  return {
    isOpen,
    currentIndex,
    currentItem,
    items,
    context,
    isLoading,
    hasMore,
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
    goToMedia,
    nextMedia,
    prevMedia,
    isMuted,
    setMuted,
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
