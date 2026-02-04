/**
 * FullscreenPlayerContext - Global context for unified fullscreen media player
 * 
 * Provides a simple API for opening the fullscreen player from any page.
 * Now uses the new modular FullscreenMediaViewer (Phase 5).
 * 
 * TikTok-Level Improvements:
 * - FIX #1: Adaptive prefetch via useAdaptivePrefetch hook
 * - FIX #5: Update prefetch window on index change
 * - FIX #7: Prefetch all media in carousel items
 * 
 * Usage:
 * const { openFullscreen, closeFullscreen, isOpen } = useFullscreenPlayer();
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { FeedAdapter } from '@/types/feed-adapter';
import { FullscreenMediaViewer } from '@/media/fullscreen';
import { adaptItemsToFullscreen } from '@/media/fullscreenAdapters';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { useAdaptivePrefetch, AdaptivePrefetchConfig } from '@/hooks/useAdaptivePrefetch';
import { FullscreenMediaItem } from '@/media/hooks/useFullscreenViewer';

// ============ Types ============

export interface FullscreenPlayerConfig<T = unknown> {
  // Data
  items: T[];
  adapter: FeedAdapter<T>;
  
  // Navigation
  initialIndex: number;
  focusItemId?: string;
  
  // Features
  allowLandscape?: boolean;
  
  // Infinite scroll
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  
  // Callbacks
  onIndexChange?: (index: number) => void;
  onLike?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onFollow?: (creatorId: string) => void;
  onFirstFrameReady?: () => void;
  onClose?: () => void;
  
  // Delete/Edit callbacks (for own posts)
  currentUserId?: string | null;
  onEdit?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  
  // Optional customization
  showActionRail?: boolean;
  showCreatorCapsule?: boolean;
  showVideoScrubber?: boolean;
}

interface FullscreenPlayerContextValue {
  isOpen: boolean;
  openFullscreen: <T>(config: FullscreenPlayerConfig<T>) => void;
  closeFullscreen: () => void;
  updateConfig: <T>(updates: Partial<FullscreenPlayerConfig<T>>) => void;
  // FIX #1: Expose adaptive prefetch config for components
  prefetchConfig: AdaptivePrefetchConfig;
  // FIX #5: Notify context of index changes for re-prefetch
  notifyIndexChange: (newIndex: number) => void;
}

// ============ Helper: Extract video URL from item ============

function extractVideoUrl(item: any): string | null {
  const mediaUrl = 
    item?.media?.[0]?.media_url || 
    item?.src || 
    item?.mediaUrl || 
    item?.url;
  
  const mediaType = 
    item?.media?.[0]?.media_type || 
    item?.type || 
    item?.mediaType;
  
  if (mediaUrl && mediaType === 'video') {
    const streamId = uidFromNode({ src: mediaUrl });
    if (streamId) {
      return generateStreamHlsUrl(streamId);
    }
  }
  return null;
}

// ============ Helper: Extract all video URLs from fullscreen item (FIX #7) ============

function extractAllVideoUrls(item: FullscreenMediaItem): string[] {
  const urls: string[] = [];
  
  // Primary media
  if (item.mediaType === 'video' && item.mediaUrl) {
    const streamId = uidFromNode({ src: item.mediaUrl });
    if (streamId) {
      urls.push(generateStreamHlsUrl(streamId));
    }
  }
  
  // FIX #7: Also prefetch all carousel items
  if (item.allMedia && item.allMedia.length > 1) {
    for (const media of item.allMedia) {
      if (media.mediaType === 'video' && media.mediaUrl) {
        const streamId = uidFromNode({ src: media.mediaUrl });
        if (streamId) {
          const hlsUrl = generateStreamHlsUrl(streamId);
          if (!urls.includes(hlsUrl)) {
            urls.push(hlsUrl);
          }
        }
      }
    }
  }
  
  return urls;
}

// ============ Context ============

const FullscreenPlayerContext = createContext<FullscreenPlayerContextValue | null>(null);

// ============ Provider ============

export function FullscreenPlayerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<FullscreenPlayerConfig<any> | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();
  const currentIndexRef = useRef<number>(0);
  const fullscreenItemsRef = useRef<FullscreenMediaItem[]>([]);
  
  // FIX #1: Use adaptive prefetch hook
  const { config: prefetchConfig, onIndexChange: adaptiveOnIndexChange, recordScrollEvent } = useAdaptivePrefetch();

  // FIX #5 & #7: Prefetch videos around the current index
  const prefetchAroundIndex = useCallback((index: number, items: FullscreenMediaItem[]) => {
    if (!items.length) return;
    
    const { prefetchAhead, prefetchBehind, preloadManifests } = prefetchConfig;
    
    if (!preloadManifests) return; // Save-data mode
    
    const prefetchStart = Math.max(0, index - prefetchBehind);
    const prefetchEnd = Math.min(items.length, index + prefetchAhead + 1);
    
    const prefetchPromises: Promise<void>[] = [];
    
    for (let i = prefetchStart; i < prefetchEnd; i++) {
      const item = items[i];
      if (!item) continue;
      
      // FIX #7: Get ALL video URLs including carousel items
      const hlsUrls = extractAllVideoUrls(item);
      
      for (const hlsUrl of hlsUrls) {
        // Prioritize the current index
        if (i === index) {
          prefetchPromises.unshift(preloadHlsManifest(hlsUrl));
        } else {
          prefetchPromises.push(preloadHlsManifest(hlsUrl));
        }
      }
    }
    
    // Fire and forget
    Promise.allSettled(prefetchPromises);
  }, [prefetchConfig]);

  // FIX #5: Handler for index changes during navigation
  const notifyIndexChange = useCallback((newIndex: number) => {
    currentIndexRef.current = newIndex;
    
    // Record scroll event for velocity tracking
    recordScrollEvent();
    
    // Update adaptive config based on scroll velocity
    adaptiveOnIndexChange();
    
    // Re-prefetch around new index
    prefetchAroundIndex(newIndex, fullscreenItemsRef.current);
  }, [recordScrollEvent, adaptiveOnIndexChange, prefetchAroundIndex]);

  const openFullscreen = useCallback(<T,>(newConfig: FullscreenPlayerConfig<T>) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    const { items, initialIndex, adapter } = newConfig;
    
    // Convert items to fullscreen format
    const fullscreenItems = adaptItemsToFullscreen(items as any[], adapter as FeedAdapter<any>);
    fullscreenItemsRef.current = fullscreenItems;
    currentIndexRef.current = initialIndex;
    
    // FIX #1 & #7: Use adaptive prefetch with carousel support
    prefetchAroundIndex(initialIndex, fullscreenItems);
    
    setConfig(newConfig as FullscreenPlayerConfig<any>);
    setIsOpen(true);
  }, [prefetchAroundIndex]);

  const closeFullscreen = useCallback(() => {
    // Clear config FIRST to prevent any re-renders trying to access deleted items
    const onCloseCallback = config?.onClose;
    
    setIsOpen(false);
    
    // Call user's onClose callback
    onCloseCallback?.();
    
    // Clear config after animation completes (300ms)
    closeTimeoutRef.current = setTimeout(() => {
      setConfig(null);
      fullscreenItemsRef.current = [];
    }, 300);
  }, [config]);

  const updateConfig = useCallback(<T,>(updates: Partial<FullscreenPlayerConfig<T>>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Handle internal index change and notify context
  const handleIndexChange = useCallback((index: number) => {
    notifyIndexChange(index);
    config?.onIndexChange?.(index);
  }, [notifyIndexChange, config]);

  // Convert old config items to new FullscreenMediaItem format
  const fullscreenItems = config 
    ? adaptItemsToFullscreen(config.items, config.adapter) 
    : [];
  
  // Keep ref in sync
  useEffect(() => {
    fullscreenItemsRef.current = fullscreenItems;
  }, [fullscreenItems]);

  return (
    <FullscreenPlayerContext.Provider value={{ 
      isOpen, 
      openFullscreen, 
      closeFullscreen, 
      updateConfig,
      prefetchConfig,
      notifyIndexChange,
    }}>
      {children}
      
      <FullscreenMediaViewer
        isOpen={isOpen && !!config}
        items={fullscreenItems}
        initialIndex={config?.initialIndex ?? 0}
        context="discover"
        onClose={closeFullscreen}
        onIndexChange={handleIndexChange}
        onLike={config?.onLike}
        onComment={config?.onComment}
        onShare={config?.onShare}
        onFollow={config?.onFollow}
        showComments={true}
        showShare={true}
        showActionRail={config?.showActionRail ?? true}
        showCreatorCapsule={config?.showCreatorCapsule ?? true}
        showVideoScrubber={config?.showVideoScrubber ?? true}
        currentUserId={config?.currentUserId}
        onEdit={config?.onEdit}
        onDelete={config?.onDelete}
      />
    </FullscreenPlayerContext.Provider>
  );
}

// ============ Hook ============

export function useFullscreenPlayer() {
  const context = useContext(FullscreenPlayerContext);
  if (!context) {
    throw new Error('useFullscreenPlayer must be used within FullscreenPlayerProvider');
  }
  return context;
}

// ============ Optional Hook (doesn't throw) ============

export function useFullscreenPlayerOptional() {
  return useContext(FullscreenPlayerContext);
}

export default FullscreenPlayerProvider;
