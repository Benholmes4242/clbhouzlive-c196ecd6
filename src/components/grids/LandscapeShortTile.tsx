/**
 * LandscapeShortTile - Adaptive aspect ratio tile for landscape short videos
 * Displays in native aspect ratio (capped at 16:9 for very wide videos)
 * Spans full width in the 2-column shorts grid
 * 
 * UNIFIED WITH CLUBHOUSE: Uses visibility-based autoplay via IntersectionObserver
 * - managedByMediaRuntime={false} for direct browser-led autoplay
 * - autoplay based on 40% visibility threshold
 * - preload="auto" for instant buffering
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GridPost } from './types';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';

interface LandscapeShortTileProps {
  post: GridPost;
  onClick: () => void;
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}

export const LandscapeShortTile = React.memo(function LandscapeShortTile({ 
  post, 
  onClick,
  isVideoReady = true,
  onReady,
}: LandscapeShortTileProps) {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const media = post.post_media?.[0];
  
  const [isVisible, setIsVisible] = useState(false);
  
  if (!media || media.media_type !== 'video') return null;
  
  // Calculate aspect ratio - cap at 16:9 for very wide videos
  const rawAspectRatio = media.aspect_ratio || 
    (media.width && media.height ? media.width / media.height : 16/9);
  const aspectRatio = Math.min(rawAspectRatio, 16/9); // Cap at 16:9
  
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
      console.log(`[LandscapeShortTile] Video ${streamId.substring(0, 8)} ready (canplaythrough)`);
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
      style={{ aspectRatio: String(aspectRatio) }}
      onClick={onClick}
    >
      {/* Poster-first: always show thumbnail immediately */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.onerror = null;
          }}
        />
      )}

      {hlsUrl ? (
        <>
          {/* HLSPlayer - fades in once video is ready */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-200",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <UnifiedVideoPlayer
              ref={playerRef}
              src={hlsUrl}
              posterUrl={posterUrl}
              autoplay={isVisible}
              muted
              loop
              managedByMediaRuntime={false}
              preload="auto"
              onCanPlayThrough={handleCanPlayThrough}
              className="w-full h-full"
              objectFit="cover"
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
    prevProps.post.post_media?.[0]?.aspect_ratio === nextProps.post.post_media?.[0]?.aspect_ratio &&
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});
