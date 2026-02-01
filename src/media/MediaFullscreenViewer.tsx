/**
 * MediaFullscreenViewer - Unified fullscreen media viewer
 * 
 * Single fullscreen viewer for all surfaces (replaces FullscreenMediaModal, ShortsViewer, etc.)
 * 
 * Features:
 * - Uses HLSPlayer for video playback
 * - Poster crossfade (no flash)
 * - Prewarm next/prev items
 * - Swipe navigation
 * - Keyboard controls
 * - Time sync with tiles (opens at current time)
 */

import React, { useEffect, useRef, useState, useCallback, memo, useId } from 'react';
import { X, Volume2, VolumeX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import HLSPlayer, { HLSPlayerRef } from './HLSPlayer';
import { useMediaSystemSafe } from './MediaSystemProvider';
import { runtimeSetModalOpen, runtimeUserMute, runtimeClearOnFullscreenClose } from './runtime';
import { MediaRuntime } from './runtime/MediaRuntime';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

// Warm pool size: preload ±1 adjacent videos
const WARM_POOL_SIZE = 1;

// ============ Types ============

export interface MediaFullscreenItem {
  id: string;
  src: string;
  type: 'video' | 'image';
  poster?: string;
  title?: string;
  description?: string;
  durationSeconds?: number;
  user?: {
    id?: string;
    name?: string;
    avatarUrl?: string;
  };
  likes?: number;
  golfCourse?: {
    id: string;
    name: string;
    country?: string;
  };
  studioEdits?: {
    textOverlays?: Array<{
      id: string;
      text: string;
      x: number;
      y: number;
      scale: number;
      style: 'modern' | 'classic' | 'signature';
      color?: string;
    }>;
    filter?: string;
    music?: any;
  };
}

export interface MediaFullscreenViewerProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaFullscreenItem[];
  initialIndex?: number;
  initialTime?: number;
  
  // Orientation
  orientation?: 'vertical' | 'horizontal';
  
  // Callbacks
  onIndexChange?: (index: number) => void;
  onTimeUpdate?: (time: number) => void;
}

// ============ Component ============

