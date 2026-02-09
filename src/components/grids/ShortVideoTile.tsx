/**
 * ShortVideoTile - Unified Watch Tab Standard
 * 
 * 3:4 fixed aspect ratio video tile for shorts
 * - Grey shimmer loading state
 * - Bottom gradient with metadata
 * - Course name display
 * - Like count badge (hidden number at zero)
 * - Conditional autoplay (diagonal pattern)
 * - 50%/10% hysteresis thresholds
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { GridPost } from './types';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { cn } from '@/lib/utils';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';

interface ShortVideoTileProps {
  post: GridPost;
  onClick: () => void;
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
  /** Whether this tile is eligible for autoplay (diagonal pattern) */
  isAutoplayCandidate?: boolean;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export const ShortVideoTile = React.memo(function ShortVideoTile({ 
  post, 
  onClick,
  isVideoReady = true,
  onReady,
  isAutoplayCandidate = true,
}: ShortVideoTileProps) {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const media = post.post_media?.[0];
  
  const [shouldPlay, setShouldPlay] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  
  // Use media_url directly - it already contains the proper HLS URL
  const hlsUrl = media?.media_url || null;
  const posterUrl = media?.poster_url || undefined;
  
  // Extract course name from post
  const courseName = (post as any).golf_courses?.name || (post as any).course?.name || null;
  const likeCount = post.like_count || 0;
  
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
  
  // Hysteresis-based autoplay: 50% to start, 10% to stop (only if autoplay candidate)
  useEffect(() => {
    if (!containerRef.current || !isAutoplayCandidate) return;
    
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
  }, [isAutoplayCandidate]);
  
  // Early return AFTER all hooks
  if (!media || media.media_type !== 'video') return null;
  
  // Determine if shimmer should show (before poster/video loaded)
  const showShimmer = !posterLoaded && !isVideoReady;
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden aspect-[3/4] active:scale-[0.97] transition-transform"
      onClick={onClick}
    >
      {/* Grey shimmer loading state (Watch tab standard) */}
      <div className={cn(
        "absolute inset-0 bg-muted overflow-hidden transition-opacity duration-150",
        showShimmer ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-background/40 to-transparent" />
      </div>

      {/* Poster-first: priority loading */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            "transition-opacity duration-150 ease-out",
            isVideoReady && isAutoplayCandidate ? "opacity-0" : "opacity-100"
          )}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setPosterLoaded(true)}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.onerror = null;
            setPosterLoaded(true); // Treat as "loaded" to hide shimmer
          }}
        />
      )}

      {/* Video layer - only for autoplay candidates */}
      {hlsUrl && isAutoplayCandidate && (
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
            className="w-full h-full object-cover"
            objectFit="cover"
          />
        </div>
      )}

      {/* Bottom gradient (Watch tab standard: from-black/70 h-1/3) */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

      {/* Like count badge - top right (Watch tab standard) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full z-10">
        <Heart className={cn("w-3 h-3", likeCount > 0 ? "fill-like text-like" : "text-white")} />
        {likeCount > 0 && (
          <span className="text-white text-[10px] font-medium">{formatCount(likeCount)}</span>
        )}
      </div>

      {/* Course name - bottom left (Watch tab standard) */}
      {courseName && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <p className="text-white/60 text-[10px] leading-tight truncate">
            {courseName}
          </p>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.post_media?.[0]?.media_url === nextProps.post.post_media?.[0]?.media_url &&
    prevProps.post.like_count === nextProps.post.like_count &&
    prevProps.isVideoReady === nextProps.isVideoReady &&
    prevProps.isAutoplayCandidate === nextProps.isAutoplayCandidate
  );
});
