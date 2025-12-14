/**
 * HeroMedia - Full-bleed hero section with image or video support
 */

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface HeroMediaProps {
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (mediaType === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked - that's fine, user will see poster
      });
    }
  }, [mediaType, url]);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
      style={{ height }}
    >
      {mediaType === 'video' ? (
        <video
          ref={videoRef}
          src={url}
          poster={posterUrl}
          autoPlay
          loop
          muted
          playsInline
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoadedData={() => setIsLoaded(true)}
        />
      ) : (
        <img
          src={url}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsLoaded(true)}
          loading="eager"
        />
      )}

      {/* Placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-pulse" />
      )}

      {/* Top scrim gradient for text readability */}
      <div className="absolute inset-0 dgp-hero-scrim-top pointer-events-none" />

      {/* Bottom scrim gradient for seamless transition to content */}
      <div className="absolute inset-0 dgp-hero-scrim-bottom pointer-events-none" />
    </div>
  );
};

export default HeroMedia;
