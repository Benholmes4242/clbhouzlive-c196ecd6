/**
 * WatchShortCard - Individual video card for Watch grid
 * 
 * Features:
 * - 9:16 aspect ratio (portrait)
 * - Autoplay when in view (muted)
 * - Like count overlay
 * - Creator name overlay
 * - Multi-media indicator
 */

import React, { useRef, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Heart, Layers } from 'lucide-react';
import { WatchShort } from '@/hooks/useWatchShorts';
import { getStreamPoster } from '@/utils/stream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { cn } from '@/lib/utils';

interface WatchShortCardProps {
  video: WatchShort;
  index: number;
  onTap: () => void;
  isAutoplayCandidate: boolean;
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

export function WatchShortCard({ 
  video, 
  index, 
  onTap, 
  isAutoplayCandidate 
}: WatchShortCardProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const [posterHidden, setPosterHidden] = useState(false);
  
  // Visibility observer for autoplay
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.6, // 60% visible to play
    triggerOnce: false,
  });

  const primaryMedia = video.media[0];
  if (!primaryMedia) return null;

  const mediaUrl = primaryMedia.media_url;
  const posterUrl = primaryMedia.poster_url || getStreamPoster(mediaUrl, '1s') || undefined;
  const creator = video.creator;
  const likeCount = video.like_count || 0;
  const hasMultipleMedia = video.media.length > 1;

  // Autoplay when in view (only for autoplay candidates)
  useEffect(() => {
    if (!isAutoplayCandidate) return;
    
    const player = playerRef.current;
    if (!player) return;

    if (inView) {
      player.play();
    } else {
      player.pause();
    }
  }, [inView, isAutoplayCandidate]);

  const handleLoadedData = () => {
    // Hide poster once video has data
    setPosterHidden(true);
  };

  return (
    <div
      ref={inViewRef}
      className={cn(
        "relative aspect-[3/4] overflow-hidden cursor-pointer bg-muted",
        "transition-transform duration-100 active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
      onClick={onTap}
      tabIndex={0}
      role="button"
      aria-label={`Watch video by ${creator?.display_name || creator?.username || 'Unknown'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
    >
      {/* Poster Image - shown until video loads */}
      {posterUrl && !posterHidden && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-10"
          loading={index < 6 ? 'eager' : 'lazy'}
        />
      )}

      {/* Video Player */}
      <HLSPlayer
        ref={playerRef}
        src={mediaUrl}
        poster={posterUrl}
        autoplay={false}
        muted
        loop
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
        onLoadedData={handleLoadedData}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-20" />

      {/* Like Count - Top Right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full z-30">
        <Heart className="w-3 h-3 text-white" />
        <span className="text-white text-xs font-medium">{formatCount(likeCount)}</span>
      </div>

      {/* Multi-media Indicator - Top Left */}
      {hasMultipleMedia && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full z-30">
          <Layers className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-medium">+{video.media.length - 1}</span>
        </div>
      )}

      {/* Creator Name - Bottom */}
      <div className="absolute bottom-2 left-2 right-2 z-30">
        <p className="text-white text-sm font-medium truncate">
          {creator?.display_name || creator?.username || 'Unknown'}
        </p>
      </div>
    </div>
  );
}

export default WatchShortCard;
