/**
 * DiscoverMomentsGrid - Enhanced grid displaying explore_moments
 * 
 * Data source: unified explore_moments view
 * Initial render: 20 items, then infinite scroll in batches of 20
 * Order: latest first (created_at desc)
 * 
 * Autoplay pattern: Diagonal alternating
 * - Row 1: Left plays, Right static
 * - Row 2: Left static, Right plays
 * (repeats)
 * 
 * Polish: Course name overlay, better gradients, hover effects
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useInfiniteExploreMoments, RegionKey, ExploreMoment } from '@/hooks/useExploreMoments';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, MapPin } from 'lucide-react';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { useMediaAutoplay } from '@/media/useMediaAutoplay';

interface DiscoverMomentsGridProps {
  regionKey?: RegionKey;
  className?: string;
  onMomentClick?: (moment: ExploreMoment, index: number, allMoments: ExploreMoment[]) => void;
}

// Gradient fallbacks for items without thumbnails
const GRADIENTS = [
  "from-emerald-800 via-slate-700 to-slate-900",
  "from-blue-700 via-slate-600 to-slate-900",
  "from-amber-700 via-slate-600 to-slate-900",
  "from-teal-700 via-slate-600 to-slate-900",
];

/**
 * Diagonal alternating autoplay pattern:
 * Row 1: Left plays (0), Right static (1)
 * Row 2: Left static (2), Right plays (3)
 * Pattern repeats every 4 items
 */
const isAutoplayCandidate = (index: number): boolean => {
  const positionInPattern = index % 4;
  return positionInPattern === 0 || positionInPattern === 3;
};

// Skeleton tile component
const MomentTileSkeleton: React.FC = () => (
  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
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
      } else if (retryCount < maxRetries) {
        // Video element not ready yet, retry after short delay
        retryCount++;
        setTimeout(checkAndRegister, 50);
      }
    };
    
    checkAndRegister();
    
    return () => {
      cancelled = true;
      registerRef(null);
    };
  }, [canAutoplay, registerRef]);

  return (
    <button
      onClick={onClick}
      className="group text-left w-full"
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow">
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
        
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      </div>
    </button>
  );
};

export const DiscoverMomentsGrid: React.FC<DiscoverMomentsGridProps> = ({
  regionKey,
  className,
  onMomentClick,
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
  } = useInfiniteExploreMoments(regionKey);

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

  // Initial loading state with skeleton
  if (isLoading && moments.length === 0) {
    return (
      <div className={cn("py-6", className)}>
        <div className="px-4 mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <div className="px-1 grid grid-cols-2 gap-1">
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
        <div className="px-4 mb-4">
          <h2 className="text-lg font-bold text-foreground">Discover Courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Moments from the world's great courses
          </p>
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No moments found yet. Be the first to share!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-6", className)}>
      {/* Enhanced Section Header */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-bold text-foreground">
          Discover Courses
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Moments from the world's great courses
        </p>
      </div>
      
      {/* Grid with tighter gaps */}
      <div className="px-1 grid grid-cols-2 gap-1">
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
