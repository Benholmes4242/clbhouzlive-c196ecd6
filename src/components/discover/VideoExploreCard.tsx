import React, { useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { Eye } from 'lucide-react';
import { getStreamPoster } from '@/utils/stream';
import { DurationBadge } from '@/components/VideoCard/DurationBadge';

const FALLBACK_THUMBNAIL = '/placeholder.svg';

interface VideoExploreCardProps {
  item: ExploreContentItem;
  onMediaClick?: (item: ExploreContentItem) => void;
  compact?: boolean;
  /** Whether this is a priority card (first 6) for eager loading */
  isPriority?: boolean;
}

const VideoExploreCard: React.FC<VideoExploreCardProps> = ({ item, onMediaClick, compact = false, isPriority = false }) => {
  const initialThumb = item.thumbnailSrc || getStreamPoster(item.src, '1s') || FALLBACK_THUMBNAIL;
  const [imgSrc, setImgSrc] = useState<string>(initialThumb);

  const handleImageError = () => {
    setImgSrc(FALLBACK_THUMBNAIL);
  };

  // Format view count
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Format upload time (using likes as a proxy for now)
  const getUploadTime = () => {
    const daysSince = Math.floor(Math.random() * 30) + 1;
    if (daysSince === 1) return '1 day ago';
    if (daysSince < 7) return `${daysSince} days ago`;
    if (daysSince < 14) return '1 week ago';
    if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`;
    return '1 month ago';
  };

  return (
    <div
      className="cursor-pointer group"
      onClick={() => onMediaClick?.(item)}
    >
      {/* 16:9 Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted" style={{ borderRadius: '4px' }}>
        <img
          src={imgSrc}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading={isPriority ? "eager" : "lazy"}
          fetchPriority={isPriority ? "high" : "auto"}
          onError={handleImageError}
        />
        
        {/* Duration tag (bottom-right) - Explore tab glass style */}
        {item.duration && typeof item.duration === 'number' && (
          <div className="absolute bottom-2 right-2">
            <DurationBadge 
              seconds={item.duration} 
              className="rounded-md px-2 py-0.5 backdrop-blur-md bg-black/35 border border-white/10 text-white text-xs font-medium"
            />
          </div>
        )}
        {item.duration && typeof item.duration === 'string' && (
          <div className="absolute bottom-2 right-2 rounded-md px-2 py-0.5 backdrop-blur-md bg-black/35 border border-white/10 text-white text-xs font-medium">
            {item.duration}
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Meta section */}
      <div className={compact ? "mt-2.5 px-0.5" : "mt-2 px-0.5"}>
        {/* Title - hidden in compact mode, fixed height for alignment */}
        {!compact && (
          <h3 className="text-foreground font-semibold text-body-md line-clamp-1 leading-snug mb-1 overflow-hidden pl-0.5 pr-0.5" style={{ minHeight: '1.4em' }}>
            {item.title}
          </h3>
        )}

        {/* Creator + metadata row */}
        <div className="flex items-center gap-2 text-muted-foreground pl-0.5">
          {/* Creator avatar */}
          {item.user?.avatar && (
            <img
              src={item.user.avatar}
              alt={item.user.name}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          )}
          
          {/* Creator name & stats */}
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm truncate">
              {item.user?.name || 'Anonymous'}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
              <Eye className="w-3 h-3" />
              <span>{formatViews(item.likes * 100)} views</span>
              <span className="mx-1">•</span>
              <span>{getUploadTime()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VideoExploreCard;
