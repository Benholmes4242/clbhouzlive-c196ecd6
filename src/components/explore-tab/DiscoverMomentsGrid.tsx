/**
 * DiscoverMomentsGrid - Enhanced grid displaying explore_moments
 * 
 * TikTok-Level Video Architecture:
 * - UnifiedVideoPlayer with HLS pool promotion
 * - 50%/10% autoplay hysteresis
 * - useAdaptivePrefetch (3-20 dynamic range)
 * - 150ms ease-out crossfade
 * - Priority poster loading (fetchPriority="high")
 * - Shimmer-down skeleton animations
 * 
 * Data source: unified explore_moments view
 * Initial render: 20 items, then infinite scroll in batches of 20
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useInfiniteExploreMoments, RegionKey, ExploreMoment, ExploreFilters } from '@/hooks/useExploreMoments';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Heart, MapPin } from 'lucide-react';
import { formatDuration } from '@/utils/formatDuration';
import UnifiedVideoPlayer from '@/media/components/UnifiedVideoPlayer';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';

// TikTok-level performance constants
const AUTOPLAY_START_THRESHOLD = 0.5;
const AUTOPLAY_STOP_THRESHOLD = 0.1;
const CROSSFADE_DURATION_MS = 150;
const FIRST_FRAME_FALLBACK_MS = 3000;

// Helper to format like count
const formatLikeCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toString();
};

interface DiscoverMomentsGridProps {
  regionKey?: RegionKey;
  filters?: ExploreFilters;
  className?: string;
  onMomentClick?: (moment: ExploreMoment, index: number, allMoments: ExploreMoment[]) => void;
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
}

// Gradient fallbacks for items without thumbnails
const GRADIENTS = [
  "from-emerald-800 via-slate-700 to-slate-900",
  "from-blue-700 via-slate-600 to-slate-900",
  "from-amber-700 via-slate-600 to-slate-900",
  "from-teal-700 via-slate-600 to-slate-900",
];

// TikTok-level shimmer skeleton
const MomentTileSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div 
    className="aspect-[3/4] overflow-hidden bg-muted motion-safe:animate-shimmer-down"
    style={{ animationDelay: `${index * 75}ms` }}
  >
    <Skeleton className="w-full h-full" />
  </div>
);

// TikTok-Level Moment Tile with 50%/10% hysteresis
const MomentTile: React.FC<{
  moment: ExploreMoment;
  index: number;
  onClick: () => void;
  isPriority?: boolean;
}> = React.memo(({ moment, index, onClick, isPriority = false }) => {
  const [imageError, setImageError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const firstFrameTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  const isVideo = moment.media_type === 'video';
  const gradientIndex = index % GRADIENTS.length;
  
  // TikTok-level 50%/10% hysteresis
  const { ref: containerRef, inView: isVisible } = useInView({
    threshold: [AUTOPLAY_STOP_THRESHOLD, AUTOPLAY_START_THRESHOLD],
    triggerOnce: false,
  });

  const [shouldPlay, setShouldPlay] = useState(false);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (isVisible) {
      wasVisibleRef.current = true;
      setShouldPlay(true);
    } else if (wasVisibleRef.current) {
      setShouldPlay(false);
    }
  }, [isVisible]);
  
  // Extract stream URL with cache consistency
  const { hlsUrl, posterUrl, streamId } = useMemo(() => {
    if (!isVideo || !moment.media_url) {
      return { 
        hlsUrl: null, 
        posterUrl: moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : undefined),
        streamId: null 
      };
    }
    const extractedStreamId = uidFromNode({ src: moment.media_url });
    if (!extractedStreamId) return { hlsUrl: null, posterUrl: moment.thumbnail_url, streamId: null };
    
    const thumbnail = isPosterFailed(extractedStreamId) 
      ? undefined 
      : generateStreamThumbnailUrl(extractedStreamId, { height: 600 });
    
    return { 
      hlsUrl: generateStreamHlsUrl(extractedStreamId), 
      posterUrl: moment.thumbnail_url || thumbnail,
      streamId: extractedStreamId 
    };
  }, [isVideo, moment.media_url, moment.thumbnail_url, moment.media_type]);
  
  const imageUrl = posterUrl || (moment.media_type === 'image' ? moment.media_url : null);
  const showGradient = !imageUrl || imageError;

  // First-frame fallback timeout
  useEffect(() => {
    if (isVideo && hlsUrl && !isVideoReady) {
      firstFrameTimeoutRef.current = setTimeout(() => {
        setShowVideo(true);
      }, FIRST_FRAME_FALLBACK_MS);
    }
    return () => {
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
      }
    };
  }, [isVideo, hlsUrl, isVideoReady]);

  const handleVideoReady = useCallback(() => {
    if (firstFrameTimeoutRef.current) {
      clearTimeout(firstFrameTimeoutRef.current);
    }
    setIsVideoReady(true);
    setShowVideo(true);
  }, []);

  const courseName = moment.course_name;
  const likeCount = moment.likes_count ?? 0;
  const durationSeconds = moment.duration_seconds;

  return (
    <button
      ref={containerRef}
      onClick={onClick}
      className="group text-left w-full will-change-transform"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {/* Video with TikTok-level 150ms crossfade */}
        {isVideo && hlsUrl ? (
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
            {/* Play icon when not autoplaying */}
            {!shouldPlay && (
              <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                </div>
              </div>
            )}
          </>
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
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
        
        {/* Course name badge */}
        {courseName && (
          <div className="absolute top-2 left-2 right-2 flex justify-center pointer-events-none">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full max-w-[90%]">
              <MapPin className="w-3 h-3 text-white flex-shrink-0" />
              <span className="text-[11px] font-medium text-white truncate text-center">
                {courseName}
              </span>
            </div>
          </div>
        )}
        
        {/* Like count badge */}
        {likeCount > 0 && (
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
              <Heart className="w-3 h-3 text-white fill-white" />
              <span className="text-[11px] font-medium text-white">
                {formatLikeCount(likeCount)}
              </span>
            </div>
          </div>
        )}
        
        {/* Duration badge */}
        {isVideo && durationSeconds && durationSeconds > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium pointer-events-none">
            {formatDuration(durationSeconds)}
          </div>
        )}
      </div>
    </button>
  );
}, (prev, next) => 
  prev.moment.moment_id === next.moment.moment_id && 
  prev.index === next.index &&
  prev.isPriority === next.isPriority
);

