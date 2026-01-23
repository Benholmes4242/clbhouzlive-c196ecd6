/**
 * DiscoverMomentsGrid - Enhanced grid displaying explore_moments
 * 
 * UNIFIED WITH CLUBHOUSE: Uses direct visibility-based autoplay pattern
 * for consistent behavior across all video grids.
 * 
 * Data source: unified explore_moments view
 * Initial render: 20 items, then infinite scroll in batches of 20
 * Order: latest first (created_at desc) - ALL TIME by default
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useInfiniteExploreMoments, RegionKey, ExploreMoment, ExploreFilters } from '@/hooks/useExploreMoments';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Heart, MapPin, Loader2 } from 'lucide-react';
import { formatDuration } from '@/utils/formatDuration';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';

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

// Skeleton tile component
const MomentTileSkeleton: React.FC = () => (
  <div className="aspect-[3/4] overflow-hidden bg-muted">
    <Skeleton className="w-full h-full" />
  </div>
);

// UNIFIED: Enhanced moment tile with direct visibility-based autoplay
const MomentTile: React.FC<{
  moment: ExploreMoment;
  index: number;
  onClick: () => void;
}> = ({ moment, index, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [clientDuration, setClientDuration] = useState<number | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const playerRef = useRef<HLSPlayerRef>(null);
  const hasReportedReadyRef = useRef(false);
  
  const isVideo = moment.media_type === 'video';
  const gradientIndex = index % GRADIENTS.length;
  
  // UNIFIED: Visibility-based autoplay via IntersectionObserver
  const { ref: containerRef, inView: isVisible } = useInView({
    threshold: 0.4, // Play when 40% visible (matches Clubhouse)
    triggerOnce: false,
  });
  
  // CRITICAL: Extract stream UID for cache consistency
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
    
    const hls = generateStreamHlsUrl(extractedStreamId);
    const thumbnail = isPosterFailed(extractedStreamId) 
      ? undefined 
      : generateStreamThumbnailUrl(extractedStreamId, { height: 600 });
    
    return { 
      hlsUrl: hls, 
      posterUrl: moment.thumbnail_url || thumbnail,
      streamId: extractedStreamId 
    };
  }, [isVideo, moment.media_url, moment.thumbnail_url, moment.media_type]);
  
  const imageUrl = posterUrl || (moment.media_type === 'image' ? moment.media_url : null);
  const showGradient = !imageUrl || imageError;
  
  // Reset ready flag when moment changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
  }, [moment.moment_id]);
  
  // Handle video ready
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
    }
  }, [isVideo]);

  // Get duration metadata from video element
  useEffect(() => {
    if (!isVideo || !playerRef.current || moment.duration_seconds) return;
    
    const videoEl = playerRef.current.getElement();
    if (!videoEl) return;
    
    const handleMetadata = () => {
      if (videoEl.duration && isFinite(videoEl.duration)) {
        setClientDuration(Math.round(videoEl.duration));
      }
    };
    
    if (videoEl.duration && isFinite(videoEl.duration)) {
      setClientDuration(Math.round(videoEl.duration));
    } else {
      videoEl.addEventListener('loadedmetadata', handleMetadata, { once: true });
      return () => videoEl.removeEventListener('loadedmetadata', handleMetadata);
    }
  }, [isVideo, moment.duration_seconds]);

  // Get course name, like count, and duration from moment data (with client fallback)
  const courseName = moment.course_name;
  const likeCount = moment.likes_count ?? 0;
  const durationSeconds = moment.duration_seconds ?? clientDuration;

  return (
    <button
      ref={containerRef}
      onClick={onClick}
      className="group text-left w-full"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-alt">
        {/* Video with UNIFIED direct visibility-based autoplay */}
        {isVideo && hlsUrl ? (
          <>
            {/* HLSPlayer - always mounted, opacity controlled by ready state */}
            <div className={cn(
              "absolute inset-0 transition-opacity duration-200",
              isVideoReady ? "opacity-100" : "opacity-0"
            )}>
              <HLSPlayer
                ref={playerRef}
                src={hlsUrl}
                mediaId={streamId || moment.moment_id}
                autoplay={isVisible}
                muted
                loop
                className="w-full h-full object-cover"
                aspectRatio="3:4"
                objectFit="cover"
                managedByMediaRuntime={false}
                externallyManaged={false}
                preload="auto"
                onCanPlayThrough={handleCanPlayThrough}
              />
            </div>
            
            {/* Loading spinner - only before video is buffered */}
            {!isVideoReady && (
              <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
                {posterUrl && !imageError ? (
                  <img 
                    src={posterUrl} 
                    alt="Moment"
                    loading="lazy"
                    onError={() => setImageError(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                )}
              </div>
            )}
          </>
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
        
        {/* Bottom gradient overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
        
        {/* Course name badge - top center with MapPin */}
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
        
        {/* Like count badge - bottom left */}
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
        
        {/* Duration badge - bottom right (videos only) */}
        {isVideo && durationSeconds && durationSeconds > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium pointer-events-none">
            {formatDuration(durationSeconds)}
          </div>
        )}
      </div>
    </button>
  );
};

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

  const handleMomentClick = useCallback((moment: ExploreMoment, index: number) => {
    if (onMomentClick) {
      onMomentClick(moment, index, moments);
    } else {
      if (moment.source_type === 'post') {
        navigate(`/post/${moment.source_id}`);
      } else {
        navigate(`/courses/${moment.course_id}`);
      }
    }
  }, [navigate, onMomentClick, moments]);

  // Initial loading state with skeleton
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
            <MomentTileSkeleton key={i} />
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
      {/* Enhanced Section Header */}
      {showHeader && (
        <div className="px-4 mb-4">
          <h2 className="text-lg font-bold text-foreground">{headerTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{headerSubtitle}</p>
        </div>
      )}
      
      {/* Grid with tighter gaps */}
      <div className="px-1 grid grid-cols-2 gap-[2px]">
        {moments.map((moment, index) => (
          <MomentTile
            key={moment.moment_id}
            moment={moment}
            index={index}
            onClick={() => handleMomentClick(moment, index)}
          />
        ))}
        
        {/* Skeleton tiles for infinite scroll loading */}
        {isFetchingNextPage && (
          Array.from({ length: 4 }).map((_, i) => (
            <MomentTileSkeleton key={`loading-${i}`} />
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
