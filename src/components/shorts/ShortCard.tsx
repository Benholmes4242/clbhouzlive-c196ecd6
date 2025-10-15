import React from 'react';
import { Play, Heart } from 'lucide-react';
import { ExploreContentItem } from '@/components/explore/types';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';

interface ShortCardProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;
  isPinned?: boolean;
  autoplay?: boolean;
}

export default function ShortCard({ item, onClick, height, isPinned, autoplay }: ShortCardProps) {
  const isVideo = item.type === 'video' || item.src?.includes('.mp4') || item.src?.includes('.webm');
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
            src={item.thumbnailSrc || item.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Gradient overlay for badges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Duration Badge - Top Left */}
        {item.duration && (
          <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-lg backdrop-blur-sm border" 
               style={{ 
                 backgroundColor: 'rgba(18,18,18,0.48)', 
                 borderColor: 'rgba(255,255,255,0.12)',
                 borderRadius: '8px'
               }}>
            <span className="text-xs font-medium text-white">{item.duration}</span>
          </div>
        )}

        {/* Play Icon - Top Right */}
        <div className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full backdrop-blur-sm border flex items-center justify-center transition-opacity group-hover:opacity-100 opacity-90"
             style={{ 
               backgroundColor: 'rgba(18,18,18,0.48)', 
               borderColor: 'rgba(255,255,255,0.12)'
             }}>
          <Play className="w-4 h-4 text-white fill-white" />
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Caption Block - Below Card */}
      <div className="mt-2 px-1 text-left">
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
