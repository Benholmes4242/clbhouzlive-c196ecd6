/**
 * DiscoverMomentsGrid - Grid displaying explore_moments
 * 
 * Data source: unified explore_moments view
 * Initial render: 20 items, then infinite scroll in batches of 20
 * Order: latest first (created_at desc)
 * 
 * Polish: skeleton tiles, video autoplay with HLSPlayer, no duplicates
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useInfiniteExploreMoments, RegionKey, ExploreMoment } from '@/hooks/useExploreMoments';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import HLSPlayer from '@/media/HLSPlayer';

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
  isInViewport?: boolean;
}> = ({ moment, index, onClick, isInViewport = false }) => {
  const [imageError, setImageError] = useState(false);
  const isVideo = moment.media_type === 'video';
  const gradientIndex = index % GRADIENTS.length;
  
  // Use thumbnail_url, falling back to media_url for images, then gradient
  const imageUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : null);
  const showGradient = !imageUrl || imageError;
  
  // Video source - use media_url for video playback
  const videoSrc = moment.media_url;

  return (
    <button
      onClick={onClick}
      className="group text-left"
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow">
        {/* Video with HLSPlayer autoplay */}
        {isVideo && videoSrc ? (
          <HLSPlayer
            src={videoSrc}
            poster={moment.thumbnail_url || undefined}
            mediaId={moment.moment_id}
            autoplay={isInViewport}
            muted
            loop
            className="absolute inset-0 w-full h-full object-cover"
            aspectRatio="auto"
            objectFit="cover"
          />
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
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
  
  // Track which items are in viewport for autoplay
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  
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
        {moments.map((moment, index) => (
          <MomentTileWithVisibility
            key={moment.moment_id}
            moment={moment}
            index={index}
            onClick={() => handleMomentClick(moment)}
          />
        ))}
        
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

// Wrapper component that tracks visibility for autoplay
const MomentTileWithVisibility: React.FC<{
  moment: ExploreMoment;
  index: number;
  onClick: () => void;
}> = ({ moment, index, onClick }) => {
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  return (
    <div ref={ref}>
      <MomentTile
        moment={moment}
        index={index}
        onClick={onClick}
        isInViewport={inView}
      />
    </div>
  );
};

export default DiscoverMomentsGrid;
