/**
 * LongFormVideoTile - Adaptive aspect ratio video tile for long-form videos
 * Supports both landscape (16:9) and portrait (9:16) videos
 * Portrait videos capped at 70vh height
 * 
 * TikTok-level optimizations:
 * - UnifiedVideoPlayer for source stability, pool promotion, buffering debounce
 * - 50%/10% hysteresis autoplay thresholds
 * - 150ms crossfade timing
 * - First-frame fallback via UnifiedVideoPlayer
 * 
 * Watch Tab Standard:
 * - bg-gray-200 shimmer loading state
 * - Left-to-right shimmer sweep
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { DurationBadge } from './DurationBadge';
import { GridPost } from './types';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { cn } from '@/lib/utils';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';

interface LongFormVideoTileProps {
  post: GridPost;
  onClick: () => void;
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}

export const LongFormVideoTile = React.memo(function LongFormVideoTile({ 
  post, 
  onClick,
  isVideoReady = true,
  onReady,
}: LongFormVideoTileProps) {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const media = post.post_media?.[0];
  
  const [shouldPlay, setShouldPlay] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  
  // Calculate aspect ratio from stored dimensions
  const aspectRatio = media?.aspect_ratio || 
    (media?.width && media?.height ? media.width / media.height : 16/9);
  const isPortrait = aspectRatio < 1;
  
  // Use media_url directly - it already contains the proper HLS URL
  const hlsUrl = media?.media_url || null;
  const posterUrl = media?.poster_url || undefined;
  
  // CRITICAL: Extract stream UID for cache consistency
  const streamId = useMemo(() => uidFromNode({ src: hlsUrl }) || post.id, [hlsUrl, post.id]);

  // Reset ready flag when post changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setPosterLoaded(false);
  }, [post.id]);

  // Handle video ready - CRITICAL: Use stream UID, not post ID
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      onReady?.(streamId);
    }
  }, [streamId, onReady]);
  
  // Hysteresis-based autoplay: 50% to start, 10% to stop
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry.intersectionRatio;
        
        setShouldPlay(prev => {
          if (!prev && ratio >= 0.5) return true;
          if (prev && ratio < 0.1) return false;
          return prev;
        });
      },
      { threshold: [0, 0.1, 0.5, 1.0] }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  // Early return AFTER all hooks
  if (!media || media.media_type !== 'video') return null;
  
  // Truncate content for display
  const displayContent = post.content 
    ? post.content.length > 100 
      ? post.content.slice(0, 100) + '...' 
      : post.content
    : null;
  
  return (
    <div
      ref={containerRef}
      className="w-full cursor-pointer"
      onClick={onClick}
    >
      {/* Video container with adaptive aspect ratio */}
      <div 
        className={cn(
          "relative w-full overflow-hidden rounded-xl bg-gray-200",
          isPortrait && "mx-auto"
        )}
        style={{
          aspectRatio: String(aspectRatio),
          maxHeight: isPortrait ? '70vh' : undefined,
          maxWidth: isPortrait ? `calc(70vh * ${aspectRatio})` : '100%',
        }}
      >
        {/* Shimmer loading state - Watch tab standard */}
        <div 
          className={cn(
            "absolute inset-0 bg-gray-200 overflow-hidden transition-opacity duration-300",
            posterLoaded || isVideoReady ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
        
        {/* Poster-first: priority loading for first 4 tiles */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className={cn(
              "absolute inset-0 w-full h-full object-contain transition-opacity duration-150",
              posterLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onLoad={() => setPosterLoaded(true)}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.onerror = null;
            }}
          />
        )}

        {hlsUrl ? (
          <>
            {/* UnifiedVideoPlayer - 150ms crossfade */}
            <div className={cn(
              "absolute inset-0 transition-opacity duration-150 ease-out",
              isVideoReady ? "opacity-100" : "opacity-0"
            )}>
              <UnifiedVideoPlayer
                ref={playerRef}
                src={hlsUrl}
                posterUrl={posterUrl}
                autoplay={shouldPlay}
                muted
                loop
                managedByMediaRuntime={false}
                preload="auto"
                surface="grid"
                mediaId={streamId}
                onLoadedData={handleCanPlayThrough}
                className="w-full h-full object-contain"
              />
            </div>
          </>
        ) : null}
        
        {/* Duration overlay */}
        {media.duration_seconds && isVideoReady && (
          <DurationBadge 
            seconds={media.duration_seconds} 
            className="absolute bottom-3 right-3"
          />
        )}
      </div>
      
      {/* Title below video */}
      {displayContent && (
        <p className="mt-2 text-sm font-medium text-foreground line-clamp-2 px-1">
          {displayContent}
        </p>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.post_media?.[0]?.media_url === nextProps.post.post_media?.[0]?.media_url &&
    prevProps.post.post_media?.[0]?.aspect_ratio === nextProps.post.post_media?.[0]?.aspect_ratio &&
    prevProps.post.content === nextProps.post.content &&
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});
