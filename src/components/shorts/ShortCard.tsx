import React from 'react';
import { Heart } from 'lucide-react';
import { ExploreContentItem } from '@/components/explore/types';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { usePerfMonitor, trackImageLoad } from '@/hooks/usePerfMonitor';

interface ShortCardProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;
  isPinned?: boolean;
  autoplay?: boolean;
}

export default function ShortCard({ item, onClick, height, isPinned, autoplay }: ShortCardProps) {
  // Performance monitoring
  usePerfMonitor('ShortCard', { id: item.id, isPinned, autoplay });
  
  const isVideo = item.type === 'video' || item.src?.includes('.mp4') || item.src?.includes('.webm');
  const thumbnailUrl = item.thumbnailSrc || item.src || '';
  
  // Track thumbnail load
  const thumbTracking = trackImageLoad(thumbnailUrl, `ShortCard:thumb:${item.id}`);
  
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
        {/* Thumbnail/Video */}
        {isVideo && autoplay ? (
          <video
            src={item.src}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onLoad={thumbTracking.onLoad}
            onError={thumbTracking.onError}
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
