/**
 * DiscoverGrid - 2-column mixed layout for Explore page
 * 
 * Matches ShortsGrid from profile pages exactly:
 * - Portrait: 2-column, 3:4 aspect ratio
 * - Landscape: Full width (spans both columns), adaptive aspect ratio
 * - gap-0.5 (2px gap)
 * - px-1 padding
 * - Autoplay on visible videos
 * - Full prefetch system with ready queue and LoadingBoundary
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Compass, Loader2, MapPin } from 'lucide-react';
import { ExploreMoment, ExploreFilters, RegionKey, useInfiniteExploreMoments } from '@/hooks/useExploreMoments';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { cn } from '@/lib/utils';
interface DiscoverGridProps {
  regionKey?: RegionKey;
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

// Skeleton for Discover Explore grid
function DiscoverGridSkeleton() {
  return (
    <div className="px-1">
      <div className="grid grid-cols-2 gap-0.5">
        {/* Mix of portrait and landscape skeletons */}
        <div className="aspect-[3/4] bg-zinc-800 animate-pulse" />
        <div className="aspect-[3/4] bg-zinc-800 animate-pulse" />
        <div className="col-span-2 aspect-video bg-zinc-800 animate-pulse" />
        <div className="aspect-[3/4] bg-zinc-800 animate-pulse" />
        <div className="aspect-[3/4] bg-zinc-800 animate-pulse" />
        <div className="col-span-2 aspect-video bg-zinc-800 animate-pulse" />
        <div className="aspect-[3/4] bg-zinc-800 animate-pulse" />
        <div className="aspect-[3/4] bg-zinc-800 animate-pulse" />
      </div>
    </div>
  );
}

// Portrait Tile Component - paused-video-first architecture
const PortraitTile = React.memo(function PortraitTile({ 
  moment, 
  onClick,
  isVideoReady = true,
  onReady,
}: { 
  moment: ExploreMoment; 
  onClick: () => void;
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasReportedReadyRef = useRef(false);
  
  const isVideo = moment.media_type === 'video';
  const posterUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : undefined);
  
  // Get HLS URL for videos
  const hlsUrl = useMemo(() => {
    if (!isVideo || !moment.media_url) return null;
    const streamId = uidFromNode({ src: moment.media_url });
    return streamId ? generateStreamHlsUrl(streamId) : null;
  }, [isVideo, moment.media_url]);
  
  // Reset ready flag when moment changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [moment.moment_id]);

  // Handle video ready (buffered for smooth playback)
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      console.log(`[PortraitTile] Video ${moment.moment_id.substring(0, 8)} ready (canplaythrough)`);
      onReady?.(moment.moment_id);
    }
  }, [moment.moment_id, isVideo, onReady]);
  
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
        <>
          {/* HLSPlayer - ALWAYS mounted, shows paused first frame */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-200",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <HLSPlayer
              ref={playerRef}
              src={hlsUrl}
              autoplay={isVisible}
              muted
              loop
              externallyManaged
              className="w-full h-full object-cover"
              onCanPlayThrough={handleCanPlayThrough}
            />
          </div>
          
          {/* Skeleton - only before video is buffered */}
          {!isVideoReady && (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          )}
        </>
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
}, (prevProps, nextProps) => {
  return (
    prevProps.moment.moment_id === nextProps.moment.moment_id &&
    prevProps.moment.media_url === nextProps.moment.media_url &&
    prevProps.moment.thumbnail_url === nextProps.moment.thumbnail_url &&
    prevProps.moment.course_name === nextProps.moment.course_name &&
    prevProps.moment.likes_count === nextProps.moment.likes_count &&
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});

