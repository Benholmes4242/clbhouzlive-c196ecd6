/**
 * FullscreenControls - Video playback controls (scrubber, mute)
 * 
 * Auto-hides after 3 seconds of inactivity.
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';

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
  const [isPlaying, setIsPlaying] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  // Don't render for non-video content
  if (!isVideo) return null;

  const handleSeek = (progress: number) => {
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = progress * duration;
    }
  };

  const handleMuteToggle = () => {
    viewer.toggleMute();
  };

  const progress = duration > 0 ? currentTime / duration : 0;

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
      {/* Progress bar / Scrubber */}
      <div className="pointer-events-auto px-4">
        <VideoScrubber
          progress={progress}
          buffered={0}
          onSeek={handleSeek}
        />
      </div>

      {/* Mute button */}
      <button
        onClick={handleMuteToggle}
        className="pointer-events-auto absolute right-4 bottom-full mb-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
      >
        {viewer.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
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
      {/* Buffered */}
      <div
        className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
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
