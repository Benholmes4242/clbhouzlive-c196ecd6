/**
 * ShortVideoTile - 9:16 fixed aspect ratio video tile for portrait shorts
 * All visible videos autoplay with no limit on concurrent playback
 * Used in the 2-column shorts grid for portrait videos
 * NOW with isVideoReady/onReady props for paused-video-first architecture
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GridPost } from './types';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
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
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const media = post.post_media?.[0];
  
  const [isVisible, setIsVisible] = useState(false);
  
  if (!media || media.media_type !== 'video') return null;
  
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
      console.log(`[ShortVideoTile] Video ${streamId.substring(0, 8)} ready (canplaythrough)`);
      onReady?.(streamId);
    }
  }, [streamId, onReady]);
  
  // Visibility detection - NO LIMIT on concurrent videos
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
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden bg-black"
      style={{ aspectRatio: '3/4' }}
      onClick={onClick}
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
              className="w-full h-full object-cover"
            />
          </div>

          {/* Skeleton - only before video is buffered */}
          {!isVideoReady && (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          )}
        </>
      ) : (
        <img
          src={posterUrl || ''}
          alt=""
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.post_media?.[0]?.media_url === nextProps.post.post_media?.[0]?.media_url &&
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});
