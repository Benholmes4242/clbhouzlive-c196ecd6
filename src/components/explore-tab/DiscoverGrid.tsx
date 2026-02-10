/**
 * DiscoverGrid - 2-column mixed layout for Explore page
 * 
 * Clubhouse-Parity Performance Fixes:
 * - Fix 1: Mount gating — only mount UVP within ±4 of viewport (caps HLS to ~9)
 * - Fix 2: MediaRuntime registration with surface="explore-grid" (MAX_CONCURRENT=2)
 * - Fix 3: Play-gated poster-to-video transition (onPlay, not canPlayThrough)
 * - Fix 4: Shimmer base layer + poster fade-in (no bg-black ever visible)
 * - Fix 5: Silent error handling — poster stays, no error chrome
 * - Fix 6: Video indicator — duration badge on video tiles
 * - Fix 7: GlobalAudioContext integration
 * - Fix 8: Poster preload links for first 4 tiles
 * - Fix 9: Preload attribute optimisation (metadata vs auto)
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Compass, Heart, Play } from 'lucide-react';
import { ExploreMoment, ExploreFilters, RegionKey, useInfiniteExploreMoments } from '@/hooks/useExploreMoments';
import { UnifiedVideoPlayer } from '@/media/components/UnifiedVideoPlayer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import ExploreErrorState from './ExploreErrorState';
import { cn } from '@/lib/utils';

// Format like count for display
function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

// Format duration for badge
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface DiscoverGridProps {
  regionKey?: RegionKey;
  filters?: ExploreFilters;
  className?: string;
  onMomentClick?: (moment: ExploreMoment, index: number, allMoments: ExploreMoment[]) => void;
}

// Helper to determine if moment is landscape
const isLandscape = (moment: ExploreMoment): boolean => {
  if (moment.aspect_ratio != null) return moment.aspect_ratio >= 1;
  return false;
};

const MOUNT_BUFFER = 4; // ±4 tiles from viewport centre

// Skeleton for Discover Explore grid
function DiscoverGridSkeleton() {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
    
  return (
    <div className="px-[3px]">
      <div className="grid grid-cols-2 gap-[3px]">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div 
            key={i}
            className={cn(
              "bg-muted/50 overflow-hidden",
              i === 2 || i === 5 ? "col-span-2 aspect-video" : "aspect-[3/4]",
              !prefersReducedMotion && "animate-shimmer-down"
            )}
            style={!prefersReducedMotion ? { animationDelay: `${i * 50}ms` } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ======================== Portrait Tile ========================
interface TileProps {
  moment: ExploreMoment;
  index: number;
  isLiked: boolean;
  shouldMountVideo: boolean;
  isGloballyMuted: boolean;
  onClick: () => void;
}

const PortraitTile = React.memo(function PortraitTile({ 
  moment, index, isLiked, shouldMountVideo, isGloballyMuted, onClick,
}: TileProps) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hasReportedReadyRef = useRef(false);
  const isVideoReadyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport hysteresis for autoplay
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) setIsVisible(true);
        else if (!entry.isIntersecting || entry.intersectionRatio < 0.1) setIsVisible(false);
      },
      { threshold: [0.1, 0.5] }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  const isVideo = moment.media_type === 'video';
  const isPriorityItem = index < 6;
  const likeCount = moment.likes_count || 0;
  const shouldAutoplay = isVisible && shouldMountVideo;
  
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
      ? generatedPosterUrl : moment.thumbnail_url;
    return {
      hlsUrl: generateStreamHlsUrl(extractedStreamId),
      posterUrl: finalPosterUrl,
      streamId: extractedStreamId,
    };
  }, [isVideo, moment.media_url, moment.thumbnail_url, moment.media_type]);
  
  // Reset when moment changes or unmounted
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
    setHasError(false);
    if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
  }, [moment.moment_id]);
  
  useEffect(() => {
    if (!shouldMountVideo) {
      hasReportedReadyRef.current = false;
      setIsVideoReady(false);
      if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
    }
  }, [shouldMountVideo]);
  
  // Fix 3: Play-gated transition
  const handlePlay = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      isVideoReadyTimerRef.current = setTimeout(() => {
        hasReportedReadyRef.current = true;
        setIsVideoReady(true);
      }, 100);
    }
  }, []);
  
  // Fix 5: Silent error handling
  const handleError = useCallback(() => {
    console.warn('[DiscoverGrid] Video error:', moment.moment_id);
    setHasError(true);
    setIsVideoReady(false);
  }, [moment.moment_id]);
  
  useEffect(() => {
    return () => { if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current); };
  }, []);
  
  const videoIsReady = isVideoReady && shouldAutoplay && shouldMountVideo && !hasError;
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden rounded-xl bg-muted will-change-transform"
      style={{ aspectRatio: '3/4' }}
      onClick={onClick}
      aria-busy={isVideo && !isVideoReady}
    >
      {/* Fix 4: Shimmer base layer */}
      <div className="absolute inset-0 bg-muted/50 animate-shimmer-down" />
      
      {/* Poster — fades in over shimmer */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover z-[1] transition-opacity duration-200",
            posterLoaded ? "opacity-100" : "opacity-0",
            videoIsReady && "!opacity-0 !duration-150"
          )}
          loading={isPriorityItem ? "eager" : "lazy"}
          fetchPriority={isPriorityItem ? "high" : "auto"}
          decoding="async"
          onLoad={() => setPosterLoaded(true)}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {/* Fix 1: Only mount player within buffer window */}
      {isVideo && hlsUrl && shouldMountVideo && !hasError && (
        <div className="absolute inset-0 z-[2]">
          <UnifiedVideoPlayer
            src={hlsUrl}
            posterUrl={posterUrl || undefined}
            autoplay={shouldAutoplay}
            muted={isGloballyMuted}
            loop
            preload={shouldAutoplay ? "auto" : "metadata"}
            showMuteButton={false}
            showPlayButton={false}
            scrubber={false}
            mediaId={streamId || undefined}
            className="w-full h-full object-cover"
            managedByMediaRuntime={true}
            surface="explore-grid"
            onPlay={handlePlay}
            onError={handleError}
          />
        </div>
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-10" />

      {/* Fix 6: Duration badge for video tiles — hidden when video plays */}
      {isVideo && moment.duration_seconds && !videoIsReady && (
        <div className="absolute bottom-2 right-2 z-30 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
          <span className="text-[10px] font-medium text-white tabular-nums">
            {formatDuration(moment.duration_seconds)}
          </span>
        </div>
      )}
      
      {/* Play icon fallback if no duration */}
      {isVideo && !moment.duration_seconds && !videoIsReady && (
        <div className="absolute bottom-2 left-2 z-30">
          <Play className="w-4 h-4 text-white/70 fill-white/70 drop-shadow-sm" />
        </div>
      )}

      {/* Like badge — only when user liked */}
      {isLiked && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/30 backdrop-blur-sm rounded-full z-30">
          <Heart className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
          {likeCount > 0 && (
            <span className="text-white text-xs font-medium">{formatCount(likeCount)}</span>
          )}
        </div>
      )}

      {/* Course name */}
      <div className="absolute bottom-2 left-2 right-2 z-20">
        {moment.course_name && (
          <p className="text-xs font-semibold text-white truncate">
            {moment.course_name}
          </p>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.moment.moment_id === next.moment.moment_id &&
    prev.moment.media_url === next.moment.media_url &&
    prev.moment.thumbnail_url === next.moment.thumbnail_url &&
    prev.moment.course_name === next.moment.course_name &&
    prev.moment.likes_count === next.moment.likes_count &&
    prev.moment.creator?.id === next.moment.creator?.id &&
    prev.isLiked === next.isLiked &&
    prev.index === next.index &&
    prev.shouldMountVideo === next.shouldMountVideo &&
    prev.isGloballyMuted === next.isGloballyMuted
  );
});

