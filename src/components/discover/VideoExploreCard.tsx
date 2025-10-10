import React, { useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { Eye } from 'lucide-react';

const FALLBACK_THUMBNAIL = '/img/video-fallback.jpg';

interface VideoExploreCardProps {
  item: ExploreContentItem;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const VideoExploreCard: React.FC<VideoExploreCardProps> = ({ item, onMediaClick }) => {
  // Debug: verify real poster is being passed
  console.debug('[VideoCard] thumb check', {
    id: item.id,
    hasThumb: !!item.thumbnailSrc,
    thumb: item.thumbnailSrc,
    src: item.src
  });

  // Use real thumbnail first; fallback to branded fallback
  const initialThumbnail = item.thumbnailSrc || FALLBACK_THUMBNAIL;
  const [imgSrc, setImgSrc] = useState(initialThumbnail);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_THUMBNAIL);
    }
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
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={imgSrc}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
          onError={handleImageError}
        />
        
        {/* Duration tag (bottom-right) */}
        {item.duration && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-xs font-semibold">
            {item.duration}
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Meta section */}
      <div className="mt-2 px-0.5">
        {/* Title */}
        <h3 className="text-foreground font-semibold text-[15px] md:text-base line-clamp-2 leading-snug mb-1.5">
          {item.title}
        </h3>

        {/* Creator + metadata row */}
        <div className="flex items-center gap-2 text-muted-foreground">
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

        {/* Course tag (if available) */}
        {item.golfCourse && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              🏌️ {item.golfCourse.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoExploreCard;
