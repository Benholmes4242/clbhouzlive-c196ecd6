import React, { useRef, useState, useEffect, useId, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import UnifiedVideoPlayer, { UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { VideoItem } from '../types';
import { preloadHlsManifest } from '@/utils/hlsPreload';

type ShortsCarouselProps = {
  videos: VideoItem[];
  onVideoClick: (id: string) => void;
};

/**
 * ShortsCarousel - Horizontal scrolling shorts carousel
 * 
 * Uses unified HLSPlayer with MediaRuntime for autoplay control.
 */
export function ShortsCarousel({ videos, onVideoClick }: ShortsCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const hasPreloadedFirst = useRef(false);

  // Preload first video manifest
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current || !videos.length) return;
    
    const firstVideo = videos[0];
    if (firstVideo?.hlsUrl) {
      hasPreloadedFirst.current = true;
      preloadHlsManifest(firstVideo.hlsUrl);
    }
  }, [videos]);

  const formatViews = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="bg-[#111] rounded-sq-md p-6 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Shorts</h3>
        <span className="text-sm text-gray-400">Quick highlights</span>
      </div>

      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto pb-2 no-scrollbar"
      >
        {videos.map((video) => (
          <ShortCard 
            key={video.id} 
            video={video} 
            onVideoClick={onVideoClick}
            formatViews={formatViews}
          />
        ))}
      </div>
    </div>
  );
}

// Separate card component for intersection observer per card
function ShortCard({ 
  video, 
  onVideoClick,
  formatViews
}: { 
  video: VideoItem; 
  onVideoClick: (id: string) => void;
  formatViews: (n: number) => string;
}) {
  const [shouldAttach, setShouldAttach] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const mediaId = useId();

  // Intersection observer for attach/autoplay with hysteresis (50% start / 10% stop)
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry.intersectionRatio;
        
        setShouldAttach(entry.isIntersecting);
        
        // Hysteresis: 50% to start, 10% to stop
        if (ratio >= 0.5) {
          setAutoplay(true);
          setIsPausing(false);
        } else if (ratio < 0.1) {
          setAutoplay(false);
          setIsPausing(true);
        }
      },
      { 
        root: null, 
        rootMargin: '200px 0px',
        threshold: [0, 0.1, 0.5, 1.0] 
      }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Handle attach/detach
  useEffect(() => {
    if (shouldAttach) {
      playerRef.current?.attach();
    } else {
      playerRef.current?.detach();
    }
  }, [shouldAttach]);

  return (
    <motion.div
      ref={cardRef}
      className="flex-shrink-0 w-40 cursor-pointer group will-change-transform"
      onClick={() => onVideoClick(video.id)}
      whileHover={{ y: -2 }}
    >
      {/* Thumbnail/Video */}
      <div className="relative aspect-[2/3] rounded-sq-md overflow-hidden bg-muted shadow-lg">
        <UnifiedVideoPlayer
          ref={playerRef}
          src={video.hlsUrl || video.src || ''}
          posterUrl={video.poster}
          muted={true}
          autoplay={autoplay}
          loop={true}
          className="w-full h-full"
          objectFit="cover"
          surface="grid"
          showMuteButton={false}
        />

        {/* Views */}
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-xs">
            👁️ {formatViews(video.views)}
          </div>
        </div>
      </div>

      {/* Title */}
      <p className="text-foreground text-sm font-medium mt-2 line-clamp-2">
        {video.title}
      </p>
    </motion.div>
  );
}