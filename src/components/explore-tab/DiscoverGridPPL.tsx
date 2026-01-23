/**
 * DiscoverGridPPL - PP→L rhythm grid for Explore page
 * 
 * Grid pattern alternates:
 * Row 1: [Portrait] [Portrait]
 * Row 2: [   Landscape       ]
 * Row 3: [Portrait] [Portrait]
 * ...
 * 
 * Content types:
 * - Course cards: Always portrait (curated imagery)
 * - Moment cards: Native aspect ratio (portrait OR landscape)
 * 
 * Fallback: If no landscape content, use course cards in landscape slots
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
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { useMediaAutoplay } from '@/media/useMediaAutoplay';
import { ExploreMoment, ExploreFilters, RegionKey } from '@/hooks/useExploreMoments';

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

// Gradients for fallback
const GRADIENTS = [
  "from-emerald-800 via-slate-700 to-slate-900",
  "from-blue-700 via-slate-600 to-slate-900",
  "from-amber-700 via-slate-600 to-slate-900",
  "from-teal-700 via-slate-600 to-slate-900",
];

// Helper to categorize aspect ratio
const getAspectCategory = (ratio: number | null): 'portrait' | 'landscape' => {
  if (!ratio) return 'portrait'; // Default to portrait if unknown
  return ratio < 1 ? 'portrait' : 'landscape';
};

// Hook to fetch mixed content (moments + courses)
function useDiscoverGridContent(filters?: ExploreFilters) {
  return useInfiniteQuery({
    queryKey: ['discover-grid-ppl', filters],
    queryFn: async ({ pageParam }) => {
      // Fetch moments
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

      // Fetch some top courses to mix in
      const { data: courses } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image, global_rank')
        .not('global_rank', 'is', null)
        .not('thumbnail_image', 'is', null)
        .order('global_rank')
        .limit(20);

      // Categorize moments by aspect ratio
      const categorizedMoments: MomentItem[] = (moments || []).map(m => ({
        ...m,
        source_type: m.source_type as 'post' | 'review',
        region_key: m.region_key as RegionKey | null,
        type: 'moment' as const,
        aspectCategory: getAspectCategory(m.aspect_ratio),
      }));

      // Create course items
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
  
  // Create approximately 20 rows of content
  for (let row = 0; row < 20; row++) {
    if (row % 2 === 0) {
      // PP row
      const items: DiscoverItem[] = [];
      
      // First portrait slot
      if (portraitIdx < portraitMoments.length) {
        items.push(portraitMoments[portraitIdx]);
        usedMoments.push(portraitMoments[portraitIdx]);
        portraitIdx++;
      } else if (courseIdx < courses.length) {
        items.push(courses[courseIdx]);
        courseIdx++;
      }
      
      // Second portrait slot
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
      // L row
      if (landscapeIdx < landscapeMoments.length) {
        slots.push({ type: 'L', items: [landscapeMoments[landscapeIdx]] });
        usedMoments.push(landscapeMoments[landscapeIdx]);
        landscapeIdx++;
      } else if (courseIdx < courses.length) {
        // Use course as landscape fallback
        slots.push({ type: 'L', items: [courses[courseIdx]] });
        courseIdx++;
      }
      // If no landscape content, skip this row (collapse to PP-PP pattern)
    }
  }
  
  return { slots, usedMoments };
}

// Portrait Card Component
const PortraitCard: React.FC<{
  item: DiscoverItem;
  index: number;
  onClick: () => void;
  isPlaying?: boolean;
  canAutoplay?: boolean;
  registerRef?: (el: HTMLVideoElement | null) => void;
}> = ({ item, index, onClick, isPlaying, canAutoplay, registerRef }) => {
  const [imageError, setImageError] = useState(false);
  const [clientDuration, setClientDuration] = useState<number | null>(null);
  const playerRef = useRef<HLSPlayerRef>(null);
  const gradientIndex = index % GRADIENTS.length;

  const isMoment = item.type === 'moment';
  const isVideo = isMoment && (item as MomentItem).media_type === 'video';
  
  const imageUrl = isMoment 
    ? ((item as MomentItem).thumbnail_url || ((item as MomentItem).media_type === 'image' ? (item as MomentItem).media_url : null))
    : (item as CourseItem).thumbnail_image;
  
  const showGradient = !imageUrl || imageError;

  // Register video element for autoplay
  useEffect(() => {
    if (!canAutoplay || !registerRef) return;
    
    let cancelled = false;
    let retryCount = 0;
    
    const checkAndRegister = () => {
      if (cancelled) return;
      const videoEl = playerRef.current?.getElement();
      if (videoEl) {
        registerRef(videoEl);
        if (!(item as MomentItem).duration_seconds && videoEl.duration && isFinite(videoEl.duration)) {
          setClientDuration(Math.round(videoEl.duration));
        } else if (!(item as MomentItem).duration_seconds) {
          videoEl.addEventListener('loadedmetadata', () => {
            if (videoEl.duration && isFinite(videoEl.duration)) {
              setClientDuration(Math.round(videoEl.duration));
            }
          }, { once: true });
        }
      } else if (retryCount < 10) {
        retryCount++;
        setTimeout(checkAndRegister, 50);
      }
    };
    
    checkAndRegister();
    return () => {
      cancelled = true;
      registerRef(null);
    };
  }, [canAutoplay, registerRef, item]);

  const durationSeconds = isMoment 
    ? ((item as MomentItem).duration_seconds ?? clientDuration)
    : null;

  return (
    <button onClick={onClick} className="group text-left w-full">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow">
        {/* Video with autoplay - UNIFIED WITH CLUBHOUSE */}
        {isVideo && canAutoplay && (item as MomentItem).media_url ? (
          <HLSPlayer
            ref={playerRef}
            src={(item as MomentItem).media_url}
            mediaId={(item as MomentItem).moment_id}
            autoplay={isPlaying}
            muted
            loop
            className="absolute inset-0 w-full h-full object-cover"
            aspectRatio="3:4"
            objectFit="cover"
            managedByMediaRuntime={false}
            externallyManaged={false}
            preload="auto"
          />
        ) : isVideo && !canAutoplay ? (
          <div className="relative w-full h-full">
            {!showGradient ? (
              <img 
                src={(item as MomentItem).thumbnail_url || imageUrl!} 
                alt="Moment"
                loading="lazy"
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br", GRADIENTS[gradientIndex])} />
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </div>
        ) : !showGradient ? (
          <img 
            src={imageUrl!} 
            alt={isMoment ? "Moment" : (item as CourseItem).name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", GRADIENTS[gradientIndex])} />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
        
        {/* Course ranking badge - top left */}
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
        
        {/* Course name badge for moments - top center */}
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
            // Course card bottom
            <>
              <h4 className="text-sm font-medium text-white line-clamp-2">
                {(item as CourseItem).name}
              </h4>
              <p className="text-xs text-white/60 mt-0.5 line-clamp-1">
                {(item as CourseItem).sub_country || (item as CourseItem).country}
              </p>
            </>
          ) : (
            // Moment card bottom - likes
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
        
        {/* Duration badge for videos */}
        {isVideo && durationSeconds && durationSeconds > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium pointer-events-none">
            {formatDuration(durationSeconds)}
          </div>
        )}
      </div>
    </button>
  );
};

// Landscape Card Component
const LandscapeCard: React.FC<{
  item: DiscoverItem;
  index: number;
  onClick: () => void;
  isPlaying?: boolean;
  canAutoplay?: boolean;
  registerRef?: (el: HTMLVideoElement | null) => void;
}> = ({ item, index, onClick, isPlaying, canAutoplay, registerRef }) => {
  const [imageError, setImageError] = useState(false);
  const [clientDuration, setClientDuration] = useState<number | null>(null);
  const playerRef = useRef<HLSPlayerRef>(null);
  const gradientIndex = index % GRADIENTS.length;

  const isMoment = item.type === 'moment';
  const isVideo = isMoment && (item as MomentItem).media_type === 'video';
  
  const imageUrl = isMoment 
    ? ((item as MomentItem).thumbnail_url || ((item as MomentItem).media_type === 'image' ? (item as MomentItem).media_url : null))
    : (item as CourseItem).thumbnail_image;
  
  const showGradient = !imageUrl || imageError;

  // Register video element for autoplay
  useEffect(() => {
    if (!canAutoplay || !registerRef) return;
    
    let cancelled = false;
    let retryCount = 0;
    
    const checkAndRegister = () => {
      if (cancelled) return;
      const videoEl = playerRef.current?.getElement();
      if (videoEl) {
        registerRef(videoEl);
        if (!(item as MomentItem).duration_seconds && videoEl.duration && isFinite(videoEl.duration)) {
          setClientDuration(Math.round(videoEl.duration));
        } else if (!(item as MomentItem).duration_seconds) {
          videoEl.addEventListener('loadedmetadata', () => {
            if (videoEl.duration && isFinite(videoEl.duration)) {
              setClientDuration(Math.round(videoEl.duration));
            }
          }, { once: true });
        }
      } else if (retryCount < 10) {
        retryCount++;
        setTimeout(checkAndRegister, 50);
      }
    };
    
    checkAndRegister();
    return () => {
      cancelled = true;
      registerRef(null);
    };
  }, [canAutoplay, registerRef, item]);

  const durationSeconds = isMoment 
    ? ((item as MomentItem).duration_seconds ?? clientDuration)
    : null;

  return (
    <button onClick={onClick} className="group text-left w-full col-span-2">
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow">
        {/* Video with autoplay - UNIFIED WITH CLUBHOUSE */}
        {isVideo && canAutoplay && (item as MomentItem).media_url ? (
          <HLSPlayer
            ref={playerRef}
            src={(item as MomentItem).media_url}
            mediaId={(item as MomentItem).moment_id}
            autoplay={isPlaying}
            muted
            loop
            className="absolute inset-0 w-full h-full object-cover"
            aspectRatio="3:4"
            objectFit="cover"
            managedByMediaRuntime={false}
            externallyManaged={false}
            preload="auto"
          />
        ) : isVideo && !canAutoplay ? (
          <div className="relative w-full h-full">
            {!showGradient ? (
              <img 
                src={(item as MomentItem).thumbnail_url || imageUrl!} 
                alt="Moment"
                loading="lazy"
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br", GRADIENTS[gradientIndex])} />
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </div>
        ) : !showGradient ? (
          <img 
            src={imageUrl!} 
            alt={isMoment ? "Moment" : (item as CourseItem).name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", GRADIENTS[gradientIndex])} />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
        
        {/* Course ranking badge for courses */}
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
            // Course card
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
            // Moment card
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
      </div>
    </button>
  );
};

// Skeleton components
const PortraitSkeleton: React.FC = () => (
  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
    <Skeleton className="w-full h-full" />
  </div>
);

const LandscapeSkeleton: React.FC = () => (
  <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted col-span-2">
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
  
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    surface: 'grid',
    startThreshold: 0.5,
    stopThreshold: 0.2,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useDiscoverGridContent(filters);

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

  const handleItemClick = useCallback((item: DiscoverItem, flatIndex: number) => {
    if (item.type === 'course') {
      navigate(`/courses/${(item as CourseItem).id}`);
    } else if (onMomentClick) {
      // Find the moment in usedMoments
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
  }, [navigate, onMomentClick, usedMoments]);

  // Registration for autoplay
  const registerMediaRef = useRef(registerMedia);
  registerMediaRef.current = registerMedia;
  const registeredIdsRef = useRef<Set<string>>(new Set());
  
  const createRegisterRef = useCallback((id: string, index: number) => {
    return (el: HTMLVideoElement | null) => {
      if (!el) {
        if (registeredIdsRef.current.has(id)) {
          registeredIdsRef.current.delete(id);
          registerMediaRef.current({ id, element: null, isCandidate: false, sortIndex: index });
        }
        return;
      }
      if (registeredIdsRef.current.has(id)) return;
      requestAnimationFrame(() => {
        registeredIdsRef.current.add(id);
        registerMediaRef.current({ id, element: el, isCandidate: true, sortIndex: index });
      });
    };
  }, []);

  // Loading state
  if (isLoading && slots.length === 0) {
    return (
      <div className={cn("py-6", className)}>
        {showHeader && (
          <div className="px-4 mb-4">
            <Skeleton className="h-6 w-32" />
          </div>
        )}
        <div className="px-2 grid grid-cols-2 gap-2">
          <PortraitSkeleton />
          <PortraitSkeleton />
          <LandscapeSkeleton />
          <PortraitSkeleton />
          <PortraitSkeleton />
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
              const canAutoplay = item.type === 'moment' && (item as MomentItem).media_type === 'video';
              const isPlaying = canAutoplay && playingIds.has(id);
              
              return (
                <PortraitCard
                  key={`${slotIdx}-${itemIdx}-${id}`}
                  item={item}
                  index={currentIndex}
                  onClick={() => handleItemClick(item, currentIndex)}
                  isPlaying={isPlaying}
                  canAutoplay={canAutoplay}
                  registerRef={canAutoplay ? createRegisterRef(id, currentIndex) : undefined}
                />
              );
            });
          } else {
            const item = slot.items[0];
            const currentIndex = flatIndex++;
            const id = item.type === 'course' ? (item as CourseItem).id : (item as MomentItem).moment_id;
            const canAutoplay = item.type === 'moment' && (item as MomentItem).media_type === 'video';
            const isPlaying = canAutoplay && playingIds.has(id);
            
            return (
              <LandscapeCard
                key={`${slotIdx}-${id}`}
                item={item}
                index={currentIndex}
                onClick={() => handleItemClick(item, currentIndex)}
                isPlaying={isPlaying}
                canAutoplay={canAutoplay}
                registerRef={canAutoplay ? createRegisterRef(id, currentIndex) : undefined}
              />
            );
          }
        })}
        
        {/* Loading skeletons */}
        {isFetchingNextPage && (
          <>
            <PortraitSkeleton />
            <PortraitSkeleton />
            <LandscapeSkeleton />
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
