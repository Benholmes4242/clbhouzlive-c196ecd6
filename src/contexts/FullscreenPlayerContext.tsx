/**
 * FullscreenPlayerContext - Global context for unified fullscreen media player
 * 
 * Provides a simple API for opening the fullscreen player from any page.
 * Now uses the new modular FullscreenMediaViewer (Phase 5).
 * 
 * Usage:
 * const { openFullscreen, closeFullscreen, isOpen } = useFullscreenPlayer();
 * 
 * openFullscreen({
 *   items: feedData,
 *   adapter: exploreFeedAdapter,
 *   initialIndex: clickedIndex,
 *   onLoadMore: fetchNextPage,
 *   hasMore: hasNextPage,
 * });
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FeedAdapter } from '@/types/feed-adapter';
import { FullscreenMediaViewer } from '@/media/fullscreen';
import { adaptItemsToFullscreen } from '@/media/fullscreenAdapters';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

// ============ Constants ============

/** Number of videos to prefetch ahead when opening fullscreen */
const PREFETCH_AHEAD = 4;
/** Number of videos to prefetch behind when opening fullscreen */
const PREFETCH_BEHIND = 2;

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

// ============ Context ============

const FullscreenPlayerContext = createContext<FullscreenPlayerContextValue | null>(null);

// ============ Provider ============

export function FullscreenPlayerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<FullscreenPlayerConfig<any> | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  const openFullscreen = useCallback(<T,>(newConfig: FullscreenPlayerConfig<T>) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    const { items, initialIndex } = newConfig;
    
    // ENHANCED PREFETCH: Preload HLS manifests for target + adjacent videos
    // This ensures smooth swiping in fullscreen mode
    const prefetchStart = Math.max(0, initialIndex - PREFETCH_BEHIND);
    const prefetchEnd = Math.min(items.length, initialIndex + PREFETCH_AHEAD + 1);
    
    const prefetchPromises: Promise<void>[] = [];
    
    for (let i = prefetchStart; i < prefetchEnd; i++) {
      const item = items[i] as any;
      const hlsUrl = extractVideoUrl(item);
      
      if (hlsUrl) {
        // Prioritize the target video
        if (i === initialIndex) {
          prefetchPromises.unshift(preloadHlsManifest(hlsUrl));
        } else {
          prefetchPromises.push(preloadHlsManifest(hlsUrl));
        }
      }
    }
    
    // Fire and forget - don't block on prefetch completion
    Promise.allSettled(prefetchPromises);
    
    setConfig(newConfig as FullscreenPlayerConfig<any>);
    setIsOpen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsOpen(false);
    
    // Call user's onClose callback
    config?.onClose?.();
    
    // Clear config after animation completes (300ms)
    closeTimeoutRef.current = setTimeout(() => {
      setConfig(null);
    }, 300);
  }, [config]);

  const updateConfig = useCallback(<T,>(updates: Partial<FullscreenPlayerConfig<T>>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Convert old config items to new FullscreenMediaItem format
  const fullscreenItems = config 
    ? adaptItemsToFullscreen(config.items, config.adapter) 
    : [];

  return (
    <FullscreenPlayerContext.Provider value={{ isOpen, openFullscreen, closeFullscreen, updateConfig }}>
      {children}
      
      <FullscreenMediaViewer
        isOpen={isOpen && !!config}
        items={fullscreenItems}
        initialIndex={config?.initialIndex ?? 0}
        context="discover"
        onClose={closeFullscreen}
        onIndexChange={config?.onIndexChange}
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