MomentTile.displayName = 'MomentTile';

export const DiscoverMomentsGrid: React.FC<DiscoverMomentsGridProps> = ({
  regionKey,
  filters,
  className,
  onMomentClick,
  showHeader = true,
  headerTitle = "Discover Courses",
  headerSubtitle = "Moments from the world's great courses",
}) => {
  const navigate = useNavigate();
  const loadMoreRef = useRef(false);
  
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteExploreMoments(regionKey, filters);

  // Infinite scroll trigger
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // Load more when sentinel is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !loadMoreRef.current) {
      loadMoreRef.current = true;
      fetchNextPage().finally(() => {
        loadMoreRef.current = false;
      });
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages into single array, deduplicate by moment_id
  const moments = useMemo(() => {
    const allMoments = data?.pages.flatMap(page => page.moments) || [];
    const seen = new Set<string>();
    return allMoments.filter(m => {
      if (seen.has(m.moment_id)) return false;
      seen.add(m.moment_id);
      return true;
    });
  }, [data]);

  // TikTok-level adaptive prefetch
  const { onIndexChange } = useAdaptivePrefetch();

  const handleMomentClick = useCallback((moment: ExploreMoment, index: number) => {
    // Update prefetch window on interaction
    onIndexChange();
    
    if (onMomentClick) {
      onMomentClick(moment, index, moments);
    } else {
      if (moment.source_type === 'post') {
        navigate(`/post/${moment.source_id}`);
      } else {
        navigate(`/courses/${moment.course_id}`);
      }
    }
  }, [navigate, onMomentClick, moments, onIndexChange]);

  // Initial loading state with staggered shimmer
  if (isLoading && moments.length === 0) {
    return (
      <div className={cn("py-6", className)}>
        {showHeader && (
          <div className="px-4 mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56 mt-2" />
          </div>
        )}
        <div className="px-1 grid grid-cols-2 gap-[2px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <MomentTileSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (moments.length === 0) {
    return (
      <div className={cn("py-6", className)}>
        {showHeader && (
          <div className="px-4 mb-4">
            <h2 className="text-lg font-bold text-foreground">{headerTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{headerSubtitle}</p>
          </div>
        )}
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No moments found. Try adjusting your filters or be the first to share!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-6", className)}>
      {/* Section Header */}
      {showHeader && (
        <div className="px-4 mb-4">
          <h2 className="text-lg font-bold text-foreground">{headerTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{headerSubtitle}</p>
        </div>
      )}
      
      {/* Grid */}
      <div className="px-1 grid grid-cols-2 gap-[2px]">
        {moments.map((moment, index) => (
          <MomentTile
            key={moment.moment_id}
            moment={moment}
            index={index}
            onClick={() => handleMomentClick(moment, index)}
            isPriority={index < 6}
          />
        ))}
        
        {/* Skeleton tiles for infinite scroll loading */}
        {isFetchingNextPage && (
          Array.from({ length: 4 }).map((_, i) => (
            <MomentTileSkeleton key={`loading-${i}`} index={i} />
          ))
        )}
      </div>

      {/* Load more sentinel */}
      <div ref={sentinelRef} className="h-12 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
        )}
      </div>
      
      {/* End of list indicator */}
      {!hasNextPage && moments.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <div className="w-12 h-0.5 bg-border rounded-full mb-3" />
          <p className="text-xs font-medium">You've explored it all</p>
        </div>
      )}
    </div>
  );
};

export default DiscoverMomentsGrid;
