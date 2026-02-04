/**
 * NewThisWeekCarousel - Enhanced horizontal carousel showing trending moments
 * 
 * TikTok-Level Video Architecture:
 * - UnifiedVideoPlayer with HLS pool promotion
 * - 50%/10% autoplay hysteresis
 * - 150ms ease-out crossfade
 * - Priority poster loading (fetchPriority="high")
 * - Shimmer-down skeleton animations
 * 
 * Shows top 10 moments from last 7 days (trending sort)
 * Hides if fewer than 3 items
 * Autoplay pattern: Every third item (conservative for bandwidth)
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNewThisWeekByRegion, RegionKey, TrendingMoment } from '@/hooks/useExploreMoments';
import { Skeleton } from '@/components/ui/skeleton';
import UnifiedVideoPlayer from '@/media/components/UnifiedVideoPlayer';
import { useInView } from 'react-intersection-observer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';

// TikTok-level performance constants
const AUTOPLAY_START_THRESHOLD = 0.5;
const AUTOPLAY_STOP_THRESHOLD = 0.1;
const CROSSFADE_DURATION_MS = 150;
const FIRST_FRAME_FALLBACK_MS = 3000;

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
 */
const isAutoplayCandidate = (index: number): boolean => {
  return index % 3 === 0;
};

// TikTok-Level Moment Tile with 50%/10% hysteresis
const MomentTile: React.FC<{
  moment: TrendingMoment;
  index: number;
  onClick: () => void;
  isPriority?: boolean;
}> = React.memo(({ moment, index, onClick, isPriority = false }) => {
  const [imageError, setImageError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const firstFrameTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  const isVideo = moment.media_type === 'video';
  const canAutoplay = isAutoplayCandidate(index) && isVideo;
  const gradientIndex = index % GRADIENTS.length;
  
  // TikTok-level 50%/10% hysteresis
  const { ref: containerRef, inView: isVisible } = useInView({
    threshold: [AUTOPLAY_STOP_THRESHOLD, AUTOPLAY_START_THRESHOLD],
    triggerOnce: false,
  });

  const [shouldPlay, setShouldPlay] = useState(false);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (!canAutoplay) return;
    
    if (isVisible) {
      wasVisibleRef.current = true;
      setShouldPlay(true);
    } else if (wasVisibleRef.current) {
      setShouldPlay(false);
    }
  }, [isVisible, canAutoplay]);

  // Extract stream URL
  const { hlsUrl, posterUrl } = useMemo(() => {
    if (!isVideo || !moment.media_url) {
      return { 
        hlsUrl: null, 
        posterUrl: moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : undefined)
      };
    }
    const extractedStreamId = uidFromNode({ src: moment.media_url });
    if (!extractedStreamId) return { hlsUrl: null, posterUrl: moment.thumbnail_url };
    
    return { 
      hlsUrl: generateStreamHlsUrl(extractedStreamId), 
      posterUrl: moment.thumbnail_url || generateStreamThumbnailUrl(extractedStreamId, { height: 400 })
    };
  }, [isVideo, moment.media_url, moment.thumbnail_url, moment.media_type]);

  const imageUrl = posterUrl || (moment.media_type === 'image' ? moment.media_url : null);
  const showGradient = !imageUrl || imageError;

  // First-frame fallback timeout
  useEffect(() => {
    if (canAutoplay && hlsUrl && !isVideoReady) {
      firstFrameTimeoutRef.current = setTimeout(() => {
        setShowVideo(true);
      }, FIRST_FRAME_FALLBACK_MS);
    }
    return () => {
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
      }
    };
  }, [canAutoplay, hlsUrl, isVideoReady]);

  const handleVideoReady = useCallback(() => {
    if (firstFrameTimeoutRef.current) {
      clearTimeout(firstFrameTimeoutRef.current);
    }
    setIsVideoReady(true);
    setShowVideo(true);
  }, []);

  return (
    <button
      ref={containerRef}
      onClick={onClick}
      className="flex-shrink-0 group will-change-transform"
    >
      <div className="relative w-[120px] aspect-[3/4] rounded-xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-shadow">
        {/* Video with TikTok-level 150ms crossfade */}
        {isVideo && hlsUrl && canAutoplay ? (
          <>
            <div 
              className="absolute inset-0 z-10"
              style={{ 
                opacity: showVideo ? 1 : 0,
                transition: `opacity ${CROSSFADE_DURATION_MS}ms ease-out`
              }}
            >
              <UnifiedVideoPlayer
                src={hlsUrl}
                posterUrl={posterUrl || undefined}
                autoplay={shouldPlay}
                muted
                loop
                className="w-full h-full object-cover"
                onCanPlayThrough={handleVideoReady}
              />
            </div>
            {/* Priority poster loading */}
            {!showVideo && posterUrl && !imageError && (
              <img 
                src={posterUrl} 
                alt="Moment"
                loading={isPriority ? "eager" : "lazy"}
                fetchPriority={isPriority ? "high" : "auto"}
                decoding="async"
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {!showVideo && !posterUrl && (
              <div className="absolute inset-0 bg-muted motion-safe:animate-shimmer-down" />
            )}
          </>
        ) : isVideo && hlsUrl ? (
          // Static video thumbnail (not an autoplay candidate)
          <div className="relative w-full h-full">
            {!showGradient ? (
              <img 
                src={posterUrl || imageUrl!} 
                alt="Moment"
                loading={isPriority ? "eager" : "lazy"}
                fetchPriority={isPriority ? "high" : "auto"}
                decoding="async"
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br",
                GRADIENTS[gradientIndex]
              )} />
            )}
            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full backdrop-blur-md bg-black/35 border border-white/10 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </div>
        ) : !showGradient ? (
          <img 
            src={imageUrl!} 
            alt="Moment"
            loading={isPriority ? "eager" : "lazy"}
            fetchPriority={isPriority ? "high" : "auto"}
            decoding="async"
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
}, (prev, next) => 
  prev.moment.moment_id === next.moment.moment_id && 
  prev.index === next.index &&
  prev.isPriority === next.isPriority
);

MomentTile.displayName = 'MomentTile';

// TikTok-level shimmer skeleton
const TileSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div 
    className="flex-shrink-0 w-[120px] aspect-[3/4] rounded-xl overflow-hidden bg-muted motion-safe:animate-shimmer-down"
    style={{ animationDelay: `${index * 75}ms` }}
  >
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

  // Loading state with staggered shimmer
  if (isLoading) {
    return (
      <div className={cn("py-4", className)}>
        <div className="flex items-center justify-between px-4 mb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-2 scrollbar-hide scroll-smooth">
          {Array.from({ length: 5 }).map((_, i) => (
            <TileSkeleton key={i} index={i} />
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
      {/* Header */}
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
      
      {/* Carousel */}
      <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-2 scrollbar-hide scroll-smooth">
        {moments.slice(0, 10).map((moment, index) => (
          <MomentTile
            key={moment.moment_id}
            moment={moment}
            index={index}
            onClick={() => handleMomentClick(moment)}
            isPriority={index < 4}
          />
        ))}
      </div>
    </div>
  );
};

export default NewThisWeekCarousel;
