/**
 * InstantVideoTile - A video tile that mounts paused for instant playback
 * 
 * Architecture:
 * 1. Video mounts immediately with preload="auto" and paused
 * 2. First frame decodes in background (no poster → video jump)
 * 3. When visible + ready, just call play() - frame already rendered
 * 4. Skeleton overlay hides until canplaythrough fires
 * 
 * This eliminates:
 * - Loading spinners
 * - Poster → video visual jump
 * - Playback delay
 */

import React, { useRef, useEffect, useState, useCallback, forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { hlsBlobCache } from '@/utils/hlsBlobCache';
import { isPosterFailed } from '@/utils/posterPrefetch';

interface InstantVideoTileProps {
  /** Video source URL */
  src: string;
  /** Post ID for tracking */
  postId: string;
  /** Whether this tile is currently active (center of viewport) */
  isActive: boolean;
  /** Whether this tile is nearby (within 1-2 positions) */
  isNearby: boolean;
  /** Whether to actually play when active */
  shouldPlay: boolean;
  /** Muted state */
  muted: boolean;
  /** Called when video is truly ready (canplaythrough) */
  onReady?: (videoId: string) => void;
  /** Called when first frame is visible */
  onFirstFrame?: () => void;
  /** Additional class names */
  className?: string;
  /** Pre-computed poster URL */
  posterUrl?: string;
}

export const InstantVideoTile = memo(forwardRef<HTMLVideoElement, InstantVideoTileProps>(({
  src,
  postId,
  isActive,
  isNearby,
  shouldPlay,
  muted,
  onReady,
  onFirstFrame,
  className,
  posterUrl: externalPosterUrl,
}, ref) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const uid = uidFromNode({ src });
  const hlsUrl = uid ? generateStreamHlsUrl(uid) : null;
  
  // State
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const hasReportedReadyRef = useRef(false);
  const hasReportedFirstFrameRef = useRef(false);
  
  // Poster URL
  const generatedPosterUrl = externalPosterUrl || (uid ? generateStreamThumbnailUrl(uid, { height: 800, fit: 'cover' }) : undefined);
  const posterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) ? generatedPosterUrl : undefined;
  
  // Check blob cache on mount
  useEffect(() => {
    if (uid && hlsBlobCache.isReady(uid)) {
      setIsVideoReady(true);
      if (!hasReportedReadyRef.current) {
        hasReportedReadyRef.current = true;
        onReady?.(uid);
      }
    }
  }, [uid, onReady]);
  
  // Expose video element via ref
  React.useImperativeHandle(ref, () => playerRef.current?.getElement() as HTMLVideoElement);
  
  // Attach/detach based on proximity
  useEffect(() => {
    if (!playerRef.current) return;
    
    // Mount videos that are nearby for instant playback
    if (isNearby || isActive) {
      playerRef.current.attach();
    } else {
      playerRef.current.detach();
    }
  }, [isNearby, isActive]);
  
  // Play/pause based on active state
  useEffect(() => {
    if (!playerRef.current) return;
    
    if (shouldPlay && isActive && isVideoReady) {
      playerRef.current.play();
    } else if (!isActive) {
      playerRef.current.pause();
    }
  }, [shouldPlay, isActive, isVideoReady]);
  
  // Handle canplaythrough - video is truly ready
  const handleCanPlayThrough = useCallback(() => {
    setIsVideoReady(true);
    
    if (!hasReportedReadyRef.current && uid) {
      hasReportedReadyRef.current = true;
      onReady?.(uid);
    }
  }, [uid, onReady]);
  
  // Handle loadeddata - first frame is decoded
  const handleLoadedData = useCallback(() => {
    setHasFirstFrame(true);
    
    if (!hasReportedFirstFrameRef.current) {
      hasReportedFirstFrameRef.current = true;
      onFirstFrame?.();
    }
  }, [onFirstFrame]);
  
  // Reset state when src changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    hasReportedFirstFrameRef.current = false;
    setIsVideoReady(false);
    setHasFirstFrame(false);
  }, [src]);
  
  if (!hlsUrl) {
    return (
      <div className={cn("w-full h-full bg-muted flex items-center justify-center", className)}>
        <span className="text-muted-foreground text-sm">Invalid video source</span>
      </div>
    );
  }
  
  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-black", className)}>
      <HLSPlayer
        ref={playerRef}
        src={hlsUrl}
        posterUrl={posterUrl}
        muted={muted}
        loop
        // KEY: Start with autoplay=false, we control play() manually
        autoplay={false}
        showMuteButton={false}
        showPlayButton={false}
        showScrubber={false}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
        // UNIFIED WITH CLUBHOUSE
        managedByMediaRuntime={false}
        externallyManaged={false}
        mediaId={uid || postId}
        // KEY: preload="auto" to start buffering immediately
        preload="auto"
        onCanPlayThrough={handleCanPlayThrough}
        onLoadedData={handleLoadedData}
      />
      
      {/* Readability gradient */}
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: '35vh',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)'
        }}
      />
    </div>
  );
}));

InstantVideoTile.displayName = 'InstantVideoTile';

export default InstantVideoTile;