const MediaFullscreenViewer: React.FC<MediaFullscreenViewerProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  initialTime = 0,
  orientation = 'vertical',
  onIndexChange,
  onTimeUpdate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef<HLSPlayerRef>(null);
  const prevPlayerRef = useRef<HLSPlayerRef>(null);
  const nextPlayerRef = useRef<HLSPlayerRef>(null);
  const { isMuted, setMuted, pauseAll } = useMediaSystemSafe();
  
  // Transparent status bar for immersive fullscreen experience
  // Only apply when open - let underlying page control status bar when closed
  useMedianStatusBar("dark", "transparent", isOpen, false);
  
  const currentItem = items[currentIndex];
  const prevItem = items[currentIndex - 1];
  const nextItem = items[currentIndex + 1];
  const isVideo = currentItem?.type === 'video';
  const hasNext = currentIndex < items.length - 1;
  const hasPrevious = currentIndex > 0;
  
  // ============ Navigation ============
  
  const goToNext = useCallback(() => {
    if (!hasNext) return;
    setCurrentIndex(prev => prev + 1);
    setProgress(0);
  }, [hasNext]);
  
  const goToPrevious = useCallback(() => {
    if (!hasPrevious) return;
    setCurrentIndex(prev => prev - 1);
    setProgress(0);
  }, [hasPrevious]);
  
  // Notify parent of index changes
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);
  
  // ============ Keyboard & Swipe ============
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'm':
        case 'M':
          runtimeUserMute();
          setMuted(!isMuted);
          break;
        case ' ':
          e.preventDefault();
          if (playerRef.current && currentItem) {
            const el = playerRef.current.getElement();
            if (el?.paused) {
              MediaRuntime.requestPlay({ id: currentItem.id, surface: 'fullscreen', reason: 'user' });
            } else {
              MediaRuntime.requestPause({ id: currentItem.id, reason: 'user' });
            }
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToNext, goToPrevious, isMuted, setMuted]);
  
  const swipeHandlers = useSwipeable({
    onSwipedUp: orientation === 'vertical' ? goToNext : undefined,
    onSwipedDown: orientation === 'vertical' ? goToPrevious : undefined,
    onSwipedLeft: orientation === 'horizontal' ? goToNext : undefined,
    onSwipedRight: orientation === 'horizontal' ? goToPrevious : undefined,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
  });
  
  // ============ Runtime UI State ============
  
  useEffect(() => {
    runtimeSetModalOpen(isOpen);
    return () => {
      if (isOpen) {
        runtimeClearOnFullscreenClose();
      }
    };
  }, [isOpen]);
  
  // ============ Body Scroll Lock ============
  
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add('lightbox-open');
      document.documentElement.classList.add('lightbox-open');
      
      // Pause all other media
      pauseAll();
      
      return () => {
        document.body.classList.remove('lightbox-open');
        document.documentElement.classList.remove('lightbox-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, pauseAll]);
  
  // ============ Time Tracking ============
  
  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
    onTimeUpdate?.(currentTime);
  }, [onTimeUpdate]);
  
  // ============ Warm Pool: Keep adjacent videos attached + paused ============
  
  // When index changes, attach adjacent players
  useEffect(() => {
    if (!isOpen) return;
    
    // Attach adjacent warm players
    if (prevItem?.type === 'video') {
      prevPlayerRef.current?.attach();
    }
    if (nextItem?.type === 'video') {
      nextPlayerRef.current?.attach();
    }
    
    return () => {
      // Detach when leaving
      prevPlayerRef.current?.detach();
      nextPlayerRef.current?.detach();
    };
  }, [currentIndex, isOpen, prevItem, nextItem]);
  
  // ============ Render ============
  
  if (!isOpen || !currentItem) return null;
  
  const isVertical = orientation === 'vertical';
  
  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      {...swipeHandlers}
    >
      {/* Media Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isVideo ? (
          <HLSPlayer
            ref={playerRef}
            key={`fullscreen-${currentItem.id}`}
            src={currentItem.src}
            posterUrl={currentItem.poster}
            autoplay
            muted={isMuted}
            loop
            showMuteButton={false}
            showPlayButton={false}
            objectFit="contain"
            className="w-full h-full"
            managedByMediaRuntime={false}
            externallyManaged={false}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <img
            src={currentItem.src}
            alt={currentItem.title || ''}
            className="w-full h-full object-contain"
            draggable={false}
          />
        )}
        
        {/* Text overlays from studioEdits */}
        {currentItem.studioEdits?.textOverlays?.length ? (
          <TextOverlayRenderer
            textOverlays={currentItem.studioEdits.textOverlays}
            isEditable={false}
          />
        ) : null}
        
        {/* Hidden Warm Pool: Previous Item (for instant navigation) */}
        {prevItem?.type === 'video' && (
          <HLSPlayer
            ref={prevPlayerRef}
            key={`warm-prev-${prevItem.id}`}
            src={prevItem.src}
            posterUrl={prevItem.poster}
            autoplay={false}
            muted={true}
            loop
            className="absolute inset-0 opacity-0 pointer-events-none -z-10"
            managedByMediaRuntime={false}
            externallyManaged={false}
            preload="metadata"
          />
        )}
        
        {/* Hidden Warm Pool: Next Item (for instant navigation) */}
        {nextItem?.type === 'video' && (
          <HLSPlayer
            ref={nextPlayerRef}
            key={`warm-next-${nextItem.id}`}
            src={nextItem.src}
            posterUrl={nextItem.poster}
            autoplay={false}
            muted={true}
            loop
            className="absolute inset-0 opacity-0 pointer-events-none -z-10"
            managedByMediaRuntime={false}
            externallyManaged={false}
            preload="metadata"
          />
        )}
      </div>
      
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/65 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        aria-label="Close viewer"
      >
        <X className="w-5 h-5" />
      </button>
      
      {/* Mute Toggle */}
      {isVideo && (
        <button
          onClick={() => {
            runtimeUserMute();
            setMuted(!isMuted);
          }}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/65 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
      
      {/* Navigation Buttons */}
      {isVertical ? (
        <>
          {hasPrevious && (
            <button
              onClick={goToPrevious}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200px] z-40 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Previous"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={goToNext}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[200px] z-40 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Next"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          )}
        </>
      ) : (
        <>
          {hasPrevious && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </>
      )}
      
      {/* Caption Panel */}
      {(currentItem.title || currentItem.user?.name) && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-6 pb-10">
          {currentItem.title && (
            <h2 className="text-white font-semibold text-base line-clamp-2">
              {currentItem.title}
            </h2>
          )}
          {currentItem.user?.name && (
            <div className="flex items-center gap-2 mt-1 text-sm text-white/80">
              <span className="font-medium">{currentItem.user.name}</span>
              {currentItem.likes !== undefined && (
                <>
                  <span>•</span>
                  <span>{currentItem.likes.toLocaleString()} likes</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Progress Bar */}
      {isVideo && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-50">
          <div
            className="h-full bg-white transition-transform origin-left"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
      )}
      
      {/* Dots Indicator (for multiple items) */}
      {items.length > 1 && items.length <= 10 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex gap-1.5">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setProgress(0);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white scale-110"
                  : "bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to item ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(MediaFullscreenViewer);
