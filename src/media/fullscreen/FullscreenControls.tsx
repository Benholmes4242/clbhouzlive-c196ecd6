/**
 * FullscreenControls - Video playback controls (scrubber, mute)
 * 
 * TikTok-Level Improvements:
 * - FIX #3: Audio fade via useAudioFade hook
 * - FIX #6: Buffered progress display in scrubber
 * 
 * Auto-hides after 3 seconds of inactivity.
 * Uses activeVideoRef from context to properly connect to the video element.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { useAudioFade } from '@/hooks/useAudioFade';

export interface FullscreenControlsProps {
  className?: string;
}

export const FullscreenControls: React.FC<FullscreenControlsProps> = ({
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const [isVisible, setIsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0); // FIX #6
  const [isPlaying, setIsPlaying] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  
  // FIX #3: Use audio fade hook
  const { fadeIn, fadeOut, cancel: cancelFade } = useAudioFade({ duration: 150, easing: 'easeOut' });
  
  // Use activeVideoRef from context
  const videoRef = viewer.activeVideoRef;

  // Check if current item is a video
  const isVideo = viewer.currentItem?.mediaType === 'video';

  // Auto-hide controls
  useEffect(() => {
    const resetTimer = () => {
      setIsVisible(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    resetTimer();
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('mousemove', resetTimer);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('mousemove', resetTimer);
    };
  }, [viewer.currentIndex]);

  // Subscribe to video time updates via activeVideoRef
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) {
      // Reset when no video ref
      setCurrentTime(0);
      setDuration(0);
      setBufferedEnd(0);
      return;
    }
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // FIX #6: Update buffered progress
      if (video.buffered.length > 0) {
        // Find the buffer range that contains current time
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= video.currentTime && 
              video.buffered.end(i) >= video.currentTime) {
            setBufferedEnd(video.buffered.end(i));
            break;
          }
        }
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };
    
    const handleDurationChange = () => {
      setDuration(video.duration || 0);
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    // FIX #6: Handle progress events for buffering updates
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }
    };
    
    // Add event listeners
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('progress', handleProgress);
    
    // Set initial values if already loaded
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
    setCurrentTime(video.currentTime || 0);
    setIsPlaying(!video.paused);
    
    // Initial buffered check
    if (video.buffered.length > 0) {
      setBufferedEnd(video.buffered.end(video.buffered.length - 1));
    }
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('progress', handleProgress);
    };
  }, [videoRef, videoRef?.current]);

  // Cleanup fade on unmount
  useEffect(() => {
    return () => cancelFade();
  }, [cancelFade]);

  // Don't render for non-video content
  if (!isVideo) return null;

  const handleSeek = (progress: number) => {
    const video = videoRef?.current;
    if (video && duration > 0) {
      video.currentTime = progress * duration;
    }
  };

  // FIX #3: Smooth audio fade on mute toggle
  const handleMuteToggle = async () => {
    const video = videoRef?.current;
    
    if (!video) {
      // Fallback: just toggle the state
      viewer.toggleMute();
      return;
    }
    
    if (viewer.isMuted) {
      // Unmuting: Set global state first, then fade in
      viewer.setMuted(false);
      await fadeIn(video, 1);
    } else {
      // Muting: Fade out first, then set global state
      await fadeOut(video);
      viewer.setMuted(true);
    }
  };
  
  const handlePlayPause = () => {
    const video = videoRef?.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const bufferedProgress = duration > 0 ? bufferedEnd / duration : 0; // FIX #6
  
  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'absolute inset-x-0 z-[95] pointer-events-none transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        bottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Time display */}
      {duration > 0 && (
        <div className="pointer-events-auto px-4 mb-1 flex justify-between text-xs text-white/70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}

      {/* Progress bar / Scrubber - FIX #6: Now shows buffered progress */}
      <div className="pointer-events-auto px-4">
        <VideoScrubber
          progress={progress}
          buffered={bufferedProgress}
          onSeek={handleSeek}
        />
      </div>

      {/* Control buttons */}
      <div className="absolute right-4 bottom-full mb-4 flex flex-col gap-2">
        {/* Mute button */}
        <button
          onClick={handleMuteToggle}
          className="pointer-events-auto w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          {viewer.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

// ============ Video Scrubber ============

interface VideoScrubberProps {
  progress: number;
  buffered: number;
  onSeek: (progress: number) => void;
  className?: string;
}

const VideoScrubber: React.FC<VideoScrubberProps> = ({
  progress,
  buffered,
  onSeek,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const calculateProgress = (clientX: number): number => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const newProgress = calculateProgress(e.clientX);
    setDragProgress(newProgress);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newProgress = calculateProgress(e.clientX);
    setDragProgress(newProgress);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      onSeek(dragProgress);
      setIsDragging(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const newProgress = calculateProgress(e.touches[0].clientX);
    setDragProgress(newProgress);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const newProgress = calculateProgress(e.touches[0].clientX);
    setDragProgress(newProgress);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      onSeek(dragProgress);
      setIsDragging(false);
    }
  };

  const displayProgress = isDragging ? dragProgress : progress;

  return (
    <div
      ref={barRef}
      className={cn('relative h-1 bg-white/20 rounded-full cursor-pointer', className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* FIX #6: Buffered progress - now properly displayed */}
      <div
        className="absolute inset-y-0 left-0 bg-white/30 rounded-full transition-[width] duration-150"
        style={{ width: `${buffered * 100}%` }}
      />

      {/* Progress */}
      <div
        className="absolute inset-y-0 left-0 bg-white rounded-full"
        style={{ width: `${displayProgress * 100}%` }}
      />

      {/* Thumb */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow transition-transform',
          isDragging && 'scale-125'
        )}
        style={{ left: `calc(${displayProgress * 100}% - 6px)` }}
      />
    </div>
  );
};

export default FullscreenControls;
