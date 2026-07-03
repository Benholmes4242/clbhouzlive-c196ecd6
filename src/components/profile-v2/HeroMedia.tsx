/**
 * HeroMedia - Full-bleed hero section (poster-only chassis)
 *
 * Video playback severed per BRIEF_VIDEO_TEARDOWN.md. Videos render their
 * poster frame as an <img>; images render as before. No <video>, no runtime.
 */

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { isPosterFailed } from '@/utils/posterPrefetch';

interface HeroMediaProps {
  mediaId: string;
  mediaType: 'image' | 'video';
  url: string;
  posterUrl?: string;
  height?: string; // e.g., '45vh'
  className?: string;
}

export const HeroMedia: React.FC<HeroMediaProps> = ({
  mediaType,
  url,
  posterUrl,
  height = '45vh',
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const posterSafe = posterUrl && !isPosterFailed(posterUrl) ? posterUrl : undefined;
  const displaySrc = mediaType === 'video' ? posterSafe : url;

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden', className)}
      style={{
        height,
        backgroundColor: 'hsl(var(--clubhouse-bg-page, 222 47% 11%))',
        ...(mediaType === 'video' && posterSafe ? {
          backgroundImage: `url(${posterSafe})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : {}),
      }}
    >
      {displaySrc && (
        <img
          src={displaySrc}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsLoaded(true)}
          loading="eager"
        />
      )}

      {!isLoaded && !posterSafe && mediaType !== 'video' && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-pulse" />
      )}

      <div className="absolute inset-0 dgp-hero-scrim-top pointer-events-none" />
      <div className="absolute inset-0 dgp-hero-scrim-bottom pointer-events-none" />
    </div>
  );
};

export default HeroMedia;
