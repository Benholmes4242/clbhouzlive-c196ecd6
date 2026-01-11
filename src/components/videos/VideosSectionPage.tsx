import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LongFormVideoTileAutoplay } from './LongFormVideoTileAutoplay';
import { useInfiniteLongFormVideos } from '@/hooks/useInfiniteLongFormVideos';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';
import { useMediaAutoplay } from '@/media';
import { runtimeUserTap } from '@/media';
import DiscoverCommandCenter, { SortOption, Pill } from '@/components/discover/DiscoverCommandCenter';
import { getDiscoverCategories } from '@/components/post/create-moment/categoryDefinitions';
import { SHOW_MOCK_DATA, generateMockVideos } from '@/utils/mockVideoData';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';

type SectionType = 'recommended' | 'trending' | 'following' | 'courses';

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

const SECTION_TITLES: Record<SectionType, string> = {
  recommended: 'Recommended for you',
  trending: 'Trending this week',
  following: 'From creators you follow',
  courses: 'Courses & destinations',
};

const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  recommended: 'Based on what you watch',
  trending: 'Popular with golfers right now',
  following: 'Latest from creators you follow',
  courses: 'Videos featuring golf courses',
};

// Local storage key for sort preference
const VIDEOS_SECTION_SORT_KEY = 'videos-section-sort-option';

// Map SortOption to query sort
type QuerySort = 'newest' | 'most-liked' | 'most-discussed';
const sortOptionToQuerySort = (sortOption: SortOption): QuerySort => {
  switch (sortOption) {
    case 'most-liked': return 'most-liked';
    case 'most-discussed': return 'most-discussed';
    default: return 'newest';
  }
};

/**
 * VideosSectionPage - Full section page with infinite scroll
 * 
 * Routes (via query params on /discover):
 * - /discover?main=videos&section=recommended
 * - /discover?main=videos&section=trending
 * - /discover?main=videos&section=following
 * - /discover?main=videos&section=courses
 */
