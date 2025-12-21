/**
 * VideoScrubber - Draggable progress bar for video tiles
 * 
 * Shows playback progress and allows seeking via drag/swipe.
 * Positioned at the bottom edge of the video/media area.
 * 
 * Important:
 * - stopPropagation on all pointer events to prevent triggering tile click (fullscreen open)
 * - Works with autoplay: progress updates while playing, stops when paused
 * - Integrates with MediaRuntime for intent tracking
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MEDIA_RUNTIME_V2 } from '@/config/featureFlags';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';

interface VideoScrubberProps {
  videoEl: HTMLVideoElement | null;
  mediaId?: string; // For runtime intent tracking
  height?: number;
  className?: string;
}

export function VideoScrubber({ 
  videoEl, 
  mediaId,
  height = 3,
  className 
}: VideoScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidDuration, setIsValidDuration] = useState(false);
  const wasPausedRef = useRef(false);
  const rafRef = useRef<number>();

  // Check if video has valid duration
  useEffect(() => {
    if (!videoEl) {
      setIsValidDuration(false);
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

  // Update progress bar (GPU-accelerated via scaleX)
  const updateProgress = useCallback(() => {
    if (!videoEl || !fillRef.current || !isValidDuration) return;
    
    const duration = videoEl.duration;
    if (!duration || duration <= 0 || !Number.isFinite(duration)) return;
    
    const ratio = Math.min(1, Math.max(0, videoEl.currentTime / duration));
    fillRef.current.style.transform = `scaleX(${ratio})`;
  }, [videoEl, isValidDuration]);

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
    if (MEDIA_RUNTIME_V2) {
      MediaRuntime.trackIntent('scrub');
    }
    
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

  // Don't render if no valid video
  if (!videoEl || !isValidDuration) {
    return null;
  }

  return (
    <div
      ref={trackRef}
      className={cn(
        "absolute left-0 right-0 z-10 cursor-pointer touch-none",
        "pointer-events-auto",
        className
      )}
      style={{ 
        height: `${height}px`,
        bottom: 0,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Track background */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      {/* Progress fill */}
      <div
        ref={fillRef}
        className={cn(
          "absolute inset-0 origin-left will-change-transform",
          isDragging ? "bg-white/90" : "bg-white/60"
        )}
        style={{ transform: 'scaleX(0)' }}
      />
      
      {/* Larger touch target (invisible) */}
      <div 
        className="absolute -top-2 -bottom-2 left-0 right-0" 
        style={{ pointerEvents: 'inherit' }}
      />
    </div>
  );
}

export default VideoScrubber;
