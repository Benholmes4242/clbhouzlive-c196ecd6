/**
 * VideoScrubber - Draggable progress bar for video tiles
 * 
 * Shows playback progress and allows seeking via drag/swipe.
 * Positioned at the bottom edge of the video/media area.
 * 
 * Features:
 * - Three-layer bar: track → buffered → played
 * - Micro-buffering shimmer when stalling
 * - Ghost shimmer before first frame (prewarm indicator)
 * - stopPropagation on all pointer events to prevent triggering tile click
 * - Integrates with MediaRuntime for intent tracking
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';

type ScrubberVariant = 'default' | 'wizard' | 'fullscreen' | 'amber';

interface VideoScrubberProps {
  videoEl: HTMLVideoElement | null;
  mediaId?: string; // For runtime intent tracking
  height?: number;
  className?: string;
  /** Visual variant: 'default' (white for feed), 'wizard' (amber), or 'fullscreen' (subtle white) */
  variant?: ScrubberVariant;
  // Buffering state (from HLSPlayer)
  bufferedPct?: number;      // 0..1
  isBuffering?: boolean;     // true when waiting/stalled
  hasFirstFrame?: boolean;   // true when first frame painted
  isAttached?: boolean;      // true when HLS is attached
}

// Color palettes per variant
const COLORS = {
  default: {
    track: 'rgba(255, 255, 255, 0.15)',
    buffered: 'rgba(255, 255, 255, 0.25)',
    fill: '#FFFFFF',
    glow: 'none',
    ghostShimmer: 'rgba(255,255,255,0.05)',
    bufferShimmer: 'rgba(255,255,255,0.3)',
  },
  wizard: {
    track: 'rgba(217, 119, 6, 0.15)',
    buffered: 'rgba(217, 119, 6, 0.25)',
    fill: '#F59E0B',
    glow: '0 0 10px rgba(245, 158, 11, 0.4)',
    ghostShimmer: 'rgba(217,119,6,0.1)',
    bufferShimmer: 'rgba(217,119,6,0.2)',
  },
  fullscreen: {
    track: 'rgba(255, 255, 255, 0.15)',
    buffered: 'rgba(255, 255, 255, 0.3)',
    fill: '#FFFFFF',
    glow: '0 0 8px rgba(255, 255, 255, 0.45)',
    ghostShimmer: 'rgba(255,255,255,0.1)',
    bufferShimmer: 'rgba(255,255,255,0.2)',
  },
  amber: {
    track: 'rgba(255, 255, 255, 0.16)',
    buffered: 'rgba(247, 147, 30, 0.30)',
    fill: '#F7931E',
    glow: 'none',
    ghostShimmer: 'rgba(247, 147, 30, 0.10)',
    bufferShimmer: 'rgba(247, 147, 30, 0.22)',
  },
} as const;

