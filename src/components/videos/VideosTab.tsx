/**
 * VideosTab - Feed-based long-form video tab
 * 
 * UNIFIED WITH CLUBHOUSE: Video tiles now handle their own visibility-based
 * autoplay internally - no external MediaRuntime coordination needed.
 * 
 * DATA RULE: Videos tab = long-form ONLY (≥4 min / 240 seconds)
 */

import React, { useState, useMemo, useCallback, useLayoutEffect, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import { LongFormFeedCard } from './LongFormFeedCard';
import { LongFormFeedCardSkeleton } from './LongFormFeedCardSkeleton';
import { VideosSectionPage } from './VideosSectionPage';
import { VideosSearchResults } from './VideosSearchResults';
import { ContinueWatchingSection } from './ContinueWatchingSection';
import { useInfiniteLongFormVideos } from '@/hooks/useInfiniteLongFormVideos';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { getDiscoverCategories } from '@/components/post/create-moment/categoryDefinitions';
import { watchTabDebug } from '@/debug/watchTabDebug';
import type { LongFormVideo } from './LongFormVideoTile';
import type { LongFormFeedVideo } from './LongFormFeedCard';

// Dynamic category type from definitions
export type VideoCategory = string;

// Build video pills dynamically from MOMENT_CATEGORIES
const VIDEO_PILLS = [
  { value: 'all', label: 'All', icon: undefined as React.ElementType | undefined },
  ...getDiscoverCategories().map(cat => ({
    value: cat.id,
    label: cat.label,
    icon: cat.icon,
  })),
];

// Local storage keys
const VIDEOS_SORT_KEY = 'videos-sort-option';

// Map SortOption to query sort
type QuerySort = 'newest' | 'most-liked' | 'most-discussed';
const sortOptionToQuerySort = (sortOption: SortOption): QuerySort => {
  switch (sortOption) {
    case 'most-liked': return 'most-liked';
    case 'most-discussed': return 'most-discussed';
    default: return 'newest';
  }
};

// Minimum videos ready before showing feed
const MINIMUM_READY_COUNT = 2;

interface VideosTabProps {
  onVideoClick?: (id: string) => void;
  className?: string;
}

/**
 * VideosTab - Feed-based long-form video tab with Paused-Video-First Architecture
 * 
 * DATA RULE: Videos tab = long-form ONLY (≥4 min / 240 seconds)
 * 
 * Architecture:
 * - HLSPlayer always mounted, showing paused first frame when not in view
 * - Autoplay when scrolled into view (40%+ visible)
 * - Pause when scrolled out (below 25% visible)
 * - useVideoReadyQueue for prefetch (8 ahead, 8 behind = 16 total window)
 * - useMediaAutoplay for coordinated play/pause
 */
export const VideosTab: React.FC<VideosTabProps> = ({
  onVideoClick,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Debug lifecycle
  useEffect(() => {
    watchTabDebug.pageMount();
    return () => watchTabDebug.pageUnmount();
  }, []);

  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const saved = localStorage.getItem(VIDEOS_SORT_KEY);
    return (saved as SortOption) || 'newest';
  });

  // Preserve scroll position when navigating to/from videos
  const { savePosition } = useScrollRestoration('discover:videos');

  // Fetch Continue Watching for de-dupe (priority #1)
  const continueWatchingResult = useContinueWatching(6);
  const continueWatchingVideos = continueWatchingResult.videos;

  // Unified fullscreen player for Videos content
  const { openFullscreen } = useUnifiedFullscreen('explore', {
    allowLandscape: true,
  });

  // Track if first video has been preloaded
  const hasPreloadedFirst = useRef(false);

  // Check URL params for mode
  const sectionParam = searchParams.get('section');
  const modeParam = searchParams.get('mode');
  const urlSearchQuery = searchParams.get('q') || '';
  const categoryParam = (searchParams.get('category') || 'all') as VideoCategory;

  // Get followed user IDs for filtering
  const { followedIds } = useFollowedUsers();

  // Category filter - undefined when 'all'
  const categoryFilter = categoryParam !== 'all' ? categoryParam : undefined;
  const querySort = sortOptionToQuerySort(sortOption);

  // Single infinite query for all videos (feed layout)
  const {
    items: allVideos,
    isLoading,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteLongFormVideos({
    section: 'recommended', // Use recommended as primary feed
    category: categoryFilter,
    sort: querySort,
  });

  // Handle category selection - update URL
  const handleCategorySelect = (categoryKey: string) => {
    const category = categoryKey as VideoCategory;
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };

  // Handle sort change with persistence
  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
    localStorage.setItem(VIDEOS_SORT_KEY, sort);
  };

  // Build pills for command center with icons
  const pills: Pill[] = VIDEO_PILLS.map(p => ({
    key: p.value,
    label: p.label,
    selected: categoryParam === p.value,
    icon: p.icon ? React.createElement(p.icon, { className: 'h-4 w-4' }) : undefined,
  }));

  // Exclude continue watching from main feed and apply search filter
  const filteredVideos = useMemo(() => {
    const continueWatchingIds = new Set(continueWatchingVideos.map(v => v?.id).filter(Boolean));
    
    let videos = allVideos.filter(v => !continueWatchingIds.has(v.id));

    // Client-side search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      videos = videos.filter(v => {
        const titleMatch = (v.title || '').toLowerCase().includes(query);
        const creatorNameMatch = (v.creatorName || '').toLowerCase().includes(query);
        const courseMatch = (v.golfCourseName || '').toLowerCase().includes(query);
        return titleMatch || creatorNameMatch || courseMatch;
      });
    }

    return videos;
  }, [allVideos, continueWatchingVideos, searchQuery]);

  // ============ SCROLL POSITION TRACKING ============
  const [currentIndex, setCurrentIndex] = useState(0);

  // Track scroll position using IntersectionObserver
  useEffect(() => {
    const cards = document.querySelectorAll('[data-video-card-id]');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const videoId = entry.target.getAttribute('data-video-card-id');
            const index = filteredVideos.findIndex(v => v.id === videoId);
            if (index !== -1 && index !== currentIndex) {
              setCurrentIndex(index);
            }
          }
        });
      },
      { 
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      }
    );

    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [filteredVideos, currentIndex]);

  // CRITICAL: Preload first video immediately in layout phase
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current) return;
    
    const firstVideo = filteredVideos[0] || continueWatchingVideos[0];
    if (!firstVideo?.mediaUrl) return;

    hasPreloadedFirst.current = true;

    const uid = uidFromNode({ src: firstVideo.mediaUrl });
    if (uid) {
      const hlsUrl = generateStreamHlsUrl(uid);
      preloadHlsManifest(hlsUrl);
    }
  }, [filteredVideos, continueWatchingVideos]);

  // Build combined playlist for fullscreen navigation
  const videosAsExploreItems = useMemo(() => {
    return filteredVideos.map(video => ({
      id: video.id,
      type: 'video' as const,
      src: video.mediaUrl || '',
      thumbnailSrc: video.thumbnailUrl,
      title: video.title,
      durationSeconds: video.durationSeconds,
      user: {
        id: video.creatorUserId,
        name: video.creatorName,
        avatar: video.creatorAvatarUrl,
      },
      likes: video.likes || 0,
      golfCourse: video.golfCourseId ? {
        id: video.golfCourseId,
        name: video.golfCourseName || 'Golf Course',
      } : undefined,
      createdAt: video.createdAt,
    }));
  }, [filteredVideos]);

  const handleVideoTap = useCallback((videoId: string) => {
    savePosition();
    const index = videosAsExploreItems.findIndex(v => v.id === videoId);
    if (index !== -1) {
      openFullscreen(videosAsExploreItems, index);
    }
  }, [videosAsExploreItems, openFullscreen, savePosition]);

  const handleCreatorTap = useCallback((creatorUserId: string) => {
    navigate(`/profile/${creatorUserId}`);
  }, [navigate]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleBackFromSearch = () => {
    navigate('/discover?main=videos');
  };

  // Paced loading state (Watch tab standard)
  const MIN_LOADING_DISPLAY_MS = 600;
  const loadStartTimeRef = useRef<number>(0);
  const [isPacingDelay, setIsPacingDelay] = useState(false);
  const prevVideosCountRef = useRef(filteredVideos.length);
  const [newlyLoadedStartIndex, setNewlyLoadedStartIndex] = useState<number | null>(null);

  // Infinite scroll with intersection observer
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: '0px' });

  useEffect(() => {
    if (inView && hasMore && !isFetchingNextPage) {
      loadStartTimeRef.current = Date.now();
      fetchNextPage();
    }
  }, [inView, hasMore, isFetchingNextPage, fetchNextPage]);

  // Handle paced loading when new videos arrive
  useEffect(() => {
    const prevCount = prevVideosCountRef.current;
    const newCount = filteredVideos.length;
    
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
    
    prevVideosCountRef.current = newCount;
  }, [filteredVideos.length]);

  // Show loading indicator
  const showBottomLoader = isFetchingNextPage || isPacingDelay;

  // Convert LongFormVideo to LongFormFeedVideo format
  const toFeedVideo = (v: LongFormVideo): LongFormFeedVideo => ({
    id: v.id,
    title: v.title,
    content: v.title,
    mediaUrl: v.mediaUrl || '',
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    durationSeconds: v.durationSeconds,
    creatorUserId: v.creatorUserId,
    creatorName: v.creatorName || 'Unknown',
    creatorAvatarUrl: v.creatorAvatarUrl,
    followerCount: 0,
    golfCourseName: v.golfCourseName,
    golfCourseId: v.golfCourseId,
    createdAt: v.createdAt || new Date().toISOString(),
    // Pass through review and golf course data
    isReview: (v as any).isReview,
    reviewRating: (v as any).reviewRating,
    golfCourse: (v as any).golfCourse,
    mediaWidth: (v as any).mediaWidth,
    mediaHeight: (v as any).mediaHeight,
  });

  // EARLY RETURNS AFTER ALL HOOKS
  // If in search mode, render search results
  if (modeParam === 'search' && urlSearchQuery) {
    return (
      <VideosSearchResults
        query={urlSearchQuery}
        category={categoryFilter}
        onBack={handleBackFromSearch}
        className={className}
      />
    );
  }

  // If section param exists, render section page
  if (sectionParam) {
    return <VideosSectionPage />;
  }

  return (
    <div className={cn("min-h-screen pb-20 bg-[#F8FAFC]", className)}>
      {/* Command Center: Search + Sort + Pills */}
      <div className="bg-[#F8FAFC] border-b border-[#e2e8f0]">
        <DiscoverCommandCenter
          searchPlaceholder="Search videos, creators, courses..."
          searchValue={searchQuery}
          onSearchChange={handleSearch}
          sortValue={sortOption}
          onSortChange={handleSortChange}
          pills={pills}
          onPillSelect={handleCategorySelect}
        />
      </div>

      {/* Continue Watching (only shows if user has in-progress videos) */}
      <ContinueWatchingSection
        onVideoClick={(id) => {
          onVideoClick?.(id);
        }}
        className="mb-4"
      />

      {/* Feed Content */}
      {isLoading ? (
        <div className="-mx-5 px-0">
          <div className="flex flex-col gap-3 py-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <LongFormFeedCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      ) : filteredVideos.length === 0 ? (
        // Empty state - positioned higher in viewport
        <div className="flex flex-col items-center justify-center py-10 px-4">
          <Play className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-foreground font-semibold mb-0.5">No videos yet</p>
          <p className="text-muted-foreground text-sm text-center max-w-[280px]">
            Long-form videos (4+ minutes) will appear here as creators share new content
          </p>
        </div>
      ) : (
          // Video feed - no gradient background (matches Friends tab)
          <div className="-mx-5 px-0">
            <div className="flex flex-col gap-3 py-3">
              {filteredVideos.map((video, index) => {
                const isNewlyLoaded = newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex;
                const entranceDelay = isNewlyLoaded ? (index - newlyLoadedStartIndex) * 30 : 0;
                
                return (
                  <div
                    key={video.id}
                    className={isNewlyLoaded 
                      ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:fill-mode-backwards' 
                      : undefined
                    }
                    style={isNewlyLoaded ? { animationDelay: `${entranceDelay}ms` } : undefined}
                  >
                    <LongFormFeedCard
                      video={toFeedVideo(video)}
                      index={index}
                      onVideoTap={() => handleVideoTap(video.id)}
                      onCreatorTap={() => handleCreatorTap(video.creatorUserId)}
                    />
                  </div>
                );
              })}

              {/* Infinite scroll sentinel */}
              <div ref={loadMoreRef} className="h-4" />

              {/* Orange brand spinner for paced infinite scroll (Watch tab standard) */}
              {showBottomLoader && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              )}

              {/* End of feed */}
              {!hasMore && filteredVideos.length > 3 && !showBottomLoader && (
                <div className="flex flex-col items-center justify-center py-8 bg-white">
                  <div className="w-12 h-0.5 bg-muted rounded-full mb-3" />
                  <p className="text-xs font-medium text-muted-foreground">You've reached the end</p>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div>
  );
};

export default VideosTab;