// Landscape Tile Component - paused-video-first architecture
const LandscapeTile = React.memo(function LandscapeTile({ 
  moment, 
  onClick,
  isVideoReady = true,
  onReady,
}: { 
  moment: ExploreMoment; 
  onClick: () => void;
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasReportedReadyRef = useRef(false);
  
  const isVideo = moment.media_type === 'video';
  
  // Calculate aspect ratio - cap at 16:9 for very wide videos
  const rawAspectRatio = moment.aspect_ratio || 16/9;
  const aspectRatio = Math.min(rawAspectRatio, 16/9);
  
  const posterUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : undefined);
  
  // Get HLS URL for videos
  const hlsUrl = useMemo(() => {
    if (!isVideo || !moment.media_url) return null;
    const streamId = uidFromNode({ src: moment.media_url });
    return streamId ? generateStreamHlsUrl(streamId) : null;
  }, [isVideo, moment.media_url]);
  
  // Reset ready flag when moment changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [moment.moment_id]);

  // Handle video ready
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      console.log(`[LandscapeTile] Video ${moment.moment_id.substring(0, 8)} ready (canplaythrough)`);
      onReady?.(moment.moment_id);
    }
  }, [moment.moment_id, isVideo, onReady]);
  
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
        <>
          {/* HLSPlayer - ALWAYS mounted, shows paused first frame */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-200",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <HLSPlayer
              ref={playerRef}
              src={hlsUrl}
              autoplay={isVisible}
              muted
              loop
              externallyManaged
              className="w-full h-full object-cover"
              onCanPlayThrough={handleCanPlayThrough}
            />
          </div>
          
          {/* Skeleton - only before video is buffered */}
          {!isVideoReady && (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          )}
        </>
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
}, (prevProps, nextProps) => {
  return (
    prevProps.moment.moment_id === nextProps.moment.moment_id &&
    prevProps.moment.media_url === nextProps.moment.media_url &&
    prevProps.moment.thumbnail_url === nextProps.moment.thumbnail_url &&
    prevProps.moment.course_name === nextProps.moment.course_name &&
    prevProps.moment.aspect_ratio === nextProps.moment.aspect_ratio &&
    prevProps.moment.likes_count === nextProps.moment.likes_count &&
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});

const MINIMUM_READY_COUNT = 4;

export function DiscoverGrid({ 
  regionKey: regionKeyProp,
  filters, 
  className,
  onMomentClick,
}: DiscoverGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Use prop regionKey if provided, otherwise derive from filters
  const regionKey = regionKeyProp || (filters?.region && filters.region !== 'all' 
    ? filters.region as RegionKey 
    : undefined);

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

  // Video ready queue integration (8 ahead, 4 behind for grid layout)
  const {
    initiatePrefetch,
    markReady,
    isReady,
    readySet,
  } = useVideoReadyQueue({
    prefetchAhead: 8,
    prefetchBehind: 4,
    onVideoReady: (id) => console.log(`[DiscoverGrid] Video ${id.substring(0, 8)} marked ready`),
  });

  // Callback ref to prevent stale closures
  const markReadyRef = useRef(markReady);
  markReadyRef.current = markReady;

  // CRITICAL: Use stream UIDs for cache consistency
  const videoIds = useMemo(() => {
    return allMoments
      .filter(m => m.media_type === 'video')
      .map(moment => {
        const streamId = uidFromNode({ src: moment.media_url });
        return streamId || moment.moment_id;
      });
  }, [allMoments]);

  // Create video URL map for HLS prefetching (keyed by stream UID)
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    allMoments.forEach(moment => {
      if (moment.media_type === 'video' && moment.media_url) {
        const streamId = uidFromNode({ src: moment.media_url });
        if (streamId) {
          map.set(streamId, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [allMoments]);

  // Trigger prefetch when items load
  useEffect(() => {
    if (videoIds.length > 0 && videoUrlMap.size > 0) {
      initiatePrefetch(videoIds, 0, videoUrlMap);
    }
  }, [videoIds, videoUrlMap, initiatePrefetch]);

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

  // Check if ready - use readySet.size for count
  const readyCount = readySet.size;
  const isGridReady = readyCount >= Math.min(MINIMUM_READY_COUNT, videoIds.length) || videoIds.length === 0 || !isLoading;

  // Show skeleton while loading initial videos
  if (!isGridReady && isLoading) {
    return (
      <div className={className}>
        <DiscoverGridSkeleton />
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
            // CRITICAL: Use stream UID for cache lookup
            const momentIsVideoReady = moment.media_type === 'video' ? isReady(uidFromNode({ src: moment.media_url }) || moment.moment_id) : true;
            
            if (isLandscape(moment)) {
              // Landscape: full width (spans 2 columns)
              return (
                <div key={moment.moment_id} className="col-span-2">
                  <LandscapeTile
                    moment={moment}
                    isVideoReady={momentIsVideoReady}
                    onReady={(id) => markReadyRef.current(id)}
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
                isVideoReady={momentIsVideoReady}
                onReady={(id) => markReadyRef.current(id)}
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
