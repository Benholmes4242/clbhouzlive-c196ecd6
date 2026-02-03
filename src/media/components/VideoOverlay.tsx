/**
 * VideoOverlay - Overlay states for UnifiedVideoPlayer
 * 
 * Handles: loading spinner, error state, play button, quality badge
 * 
 * Stall spinner uses 600ms delay threshold to prevent flickering
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Play, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { PlaybackState, MediaError } from '@/media/types';

// Stall spinner delay threshold (ms) - prevents flickering on brief stalls
const STALL_SPINNER_DELAY_MS = 600;

export interface VideoOverlayProps {
  playbackState: PlaybackState;
  error: MediaError | null;
  showPlayButton?: boolean;
  showQualityBadge?: boolean;
  quality?: number;
  onPlayClick?: () => void;
  onRetryClick?: () => void;
  className?: string;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({
  playbackState,
  error,
  showPlayButton = true,
  showQualityBadge = false,
  quality = 0,
  onPlayClick,
  onRetryClick,
  className,
}) => {
  const isLoading = playbackState === 'loading';
  const isError = playbackState === 'error' && !!error;
  const isPaused = playbackState === 'paused' || playbackState === 'idle' || playbackState === 'ready';
  
  // Delayed spinner state - only shows after 600ms threshold
  const [showSpinner, setShowSpinner] = useState(false);
  
  useEffect(() => {
    if (isLoading) {
      // Start timer - only show spinner after delay
      const timer = setTimeout(() => {
        setShowSpinner(true);
      }, STALL_SPINNER_DELAY_MS);
      
      return () => clearTimeout(timer);
    } else {
      // Loading stopped - hide spinner immediately
      setShowSpinner(false);
    }
  }, [isLoading]);
  
  // HD badge shown for quality >= 720p
  const isHD = quality >= 720;
  
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Loading spinner - only shows after 600ms delay */}
      {showSpinner && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin opacity-80" />
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-auto">
          <AlertCircle className="w-10 h-10 text-white/80 mb-3" />
          <p className="text-white/90 text-sm mb-3">
            {error?.message || 'Failed to load video'}
          </p>
          {onRetryClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetryClick();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      )}
      
      {/* Center play button */}
      {showPlayButton && isPaused && !isLoading && !isError && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onPlayClick?.();
          }}
        >
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
      )}
      
      {/* HD Quality badge */}
      {showQualityBadge && isHD && !isError && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] font-semibold text-white/90">
          HD
        </div>
      )}
    </div>
  );
};

export default VideoOverlay;
