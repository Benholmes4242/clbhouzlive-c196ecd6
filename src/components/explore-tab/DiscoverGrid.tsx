/**
 * DiscoverGrid - 2-column mixed layout for Explore page
 * 
 * TikTok-Level Implementation:
 * - UnifiedVideoPlayer with source stability + HLS pool promotion
 * - 50% start / 10% stop hysteresis for viewport-aware autoplay
 * - 150ms crossfade with ease-out
 * - Priority poster loading for first 6 items
 * - 3s first-frame fallback timeout
 * - Adaptive prefetch with scroll velocity tracking
 * - GPU-accelerated tile transitions
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Compass, Loader2, MapPin } from 'lucide-react';
import { ExploreMoment, ExploreFilters, RegionKey, useInfiniteExploreMoments } from '@/hooks/useExploreMoments';
import { UnifiedVideoPlayer } from '@/media/components/UnifiedVideoPlayer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
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
  return false;
};

// 3s first-frame fallback
const FIRST_FRAME_FALLBACK_MS = 3000;

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

// Skeleton for Discover Explore grid - Watch tab standard left-to-right shimmer
function DiscoverGridSkeleton() {
  return (
    <div className="px-1">
      <div className="grid grid-cols-2 gap-0.5">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div 
            key={i}
            className={cn(
              "bg-gray-200 overflow-hidden",
              i === 2 || i === 5 ? "col-span-2 aspect-video" : "aspect-[3/4]"
            )}
          >
            <div 
              className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Portrait Tile Component - TikTok-Level Implementation
const PortraitTile = React.memo(function PortraitTile({ 
  moment,
  index,
  onClick,
}: { 
  moment: ExploreMoment;
  index: number;
  onClick: () => void;
}) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const hasReportedReadyRef = useRef(false);
  const firstFrameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // P0: 50% start / 10% stop hysteresis
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          setIsVisible(true);
        } else if (!entry.isIntersecting || entry.intersectionRatio < 0.1) {
          setIsVisible(false);
        }
      },
      { threshold: [0.1, 0.5] }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  const isVideo = moment.media_type === 'video';
  const isPriorityItem = index < 6;
  
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
    
    if (firstFrameTimeoutRef.current) {
      clearTimeout(firstFrameTimeoutRef.current);
    }
  }, [moment.moment_id]);

  // P1: 3s first-frame fallback timeout
  useEffect(() => {
    if (isVisible && hlsUrl && !isVideoReady) {
      firstFrameTimeoutRef.current = setTimeout(() => {
        if (!hasReportedReadyRef.current) {
          hasReportedReadyRef.current = true;
          setIsVideoReady(true);
        }
      }, FIRST_FRAME_FALLBACK_MS);
      
      return () => {
        if (firstFrameTimeoutRef.current) {
          clearTimeout(firstFrameTimeoutRef.current);
        }
      };
    }
  }, [isVisible, hlsUrl, isVideoReady]);

  // UNIFIED: Use canplaythrough for buffered ready state
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
      
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
      }
    }
  }, []);
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden bg-black will-change-transform"
      style={{ aspectRatio: '3/4' }}
      onClick={onClick}
      aria-busy={isVideo && !isVideoReady}
    >
      {/* Poster-first: always show thumbnail immediately */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading={isPriorityItem ? "eager" : "lazy"}
          fetchPriority={isPriorityItem ? "high" : "auto"}
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {isVideo && hlsUrl ? (
        <>
          {/* TikTok-Level: UnifiedVideoPlayer with 150ms crossfade */}
          <div className={cn(
            "absolute inset-0 motion-safe:transition-opacity motion-safe:duration-150 motion-safe:ease-out",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <UnifiedVideoPlayer
              src={hlsUrl}
              posterUrl={posterUrl || undefined}
              autoplay={isVisible}
              muted
              loop
              preload="auto"
              showMuteButton={false}
              showPlayButton={false}
              scrubber={false}
              mediaId={streamId || undefined}
              className="w-full h-full object-cover"
              onCanPlayThrough={handleCanPlayThrough}
            />
          </div>
          
          {/* Skeleton - Watch tab standard left-to-right shimmer */}
          {!isVideoReady && !posterUrl && (
            <div 
              className="absolute inset-0 bg-gray-200 overflow-hidden"
              aria-busy="true"
            >
              <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
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
    prevProps.index === nextProps.index
  );
});

// Landscape Tile Component - TikTok-Level Implementation
const LandscapeTile = React.memo(function LandscapeTile({ 
  moment,
  index,
  onClick,
}: { 
  moment: ExploreMoment;
  index: number;
  onClick: () => void;
}) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const hasReportedReadyRef = useRef(false);
  const firstFrameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // P0: 50% start / 10% stop hysteresis
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          setIsVisible(true);
        } else if (!entry.isIntersecting || entry.intersectionRatio < 0.1) {
          setIsVisible(false);
        }
      },
      { threshold: [0.1, 0.5] }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  const isVideo = moment.media_type === 'video';
  const isPriorityItem = index < 6;
  
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
    
    if (firstFrameTimeoutRef.current) {
      clearTimeout(firstFrameTimeoutRef.current);
    }
  }, [moment.moment_id]);

  // P1: 3s first-frame fallback timeout
  useEffect(() => {
    if (isVisible && hlsUrl && !isVideoReady) {
      firstFrameTimeoutRef.current = setTimeout(() => {
        if (!hasReportedReadyRef.current) {
          hasReportedReadyRef.current = true;
          setIsVideoReady(true);
        }
      }, FIRST_FRAME_FALLBACK_MS);
      
      return () => {
        if (firstFrameTimeoutRef.current) {
          clearTimeout(firstFrameTimeoutRef.current);
        }
      };
    }
  }, [isVisible, hlsUrl, isVideoReady]);

  // UNIFIED: Use canplaythrough for buffered ready state
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
      
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
      }
    }
  }, []);
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden bg-black will-change-transform"
      style={{ aspectRatio: String(aspectRatio) }}
      onClick={onClick}
      aria-busy={isVideo && !isVideoReady}
    >
      {/* Poster-first: always show thumbnail immediately */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading={isPriorityItem ? "eager" : "lazy"}
          fetchPriority={isPriorityItem ? "high" : "auto"}
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {isVideo && hlsUrl ? (
        <>
          {/* TikTok-Level: UnifiedVideoPlayer with 150ms crossfade */}
          <div className={cn(
            "absolute inset-0 motion-safe:transition-opacity motion-safe:duration-150 motion-safe:ease-out",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <UnifiedVideoPlayer
              src={hlsUrl}
              posterUrl={posterUrl || undefined}
              autoplay={isVisible}
              muted
              loop
              preload="auto"
              showMuteButton={false}
              showPlayButton={false}
              scrubber={false}
              mediaId={streamId || undefined}
              className="w-full h-full object-cover"
              onCanPlayThrough={handleCanPlayThrough}
            />
          </div>
          
          {/* Skeleton - Watch tab standard left-to-right shimmer */}
          {!isVideoReady && !posterUrl && (
            <div 
              className="absolute inset-0 bg-gray-200 overflow-hidden"
              aria-busy="true"
            >
              <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
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
    prevProps.moment.aspect_ratio === nextProps.moment.aspect_ratio &&
    prevProps.index === nextProps.index
  );
});

export function DiscoverGrid({ 
  regionKey: regionKeyProp,
  filters, 
  className,
  onMomentClick,
}: DiscoverGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastPrefetchedIndex = useRef(-1);
  
  // TikTok-level: Adaptive prefetch based on network/battery/scroll
  const { config: prefetchConfig, onIndexChange } = useAdaptivePrefetch();
  
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

  // TikTok-level: Adaptive prefetch on mount using dynamic window
  useEffect(() => {
    if (allMoments.length === 0 || !prefetchConfig.preloadManifests) return;
    
    // Preload initial batch based on adaptive config
    const videoMoments = allMoments
      .slice(0, Math.min(prefetchConfig.prefetchAhead, allMoments.length))
      .filter(m => m.media_type === 'video' && m.media_url);
    
    videoMoments.forEach((moment) => {
      const uid = uidFromNode({ src: moment.media_url! });
      if (uid) {
        const hlsUrl = generateStreamHlsUrl(uid);
        preloadHlsManifest(hlsUrl);
      }
    });
    
    lastPrefetchedIndex.current = Math.min(prefetchConfig.prefetchAhead - 1, allMoments.length - 1);
  }, [allMoments, prefetchConfig.prefetchAhead, prefetchConfig.preloadManifests]);

  // Intersection observer for infinite scroll with adaptive prefetch
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
          
          // Notify adaptive prefetch of scroll activity
          onIndexChange();
          
          // Prefetch next batch based on adaptive config
          if (prefetchConfig.preloadManifests) {
            const currentLength = allMoments.length;
            const prefetchStart = lastPrefetchedIndex.current + 1;
            const prefetchEnd = Math.min(
              prefetchStart + prefetchConfig.prefetchAhead,
              currentLength
            );
            
            if (prefetchEnd > prefetchStart) {
              const upcomingVideos = allMoments
                .slice(prefetchStart, prefetchEnd)
                .filter(m => m.media_type === 'video' && m.media_url);
              
              upcomingVideos.forEach((moment) => {
                const uid = uidFromNode({ src: moment.media_url! });
                if (uid) {
                  const hlsUrl = generateStreamHlsUrl(uid);
                  preloadHlsManifest(hlsUrl);
                }
              });
              
              lastPrefetchedIndex.current = prefetchEnd - 1;
            }
          }
        }
      },
      { rootMargin: '0px' } // Watch tab standard: trigger at bottom
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, allMoments, prefetchConfig, onIndexChange]);

  // Paced loading state (Watch tab standard)
  const MIN_LOADING_DISPLAY_MS = 600;
  const loadStartTimeRef = useRef<number>(0);
  const [isPacingDelay, setIsPacingDelay] = useState(false);
  const prevMomentsCountRef = useRef(allMoments.length);
  const [newlyLoadedStartIndex, setNewlyLoadedStartIndex] = useState<number | null>(null);
  const loadingMoreRef = useRef(false);

  // Handle triggering load with timestamp
  const handleLoadTrigger = useCallback(() => {
    if (!loadingMoreRef.current && hasNextPage && !isFetchingNextPage) {
      loadingMoreRef.current = true;
      loadStartTimeRef.current = Date.now();
      fetchNextPage();
      setTimeout(() => { loadingMoreRef.current = false; }, 1000);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle paced loading when new moments arrive
  useEffect(() => {
    const prevCount = prevMomentsCountRef.current;
    const newCount = allMoments.length;
    
    if (newCount > prevCount && loadStartTimeRef.current > 0) {
      const elapsed = Date.now() - loadStartTimeRef.current;
      const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed);
      
      if (remaining > 0) {
        setIsPacingDelay(true);
        const timer = setTimeout(() => {
          setNewlyLoadedStartIndex(prevCount);
          setIsPacingDelay(false);
          loadStartTimeRef.current = 0;
          setTimeout(() => setNewlyLoadedStartIndex(null), 500);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setNewlyLoadedStartIndex(prevCount);
        loadStartTimeRef.current = 0;
        setTimeout(() => setNewlyLoadedStartIndex(null), 500);
      }
    }
    
    prevMomentsCountRef.current = newCount;
  }, [allMoments.length]);

  // Show loading indicator
  const showBottomLoader = isFetchingNextPage || isPacingDelay;

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
            const isNewlyLoaded = newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex;
            const entranceDelay = isNewlyLoaded ? (index - newlyLoadedStartIndex) * 30 : 0;
            
            const tileWrapper = (children: React.ReactNode) => (
              <div
                key={moment.moment_id}
                className={cn(
                  isLandscape(moment) && "col-span-2",
                  isNewlyLoaded && "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:fill-mode-backwards"
                )}
                style={isNewlyLoaded ? { animationDelay: `${entranceDelay}ms` } : undefined}
              >
                {children}
              </div>
            );
            
            if (isLandscape(moment)) {
              return tileWrapper(
                <LandscapeTile
                  moment={moment}
                  index={index}
                  onClick={() => handleMomentClick(moment, index)}
                />
              );
            }
            
            return tileWrapper(
              <PortraitTile
                moment={moment}
                index={index}
                onClick={() => handleMomentClick(moment, index)}
              />
            );
          })}
        </div>
        
        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="h-4" />
        )}
        
        {/* Orange brand spinner for paced infinite scroll (Watch tab standard) */}
        {showBottomLoader && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        
        {/* End state */}
        {!hasNextPage && allMoments.length > 0 && !isLoading && !showBottomLoader && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <div className="w-12 h-0.5 bg-muted/40 rounded-full mb-3" />
            <p className="text-xs font-medium">You've seen everything</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscoverGrid;
