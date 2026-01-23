/**
 * ShortsVideoTile - Grid tile for shorts
 * 
 * UNIFIED WITH CLUBHOUSE: Uses visibility-based autoplay via IntersectionObserver
 * - managedByMediaRuntime={false} for direct browser-led autoplay
 * - autoplay based on 40% visibility threshold
 * - preload="auto" for instant buffering
 */

import React, { useRef, useEffect, useState } from 'react';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
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
  const playerRef = useRef<HLSPlayerRef>(null);
  const [isVisible, setIsVisible] = useState(false);
  const filterClass = getFilterClass(filterId);

  // Visibility-based autoplay (40% threshold)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.intersectionRatio >= 0.4);
      },
      { threshold: [0, 0.4, 0.5, 1.0] }
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
        <HLSPlayer
          ref={playerRef}
          src={hlsUrl}
          posterUrl={posterUrl}
          autoplay={isVisible}
          muted
          loop
          showMuteButton={false}
          showPlayButton={false}
          objectFit="cover"
          managedByMediaRuntime={false}
          externallyManaged={false}
          preload="auto"
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* Hover overlay - OUTSIDE filtered layer */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-10 group-hover:opacity-10 bg-black" />
    </div>
  );
}
