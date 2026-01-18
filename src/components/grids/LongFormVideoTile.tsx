/**
 * LongFormVideoTile - Adaptive aspect ratio video tile for long-form videos
 * Supports both landscape (16:9) and portrait (9:16) videos
 * Portrait videos capped at 70vh height
 * NOW with isVideoReady/onReady props for paused-video-first architecture
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { DurationBadge } from './DurationBadge';
import { GridPost } from './types';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
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
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const media = post.post_media?.[0];
  
  const [isVisible, setIsVisible] = useState(false);
  
  if (!media || media.media_type !== 'video') return null;
  
  // Calculate aspect ratio from stored dimensions
  const aspectRatio = media.aspect_ratio || 
    (media.width && media.height ? media.width / media.height : 16/9);
  const isPortrait = aspectRatio < 1;
  
  // Use media_url directly - it already contains the proper HLS URL
  const hlsUrl = media.media_url || null;
  const posterUrl = media.poster_url || undefined;
  
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
      console.log(`[LongFormVideoTile] Video ${streamId.substring(0, 8)} ready (canplaythrough)`);
      onReady?.(streamId);
    }
  }, [streamId, onReady]);
  
  // Visibility detection for autoplay
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.4);
      },
      { threshold: [0.25, 0.4] }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
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
          "relative w-full overflow-hidden rounded-xl bg-black",
          isPortrait && "mx-auto"
        )}
        style={{
          aspectRatio: String(aspectRatio),
          maxHeight: isPortrait ? '70vh' : undefined,
          maxWidth: isPortrait ? `calc(70vh * ${aspectRatio})` : '100%',
        }}
      >
        {hlsUrl ? (
          <>
            {/* HLSPlayer - ALWAYS mounted, shows paused first frame */}
            <div className={cn(
              "absolute inset-0 transition-opacity duration-200",
              isVideoReady ? "opacity-100" : "opacity-0"
            )}>
              <HLSPlayer
                ref={playerRef}
                src={hlsUrl}
                autoplay={isVisible}
                muted
                loop
                externallyManaged
                onCanPlayThrough={handleCanPlayThrough}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Skeleton - only before video is buffered */}
            {!isVideoReady && (
              <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
              </div>
            )}
          </>
        ) : (
          <img
            src={posterUrl || ''}
            alt=""
            className="w-full h-full object-contain"
          />
        )}
        
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
        <p className="mt-2 text-sm font-medium text-[#1e293b] line-clamp-2 px-1">
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
