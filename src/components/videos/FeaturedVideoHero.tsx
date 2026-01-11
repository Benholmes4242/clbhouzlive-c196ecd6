import React, { useRef, useEffect, useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { Play, Heart, MessageCircle, MapPin, Flame, Sparkles, Clock } from 'lucide-react';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useLongFormVideosQuery } from '@/hooks/useLongFormVideosQuery';
import type { LongFormVideo } from './LongFormVideoTile';

interface FeaturedVideoHeroProps {
  onVideoClick?: (id: string) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  className?: string;
}

type BadgeType = 'trending' | 'editors_pick' | 'new' | null;

const formatCount = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const getBadgeConfig = (badge: BadgeType) => {
  switch (badge) {
    case 'trending':
      return {
        icon: Flame,
        label: 'TRENDING',
        className: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/30',
      };
    case 'editors_pick':
      return {
        icon: Sparkles,
        label: "EDITOR'S PICK",
        className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/30',
      };
    case 'new':
      return {
        icon: Clock,
        label: 'NEW',
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30',
      };
    default:
      return null;
  }
};

/**
 * FeaturedVideoHero - Hero section with trending/featured video
 * 
 * Features:
 * - Auto-preview on scroll into view (muted, 3-5 seconds)
 * - Badge system (trending, editor's pick, new)
 * - Engagement signals (likes, comments)
 * - Course tag if tagged to a course
 * - Tap anywhere opens fullscreen player
 */
export const FeaturedVideoHero: React.FC<FeaturedVideoHeroProps> = ({
  onVideoClick,
  onCreatorClick,
  className,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const mediaId = useId();
  const [shouldAttach, setShouldAttach] = useState(false);
  const { ref: containerRef, isInView } = useIntersectionObserver({ 
    threshold: 0.5,
    rootMargin: '100px',
  });

  // Fetch trending video for hero
  const { videos, isLoading } = useLongFormVideosQuery({
    section: 'trending',
    limit: 1,
  });

  const featuredVideo = videos[0] as LongFormVideo | undefined;

  // Determine badge based on video properties
  const badge: BadgeType = featuredVideo?.isTrending ? 'trending' : 
    (featuredVideo?.createdAt && new Date(featuredVideo.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)) ? 'new' : null;

  const badgeConfig = getBadgeConfig(badge);

  // Handle intersection for autoplay
  useEffect(() => {
    setShouldAttach(isInView);
  }, [isInView]);

  useEffect(() => {
    if (shouldAttach) {
      playerRef.current?.attach();
    } else {
      playerRef.current?.detach();
    }
  }, [shouldAttach]);

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (featuredVideo?.creatorUserId) {
      onCreatorClick?.(featuredVideo.creatorUserId);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("px-4 mb-6", className)}>
        <div className="relative rounded-2xl overflow-hidden bg-muted animate-pulse">
          <div className="aspect-video" />
        </div>
      </div>
    );
  }

  // No featured video
  if (!featuredVideo) {
    return null;
  }

  return (
    <div 
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={cn("px-4 mb-6", className)}
    >
      <div
        className="relative rounded-2xl overflow-hidden bg-card shadow-lg cursor-pointer group"
        onClick={() => onVideoClick?.(featuredVideo.id)}
      >
        {/* Video/Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {featuredVideo.mediaUrl ? (
            <HLSPlayer
              ref={playerRef}
              src={featuredVideo.mediaUrl}
              muted={true}
              autoplay={shouldAttach}
              loop={true}
              managedByMediaRuntime={false}
              mediaId={mediaId}
              className="w-full h-full object-cover"
              poster={featuredVideo.thumbnailUrl}
            />
          ) : (
            <img
              src={featuredVideo.thumbnailUrl}
              alt={featuredVideo.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Gradient overlay for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Play button - center */}
          <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Play className="h-7 w-7 text-foreground ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Badge - top left */}
          {badgeConfig && (
            <div className={cn(
              "absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg",
              badgeConfig.className
            )}>
              <badgeConfig.icon className="h-3.5 w-3.5" />
              <span>{badgeConfig.label}</span>
            </div>
          )}

          {/* Content overlay - bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Title */}
            <h2 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-2">
              {featuredVideo.title}
            </h2>

            {/* Creator row */}
            <div className="flex items-center gap-2 mb-3">
              <button 
                onClick={handleCreatorClick}
                className="shrink-0 rounded-full overflow-hidden hover:ring-2 hover:ring-white/30 transition-all"
              >
                <GolferAvatar
                  name={featuredVideo.creatorName}
                  photoUrl={featuredVideo.creatorAvatarUrl}
                  size={28}
                />
              </button>
              <button 
                onClick={handleCreatorClick}
                className="text-white/90 text-sm font-medium hover:text-white transition-colors"
              >
                @{featuredVideo.creatorName}
              </button>
            </div>

            {/* Engagement stats row */}
            <div className="flex items-center gap-4 text-white/80 text-sm">
              {(featuredVideo.likes || 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" fill="currentColor" />
                  <span>{formatCount(featuredVideo.likes || 0)}</span>
                </div>
              )}
              {featuredVideo.golfCourseName && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate max-w-[150px]">{featuredVideo.golfCourseName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedVideoHero;
