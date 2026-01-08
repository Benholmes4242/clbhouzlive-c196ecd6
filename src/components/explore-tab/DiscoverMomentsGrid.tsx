/**
 * DiscoverMomentsGrid - Grid displaying explore_moments
 * 
 * Data source: unified explore_moments view
 * Initial render: 20 items, then infinite scroll in batches of 20
 * Order: latest first (created_at desc)
 */

import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useInfiniteExploreMoments, RegionKey, ExploreMoment } from '@/hooks/useExploreMoments';
import { Play, MapPin } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

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

export const DiscoverMomentsGrid: React.FC<DiscoverMomentsGridProps> = ({
  regionKey,
  className,
  onMomentClick,
}) => {
  const navigate = useNavigate();
  const loadMoreRef = useRef(false);
  
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

  // Flatten all pages into single array
  const moments = useMemo(() => {
    return data?.pages.flatMap(page => page.moments) || [];
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

  // Loading state
  if (isLoading && moments.length === 0) {
    return (
      <div className={cn("py-6", className)}>
        <div className="px-5 mb-4">
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
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
          const isVideo = moment.media_type === 'video';
          const gradientIndex = index % GRADIENTS.length;

          return (
            <button
              key={moment.moment_id}
              onClick={() => handleMomentClick(moment)}
              className="group text-left"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-alt">
                {/* Background image or gradient */}
                {moment.thumbnail_url ? (
                  <img 
                    src={moment.thumbnail_url} 
                    alt="Moment"
                    loading="lazy"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Video indicator */}
                {isVideo && (
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                )}
                
                {/* Source type badge */}
                <div className="absolute top-3 left-3">
                  <div className="px-2 py-0.5 bg-black/50 rounded-full text-xs text-white/80">
                    {moment.source_type === 'post' ? 'Post' : 'Review'}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Load more sentinel */}
      <div ref={sentinelRef} className="h-20 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
};

export default DiscoverMomentsGrid;
