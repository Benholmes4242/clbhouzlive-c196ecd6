/**
 * VideoControls - Playback controls overlay
 * 
 * Includes: play/pause, volume, time display, fullscreen
 * Auto-hides after configurable delay
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

export interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  onPlayPause?: () => void;
  onMuteToggle?: () => void;
  onFullscreen?: () => void;
  showPlayPause?: boolean;
  showVolume?: boolean;
  showTime?: boolean;
  showFullscreen?: boolean;
  autoHide?: number; // ms to wait before hiding, 0 to disable
  className?: string;
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  isMuted,
  currentTime,
  duration,
  onPlayPause,
  onMuteToggle,
  onFullscreen,
  showPlayPause = true,
  showVolume = true,
  showTime = true,
  showFullscreen = false,
  autoHide = 3000,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const resetHideTimer = useCallback(() => {
    if (autoHide <= 0) return;
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    setIsVisible(true);
    
    if (isPlaying) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, autoHide);
    }
  }, [autoHide, isPlaying]);
  
  // Reset timer on play state change
  useEffect(() => {
    if (!isPlaying) {
      setIsVisible(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    } else {
      resetHideTimer();
    }
    
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isPlaying, resetHideTimer]);
  
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    resetHideTimer();
  };
  
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 p-3",
        "bg-gradient-to-t from-black/60 to-transparent",
        "transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      onClick={handleInteraction}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        {showPlayPause && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause?.();
            }}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            )}
          </button>
        )}
        
        {/* Volume */}
        {showVolume && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMuteToggle?.();
            }}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        )}
        
        {/* Time display */}
        {showTime && (
          <div className="flex-1 text-white/80 text-xs font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        )}
        
        {/* Fullscreen */}
        {showFullscreen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen?.();
            }}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoControls;