// ======================== Landscape Tile ========================
const LandscapeTile = React.memo(function LandscapeTile({ 
  moment, index, isLiked, shouldMountVideo, isGloballyMuted, onClick,
}: TileProps) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hasReportedReadyRef = useRef(false);
  const isVideoReadyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) setIsVisible(true);
        else if (!entry.isIntersecting || entry.intersectionRatio < 0.1) setIsVisible(false);
      },
      { threshold: [0.1, 0.5] }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  const isVideo = moment.media_type === 'video';
  const isPriorityItem = index < 6;
  const likeCount = moment.likes_count || 0;
  const creator = moment.creator;
  const rawAspectRatio = moment.aspect_ratio || 16/9;
  const aspectRatio = Math.min(rawAspectRatio, 16/9);
  const shouldAutoplay = isVisible && shouldMountVideo;
  
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
      ? generatedPosterUrl : moment.thumbnail_url;
    return {
      hlsUrl: generateStreamHlsUrl(extractedStreamId),
      posterUrl: finalPosterUrl,
      streamId: extractedStreamId,
    };
  }, [isVideo, moment.media_url, moment.thumbnail_url, moment.media_type]);
  
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
    setHasError(false);
    if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
  }, [moment.moment_id]);
  
  useEffect(() => {
    if (!shouldMountVideo) {
      hasReportedReadyRef.current = false;
      setIsVideoReady(false);
      if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
    }
  }, [shouldMountVideo]);
  
  const handlePlay = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      isVideoReadyTimerRef.current = setTimeout(() => {
        hasReportedReadyRef.current = true;
        setIsVideoReady(true);
      }, 100);
    }
  }, []);
  
  const handleError = useCallback(() => {
    console.warn('[DiscoverGrid] Video error:', moment.moment_id);
    setHasError(true);
    setIsVideoReady(false);
  }, [moment.moment_id]);
  
  useEffect(() => {
    return () => { if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current); };
  }, []);
  
  const videoIsReady = isVideoReady && shouldAutoplay && shouldMountVideo && !hasError;
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer overflow-hidden rounded-xl bg-muted will-change-transform"
      style={{ aspectRatio: String(aspectRatio) }}
      onClick={onClick}
      aria-busy={isVideo && !isVideoReady}
    >
      {/* Shimmer base layer */}
      <div className="absolute inset-0 bg-muted/50 animate-shimmer-down" />
      
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover z-[1] transition-opacity duration-200",
            posterLoaded ? "opacity-100" : "opacity-0",
            videoIsReady && "!opacity-0 !duration-150"
          )}
          loading={isPriorityItem ? "eager" : "lazy"}
          fetchPriority={isPriorityItem ? "high" : "auto"}
          decoding="async"
          onLoad={() => setPosterLoaded(true)}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {isVideo && hlsUrl && shouldMountVideo && !hasError && (
        <div className="absolute inset-0 z-[2]">
          <UnifiedVideoPlayer
            src={hlsUrl}
            posterUrl={posterUrl || undefined}
            autoplay={shouldAutoplay}
            muted={isGloballyMuted}
            loop
            preload={shouldAutoplay ? "auto" : "metadata"}
            showMuteButton={false}
            showPlayButton={false}
            scrubber={false}
            mediaId={streamId || undefined}
            className="w-full h-full object-cover"
            managedByMediaRuntime={true}
            surface="explore-grid"
            onPlay={handlePlay}
            onError={handleError}
          />
        </div>
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-10" />

      {/* Duration badge for video tiles */}
      {isVideo && moment.duration_seconds && !videoIsReady && (
        <div className="absolute bottom-2 right-2 z-30 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
          <span className="text-[10px] font-medium text-white tabular-nums">
            {formatDuration(moment.duration_seconds)}
          </span>
        </div>
      )}
      
      {isVideo && !moment.duration_seconds && !videoIsReady && (
        <div className="absolute bottom-2 left-2 z-30">
          <Play className="w-4 h-4 text-white/70 fill-white/70 drop-shadow-sm" />
        </div>
      )}

      {/* Like Count */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full z-30">
        <Heart className={cn("w-3 h-3", isLiked ? "fill-like text-like" : "text-white")} />
        {likeCount > 0 && (
          <span className="text-white text-[10px] font-medium">{formatCount(likeCount)}</span>
        )}
      </div>

      {/* Creator Name + Course */}
      <div className="absolute bottom-2 left-2 right-2 z-20">
        {(creator?.display_name || creator?.username) && (
          <p className="text-white text-sm font-medium truncate">
            {creator?.display_name || creator?.username}
          </p>
        )}
        {moment.course_name && (
          <p className="text-white/60 text-[10px] leading-tight truncate">
            {moment.course_name}
          </p>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.moment.moment_id === next.moment.moment_id &&
    prev.moment.media_url === next.moment.media_url &&
    prev.moment.thumbnail_url === next.moment.thumbnail_url &&
    prev.moment.course_name === next.moment.course_name &&
    prev.moment.likes_count === next.moment.likes_count &&
    prev.moment.creator?.id === next.moment.creator?.id &&
    prev.moment.aspect_ratio === next.moment.aspect_ratio &&
    prev.isLiked === next.isLiked &&
    prev.index === next.index &&
    prev.shouldMountVideo === next.shouldMountVideo &&
    prev.isGloballyMuted === next.isGloballyMuted
  );
});

// ======================== DiscoverGrid Container ========================
export function DiscoverGrid({ 
  regionKey: regionKeyProp,
  filters, 
  className,
  onMomentClick,
}: DiscoverGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastPrefetchedIndex = useRef(-1);
  const [currentViewportIndex, setCurrentViewportIndex] = useState(0);
  const tileRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Fix 7: GlobalAudioContext
  const { isGloballyMuted } = useGlobalAudio();
  
  // Adaptive prefetch
  const { config: prefetchConfig, onIndexChange } = useAdaptivePrefetch();
  
  const regionKey = regionKeyProp || (filters?.region && filters.region !== 'all' 
    ? filters.region as RegionKey 
    : undefined);

  const { 
    data, 
    isLoading,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteExploreMoments(regionKey, filters);

  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const allMoments = useMemo(() => {
    return data?.pages.flatMap(page => page.moments) ?? [];
  }, [data]);

  const sourceIds = useMemo(() => allMoments.map(m => m.source_id), [allMoments]);
  const { data: userLikedIds = new Set<string>() } = useQuery({
    queryKey: ['explore-grid-user-likes', userId, sourceIds],
    queryFn: async () => {
      if (!userId || sourceIds.length === 0) return new Set<string>();
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', sourceIds);
      return new Set((data || []).map(d => d.post_id));
    },
    enabled: !!userId && sourceIds.length > 0,
    staleTime: 60_000,
  });

  // Fix 1: Parent-level viewport tracker for mount gating
  useEffect(() => {
    if (allMoments.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.tileIndex);
            if (!isNaN(idx)) {
              setCurrentViewportIndex(prev => {
                // Only update if significantly different to avoid excessive re-renders
                if (Math.abs(prev - idx) >= 2) return idx;
                return prev;
              });
            }
          }
        }
      },
      { threshold: [0.5], rootMargin: '0px' }
    );
    
    tileRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [allMoments.length]);

  // Fix 8: Poster preload links for first 4 tiles
  useEffect(() => {
    if (!allMoments.length) return;
    const links: HTMLLinkElement[] = [];
    
    const first4 = allMoments.slice(0, 4);
    first4.forEach((moment) => {
      let posterUrl: string | null = null;
      if (moment.media_type === 'video' && moment.media_url) {
        const uid = uidFromNode({ src: moment.media_url });
        if (uid) {
          const generated = generateStreamThumbnailUrl(uid, { height: 800, fit: 'cover' });
          if (generated && !isPosterFailed(generated)) posterUrl = generated;
        }
      } else if (moment.media_type === 'image') {
        posterUrl = moment.thumbnail_url || moment.media_url;
      }
      if (!posterUrl) return;
      if (document.querySelector(`link[href="${posterUrl}"]`)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = posterUrl;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
      links.push(link);
    });
    
    return () => links.forEach(l => l.remove());
  }, [allMoments]);

  // HLS manifest prefetch
  useEffect(() => {
    if (allMoments.length === 0 || !prefetchConfig.preloadManifests) return;
    const videoMoments = allMoments
      .slice(0, Math.min(prefetchConfig.prefetchAhead, allMoments.length))
      .filter(m => m.media_type === 'video' && m.media_url);
    videoMoments.forEach((moment) => {
      const uid = uidFromNode({ src: moment.media_url! });
      if (uid) preloadHlsManifest(generateStreamHlsUrl(uid));
    });
    lastPrefetchedIndex.current = Math.min(prefetchConfig.prefetchAhead - 1, allMoments.length - 1);
  }, [allMoments, prefetchConfig.prefetchAhead, prefetchConfig.preloadManifests]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
          onIndexChange();
          if (prefetchConfig.preloadManifests) {
            const prefetchStart = lastPrefetchedIndex.current + 1;
            const prefetchEnd = Math.min(prefetchStart + prefetchConfig.prefetchAhead, allMoments.length);
            if (prefetchEnd > prefetchStart) {
              allMoments.slice(prefetchStart, prefetchEnd)
                .filter(m => m.media_type === 'video' && m.media_url)
                .forEach((moment) => {
                  const uid = uidFromNode({ src: moment.media_url! });
                  if (uid) preloadHlsManifest(generateStreamHlsUrl(uid));
                });
              lastPrefetchedIndex.current = prefetchEnd - 1;
            }
          }
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, allMoments, prefetchConfig, onIndexChange]);

  // Paced loading state
  const MIN_LOADING_DISPLAY_MS = 600;
  const loadStartTimeRef = useRef<number>(0);
  const [isPacingDelay, setIsPacingDelay] = useState(false);
  const prevMomentsCountRef = useRef(allMoments.length);
  const [newlyLoadedStartIndex, setNewlyLoadedStartIndex] = useState<number | null>(null);
  const loadingMoreRef = useRef(false);

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

  const showBottomLoader = isFetchingNextPage || isPacingDelay;

  const handleMomentClick = useCallback((moment: ExploreMoment, index: number) => {
    onMomentClick?.(moment, index, allMoments);
  }, [onMomentClick, allMoments]);

  // Ref callback for tile tracking
  const setTileRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) tileRefs.current.set(index, el);
    else tileRefs.current.delete(index);
  }, []);

  if (error && !isLoading && allMoments.length === 0) {
    return (
      <ExploreErrorState
        message="Couldn't load content"
        onRetry={() => refetch()}
      />
    );
  }

  if (!isLoading && !error && allMoments.length === 0) {
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

  if (isLoading && allMoments.length === 0) {
    return (
      <div className={className}>
        <DiscoverGridSkeleton />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="px-4">
        <div className="grid grid-cols-2 gap-1">
          {allMoments.map((moment, index) => {
            const isNewlyLoaded = newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex;
            const entranceDelay = isNewlyLoaded ? (index - newlyLoadedStartIndex) * 30 : 0;
            // Fix 1: Mount gating
            const shouldMountVideo = Math.abs(index - currentViewportIndex) <= MOUNT_BUFFER;
            
            const tileWrapper = (children: React.ReactNode) => (
              <div
                key={moment.moment_id}
                ref={(el) => setTileRef(index, el)}
                data-tile-index={index}
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
                  isLiked={userLikedIds.has(moment.source_id)}
                  shouldMountVideo={shouldMountVideo}
                  isGloballyMuted={isGloballyMuted}
                  onClick={() => handleMomentClick(moment, index)}
                />
              );
            }
            
            return tileWrapper(
              <PortraitTile
                moment={moment}
                index={index}
                isLiked={userLikedIds.has(moment.source_id)}
                shouldMountVideo={shouldMountVideo}
                isGloballyMuted={isGloballyMuted}
                onClick={() => handleMomentClick(moment, index)}
              />
            );
          })}
        </div>
        
        {hasNextPage && (
          <div ref={loadMoreRef} className="h-20" />
        )}
        
        {showBottomLoader && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        
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
