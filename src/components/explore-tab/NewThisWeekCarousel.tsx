/**
 * NewThisWeekCarousel - Enhanced horizontal carousel showing trending moments
 * 
 * Shows top 10 moments from last 7 days (trending sort)
 * Hides if fewer than 3 items
 * 
 * Autoplay pattern: Every third item (conservative for bandwidth)
 * Items at index 0, 3, 6, 9 autoplay when visible
 * 
 * Polish: Better cards, gradient overlays, hover effects
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNewThisWeekByRegion, RegionKey, TrendingMoment } from '@/hooks/useExploreMoments';
import { Skeleton } from '@/components/ui/skeleton';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { useMediaAutoplay } from '@/media/useMediaAutoplay';

interface NewThisWeekCarouselProps {
  regionKey: RegionKey;
  regionTitle: string;
  onMomentClick?: (moment: TrendingMoment) => void;
  className?: string;
}

// Region slug mapping
const REGION_SLUGS: Record<RegionKey, string> = {
  GBI: 'gbi',
  EU: 'eu',
  USA: 'usa',
  ROW: 'row',
};

// Gradient fallbacks
const GRADIENTS = [
  "from-emerald-800 via-slate-700 to-slate-900",
  "from-blue-700 via-slate-600 to-slate-900",
  "from-amber-700 via-slate-600 to-slate-900",
  "from-teal-700 via-slate-600 to-slate-900",
];

/**
 * Every third autoplay pattern (conservative for bandwidth)
 * Items at index 0, 3, 6, 9... autoplay
 */
const isAutoplayCandidate = (index: number): boolean => {
  return index % 3 === 0;
};

// Enhanced tile component with hover effects
const MomentTile: React.FC<{
  moment: TrendingMoment;
  index: number;
  onClick: () => void;
  isPlaying: boolean;
  canAutoplay: boolean;
  registerRef: (el: HTMLVideoElement | null) => void;
}> = ({ moment, index, onClick, isPlaying, canAutoplay, registerRef }) => {
  const [imageError, setImageError] = useState(false);
  const isVideo = moment.media_type === 'video';
  const gradientIndex = index % GRADIENTS.length;
  const playerRef = useRef<HLSPlayerRef>(null);
  
  const imageUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : null);
  const showGradient = !imageUrl || imageError;
  const videoSrc = moment.media_url;

  // Register video element with MediaRuntime
  useEffect(() => {
    if (canAutoplay && playerRef.current) {
      const videoEl = playerRef.current.getElement();
      registerRef(videoEl);
    }
    return () => {
      if (canAutoplay) {
        registerRef(null);
      }
    };
  }, [canAutoplay, registerRef]);

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 group"
    >
      <div className="relative w-[120px] aspect-[3/4] rounded-xl overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow">
        {/* Video with autoplay capability */}
        {isVideo && videoSrc && canAutoplay ? (
          <HLSPlayer
            ref={playerRef}
            src={videoSrc}
            poster={moment.thumbnail_url || undefined}
            mediaId={moment.moment_id}
            autoplay={isPlaying}
            muted
            loop
            className="absolute inset-0 w-full h-full object-cover"
            aspectRatio="auto"
            objectFit="cover"
            managedByMediaRuntime
          />
        ) : isVideo && videoSrc ? (
          // Static video thumbnail (not an autoplay candidate)
          <div className="relative w-full h-full">
            {!showGradient ? (
              <img 
                src={moment.thumbnail_url || imageUrl!} 
                alt="Moment"
                loading="lazy"
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br",
                GRADIENTS[gradientIndex]
              )} />
            )}
            {/* Play icon overlay with hover effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-colors">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </div>
        ) : !showGradient ? (
          <img 
            src={imageUrl!} 
            alt="Moment"
            loading="lazy"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br",
            GRADIENTS[gradientIndex]
          )} />
        )}
        
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>
    </button>
  );
};

// Skeleton tile
const TileSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-[120px] aspect-[3/4] rounded-xl overflow-hidden bg-muted">
    <Skeleton className="w-full h-full" />
  </div>
);

export const NewThisWeekCarousel: React.FC<NewThisWeekCarouselProps> = ({
  regionKey,
  regionTitle,
  onMomentClick,
  className,
}) => {
  const navigate = useNavigate();
  const { data: moments, isLoading } = useNewThisWeekByRegion(regionKey);
  
  // Set up autoplay with MediaRuntime - unique surface per region
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    surface: 'grid',
    startThreshold: 0.5,
    stopThreshold: 0.2,
  });

  const handleMomentClick = useCallback((moment: TrendingMoment) => {
    if (onMomentClick) {
      onMomentClick(moment);
    } else {
      if (moment.source_type === 'post') {
        navigate(`/post/${moment.source_id}`);
      } else {
        navigate(`/courses/${moment.course_id}`);
      }
    }
  }, [navigate, onMomentClick]);

  const handleSeeAll = useCallback(() => {
    navigate(`/discover/explore/region/${REGION_SLUGS[regionKey]}`);
  }, [navigate, regionKey]);

  // Create registration callback for each moment
  const createRegisterRef = useCallback((momentId: string, index: number) => {
    return (el: HTMLVideoElement | null) => {
      registerMedia({
        id: momentId,
        element: el,
        isCandidate: true,
        sortIndex: index,
      });
    };
  }, [registerMedia]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("py-4", className)}>
        <div className="flex items-center justify-between px-4 mb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-2 scrollbar-hide scroll-smooth">
          {Array.from({ length: 5 }).map((_, i) => (
            <TileSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Hide if fewer than 3 items
  if (!moments || moments.length < 3) {
    return null;
  }

  return (
    <div className={cn("py-4", className)}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-base font-bold text-foreground">
          New this week in {regionTitle}
        </h3>
        <button
          onClick={handleSeeAll}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <span className="text-sm font-medium text-muted-foreground">See all</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Enhanced Carousel */}
      <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-2 scrollbar-hide scroll-smooth">
        {moments.slice(0, 10).map((moment, index) => {
          const canAutoplay = isAutoplayCandidate(index) && moment.media_type === 'video';
          const isPlaying = canAutoplay && playingIds.has(moment.moment_id);
          
          return (
            <MomentTile
              key={moment.moment_id}
              moment={moment}
              index={index}
              onClick={() => handleMomentClick(moment)}
              isPlaying={isPlaying}
              canAutoplay={canAutoplay}
              registerRef={createRegisterRef(moment.moment_id, index)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default NewThisWeekCarousel;
