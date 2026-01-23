/**
 * DiscoverGrid - 2-column mixed layout for Explore page
 * 
 * UNIFIED WITH CLUBHOUSE: Uses the exact same video wiring pattern as
 * ClubhouseVerticalGrid for consistent autoplay behavior.
 * 
 * Features:
 * - Portrait: 2-column, 3:4 aspect ratio
 * - Landscape: Full width (spans both columns), adaptive aspect ratio
 * - gap-0.5 (2px gap)
 * - px-1 padding
 * - Direct visibility-based autoplay via IntersectionObserver
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Compass, Loader2, MapPin } from 'lucide-react';
import { ExploreMoment, ExploreFilters, RegionKey, useInfiniteExploreMoments } from '@/hooks/useExploreMoments';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import { cn } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';

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
  return false;
};

// Course tag pill - centered at top
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

// Portrait Tile Component - UNIFIED with Clubhouse pattern
const PortraitTile = React.memo(function PortraitTile({ 
  moment, 
  onClick,
}: { 
  moment: ExploreMoment; 
  onClick: () => void;
}) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hasReportedReadyRef = useRef(false);
  
  // UNIFIED: Visibility-based autoplay via IntersectionObserver
  const { ref: containerRef, inView: isVisible } = useInView({
    threshold: 0.4, // Play when 40% visible (matches Clubhouse)
    triggerOnce: false,
  });
  
  const isVideo = moment.media_type === 'video';
  
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
    
    const generatedPosterUrl = generateStreamThumbnailUrl(extractedStreamId, { height: 800, fit: 'cover' });
    const finalPosterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) 
      ? generatedPosterUrl 
      : moment.thumbnail_url;
    
    return {
      hlsUrl: generateStreamHlsUrl(extractedStreamId),
      posterUrl: finalPosterUrl,
      streamId: extractedStreamId,
    };
  }, [isVideo, moment.media_url, moment.thumbnail_url, moment.media_type]);
  
  // Reset ready flag when moment changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
  }, [moment.moment_id]);

  // UNIFIED: Use canplaythrough for buffered ready state
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
    }
  }, []);
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden bg-black"
      style={{ aspectRatio: '3/4' }}
      onClick={onClick}
    >
      {/* Poster-first: always show thumbnail immediately */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {isVideo && hlsUrl ? (
        <>
          {/* 
            UNIFIED WITH CLUBHOUSE: HLSPlayer uses same props as Clubhouse VideoWithAutoplay.
            - managedByMediaRuntime={false} for direct browser-led autoplay
            - externallyManaged={false} for HLS.js internal management
            - autoplay based on visibility
            - preload="auto" for instant buffering
          */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-200",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <HLSPlayer
              ref={playerRef}
              src={hlsUrl}
              posterUrl={posterUrl || undefined}
              autoplay={isVisible}
              muted
              loop
              preload="auto"
              showMuteButton={false}
              showPlayButton={false}
              showScrubber={false}
              managedByMediaRuntime={false}
              externallyManaged={false}
              mediaId={streamId || undefined}
              className="w-full h-full object-cover"
              onCanPlayThrough={handleCanPlayThrough}
            />
          </div>
          
          {/* Skeleton - only before video is buffered */}
          {!isVideoReady && !posterUrl && (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          )}
        </>
      ) : null}
      
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
    prevProps.moment.course_name === nextProps.moment.course_name
  );
});

// Landscape Tile Component - UNIFIED with Clubhouse pattern
const LandscapeTile = React.memo(function LandscapeTile({ 
  moment, 
  onClick,
}: { 
  moment: ExploreMoment; 
  onClick: () => void;
}) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hasReportedReadyRef = useRef(false);
  
  // UNIFIED: Visibility-based autoplay via IntersectionObserver
  const { ref: containerRef, inView: isVisible } = useInView({
    threshold: 0.4, // Play when 40% visible (matches Clubhouse)
    triggerOnce: false,
  });
  
  const isVideo = moment.media_type === 'video';
  
  // Calculate aspect ratio - cap at 16:9 for very wide videos
  const rawAspectRatio = moment.aspect_ratio || 16/9;
  const aspectRatio = Math.min(rawAspectRatio, 16/9);
  
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
    
    const generatedPosterUrl = generateStreamThumbnailUrl(extractedStreamId, { height: 720, fit: 'cover' });
    const finalPosterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) 
      ? generatedPosterUrl 
      : moment.thumbnail_url;
    
    return {
      hlsUrl: generateStreamHlsUrl(extractedStreamId),
      posterUrl: finalPosterUrl,
      streamId: extractedStreamId,
    };
  }, [isVideo, moment.media_url, moment.thumbnail_url, moment.media_type]);
  
  // Reset ready flag when moment changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
  }, [moment.moment_id]);

  // UNIFIED: Use canplaythrough for buffered ready state
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
    }
  }, []);
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden bg-black"
      style={{ aspectRatio: String(aspectRatio) }}
      onClick={onClick}
    >
      {/* Poster-first: always show thumbnail immediately */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {isVideo && hlsUrl ? (
        <>
          {/* 
            UNIFIED WITH CLUBHOUSE: HLSPlayer uses same props as Clubhouse VideoWithAutoplay.
            - managedByMediaRuntime={false} for direct browser-led autoplay
            - externallyManaged={false} for HLS.js internal management
            - autoplay based on visibility
            - preload="auto" for instant buffering
          */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-200",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <HLSPlayer
              ref={playerRef}
              src={hlsUrl}
              posterUrl={posterUrl || undefined}
              autoplay={isVisible}
              muted
              loop
              preload="auto"
              showMuteButton={false}
              showPlayButton={false}
              showScrubber={false}
              managedByMediaRuntime={false}
              externallyManaged={false}
              mediaId={streamId || undefined}
              className="w-full h-full object-cover"
              onCanPlayThrough={handleCanPlayThrough}
            />
          </div>
          
          {/* Skeleton - only before video is buffered */}
          {!isVideoReady && !posterUrl && (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          )}
        </>
      ) : null}
      
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
    prevProps.moment.aspect_ratio === nextProps.moment.aspect_ratio
  );
});

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

  // Show skeleton while loading initial data
  if (isLoading && allMoments.length === 0) {
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
