/**
 * DiscoverMomentsGrid - Grid displaying explore_moments
 * 
 * Data source: unified explore_moments view
 * Initial render: 20 items, then infinite scroll in batches of 20
 * Order: latest first (created_at desc)
 * 
 * Autoplay pattern: Diagonal alternating
 * - Row 1: Left plays, Right static
 * - Row 2: Left static, Right plays
 * (repeats)
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useInfiniteExploreMoments, RegionKey, ExploreMoment } from '@/hooks/useExploreMoments';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Play } from 'lucide-react';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { useMediaAutoplay } from '@/media/useMediaAutoplay';

interface DiscoverMomentsGridProps {
  regionKey?: RegionKey;
  className?: string;
  onMomentClick?: (moment: ExploreMoment) => void;
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
  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-alt">
    <Skeleton className="w-full h-full" />
  </div>
);

// Individual moment tile with video autoplay support
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
  
  // Use thumbnail_url, falling back to media_url for images, then gradient
  const imageUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : null);
  const showGradient = !imageUrl || imageError;
  
  // Video source
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
      className="group text-left w-full"
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow">
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
          <div className="relative">
            {!showGradient ? (
              <img 
                src={moment.thumbnail_url || imageUrl!} 
                alt="Moment"
                loading="lazy"
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br",
                GRADIENTS[gradientIndex]
              )} />
            )}
            {/* Play icon overlay for static videos */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
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
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        
        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
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
    startThreshold: 0.5,  // Play when 50% visible
    stopThreshold: 0.2,   // Pause when below 20% visible
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
    // Deduplicate to prevent any edge-case repeats
    const seen = new Set<string>();
    return allMoments.filter(m => {
      if (seen.has(m.moment_id)) return false;
      seen.add(m.moment_id);
      return true;
    });
  }, [data]);

  const handleMomentClick = useCallback((moment: ExploreMoment) => {
    if (onMomentClick) {
      onMomentClick(moment);
    } else {
      // Navigate based on source type
      if (moment.source_type === 'post') {
        navigate(`/post/${moment.source_id}`);
      } else {
        // For reviews, navigate to course
        navigate(`/courses/${moment.course_id}`);
      }
    }
  }, [navigate, onMomentClick]);

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
        <div className="px-5 mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
        <div className="px-5 mb-4">
          <h3 className="text-lg font-serif text-foreground">Discover Courses</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Moments from the world's great courses
          </p>
        </div>
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No moments found yet. Be the first to share!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-6", className)}>
      {/* Section Header */}
      <div className="px-5 mb-4">
        <h3 className="text-lg font-serif text-foreground">Discover Courses</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Moments from the world's great courses
        </p>
      </div>
      
      {/* Grid */}
      <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {moments.map((moment, index) => {
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
        
        {/* Pagination skeleton tiles */}
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
    </div>
  );
};

export default DiscoverMomentsGrid;
