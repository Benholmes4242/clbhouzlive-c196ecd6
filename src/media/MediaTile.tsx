/**
 * MediaTile - Unified tile component for grids/cards
 * Single component for all media grids across the app
 * 
 * Replaces: UnifiedMediaTile, LongFormVideoTileAutoplay, BusinessVideoTile, etc.
 * 
 * Features:
 * - Handles both photo and video
 * - Integrates with useMediaAutoplay
 * - Consistent overlay UI (duration, views, creator)
 * - Click to open fullscreen
 */

import React, { useRef, useEffect, useCallback, memo } from 'react';
import { Play, Eye } from 'lucide-react';
import HLSPlayer, { HLSPlayerRef } from './HLSPlayer';
import { cn } from '@/lib/utils';
import type { RegisterMediaFn } from './useMediaAutoplay';

// ============ Types ============

export interface MediaTileProps {
  // Media
  id: string;
  type: 'photo' | 'video';
  src: string; // HLS URL for video, image URL for photo
  poster?: string;
  
  // Display
  aspectRatio?: '3:4' | '16:9' | '1:1' | '9:16';
  className?: string;
  
  // Metadata overlay
  duration?: number; // seconds
  viewCount?: number;
  creatorName?: string;
  creatorAvatar?: string;
  
  // Autoplay registration
  registerMedia?: RegisterMediaFn;
  isAutoplayCandidate?: boolean;
  sortIndex?: number;
  
  // Callbacks
  onClick?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  
  // State
  isPlaying?: boolean;
  muted?: boolean;
}

// ============ Helpers ============

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

// ============ Component ============

const MediaTile: React.FC<MediaTileProps> = ({
  id,
  type,
  src,
  poster,
  aspectRatio = '3:4',
  className,
  duration,
  viewCount,
  creatorName,
  creatorAvatar,
  registerMedia,
  isAutoplayCandidate = true,
  sortIndex = 0,
  onClick,
  onPlay,
  onPause,
  isPlaying,
  muted = true,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  
  // ============ Autoplay Registration ============
  
  useEffect(() => {
    if (!registerMedia || type !== 'video') return;
    
    const videoEl = playerRef.current?.getElement();
    
    // FIX: Observe video element directly, not tile wrapper
    // This fixes WebView grey-box issues where wrapper behaves differently
    registerMedia({
      id,
      element: videoEl,
      isCandidate: isAutoplayCandidate,
      sortIndex,
      // observeTarget removed - default to video element
    });
    
    // Unregister on unmount
    return () => {
      registerMedia({ id, element: null });
    };
  }, [id, registerMedia, isAutoplayCandidate, sortIndex, type]);
  
  // ============ Click Handler ============
  
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);
  
  // ============ Aspect Ratio ============
  
  const aspectClass = {
    '3:4': 'aspect-[3/4]',
    '16:9': 'aspect-video',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
  }[aspectRatio];
  
  return (
    <div
      ref={tileRef}
      className={cn(
        'relative overflow-hidden rounded-lg bg-black cursor-pointer group',
        aspectClass,
        className
      )}
      onClick={handleClick}
    >
      {/* Photo */}
      {type === 'photo' && (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
      
      {/* Video */}
      {type === 'video' && (
        <HLSPlayer
          ref={playerRef}
          src={src}
          poster={poster}
          muted={muted}
          autoplay={isPlaying}
          aspectRatio={aspectRatio}
          objectFit="cover"
          externallyManaged
          onPlay={onPlay}
          onPause={onPause}
        />
      )}
      
      {/* Play Icon Overlay (video only, when not playing) */}
      {type === 'video' && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      )}
      
      {/* Duration Badge */}
      {type === 'video' && duration !== undefined && duration > 0 && (
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
          {formatDuration(duration)}
        </div>
      )}
      
      {/* View Count Badge */}
      {viewCount !== undefined && viewCount > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
          <Eye className="w-3 h-3" />
          <span>{formatViewCount(viewCount)}</span>
        </div>
      )}
      
      {/* Creator Info Overlay */}
      {(creatorName || creatorAvatar) && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {creatorAvatar && (
            <img
              src={creatorAvatar}
              alt=""
              className="w-6 h-6 rounded-full border border-white/30"
            />
          )}
          {creatorName && (
            <span className="text-xs text-white font-medium drop-shadow-md truncate max-w-[120px]">
              {creatorName}
            </span>
          )}
        </div>
      )}
      
      {/* Hover Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

export default memo(MediaTile);
