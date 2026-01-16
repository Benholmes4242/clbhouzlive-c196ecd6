/**
 * DiscoverMomentsGrid - Enhanced grid displaying explore_moments
 * 
 * Data source: unified explore_moments view
 * Initial render: 20 items, then infinite scroll in batches of 20
 * Order: latest first (created_at desc) - ALL TIME by default
 * 
 * Autoplay pattern: All videos are candidates, MediaRuntime handles concurrency
 * 
 * Phase 3: Supports filtering by time frame, region, and sort
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useInfiniteExploreMoments, RegionKey, ExploreMoment, ExploreFilters } from '@/hooks/useExploreMoments';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Heart, MapPin } from 'lucide-react';
import { formatDuration } from '@/utils/formatDuration';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { useMediaAutoplay } from '@/media/useMediaAutoplay';

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

/**
 * Alternating autoplay pattern for grid videos.
 * Only ONE video per row attempts autoplay, dramatically reducing concurrent load attempts.
 * 
 * Pattern: L R L R (alternating by row)
 * - Row 0: Left card (index 0) can autoplay
 * - Row 1: Right card (index 3) can autoplay  
 * - Row 2: Left card (index 4) can autoplay
 * - Row 3: Right card (index 7) can autoplay
 * 
 * For a 2-column grid:
 * Row 0: [0*] [1]    <- index 0 (left) autoplays
 * Row 1: [2]  [3*]   <- index 3 (right) autoplays
 * Row 2: [4*] [5]    <- index 4 (left) autoplays
 * Row 3: [6]  [7*]   <- index 7 (right) autoplays
 * 
 * This ensures only one video per row attempts autoplay,
 * reducing network congestion and preventing mass timeout.
 */
const isAutoplayCandidate = (index: number, columnsPerRow: number = 2): boolean => {
  const row = Math.floor(index / columnsPerRow);
  const column = index % columnsPerRow;
  
  // Alternating pattern: even rows -> left column, odd rows -> right column
  const isEvenRow = row % 2 === 0;
  const isLeftColumn = column === 0;
  const isRightColumn = column === columnsPerRow - 1;
  
  return (isEvenRow && isLeftColumn) || (!isEvenRow && isRightColumn);
};

// Skeleton tile component
const MomentTileSkeleton: React.FC = () => (
  <div className="aspect-[3/4] overflow-hidden bg-muted">
    <Skeleton className="w-full h-full" />
  </div>
);

// Enhanced moment tile with course name overlay
const MomentTile: React.FC<{
  moment: ExploreMoment;
  index: number;
  onClick: () => void;
  isPlaying: boolean;
  canAutoplay: boolean;
  registerRef: (el: HTMLVideoElement | null) => void;
}> = ({ moment, index, onClick, isPlaying, canAutoplay, registerRef }) => {
  const [imageError, setImageError] = useState(false);
  const [clientDuration, setClientDuration] = useState<number | null>(null);
  const isVideo = moment.media_type === 'video';
  const gradientIndex = index % GRADIENTS.length;
  const playerRef = useRef<HLSPlayerRef>(null);
  
  const imageUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : null);
  const showGradient = !imageUrl || imageError;
  const videoSrc = moment.media_url;

  // Register video element with MediaRuntime - with retry for async mount
  useEffect(() => {
    if (!canAutoplay) return;
    
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 10;
    
    const checkAndRegister = () => {
      if (cancelled) return;
      const videoEl = playerRef.current?.getElement();
      if (videoEl) {
        registerRef(videoEl);
        
        // Listen for loadedmetadata to get client-side duration fallback
        if (!moment.duration_seconds) {
          const handleMetadata = () => {
            if (videoEl.duration && isFinite(videoEl.duration)) {
              setClientDuration(Math.round(videoEl.duration));
            }
          };
          if (videoEl.duration && isFinite(videoEl.duration)) {
            setClientDuration(Math.round(videoEl.duration));
          } else {
            videoEl.addEventListener('loadedmetadata', handleMetadata, { once: true });
          }
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkAndRegister, 50);
      }
    };
    
    checkAndRegister();
    
    return () => {
      cancelled = true;
      registerRef(null);
    };
  }, [canAutoplay, registerRef, moment.duration_seconds]);

  // Get course name, like count, and duration from moment data (with client fallback)
  const courseName = moment.course_name;
  const likeCount = moment.likes_count ?? 0;
  const durationSeconds = moment.duration_seconds ?? clientDuration;

  return (
    <button
      onClick={onClick}
      className="group text-left w-full"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-alt">
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
            aspectRatio="3:4"
            objectFit="cover"
            managedByMediaRuntime
          />
        ) : isVideo && videoSrc ? (
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
            <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-colors">
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
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
  
  // Set up autoplay with MediaRuntime
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    surface: 'grid',
    startThreshold: 0.5,
    stopThreshold: 0.2,
  });
  
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

  // Use ref to hold registerMedia to avoid dependency issues causing infinite loops
  const registerMediaRef = useRef(registerMedia);
  registerMediaRef.current = registerMedia;
  
  // Track registered IDs to prevent duplicate registrations
  const registeredIdsRef = useRef<Set<string>>(new Set());
  
  // Create registration callback for each moment
  const createRegisterRef = useCallback((momentId: string, index: number) => {
    return (el: HTMLVideoElement | null) => {
      if (!el) {
        if (registeredIdsRef.current.has(momentId)) {
          registeredIdsRef.current.delete(momentId);
          registerMediaRef.current({
            id: momentId,
            element: null,
            isCandidate: false,
            sortIndex: index,
          });
        }
        return;
      }
      
      if (registeredIdsRef.current.has(momentId)) {
        return;
      }
      
      requestAnimationFrame(() => {
        registeredIdsRef.current.add(momentId);
        registerMediaRef.current({
          id: momentId,
          element: el,
          isCandidate: true,
          sortIndex: index,
        });
      });
    };
  }, []);

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
        {moments.map((moment, index) => {
          const canAutoplay = isAutoplayCandidate(index) && moment.media_type === 'video';
          const isPlaying = canAutoplay && playingIds.has(moment.moment_id);
          
          return (
            <MomentTile
              key={moment.moment_id}
              moment={moment}
              index={index}
              onClick={() => handleMomentClick(moment, index)}
              isPlaying={isPlaying}
              canAutoplay={canAutoplay}
              registerRef={createRegisterRef(moment.moment_id, index)}
            />
          );
        })}
        
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
