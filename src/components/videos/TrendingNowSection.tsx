import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Play, Heart, Flame } from 'lucide-react';
import { useLongFormVideosQuery } from '@/hooks/useLongFormVideosQuery';
import type { LongFormVideo } from './LongFormVideoTile';

interface TrendingNowSectionProps {
  onVideoClick?: (id: string) => void;
  onViewAll?: () => void;
  excludeVideoId?: string; // Exclude featured video from this section
  className?: string;
}

const formatCount = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

/**
 * TrendingNowSection - Horizontal scroll of trending videos
 * 
 * Features:
 * - Hot content from past 7 days
 * - Engagement velocity ranking
 * - Max 10 items in carousel
 * - Deduped against featured video
 */
export const TrendingNowSection: React.FC<TrendingNowSectionProps> = ({
  onVideoClick,
  onViewAll,
  excludeVideoId,
  className,
}) => {
  // Fetch trending videos
  const { videos: allVideos, isLoading } = useLongFormVideosQuery({
    section: 'trending',
    limit: 11, // Fetch one extra in case we need to exclude featured
  });

  // Filter out excluded video
  const videos = (allVideos as LongFormVideo[]).filter(v => v.id !== excludeVideoId).slice(0, 10);

  // Loading skeleton
  if (isLoading) {
    return (
      <section className={cn("mb-6", className)}>
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <div className="aspect-[3/4] bg-muted rounded-xl animate-pulse" />
              <div className="h-4 bg-muted rounded mt-2 w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // No trending videos
  if (videos.length === 0) {
    return null;
  }

  return (
    <section className={cn("mb-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-base font-bold text-foreground">Trending Now</h2>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>See all</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar pb-2">
        {videos.map((video) => (
          <TrendingVideoCard
            key={video.id}
            video={video}
            onClick={() => onVideoClick?.(video.id)}
          />
        ))}
      </div>
    </section>
  );
};

interface TrendingVideoCardProps {
  video: LongFormVideo;
  onClick?: () => void;
}

const TrendingVideoCard: React.FC<TrendingVideoCardProps> = ({ video, onClick }) => {
  return (
    <div
      className="flex-shrink-0 w-36 cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Play icon overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-4 w-4 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Likes - bottom left */}
        {(video.likes || 0) > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full">
            <Heart className="h-3 w-3 text-white" fill="white" />
            <span className="text-white text-xs font-medium">{formatCount(video.likes || 0)}</span>
          </div>
        )}

        {/* Duration - bottom right */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded">
          {video.duration}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground mt-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
        {video.title}
      </p>
    </div>
  );
};

export default TrendingNowSection;
