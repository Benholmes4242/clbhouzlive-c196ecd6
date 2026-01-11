/**
 * FullscreenPlayerContext - Global context for unified fullscreen media player
 * 
 * Provides a simple API for opening the fullscreen player from any page.
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
import { UnifiedFullscreenViewer } from '@/components/fullscreen/UnifiedFullscreenViewer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

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
    
    // CRITICAL FIX: Preload HLS manifest for target video BEFORE opening
    // This eliminates the delay between fullscreen open and video playback
    const targetItem = newConfig.items[newConfig.initialIndex] as any;
    if (targetItem) {
      // Try to extract media URL from various item shapes
      const mediaUrl = 
        targetItem.media?.[0]?.media_url || 
        targetItem.src || 
        targetItem.mediaUrl || 
        targetItem.url;
      
      const mediaType = 
        targetItem.media?.[0]?.media_type || 
        targetItem.type || 
        targetItem.mediaType;
      
      if (mediaUrl && mediaType === 'video') {
        const streamId = uidFromNode({ src: mediaUrl });
        if (streamId) {
          preloadHlsManifest(generateStreamHlsUrl(streamId));
        }
      }
    }
    
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

  return (
    <FullscreenPlayerContext.Provider value={{ isOpen, openFullscreen, closeFullscreen, updateConfig }}>
      {children}
      
      {isOpen && config && (
        <UnifiedFullscreenViewer
          items={config.items}
          adapter={config.adapter}
          initialIndex={config.initialIndex}
          focusItemId={config.focusItemId}
          allowLandscape={config.allowLandscape}
          onLoadMore={config.onLoadMore}
          hasMore={config.hasMore}
          isLoadingMore={config.isLoadingMore}
          onIndexChange={config.onIndexChange}
          onLike={config.onLike}
          onComment={config.onComment}
          onShare={config.onShare}
          onFollow={config.onFollow}
          onFirstFrameReady={config.onFirstFrameReady}
          onClose={closeFullscreen}
          showActionRail={config.showActionRail}
          showCreatorCapsule={config.showCreatorCapsule}
          showVideoScrubber={config.showVideoScrubber}
        />
      )}
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
