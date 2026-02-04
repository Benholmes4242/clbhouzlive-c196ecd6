/**
 * ShortVideoTile - 9:16 fixed aspect ratio video tile for portrait shorts
 * 
 * TikTok-level optimizations:
 * - UnifiedVideoPlayer for source stability, pool promotion, buffering debounce
 * - 50%/10% hysteresis autoplay thresholds
 * - 150ms crossfade timing
 * - First-frame fallback via UnifiedVideoPlayer
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GridPost } from './types';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { cn } from '@/lib/utils';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';

interface ShortVideoTileProps {
  post: GridPost;
  onClick: () => void;
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}

export const ShortVideoTile = React.memo(function ShortVideoTile({ 
  post, 
  onClick,
  isVideoReady = true,
  onReady,
}: ShortVideoTileProps) {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const media = post.post_media?.[0];
  
  const [shouldPlay, setShouldPlay] = useState(false);
  
  // Use media_url directly - it already contains the proper HLS URL
  const hlsUrl = media?.media_url || null;
  const posterUrl = media?.poster_url || undefined;
  
  // CRITICAL: Extract stream UID for cache consistency
  const streamId = useMemo(() => uidFromNode({ src: hlsUrl }) || post.id, [hlsUrl, post.id]);

  // Reset ready flag when post changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
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
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden bg-black"
      style={{ aspectRatio: '3/4' }}
      onClick={onClick}
    >
      {/* Poster-first: priority loading for visible tiles */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
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
              className="w-full h-full object-cover"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.post_media?.[0]?.media_url === nextProps.post.post_media?.[0]?.media_url &&
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});