export const VideoScrubber = memo(function VideoScrubber({ 
  videoEl, 
  mediaId,
  height = 3,
  className,
  variant = 'default',
  bufferedPct,
  isBuffering,
  hasFirstFrame,
  isAttached = true,
}: VideoScrubberProps) {
  const colors = COLORS[variant];
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const bufferedRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidDuration, setIsValidDuration] = useState(false);
  const wasPausedRef = useRef(false);
  const rafRef = useRef<number>();
  
  // Internal state derivation (used when props not passed)
  const [derivedBufferedPct, setDerivedBufferedPct] = useState(0);
  const [derivedIsBuffering, setDerivedIsBuffering] = useState(false);
  const [derivedHasFirstFrame, setDerivedHasFirstFrame] = useState(false);

  // Use prop if explicitly passed, otherwise use derived (nullish coalescing)
  const effectiveBufferedPct = bufferedPct ?? derivedBufferedPct;
  const effectiveIsBuffering = isBuffering ?? derivedIsBuffering;
  const effectiveHasFirstFrame = hasFirstFrame ?? derivedHasFirstFrame;

  // Check if video has valid duration
  useEffect(() => {
    if (!videoEl) {
      setIsValidDuration(false);
      setDerivedHasFirstFrame(false);
      return;
    }

    const checkDuration = () => {
      const d = videoEl.duration;
      const valid = typeof d === 'number' && Number.isFinite(d) && d > 0;
      setIsValidDuration(valid);
    };

    checkDuration();

    videoEl.addEventListener('loadedmetadata', checkDuration);
    videoEl.addEventListener('durationchange', checkDuration);

    return () => {
      videoEl.removeEventListener('loadedmetadata', checkDuration);
      videoEl.removeEventListener('durationchange', checkDuration);
    };
  }, [videoEl]);
  
  // Derive buffering state from video element
  useEffect(() => {
    if (!videoEl) return;
    
    const updateBuffered = () => {
      if (!videoEl.duration || !Number.isFinite(videoEl.duration)) return;
      const buffered = videoEl.buffered;
      if (buffered.length > 0) {
        const end = buffered.end(buffered.length - 1);
        setDerivedBufferedPct(Math.min(1, end / videoEl.duration));
      }
    };
    
    const handleWaiting = () => setDerivedIsBuffering(true);
    const handlePlaying = () => setDerivedIsBuffering(false);
    const handleCanPlay = () => setDerivedIsBuffering(false);
    const handleFirstFrame = () => setDerivedHasFirstFrame(true);
    
    // Check initial state
    if (videoEl.readyState >= 2) {
      setDerivedHasFirstFrame(true);
    }
    updateBuffered();
    
    videoEl.addEventListener('progress', updateBuffered);
    videoEl.addEventListener('waiting', handleWaiting);
    videoEl.addEventListener('playing', handlePlaying);
    videoEl.addEventListener('canplay', handleCanPlay);
    videoEl.addEventListener('loadeddata', handleFirstFrame);
    videoEl.addEventListener('timeupdate', updateBuffered);
    
    return () => {
      videoEl.removeEventListener('progress', updateBuffered);
      videoEl.removeEventListener('waiting', handleWaiting);
      videoEl.removeEventListener('playing', handlePlaying);
      videoEl.removeEventListener('canplay', handleCanPlay);
      videoEl.removeEventListener('loadeddata', handleFirstFrame);
      videoEl.removeEventListener('timeupdate', updateBuffered);
    };
  }, [videoEl]);

  // Update progress bar (GPU-accelerated via scaleX)
  const updateProgress = useCallback(() => {
    if (!videoEl || !fillRef.current || !isValidDuration) return;
    
    const duration = videoEl.duration;
    if (!duration || duration <= 0 || !Number.isFinite(duration)) return;
    
    const ratio = Math.min(1, Math.max(0, videoEl.currentTime / duration));
    fillRef.current.style.transform = `scaleX(${ratio})`;
  }, [videoEl, isValidDuration]);

  // Update buffered bar
  useEffect(() => {
    if (bufferedRef.current) {
      bufferedRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, effectiveBufferedPct))})`;
    }
  }, [effectiveBufferedPct]);

  // Sync loop for progress updates
  useEffect(() => {
    if (!videoEl || !isValidDuration) return;

    let active = false;

    const loop = () => {
      if (!active) return;
      updateProgress();
      rafRef.current = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (active || isDragging) return;
      active = true;
      rafRef.current = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
    };

    // Start/stop based on play state
    const handlePlay = () => startLoop();
    const handlePause = () => {
      if (!isDragging) stopLoop();
    };

    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('playing', handlePlay);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('timeupdate', updateProgress); // Fallback

    // Start immediately if already playing
    if (!videoEl.paused) {
      startLoop();
    } else {
      // Still update once to show current position
      updateProgress();
    }

    return () => {
      stopLoop();
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('playing', handlePlay);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('timeupdate', updateProgress);
    };
  }, [videoEl, isValidDuration, isDragging, updateProgress]);

  // Calculate time from pointer position
  const getTimeFromEvent = useCallback((clientX: number): number => {
    if (!trackRef.current || !videoEl) return 0;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    return ratio * videoEl.duration;
  }, [videoEl]);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!videoEl || !isValidDuration) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    wasPausedRef.current = videoEl.paused;
    setIsDragging(true);
    
    // Track user intent in MediaRuntime
    MediaRuntime.trackIntent('scrub');
    
    // Seek to initial position
    const newTime = getTimeFromEvent(e.clientX);
    videoEl.currentTime = newTime;
    updateProgress();
    
    // Capture pointer for dragging
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [videoEl, isValidDuration, getTimeFromEvent, updateProgress]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !videoEl) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const newTime = getTimeFromEvent(e.clientX);
    videoEl.currentTime = newTime;
    updateProgress();
  }, [isDragging, videoEl, getTimeFromEvent, updateProgress]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isDragging]);

  // Determine shimmer state (using effective values that combine props + derived)
  const showBufferingShimmer = effectiveHasFirstFrame && effectiveIsBuffering;
  const showGhostShimmer = isAttached && !effectiveHasFirstFrame;
  const showAnyShimmer = showBufferingShimmer || showGhostShimmer;

  // Don't render if no valid video (but allow ghost shimmer before first frame)
  if (!videoEl || (!isValidDuration && !showGhostShimmer)) {
    return null;
  }

  return (
    <div
      ref={trackRef}
      className={cn(
        "absolute left-0 right-0 cursor-pointer touch-none",
        "pointer-events-auto",
        className
      )}
      style={{ 
        height: `${height}px`,
        bottom: 0,
        // Ensure scrubber sits above any gradient overlays
        zIndex: 40,
        // Isolation ensures child elements aren't affected by parent filters/blends
        isolation: 'isolate',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Track background */}
      <div 
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{ backgroundColor: colors.track }}
      >
        {/* Ghost shimmer (before first frame) */}
        {showGhostShimmer && (
          <div 
            className="absolute inset-0 animate-shimmer-slide"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${colors.ghostShimmer} 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
            }}
          />
        )}
      </div>
      
      {/* Buffered layer (behind played) */}
      <div
        ref={bufferedRef}
        className="absolute inset-0 origin-left will-change-transform overflow-hidden rounded-full"
        style={{ 
          transform: `scaleX(${effectiveBufferedPct})`,
          backgroundColor: colors.buffered,
        }}
      >
        {/* Buffering shimmer (when stalled) */}
        {showBufferingShimmer && (
          <div 
            className="absolute inset-0 animate-shimmer-slide"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${colors.bufferShimmer} 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
            }}
          />
        )}
      </div>
      
      {/* Progress fill (top layer) */}
      <div
        ref={fillRef}
        className="absolute inset-0 origin-left will-change-transform rounded-full"
        style={{ 
          transform: 'scaleX(0)',
          backgroundColor: colors.fill,
          boxShadow: colors.glow,
        }}
      />
      
      {/* Larger touch target (invisible) */}
      <div 
        className="absolute -top-[25px] -bottom-[25px] left-0 right-0" 
        style={{ pointerEvents: 'inherit' }}
      />
    </div>
  );
});

export default VideoScrubber;
