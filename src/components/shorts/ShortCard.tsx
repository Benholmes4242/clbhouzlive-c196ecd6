import React, { useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { ExploreContentItem } from '@/components/explore/types';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { useAutoplayGuard } from '@/hooks/useAutoplayGuard';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { registerPlayer } from '@/utils/videoRegistry';

interface ShortCardProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;
  isPinned?: boolean;
  autoplay?: boolean;
}

export default function ShortCard({ item, onClick, height, isPinned, autoplay }: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = item.type === 'video' || item.src?.includes('.mp4') || item.src?.includes('.webm');
  
  // Generate poster URL from Stream ID or use existing thumbnailSrc
  const streamId = item.src ? getStreamIdFromUrl(item.src) : null;
  const posterUrl = item.thumbnailSrc ?? (streamId ? getStreamPoster(streamId, '0s', 720) : undefined);
  
  // Register video in global registry for exclusivity control
  useEffect(() => {
    if (!videoRef.current || !isVideo) return undefined;
    return registerPlayer(item.id, videoRef.current);
  }, [item.id, isVideo]);

  // Cleanup: pause on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (e) {
          // Silently fail
        }
      }
    };
  }, []);
  
  // Guard autoplay - handles browser blocking gracefully
  const autoplayBlocked = useAutoplayGuard(videoRef, isVideo && !!autoplay);
  
  return (
    <button
      onClick={onClick}
      className="group relative w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl active:scale-[0.98] transition-transform duration-75"
      aria-label={`Play short: ${item.title || 'Video'} by ${item.user?.name || 'Unknown'}`}
    >
      {/* Thumbnail Container */}
      <div 
        className="relative w-full overflow-hidden rounded-xl bg-muted"
        style={{ 
          height: height ? `${height}px` : undefined,
          aspectRatio: !height ? '9/16' : undefined,
          boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 6px 16px rgba(0,0,0,0.06)'
        }}
      >
        {/* Video with poster fallback - always render video element for consistency */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={item.src}
            poster={posterUrl}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loop
            muted
            playsInline
            preload="metadata"
            data-autoplay-blocked={autoplayBlocked ? '1' : '0'}
          />
        ) : (
          <img
            src={posterUrl || item.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Gradient overlay for badges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />



        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Caption Block - Below Card */}
      <div className="mt-1.5 px-1 text-left">
        {/* Title */}
        <h3 className="text-[15px] font-semibold line-clamp-1 text-foreground">
          {item.title || 'Untitled'}
        </h3>

        {/* Meta Row */}
        <div className="flex items-center justify-between mt-0.5 text-[13px] text-muted-foreground">
          {/* Left: Avatar + Username */}
          <div className="flex items-center gap-1.5">
            {item.user?.avatar && (
              <OptimizedAvatar
                src={item.user.avatar}
                alt={item.user.name || 'User'}
                size={20}
                fallback={item.user.name?.[0] || 'U'}
              />
            )}
            <span className="font-medium">{item.user?.name || 'Unknown'}</span>
          </div>
          
          {/* Right: Heart + Count */}
          {item.likes !== undefined && (
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              <span>{item.likes.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
