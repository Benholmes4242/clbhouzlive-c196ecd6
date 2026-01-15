/**
 * DiscoverGrid - Simplified 2-column grid for Explore page
 * 
 * Matches Watch tab grid structure:
 * - 2 columns
 * - 2px gap
 * - Portrait cards (3:4 aspect ratio)
 * - Course tag overlay on each card
 */

import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { DiscoverCard } from './DiscoverCard';
import { ExploreMoment, ExploreFilters, RegionKey, useInfiniteExploreMoments } from '@/hooks/useExploreMoments';

interface DiscoverGridProps {
  filters?: ExploreFilters;
  className?: string;
  onMomentClick?: (moment: ExploreMoment, index: number, allMoments: ExploreMoment[]) => void;
  showHeader?: boolean;
}

export function DiscoverGrid({ 
  filters, 
  className,
  onMomentClick,
  showHeader = false 
}: DiscoverGridProps) {
  // Derive regionKey from filters if set
  const regionKey = filters?.region && filters.region !== 'all' 
    ? filters.region as RegionKey 
    : undefined;

  const { 
    data, 
    isLoading, 
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage 
  } = useInfiniteExploreMoments(regionKey, filters);

  // Flatten all pages into single array
  const allMoments = useMemo(() => {
    return data?.pages.flatMap(page => page.moments) ?? [];
  }, [data]);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const handleCardClick = useCallback((moment: ExploreMoment, index: number) => {
    onMomentClick?.(moment, index, allMoments);
  }, [onMomentClick, allMoments]);

  // Empty state
  if (!isLoading && allMoments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-[#F8FAFC]">
        {/* Icon in gradient circle */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
          <Compass className="w-7 h-7 text-[#64748b]" />
        </div>
        
        {/* Title */}
        <h3 className="text-base font-semibold text-[#1e293b] mb-1 text-center">
          Nothing to explore yet
        </h3>
        
        {/* Description */}
        <p className="text-sm text-[#64748b] text-center max-w-[280px]">
          Check back soon for golf moments and course content.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Simple 2-column grid - matches Watch tab */}
      <div className="grid grid-cols-2 gap-[2px] bg-[#e2e8f0]">
        {allMoments.map((moment, index) => (
          <motion.div
            key={moment.moment_id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
          >
            <DiscoverCard 
              moment={moment} 
              onClick={() => handleCardClick(moment, index)}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Loading skeletons */}
      {(isLoading || isFetchingNextPage) && (
        <div className="grid grid-cols-2 gap-[2px] bg-[#e2e8f0]">
          {[...Array(4)].map((_, i) => (
            <div 
              key={`skeleton-${i}`} 
              className="aspect-[3/4] bg-[#e2e8f0] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="h-4" />
      )}
    </div>
  );
}

export default DiscoverGrid;
