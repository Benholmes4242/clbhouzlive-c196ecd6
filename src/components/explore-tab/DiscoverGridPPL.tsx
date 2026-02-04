/**
 * DiscoverGridPPL - PP→L rhythm grid for Explore page
 * 
 * TikTok-Level Video Architecture:
 * - UnifiedVideoPlayer with HLS pool promotion
 * - 50%/10% autoplay hysteresis  
 * - useAdaptivePrefetch (3-20 dynamic range)
 * - 150ms ease-out crossfade
 * - Priority poster loading (fetchPriority="high")
 * - Shimmer-down skeleton animations
 * 
 * Grid pattern alternates:
 * Row 1: [Portrait] [Portrait]
 * Row 2: [   Landscape       ]
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Heart, Trophy, MapPin } from 'lucide-react';
import { formatDuration } from '@/utils/formatDuration';
import UnifiedVideoPlayer from '@/media/components/UnifiedVideoPlayer';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { ExploreMoment, ExploreFilters, RegionKey } from '@/hooks/useExploreMoments';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';

// Types for grid items
interface CourseItem {
  type: 'course';
  id: string;
  name: string;
  country: string;
  sub_country: string | null;
  thumbnail_image: string | null;
  global_rank: number | null;
}

interface MomentItem extends ExploreMoment {
  type: 'moment';
  aspectCategory: 'portrait' | 'landscape';
}

type DiscoverItem = CourseItem | MomentItem;

interface DiscoverGridPPLProps {
  filters?: ExploreFilters;
  className?: string;
  onMomentClick?: (moment: ExploreMoment, index: number, allMoments: ExploreMoment[]) => void;
  showHeader?: boolean;
  headerTitle?: string;
}

const PAGE_SIZE = 20;

// TikTok-level performance constants
const AUTOPLAY_START_THRESHOLD = 0.5;
const AUTOPLAY_STOP_THRESHOLD = 0.1;
const CROSSFADE_DURATION_MS = 150;
const FIRST_FRAME_FALLBACK_MS = 3000;

// Gradients for fallback
const GRADIENTS = [
  "from-emerald-800 via-slate-700 to-slate-900",
  "from-blue-700 via-slate-600 to-slate-900",
  "from-amber-700 via-slate-600 to-slate-900",
  "from-teal-700 via-slate-600 to-slate-900",
];

// Helper to categorize aspect ratio
const getAspectCategory = (ratio: number | null): 'portrait' | 'landscape' => {
  if (!ratio) return 'portrait';
  return ratio < 1 ? 'portrait' : 'landscape';
};

// Hook to fetch mixed content (moments + courses)
function useDiscoverGridContent(filters?: ExploreFilters) {
  return useInfiniteQuery({
    queryKey: ['discover-grid-ppl', filters],
    queryFn: async ({ pageParam }) => {
      let momentQuery = supabase
        .from('explore_moments')
        .select('*')
        .order('created_at', { ascending: false })
        .order('moment_id', { ascending: false })
        .limit(PAGE_SIZE);

      if (filters?.region && filters.region !== 'all') {
        momentQuery = momentQuery.eq('region_key', filters.region);
      }

      if (pageParam?.created_at) {
        momentQuery = momentQuery.lt('created_at', pageParam.created_at);
      }

      const { data: moments, error: momentsError } = await momentQuery;
      if (momentsError) throw momentsError;

      const { data: courses } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image, global_rank')
        .not('global_rank', 'is', null)
        .not('thumbnail_image', 'is', null)
        .order('global_rank')
        .limit(20);

      const categorizedMoments: MomentItem[] = (moments || []).map(m => ({
        ...m,
        source_type: m.source_type as 'post' | 'review',
        region_key: m.region_key as RegionKey | null,
        type: 'moment' as const,
        aspectCategory: getAspectCategory(m.aspect_ratio),
      }));

      const courseItems: CourseItem[] = (courses || []).map(c => ({
        type: 'course' as const,
        id: c.id,
        name: c.name,
        country: c.country,
        sub_country: c.sub_country,
        thumbnail_image: c.thumbnail_image,
        global_rank: c.global_rank,
      }));

      return {
        moments: categorizedMoments,
        courses: courseItems,
        nextCursor: moments && moments.length === PAGE_SIZE
          ? { created_at: moments[moments.length - 1].created_at }
          : null,
      };
    },
    initialPageParam: null as { created_at: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000,
  });
}

// Arrange content into PP→L slots
function arrangeIntoSlots(
  moments: MomentItem[],
  courses: CourseItem[]
): { slots: Array<{ type: 'PP' | 'L'; items: DiscoverItem[] }>; usedMoments: MomentItem[] } {
  const slots: Array<{ type: 'PP' | 'L'; items: DiscoverItem[] }> = [];
  const usedMoments: MomentItem[] = [];
  
  const portraitMoments = moments.filter(m => m.aspectCategory === 'portrait');
  const landscapeMoments = moments.filter(m => m.aspectCategory === 'landscape');
  
  let portraitIdx = 0;
  let landscapeIdx = 0;
  let courseIdx = 0;
  
  for (let row = 0; row < 20; row++) {
    if (row % 2 === 0) {
      const items: DiscoverItem[] = [];
      
      if (portraitIdx < portraitMoments.length) {
        items.push(portraitMoments[portraitIdx]);
        usedMoments.push(portraitMoments[portraitIdx]);
        portraitIdx++;
      } else if (courseIdx < courses.length) {
        items.push(courses[courseIdx]);
        courseIdx++;
      }
      
      if (portraitIdx < portraitMoments.length) {
        items.push(portraitMoments[portraitIdx]);
        usedMoments.push(portraitMoments[portraitIdx]);
        portraitIdx++;
      } else if (courseIdx < courses.length) {
        items.push(courses[courseIdx]);
        courseIdx++;
      }
      
      if (items.length > 0) {
        slots.push({ type: 'PP', items });
      }
    } else {
      if (landscapeIdx < landscapeMoments.length) {
        slots.push({ type: 'L', items: [landscapeMoments[landscapeIdx]] });
        usedMoments.push(landscapeMoments[landscapeIdx]);
        landscapeIdx++;
      } else if (courseIdx < courses.length) {
        slots.push({ type: 'L', items: [courses[courseIdx]] });
        courseIdx++;
      }
    }
  }
  
  return { slots, usedMoments };
}

// TikTok-Level Portrait Card Component
const PortraitCard: React.FC<{
  item: DiscoverItem;
  index: number;
  onClick: () => void;
  isPriority?: boolean;
}> = React.memo(({ item, index, onClick, isPriority = false }) => {
  const [imageError, setImageError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const firstFrameTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const gradientIndex = index % GRADIENTS.length;

  const isMoment = item.type === 'moment';
  const isVideo = isMoment && (item as MomentItem).media_type === 'video';
  
  // TikTok-level 50%/10% hysteresis
  const { ref: containerRef, inView: isVisible } = useInView({
    threshold: [AUTOPLAY_STOP_THRESHOLD, AUTOPLAY_START_THRESHOLD],
    triggerOnce: false,
  });

  const [shouldPlay, setShouldPlay] = useState(false);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (isVisible) {
      wasVisibleRef.current = true;
      setShouldPlay(true);
    } else if (wasVisibleRef.current) {
      setShouldPlay(false);
    }
  }, [isVisible]);

  // Extract stream URL
  const { hlsUrl, posterUrl, streamId } = useMemo(() => {
    if (!isVideo || !(item as MomentItem).media_url) {
      return { 
        hlsUrl: null, 
        posterUrl: isMoment 
          ? ((item as MomentItem).thumbnail_url || (item as MomentItem).media_url)
          : (item as CourseItem).thumbnail_image,
        streamId: null 
      };
    }
    const extractedStreamId = uidFromNode({ src: (item as MomentItem).media_url });
    if (!extractedStreamId) return { hlsUrl: null, posterUrl: (item as MomentItem).thumbnail_url, streamId: null };
    
    return { 
      hlsUrl: generateStreamHlsUrl(extractedStreamId), 
      posterUrl: (item as MomentItem).thumbnail_url || generateStreamThumbnailUrl(extractedStreamId, { height: 600 }),
      streamId: extractedStreamId 
    };
  }, [isVideo, item, isMoment]);

  const imageUrl = isMoment 
    ? ((item as MomentItem).thumbnail_url || ((item as MomentItem).media_type === 'image' ? (item as MomentItem).media_url : posterUrl))
    : (item as CourseItem).thumbnail_image;
  
  const showGradient = !imageUrl || imageError;

  // First-frame fallback timeout
  useEffect(() => {
    if (isVideo && hlsUrl && !isVideoReady) {
      firstFrameTimeoutRef.current = setTimeout(() => {
        setShowVideo(true);
      }, FIRST_FRAME_FALLBACK_MS);
    }
    return () => {
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
      }
    };
  }, [isVideo, hlsUrl, isVideoReady]);

  const handleVideoReady = useCallback(() => {
    if (firstFrameTimeoutRef.current) {
      clearTimeout(firstFrameTimeoutRef.current);
    }
    setIsVideoReady(true);
    setShowVideo(true);
  }, []);

  const durationSeconds = isMoment ? (item as MomentItem).duration_seconds : null;

  return (
    <button ref={containerRef} onClick={onClick} className="group text-left w-full will-change-transform">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted shadow-sm hover:shadow-md transition-shadow">
        {/* Video with TikTok-level crossfade */}
        {isVideo && hlsUrl ? (
          <>
            <div 
              className={cn("absolute inset-0 z-10")}
              style={{ 
                opacity: showVideo ? 1 : 0,
                transition: `opacity ${CROSSFADE_DURATION_MS}ms ease-out`
              }}
            >
              <UnifiedVideoPlayer
                src={hlsUrl}
                posterUrl={posterUrl || undefined}
                autoplay={shouldPlay}
                muted
                loop
                className="w-full h-full object-cover"
                onCanPlayThrough={handleVideoReady}
              />
            </div>
            {/* Poster with priority loading */}
            {!showVideo && posterUrl && !imageError && (
              <img 
                src={posterUrl} 
                alt="Moment"
                loading={isPriority ? "eager" : "lazy"}
                fetchPriority={isPriority ? "high" : "auto"}
                decoding="async"
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {!showVideo && !posterUrl && (
              <div className="absolute inset-0 bg-muted motion-safe:animate-shimmer-down" />
            )}
          </>
        ) : !showGradient ? (
          <img 
            src={imageUrl!} 
            alt={isMoment ? "Moment" : (item as CourseItem).name}
            loading={isPriority ? "eager" : "lazy"}
            fetchPriority={isPriority ? "high" : "auto"}
            decoding="async"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", GRADIENTS[gradientIndex])} />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
        
        {/* Course ranking badge */}
        {!isMoment && (item as CourseItem).global_rank && (
          <div className="absolute top-2 left-2 pointer-events-none">
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full">
              <Trophy className="w-2.5 h-2.5 text-white" />
              <span className="text-[10px] font-bold text-white">
                #{(item as CourseItem).global_rank}
              </span>
            </div>
          </div>
        )}
        
        {/* Course name badge for moments */}
        {isMoment && (item as MomentItem).course_name && (
          <div className="absolute top-2 left-2 right-2 flex justify-center pointer-events-none">
            <div className="px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full max-w-[90%]">
              <span className="text-[11px] font-medium text-white truncate block text-center">
                {(item as MomentItem).course_name}
              </span>
            </div>
          </div>
        )}
        
        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
          {!isMoment ? (
            <>
              <h4 className="text-sm font-medium text-white line-clamp-2">
                {(item as CourseItem).name}
              </h4>
              <p className="text-xs text-white/60 mt-0.5 line-clamp-1">
                {(item as CourseItem).sub_country || (item as CourseItem).country}
              </p>
            </>
          ) : (
            (item as MomentItem).likes_count && (item as MomentItem).likes_count! > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full w-fit">
                <Heart className="w-3 h-3 text-white fill-white" />
                <span className="text-[11px] font-medium text-white">
                  {(item as MomentItem).likes_count}
                </span>
              </div>
            )
          )}
        </div>
        
        {/* Duration badge */}
        {isVideo && durationSeconds && durationSeconds > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium pointer-events-none">
            {formatDuration(durationSeconds)}
          </div>
        )}

        {/* Play icon for non-autoplaying videos */}
        {isVideo && !shouldPlay && (
          <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}, (prev, next) => 
  prev.item === next.item && 
  prev.index === next.index && 
  prev.isPriority === next.isPriority
);

PortraitCard.displayName = 'PortraitCard';

// TikTok-Level Landscape Card Component
const LandscapeCard: React.FC<{
  item: DiscoverItem;
  index: number;
  onClick: () => void;
  isPriority?: boolean;
}> = React.memo(({ item, index, onClick, isPriority = false }) => {
  const [imageError, setImageError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const firstFrameTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const gradientIndex = index % GRADIENTS.length;

  const isMoment = item.type === 'moment';
  const isVideo = isMoment && (item as MomentItem).media_type === 'video';
  
  // TikTok-level 50%/10% hysteresis
  const { ref: containerRef, inView: isVisible } = useInView({
    threshold: [AUTOPLAY_STOP_THRESHOLD, AUTOPLAY_START_THRESHOLD],
    triggerOnce: false,
  });

  const [shouldPlay, setShouldPlay] = useState(false);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (isVisible) {
      wasVisibleRef.current = true;
      setShouldPlay(true);
    } else if (wasVisibleRef.current) {
      setShouldPlay(false);
    }
  }, [isVisible]);

  // Extract stream URL
  const { hlsUrl, posterUrl } = useMemo(() => {
    if (!isVideo || !(item as MomentItem).media_url) {
      return { 
        hlsUrl: null, 
        posterUrl: isMoment 
          ? ((item as MomentItem).thumbnail_url || (item as MomentItem).media_url)
          : (item as CourseItem).thumbnail_image
      };
    }
    const extractedStreamId = uidFromNode({ src: (item as MomentItem).media_url });
    if (!extractedStreamId) return { hlsUrl: null, posterUrl: (item as MomentItem).thumbnail_url };
    
    return { 
      hlsUrl: generateStreamHlsUrl(extractedStreamId), 
      posterUrl: (item as MomentItem).thumbnail_url || generateStreamThumbnailUrl(extractedStreamId, { height: 600 })
    };
  }, [isVideo, item, isMoment]);

  const imageUrl = isMoment 
    ? ((item as MomentItem).thumbnail_url || ((item as MomentItem).media_type === 'image' ? (item as MomentItem).media_url : posterUrl))
    : (item as CourseItem).thumbnail_image;
  
  const showGradient = !imageUrl || imageError;

  // First-frame fallback
  useEffect(() => {
    if (isVideo && hlsUrl && !isVideoReady) {
      firstFrameTimeoutRef.current = setTimeout(() => {
        setShowVideo(true);
      }, FIRST_FRAME_FALLBACK_MS);
    }
    return () => {
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
      }
    };
  }, [isVideo, hlsUrl, isVideoReady]);

  const handleVideoReady = useCallback(() => {
    if (firstFrameTimeoutRef.current) {
      clearTimeout(firstFrameTimeoutRef.current);
    }
    setIsVideoReady(true);
    setShowVideo(true);
  }, []);

  const durationSeconds = isMoment ? (item as MomentItem).duration_seconds : null;

  return (
    <button ref={containerRef} onClick={onClick} className="group text-left w-full col-span-2 will-change-transform">
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted shadow-sm hover:shadow-md transition-shadow">
        {/* Video with TikTok-level crossfade */}
        {isVideo && hlsUrl ? (
          <>
            <div 
              className="absolute inset-0 z-10"
              style={{ 
                opacity: showVideo ? 1 : 0,
                transition: `opacity ${CROSSFADE_DURATION_MS}ms ease-out`
              }}
            >
              <UnifiedVideoPlayer
                src={hlsUrl}
                posterUrl={posterUrl || undefined}
                autoplay={shouldPlay}
                muted
                loop
                className="w-full h-full object-cover"
                onCanPlayThrough={handleVideoReady}
              />
            </div>
            {!showVideo && posterUrl && !imageError && (
              <img 
                src={posterUrl} 
                alt="Moment"
                loading={isPriority ? "eager" : "lazy"}
                fetchPriority={isPriority ? "high" : "auto"}
                decoding="async"
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {!showVideo && !posterUrl && (
              <div className="absolute inset-0 bg-muted motion-safe:animate-shimmer-down" />
            )}
          </>
        ) : !showGradient ? (
          <img 
            src={imageUrl!} 
            alt={isMoment ? "Moment" : (item as CourseItem).name}
            loading={isPriority ? "eager" : "lazy"}
            fetchPriority={isPriority ? "high" : "auto"}
            decoding="async"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", GRADIENTS[gradientIndex])} />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
        
        {/* Course ranking badge */}
        {!isMoment && (item as CourseItem).global_rank && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full">
              <Trophy className="w-3 h-3 text-white" />
              <span className="text-xs font-bold text-white">
                #{(item as CourseItem).global_rank} Top 100
              </span>
            </div>
          </div>
        )}
        
        {/* Course name badge for moments */}
        {isMoment && (item as MomentItem).course_name && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <div className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full">
              <span className="text-xs font-medium text-white">
                {(item as MomentItem).course_name}
              </span>
            </div>
          </div>
        )}
        
        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          {!isMoment ? (
            <div className="flex items-end justify-between">
              <div>
                <h4 className="text-base font-semibold text-white line-clamp-1">
                  {(item as CourseItem).name}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-white/60">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">
                    {(item as CourseItem).sub_country || (item as CourseItem).country}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            (item as MomentItem).likes_count && (item as MomentItem).likes_count! > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full w-fit">
                <Heart className="w-3.5 h-3.5 text-white fill-white" />
                <span className="text-xs font-medium text-white">
                  {(item as MomentItem).likes_count}
                </span>
              </div>
            )
          )}
        </div>
        
        {/* Duration badge */}
        {isVideo && durationSeconds && durationSeconds > 0 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium pointer-events-none">
            {formatDuration(durationSeconds)}
          </div>
        )}

        {/* Play icon for non-autoplaying videos */}
        {isVideo && !shouldPlay && (
          <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}, (prev, next) => 
  prev.item === next.item && 
  prev.index === next.index && 
  prev.isPriority === next.isPriority
);

LandscapeCard.displayName = 'LandscapeCard';

// TikTok-level shimmer skeletons
const PortraitSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div 
    className="aspect-[3/4] rounded-lg overflow-hidden bg-muted motion-safe:animate-shimmer-down"
    style={{ animationDelay: `${index * 75}ms` }}
  >
    <Skeleton className="w-full h-full" />
  </div>
);

const LandscapeSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div 
    className="aspect-[16/9] rounded-lg overflow-hidden bg-muted col-span-2 motion-safe:animate-shimmer-down"
    style={{ animationDelay: `${index * 75}ms` }}
  >
    <Skeleton className="w-full h-full" />
  </div>
);

export const DiscoverGridPPL: React.FC<DiscoverGridPPLProps> = ({
  filters,
  className,
  onMomentClick,
  showHeader = true,
  headerTitle = "Discover",
}) => {
  const navigate = useNavigate();
  const loadMoreRef = useRef(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useDiscoverGridContent(filters);

  // Flatten and deduplicate moments
  const { moments, courses } = useMemo(() => {
    const allMoments: MomentItem[] = [];
    const allCourses: CourseItem[] = [];
    const seenMoments = new Set<string>();
    const seenCourses = new Set<string>();

    data?.pages.forEach(page => {
      page.moments.forEach(m => {
        if (!seenMoments.has(m.moment_id)) {
          seenMoments.add(m.moment_id);
          allMoments.push(m);
        }
      });
      page.courses.forEach(c => {
        if (!seenCourses.has(c.id)) {
          seenCourses.add(c.id);
          allCourses.push(c);
        }
      });
    });

    return { moments: allMoments, courses: allCourses };
  }, [data]);

  // Arrange into PP→L slots
  const { slots, usedMoments } = useMemo(() => {
    return arrangeIntoSlots(moments, courses);
  }, [moments, courses]);

  // TikTok-level adaptive prefetch
  const { onIndexChange } = useAdaptivePrefetch();

  const videoUrls = useMemo(() => {
    const urls: string[] = [];
    usedMoments.forEach(m => {
      if (m.media_type === 'video' && m.media_url) {
        const streamId = uidFromNode({ src: m.media_url });
        if (streamId) {
          urls.push(generateStreamHlsUrl(streamId));
        }
      }
    });
    return urls;
  }, [usedMoments]);

  // Infinite scroll trigger
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !loadMoreRef.current) {
      loadMoreRef.current = true;
      fetchNextPage().finally(() => {
        loadMoreRef.current = false;
      });
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleItemClick = useCallback((item: DiscoverItem, flatIndex: number) => {
    // Update prefetch window on interaction
    onIndexChange();
    
    if (item.type === 'course') {
      navigate(`/courses/${(item as CourseItem).id}`);
    } else if (onMomentClick) {
      const momentIdx = usedMoments.findIndex(m => m.moment_id === (item as MomentItem).moment_id);
      onMomentClick(item as MomentItem, momentIdx, usedMoments);
    } else {
      const moment = item as MomentItem;
      if (moment.source_type === 'post') {
        navigate(`/post/${moment.source_id}`);
      } else {
        navigate(`/courses/${moment.course_id}`);
      }
    }
  }, [navigate, onMomentClick, usedMoments, onIndexChange]);

  // Loading state with staggered shimmer
  if (isLoading && slots.length === 0) {
    return (
      <div className={cn("py-6", className)}>
        {showHeader && (
          <div className="px-4 mb-4">
            <Skeleton className="h-6 w-32" />
          </div>
        )}
        <div className="px-2 grid grid-cols-2 gap-2">
          <PortraitSkeleton index={0} />
          <PortraitSkeleton index={1} />
          <LandscapeSkeleton index={2} />
          <PortraitSkeleton index={3} />
          <PortraitSkeleton index={4} />
        </div>
      </div>
    );
  }

  // Empty state
  if (slots.length === 0) {
    return (
      <div className={cn("py-6", className)}>
        {showHeader && (
          <div className="px-4 mb-4">
            <h2 className="text-lg font-bold text-foreground">{headerTitle}</h2>
          </div>
        )}
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No content found. Try adjusting your filters.
          </p>
        </div>
      </div>
    );
  }

  let flatIndex = 0;

  return (
    <div className={cn("py-6", className)}>
      {showHeader && (
        <div className="px-4 mb-4">
          <h2 className="text-lg font-bold text-foreground">{headerTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Courses and moments from around the world
          </p>
        </div>
      )}
      
      <div className="px-2 grid grid-cols-2 gap-2">
        {slots.map((slot, slotIdx) => {
          if (slot.type === 'PP') {
            return slot.items.map((item, itemIdx) => {
              const currentIndex = flatIndex++;
              const id = item.type === 'course' ? (item as CourseItem).id : (item as MomentItem).moment_id;
              const isPriority = currentIndex < 6;
              
              return (
                <PortraitCard
                  key={`${slotIdx}-${itemIdx}-${id}`}
                  item={item}
                  index={currentIndex}
                  onClick={() => handleItemClick(item, currentIndex)}
                  isPriority={isPriority}
                />
              );
            });
          } else {
            const item = slot.items[0];
            const currentIndex = flatIndex++;
            const id = item.type === 'course' ? (item as CourseItem).id : (item as MomentItem).moment_id;
            const isPriority = currentIndex < 6;
            
            return (
              <LandscapeCard
                key={`${slotIdx}-${id}`}
                item={item}
                index={currentIndex}
                onClick={() => handleItemClick(item, currentIndex)}
                isPriority={isPriority}
              />
            );
          }
        })}
        
        {/* Loading skeletons with staggered animation */}
        {isFetchingNextPage && (
          <>
            <PortraitSkeleton index={0} />
            <PortraitSkeleton index={1} />
            <LandscapeSkeleton index={2} />
          </>
        )}
      </div>

      {/* Load more sentinel */}
      <div ref={sentinelRef} className="h-12 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
        )}
      </div>
      
      {/* End of list */}
      {!hasNextPage && slots.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <div className="w-12 h-0.5 bg-border rounded-full mb-3" />
          <p className="text-xs font-medium">You've explored it all</p>
        </div>
      )}
    </div>
  );
};

export default DiscoverGridPPL;
