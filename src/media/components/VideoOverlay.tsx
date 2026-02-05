/**
 * VideoOverlay - Overlay states for UnifiedVideoPlayer
 * 
 * Handles: loading spinner, error state, play button, quality badge
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Play, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { PlaybackState, MediaError } from '@/media/types';

export interface VideoOverlayProps {
  playbackState: PlaybackState;
  error: MediaError | null;
  showPlayButton?: boolean;
  showQualityBadge?: boolean;
  quality?: number;
  /** Debounced buffering state from useBufferingIndicator */
  showBuffering?: boolean;
  /** Hide all loading/buffering spinners (for feed videos) */
  hideLoadingSpinner?: boolean;
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
  showBuffering = false,
  hideLoadingSpinner = false,
  onPlayClick,
  onRetryClick,
  className,
}) => {
  // Only show loading on initial load, not during mid-playback buffering
  const isInitialLoading = playbackState === 'loading';
  const isError = playbackState === 'error' && !!error;
  const isPaused = playbackState === 'paused' || playbackState === 'idle' || playbackState === 'ready';
  const isPlaying = playbackState === 'playing';
  
  // Show buffering spinner: either initial load OR mid-playback buffering (debounced)
  // For feed videos, hideLoadingSpinner suppresses all spinners for TikTok-grade UX
  const shouldShowSpinner = !hideLoadingSpinner && (isInitialLoading || (isPlaying && showBuffering));
  
  // HD badge shown for quality >= 720p
  const isHD = quality >= 720;
  
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Loading/Buffering spinner - with smooth fade animation */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none",
          "transition-opacity duration-200 ease-out",
          shouldShowSpinner ? "opacity-100" : "opacity-0"
        )}
      >
        <div className={cn(
          "flex items-center justify-center",
          // Smaller spinner for mid-playback buffering, larger for initial load
          isInitialLoading ? "w-10 h-10" : "w-8 h-8",
          // Subtle background only on initial load
          isInitialLoading && "bg-black/20 rounded-full p-2"
        )}>
          <Loader2 
            className={cn(
              "text-white animate-spin",
              isInitialLoading ? "w-10 h-10 opacity-80" : "w-6 h-6 opacity-60"
            )} 
          />
        </div>
      </div>
      
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
      {showPlayButton && isPaused && !shouldShowSpinner && !isError && (
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
