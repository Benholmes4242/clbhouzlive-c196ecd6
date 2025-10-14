import React from 'react';
import { Play } from 'lucide-react';
import { ExploreContentItem } from '@/components/explore/types';

interface ShortCardProps {
  item: ExploreContentItem;
  onClick: () => void;
}

export default function ShortCard({ item, onClick }: ShortCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
      aria-label={`Play short: ${item.title || 'Video'} by ${item.user?.name || 'Unknown'}`}
    >
      {/* 9:16 Thumbnail Container */}
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl shadow-sm bg-muted">
        {/* Thumbnail */}
        <img
          src={item.thumbnailSrc || item.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient overlay for badges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Duration Badge - Top Left */}
        {item.duration && (
          <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-lg bg-black/65 backdrop-blur-sm border border-white/10">
            <span className="text-xs font-medium text-white">{item.duration}</span>
          </div>
        )}

        {/* Play Icon - Top Right */}
        <div className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/65 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-opacity group-hover:opacity-100 opacity-90">
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
        <div className="flex items-center gap-1.5 mt-0.5 text-[13px] text-muted-foreground">
          <span className="font-medium">{item.user?.name || 'Unknown'}</span>
          {item.likes !== undefined && (
            <>
              <span>•</span>
              <span>{item.likes.toLocaleString()} likes</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
