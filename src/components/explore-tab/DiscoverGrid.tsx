/**
 * DiscoverGrid - 2-column mixed layout for Explore page
 * 
 * Matches ShortsGrid from profile pages exactly:
 * - Portrait: 2-column, 3:4 aspect ratio
 * - Landscape: Full width (spans both columns), adaptive aspect ratio
 * - gap-0.5 (2px gap)
 * - px-1 padding
 * - Autoplay on visible videos
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Compass, Loader2, MapPin } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { ExploreMoment, ExploreFilters, RegionKey, useInfiniteExploreMoments } from '@/hooks/useExploreMoments';
import { HLSPlayer, HLSPlayerRef } from '@/media';

interface DiscoverGridProps {
  filters?: ExploreFilters;
  className?: string;
  onMomentClick?: (moment: ExploreMoment, index: number, allMoments: ExploreMoment[]) => void;
}

// Helper to determine if moment is landscape
const isLandscape = (moment: ExploreMoment): boolean => {
  if (moment.aspect_ratio != null) {
    return moment.aspect_ratio >= 1;
  }
  // Default to portrait if no aspect ratio data
  return false;
};

// Course tag pill - centered at top, matches profile header pill shape
function CourseTagPill({ courseName }: { courseName: string }) {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 max-w-[calc(100%-16px)]">
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full text-[11px] font-medium text-white max-w-full">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{courseName}</span>
      </span>
    </div>
  );
}

// Portrait Tile Component - matches ShortVideoTile exactly
function PortraitTile({ 
  moment, 
  onClick 
}: { 
  moment: ExploreMoment; 
  onClick: () => void;
}) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const isVideo = moment.media_type === 'video';
  const hlsUrl = isVideo ? moment.media_url : null;
  const posterUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : undefined);
  
  // Visibility detection for autoplay
  useEffect(() => {
    if (!containerRef.current || !isVideo) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.4);
      },
      { threshold: [0.25, 0.4] }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVideo]);
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden bg-black"
      style={{ aspectRatio: '3/4' }}
      onClick={onClick}
    >
      {isVideo && hlsUrl ? (
        <HLSPlayer
          ref={playerRef}
          src={hlsUrl}
          poster={posterUrl}
          autoplay={isVisible}
          muted
          loop
          externallyManaged
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={posterUrl || ''}
          alt=""
          className="w-full h-full object-cover"
        />
      )}
      
      {/* Course tag pill - centered at top */}
      {moment.course_name && (
        <CourseTagPill courseName={moment.course_name} />
      )}
    </div>
  );
}

// Landscape Tile Component - matches LandscapeShortTile exactly
function LandscapeTile({ 
  moment, 
  onClick 
}: { 
  moment: ExploreMoment; 
  onClick: () => void;
}) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const isVideo = moment.media_type === 'video';
  
  // Calculate aspect ratio - cap at 16:9 for very wide videos
  const rawAspectRatio = moment.aspect_ratio || 16/9;
  const aspectRatio = Math.min(rawAspectRatio, 16/9);
  
  const hlsUrl = isVideo ? moment.media_url : null;
  const posterUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : undefined);
  
  // Visibility detection for autoplay
  useEffect(() => {
    if (!containerRef.current || !isVideo) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.4);
      },
      { threshold: [0.25, 0.4] }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVideo]);
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden bg-black"
      style={{ aspectRatio: String(aspectRatio) }}
      onClick={onClick}
    >
      {isVideo && hlsUrl ? (
        <HLSPlayer
          ref={playerRef}
          src={hlsUrl}
          poster={posterUrl}
          autoplay={isVisible}
          muted
          loop
          externallyManaged
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={posterUrl || ''}
          alt=""
          className="w-full h-full object-cover"
        />
      )}
      
      {/* Course tag pill - centered at top */}
      {moment.course_name && (
        <CourseTagPill courseName={moment.course_name} />
      )}
    </div>
  );
}

export function DiscoverGrid({ 
  filters, 
  className,
  onMomentClick,
}: DiscoverGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
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
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleMomentClick = useCallback((moment: ExploreMoment, index: number) => {
    onMomentClick?.(moment, index, allMoments);
  }, [onMomentClick, allMoments]);

  // Empty state
  if (!isLoading && allMoments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-foreground font-semibold mb-1">Nothing to explore yet</p>
        <p className="text-muted-foreground text-sm text-center max-w-[280px]">
          Check back soon for golf moments and course content
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Matches ShortsGrid: px-1 padding */}
      <div className="px-1">
        {/* 2-column grid - landscape videos span both columns */}
        <div className="grid grid-cols-2 gap-0.5">
          {allMoments.map((moment, index) => {
            if (isLandscape(moment)) {
              // Landscape: full width (spans 2 columns)
              return (
                <div key={moment.moment_id} className="col-span-2">
                  <LandscapeTile
                    moment={moment}
                    onClick={() => handleMomentClick(moment, index)}
                  />
                </div>
              );
            }
            
            // Portrait: regular 2-column grid item
            return (
              <PortraitTile
                key={moment.moment_id}
                moment={moment}
                onClick={() => handleMomentClick(moment, index)}
              />
            );
          })}
        </div>
        
        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 animate-spin text-[#64748b]" />
            )}
          </div>
        )}
        
        {/* End state */}
        {!hasNextPage && allMoments.length > 0 && !isLoading && !isFetchingNextPage && (
          <div className="text-center py-8 text-[#64748b] text-sm">
            You've seen everything
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscoverGrid;
