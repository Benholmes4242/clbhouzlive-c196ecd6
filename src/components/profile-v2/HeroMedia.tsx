/**
 * HeroMedia - Full-bleed hero section with image or video support
 * 
 * User-only playback - videos do NOT autoplay.
 * Taps route through MediaRuntime.
 */

import React, { useRef, useState, useCallback } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaRuntime, runtimeUserTap } from '@/media/runtime';
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
  mediaId,
  mediaType,
  url,
  posterUrl,
  height = '45vh',
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Register with MediaRuntime on mount (for user-only playback)
  React.useEffect(() => {
    const video = videoRef.current;
    if (mediaType !== 'video' || !video) return;

    MediaRuntime.registerMedia({
      id: mediaId,
      element: video,
      surface: 'grid',
      sortIndex: 0,
      observeTarget: containerRef.current ?? video,
    });

    // Track play/pause state
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      MediaRuntime.unregisterMedia(mediaId);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [mediaId, mediaType]);

  // Handle tap to play/pause via runtime
  const handleVideoTap = useCallback(() => {
    if (isPlaying) {
      MediaRuntime.requestPause({ id: mediaId, reason: 'user' });
    } else {
      runtimeUserTap(mediaId);
    }
  }, [mediaId, isPlaying]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
      style={{ 
        height,
        // POSTER-FIRST: Show poster as CSS background immediately (skip failed posters)
        backgroundColor: 'hsl(var(--clubhouse-bg-page, 222 47% 11%))',
        ...(posterUrl && mediaType === 'video' && !isPosterFailed(posterUrl) ? {
          backgroundImage: `url(${posterUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : {}),
      }}
    >
      {mediaType === 'video' ? (
        <>
          <video
            ref={videoRef}
            src={url}
            loop
            muted
            playsInline
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-500 cursor-pointer',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoadedData={() => setIsLoaded(true)}
            onClick={handleVideoTap}
          />
          {/* Play button overlay when paused */}
          {!isPlaying && isLoaded && (
            <button
              onClick={handleVideoTap}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
              aria-label="Play video"
            >
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </button>
          )}
        </>
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

      {/* Placeholder while loading - shows poster via CSS background on container */}
      {!isLoaded && !posterUrl && (
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
