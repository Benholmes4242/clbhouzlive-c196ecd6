/**
 * ShortVideoTile - 9:16 fixed aspect ratio video tile for shorts
 * All visible videos autoplay with no limit on concurrent playback
 */

import { useRef, useEffect, useState } from 'react';
import { GridPost } from './types';
import { getStreamIdFromUrl } from '@/utils/stream';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { HLSPlayer, HLSPlayerRef } from '@/media';

interface ShortVideoTileProps {
  post: GridPost;
  onClick: () => void;
}

export function ShortVideoTile({ post, onClick }: ShortVideoTileProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const media = post.post_media?.[0];
  
  const [isVisible, setIsVisible] = useState(false);
  
  if (!media || media.media_type !== 'video') return null;
  
  // Get HLS URL
  const streamId = getStreamIdFromUrl(media.media_url || '');
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : null;
  
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
      style={{ aspectRatio: '9/16' }}
      onClick={onClick}
    >
      {hlsUrl ? (
        <HLSPlayer
          ref={playerRef}
          src={hlsUrl}
          autoplay={isVisible}
          muted
          loop
          externallyManaged
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={media.poster_url || media.media_url}
          alt=""
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
