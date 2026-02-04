import React, { useRef, useEffect, useCallback } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortCard from './ShortCard';
import { useMediaAutoplay } from '@/media';
import { logTimerMount, logTimerUnmount, logVideoPlayState } from '@/utils/debugWatchPage';

interface ShortCardWithObserverProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;
  isPinned?: boolean;
  onVisibilityChange?: (id: string, visible: boolean) => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
  variant?: 'portrait' | 'landscape';
  gridPosition?: number;
  useGlassPanel?: boolean;
  isTrending?: boolean;
  isSuggested?: boolean;
  /** Callback when video first frame is ready (for prefetch system) */
  onFirstFrameReady?: () => void;
  /** Whether this is a priority card (first 6) for eager loading */
  isPriority?: boolean;
}

/**
 * Wrapper around ShortCard that uses MediaRuntime for playback control.
 * 
 * Uses useMediaAutoplay hook for centralized playback:
 * - Registers video with MediaRuntime
 * - MediaRuntime handles visibility observation
 * - Only one video plays at a time (priority system)
 * 
 * Autoplay pattern for portrait grids:
 * - Row 1: Left card plays (position 0), right paused (position 1)
 * - Row 2: Right card plays (position 3), left paused (position 2)
 * - Landscape: Always candidate for autoplay
 */
export default function ShortCardWithObserver({
  item,
  onClick,
  height,
  isPinned,
  onVisibilityChange,
  onLike,
  onAuthorClick,
  currentUserId,
  variant,
  gridPosition = 0,
  useGlassPanel,
  isTrending,
  isSuggested,
  onFirstFrameReady,
  isPriority = false,
}: ShortCardWithObserverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const registeredIdRef = useRef<string | null>(null);
  
  // Use MediaRuntime for centralized playback control
  // P0: TikTok-level hysteresis thresholds - 50% to start, 10% to stop
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    surface: 'grid',
    startThreshold: 0.5, // P0: Start at 50% visibility
    stopThreshold: 0.1,  // P0: Stop at 10% visibility
  });
  
  // Determine if this card should be a candidate based on grid position
  const isCandidate = React.useMemo(() => {
    // Landscape cards are always candidates
    if (variant === 'landscape') return true;
    
    // Portrait cards follow alternating pattern
    // Row 1 (positions 0-1): position 0 plays
    // Row 2 (positions 2-3): position 3 plays
    const positionInPattern = gridPosition % 4;
    return positionInPattern === 0 || positionInPattern === 3;
  }, [variant, gridPosition]);
  
  // Check if this is a video
  const isVideo = item.type === 'video' || item.src?.includes('.mp4') || item.src?.includes('.webm');
  
  // Get video element from ShortCard's HLSPlayer
  const findVideoElement = useCallback(() => {
    if (!containerRef.current || !isVideo) return null;
    return containerRef.current.querySelector('video') as HTMLVideoElement | null;
  }, [isVideo]);
  
  // Register with MediaRuntime when video element is available
  useEffect(() => {
    if (!isVideo) return;
    
    // Debug: Log mount
    logTimerMount(item.id, { 
      variant, 
      gridPosition, 
      isCandidate,
      isVideo 
    });
    
    const registerVideo = () => {
      const element = findVideoElement();
      
      if (element && registeredIdRef.current !== item.id) {
        registeredIdRef.current = item.id;
        videoElementRef.current = element;
        
        // Listen for loadeddata to report first frame ready
        const handleLoadedData = () => {
          if (!hasReportedReadyRef.current) {
            hasReportedReadyRef.current = true;
            onFirstFrameReady?.();
          }
        };
        
        element.addEventListener('loadeddata', handleLoadedData, { once: true });
        
        // If already has data, report immediately
        if (element.readyState >= 2) {
          handleLoadedData();
        }
        
        registerMedia({
          id: item.id,
          element,
          isCandidate,
          sortIndex: gridPosition,
          observeTarget: containerRef.current,
        });
      }
    };
    
    // Try immediately and again after short delay (for HLS mount timing)
    registerVideo();
    const timer = setTimeout(registerVideo, 150);
    
    return () => {
      clearTimeout(timer);
      // Debug: Log unmount
      logTimerUnmount(item.id);
      // Unregister on cleanup
      if (registeredIdRef.current) {
        registerMedia({ id: registeredIdRef.current, element: null });
        registeredIdRef.current = null;
        videoElementRef.current = null;
      }
    };
  }, [item.id, isVideo, isCandidate, gridPosition, registerMedia, findVideoElement, variant]);
  
  // Notify parent of visibility changes (based on playingIds)
  useEffect(() => {
    const isPlaying = playingIds.has(item.id);
    
    // Debug: Log play state changes
    logVideoPlayState(item.id, {
      isPlaying,
      isVisible: isPlaying,
      isInViewport: true, // If it's playing, it's in viewport
    });
    
    onVisibilityChange?.(item.id, isPlaying);
  }, [playingIds, item.id, onVisibilityChange]);

  return (
    <div ref={containerRef}>
      <ShortCard
        item={item}
        onClick={onClick}
        height={height}
        isPinned={isPinned}
        shouldAttach={true} // Always attach since MediaRuntime handles visibility
        autoplay={false} // MediaRuntime controls playback
        onLike={onLike}
        onAuthorClick={onAuthorClick}
        currentUserId={currentUserId}
        variant={variant}
        useGlassPanel={useGlassPanel}
        isTrending={isTrending}
        isSuggested={isSuggested}
        isPriority={isPriority}
      />
    </div>
  );
}