export const VideosSectionPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const section = (searchParams.get('section') || 'recommended') as SectionType;
  const categoryParam = (searchParams.get('category') || 'all') as VideoCategory;
  const category = categoryParam !== 'all' ? categoryParam : undefined;

  // Command center state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const saved = localStorage.getItem(VIDEOS_SECTION_SORT_KEY);
    return (saved as SortOption) || 'newest';
  });

  // Get followed user IDs for following section
  const { followedIds } = useFollowedUsers();

  // Infinite query for videos
  const {
    items: rawItems,
    isLoading,
    isError,
    error,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteLongFormVideos({
    section,
    followedCreatorIds: followedIds,
    category,
    sort: sortOptionToQuerySort(sortOption),
  });

  // Unified fullscreen player for section videos
  const { openFullscreen } = useUnifiedFullscreen('explore', {
    allowLandscape: true,
    onLoadMore: fetchNextPage,
    hasMore,
    isLoadingMore: isFetchingNextPage,
  });

  // Client-side search filter + mock data injection
  const items = useMemo(() => {
    // Inject mock data when flag is enabled
    let videosToFilter = rawItems;
    if (SHOW_MOCK_DATA) {
      const mockVideos = generateMockVideos(20, `section-${section}`);
      videosToFilter = [...rawItems, ...mockVideos];
    }
    
    if (!searchQuery.trim()) return videosToFilter;
    
    const query = searchQuery.toLowerCase();
    return videosToFilter.filter(v => {
      const titleMatch = (v.title || '').toLowerCase().includes(query);
      const creatorMatch = (v.creatorName || '').toLowerCase().includes(query);
      const courseMatch = (v.golfCourseName || '').toLowerCase().includes(query);
      return titleMatch || creatorMatch || courseMatch;
    });
  }, [rawItems, searchQuery, section]);

  // Convert LongFormVideo items to ExploreContentItem format for fullscreen
  const videosAsExploreItems = useMemo(() => {
    return items.map(video => ({
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
  }, [items]);

  // Handle category selection - update URL
  const handleCategorySelect = (categoryKey: string) => {
    const newCategory = categoryKey as VideoCategory;
    const newParams = new URLSearchParams(searchParams);
    if (newCategory === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', newCategory);
    }
    setSearchParams(newParams);
  };

  // Handle sort change with persistence
  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
    localStorage.setItem(VIDEOS_SECTION_SORT_KEY, sort);
  };

  // Build pills for command center with icons
  const pills: Pill[] = VIDEO_PILLS.map(p => ({
    key: p.value,
    label: p.label,
    selected: categoryParam === p.value,
    icon: p.icon ? React.createElement(p.icon, { className: 'h-4 w-4' }) : undefined,
  }));

  // Autoplay setup (same as Videos tab)
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'videos',
    surface: 'videos',
    preloadMargin: 300,
    scrollSettleDelay: 200,
    startThreshold: 0.4,
    stopThreshold: 0.25,
  });

  // Infinite scroll refs
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(isFetchingNextPage);
  const onLoadMoreRef = useRef(fetchNextPage);
  const loadingRef = useRef(false);

  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isFetchingRef.current = isFetchingNextPage; }, [isFetchingNextPage]);
  useEffect(() => { onLoadMoreRef.current = fetchNextPage; }, [fetchNextPage]);

  // Infinite scroll observer - proven pattern
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Don't setup observer until data has loaded
    if (!hasMore || !fetchNextPage || isLoading) {
      console.log('[VideosSectionPage] Infinite scroll not setup:', { hasMore, hasFetchNextPage: !!fetchNextPage, isLoading });
      return;
    }
    
    console.log('[VideosSectionPage] Setting up infinite scroll observer');
    
    const timeoutId = setTimeout(() => {
      const container = containerRef.current;
      if (!container) {
        console.log('[VideosSectionPage] Container ref not found');
        return;
      }
      
      // Remove existing sentinel if any
      if (sentinelRef.current) {
        sentinelRef.current.remove();
      }
      
      // Create sentinel element
      const sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.width = '100%';
      sentinel.dataset.infiniteScrollSentinel = 'true';
      sentinel.style.backgroundColor = 'transparent';
      sentinelRef.current = sentinel;
      
      // Append to container
      container.appendChild(sentinel);
      console.log('[VideosSectionPage] Sentinel appended to container');
      
      // Disconnect existing observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Create observer
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          
          console.log('[VideosSectionPage] Sentinel intersection:', {
            isIntersecting: entry.isIntersecting,
            hasMore: hasMoreRef.current,
            isFetching: isFetchingRef.current,
            loading: loadingRef.current
          });
          
          if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current && !isFetchingRef.current) {
            console.log('[VideosSectionPage] ✅ Triggering fetchNextPage');
            loadingRef.current = true;
            onLoadMoreRef.current?.();
            
            // Reset loading flag after delay
            setTimeout(() => {
              loadingRef.current = false;
            }, 1000);
          }
        },
        {
          root: null,
          rootMargin: '800px',
          threshold: 0
        }
      );
      
      observerRef.current = observer;
      observer.observe(sentinel);
      console.log('[VideosSectionPage] Observer attached to sentinel');
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (sentinelRef.current) {
        sentinelRef.current.remove();
        sentinelRef.current = null;
      }
      console.log('[VideosSectionPage] Cleanup complete');
    };
  }, [hasMore, fetchNextPage, isLoading]);

  const handleVideoClick = useCallback((id: string) => {
    runtimeUserTap(id);
    
    // Find the video in the playlist and open fullscreen
    const index = videosAsExploreItems.findIndex(v => v.id === id);
    if (index !== -1) {
      openFullscreen(videosAsExploreItems, index);
    }
  }, [videosAsExploreItems, openFullscreen]);

  const handleCreatorClick = (creatorUserId: string) => {
    navigate(`/creator/${creatorUserId}`);
  };

  const handleBack = () => {
    navigate('/discover?main=videos');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] pb-20">
        {/* Header skeleton */}
        <div className="sticky top-0 z-30 bg-[var(--bg-page)]/95 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <div className="h-5 bg-muted rounded w-48 animate-pulse" />
              <div className="h-3 bg-muted/60 rounded w-32 mt-1.5 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Loading skeletons - full bleed */}
        <div className="divide-y divide-border/30">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="px-4 py-3 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted/60 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-lg font-medium text-foreground mb-2">Failed to load videos</p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
          <button 
            onClick={handleBack}
            className="mt-4 text-sm text-primary font-medium hover:underline"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-20">
      {/* Section title - scrolls away (NOT sticky) */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{SECTION_TITLES[section]}</h1>
            <p className="text-xs text-muted-foreground truncate">{SECTION_DESCRIPTIONS[section]}</p>
          </div>
        </div>
      </div>

      {/* Sticky header - Search + Sort + Pills anchored to top */}
      <div className="sticky top-0 z-40 bg-[var(--bg-page)]">
        <DiscoverCommandCenter
          searchPlaceholder="Search videos, creators, courses..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          sortValue={sortOption}
          onSortChange={handleSortChange}
          pills={pills}
          onPillSelect={handleCategorySelect}
        />
      </div>

      {/* Video feed - full bleed layout */}
      <div ref={containerRef} className="divide-y divide-border/30">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Nothing here yet
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-[240px] mb-6">
              Videos in this category will appear here as creators share new content
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Videos
            </Button>
          </div>
        ) : (
          items.map((item, index) => (
            <LongFormVideoTileAutoplay
              key={item.id}
              video={item}
              onVideoClick={handleVideoClick}
              onCreatorClick={handleCreatorClick}
              registerVideo={registerMedia}
              isPlaying={playingIds.has(item.id)}
              videoIndex={index}
            />
          ))
        )}

        {/* Loading indicator - skeleton tiles */}
        {isFetchingNextPage && (
          <div className="divide-y divide-border/30 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card overflow-hidden">
                <div className="aspect-video bg-muted" />
                <div className="px-4 py-3 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted/60 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* End of content - enhanced */}
        {!hasMore && items.length > 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="w-12 h-0.5 bg-muted rounded-full mb-3" />
            <p className="text-xs font-medium">You've seen it all</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideosSectionPage;
