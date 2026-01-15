/**
 * LongFormVideoTile - Adaptive aspect ratio video tile for long-form videos
 * Supports both landscape (16:9) and portrait (9:16) videos
 * Portrait videos capped at 70vh height
 */

import { useRef, useEffect, useState } from 'react';
import { DurationBadge } from './DurationBadge';
import { GridPost } from './types';
import { getStreamIdFromUrl } from '@/utils/stream';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { cn } from '@/lib/utils';

interface LongFormVideoTileProps {
  post: GridPost;
  onClick: () => void;
}

export function LongFormVideoTile({ post, onClick }: LongFormVideoTileProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const media = post.post_media?.[0];
  
  const [isVisible, setIsVisible] = useState(false);
  
  if (!media || media.media_type !== 'video') return null;
  
  // Calculate aspect ratio from stored dimensions
  const aspectRatio = media.aspect_ratio || 
    (media.width && media.height ? media.width / media.height : 16/9);
  const isPortrait = aspectRatio < 1;
  
  // Get HLS URL
  const streamId = getStreamIdFromUrl(media.media_url || '');
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : null;
  
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
          <HLSPlayer
            ref={playerRef}
            src={hlsUrl}
            autoplay={isVisible}
            muted
            loop
            externallyManaged
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={media.poster_url || media.media_url}
            alt=""
            className="w-full h-full object-contain"
          />
        )}
        
        {/* Duration overlay */}
        {media.duration_seconds && (
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
}
