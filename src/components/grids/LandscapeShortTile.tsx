/**
 * LandscapeShortTile - Adaptive aspect ratio tile for landscape short videos
 * Displays in native aspect ratio (capped at 16:9 for very wide videos)
 * Spans full width in the 2-column shorts grid
 */

import { useRef, useEffect, useState } from 'react';
import { GridPost } from './types';
import { HLSPlayer, HLSPlayerRef } from '@/media';

interface LandscapeShortTileProps {
  post: GridPost;
  onClick: () => void;
}

export function LandscapeShortTile({ post, onClick }: LandscapeShortTileProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
      className="relative cursor-pointer overflow-hidden bg-black rounded-sm"
      style={{ aspectRatio: String(aspectRatio) }}
      onClick={onClick}
    >
      {hlsUrl ? (
        <HLSPlayer
          ref={playerRef}
          src={hlsUrl}
          poster={posterUrl}
          autoplay={isVisible}
          muted
          loop
          externallyManaged
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={posterUrl || ''}
          alt=""
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
