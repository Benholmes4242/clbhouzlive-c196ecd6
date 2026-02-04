/**
 * ShortsVideoTile - Grid tile for shorts
 * 
 * UNIFIED WITH CLUBHOUSE: Uses UnifiedVideoPlayer for TikTok-level performance
 * - Source stability guard (prevents duplicate HLS instances)
 * - HLS pool promotion for instant playback
 * - Buffering indicator debounce (200ms delay, 400ms min display)
 * - 50%/10% hysteresis autoplay thresholds
 * - 150ms crossfade timing
 */

import React, { useRef, useEffect, useState } from 'react';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { getFilterClass } from '@/utils/studioFilters';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  hlsUrl: string;
  posterUrl?: string;
  sortIndex: number;
  onClick?: () => void;
  filterId?: string | null;
};

export default function ShortsVideoTile({
  id,
  hlsUrl,
  posterUrl,
  sortIndex,
  onClick,
  filterId
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const filterClass = getFilterClass(filterId);

  // Hysteresis-based autoplay: 50% to start, 10% to stop
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry.intersectionRatio;
        
        setShouldPlay(prev => {
          // Start playing at 50% visibility
          if (!prev && ratio >= 0.5) return true;
          // Stop playing at 10% visibility
          if (prev && ratio < 0.1) return false;
          return prev;
        });
        
        setIsVisible(entry.isIntersecting);
      },
      { threshold: [0, 0.1, 0.5, 1.0] }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="group relative aspect-[9/16] overflow-hidden rounded bg-muted cursor-pointer"
      onClick={onClick}
    >
      {/* Filtered pixel layer */}
      <div className={cn("absolute inset-0 w-full h-full", filterClass)}>
        <UnifiedVideoPlayer
          ref={playerRef}
          src={hlsUrl}
          posterUrl={posterUrl}
          autoplay={shouldPlay}
          muted
          loop
          showMuteButton={false}
          showPlayButton={false}
          objectFit="cover"
          managedByMediaRuntime={false}
          preload="auto"
          surface="grid"
          mediaId={id}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* Hover overlay - OUTSIDE filtered layer */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-10 group-hover:opacity-10 bg-black" />
    </div>
  );
}
